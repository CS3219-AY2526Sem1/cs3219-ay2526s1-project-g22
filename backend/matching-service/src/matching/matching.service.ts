/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 01 Oct 2025
Scope: Helped implement several functions to meet team's requirements and simplified code and added clarifying comments. Suggested tests for a few edge cases.
Author review: I checked correctness, executed tests, and refined unclear implementations and did a bit of debugging minor issues.
*/
import {redisService} from '../services/redis.service';
import {supabaseService} from '../services/supabase.service';
import {logger} from '../utils/logger';
import {UserPreference} from '../types';
import {v4 as uuidv4} from 'uuid';
import {webSocketManager} from '../websockets/websocket.manager';
import {ApiError, CollaborationData, createCollaboration} from "../services/collaborate.service";
import {getRandomQuestion, QuestionData} from "../services/question.service";

export class MatchingService {
    private readonly CACHE_KEY_PREFIX = 'user_match_pref:';

    // --- Get User Preferences with Caching ---
    // First checks Redis cache, if not found, fetches from Supabase and caches it
    // Returns null if user preferences are not found
    async getUserPreference(userId: string): Promise<UserPreference | null> {
        const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}`;
        let preferences: UserPreference | null = await redisService.get(cacheKey);

        if (preferences) {
            logger.info(`Cache hit for user preferences: ${userId}`);
            return preferences;
        }

        logger.info(`Cache miss for user preferences: ${userId}, fetching from Supabase.`);
        preferences = await supabaseService.getUserPreferences(userId);

        if (preferences) {
            await redisService.set(cacheKey, preferences);
        }
        return preferences;
    }

    // --- Queue Management ---
    // These functions manage adding/removing users from the matchmaking queue in Supabase.
    // The function only fetches from Supabase, no caching is done here.
    // This is because the queue state is dynamic and should always be current, and Supabase should be the only source
    // of truth.
    async addToQueue(userId: string) {
        try {
            // check if user is already in a session
            const count = await supabaseService.checkExistingSession(userId);

            if (count == null) {
                logger.error(`Failed to verify existing session for user ${userId}.`);
                throw new Error('Failed to verify existing session.');
            }

            if (count > 0) {
                logger.info(`User ${userId} is already in an active session, cannot add to queue.`);
                throw new Error('User is already in an active session.');
            }

            await supabaseService.addUserToQueue(userId);
        } catch (error) {
            logger.error(`Failed to add user ${userId} to Supabase queue:`, error);
            throw error; // rethrow the error after logging
        }

        this.processMatchingQueue();
    }

    // --- Remove User from Queue ---
    async removeFromQueue(userId: string) {
        try {
            await supabaseService.removeUserFromQueue(userId);
        } catch (error) {
            logger.error(`Failed to remove user ${userId} from Supabase queue:`, error);
            throw error; // rethrow the error after logging
        }
    }

    // Orchestrator function that attempts to match all users in the queue.
    // It iterates through the queue, finds the best possible pairs, creates matches,
    // and notifies them until no more pairs can be formed.
    async processMatchingQueue(): Promise<void> {
        logger.info('Processing matching queue...');
        const queueMembers = await this.getQueueMembers();

        const usersToMatch = new Set(queueMembers);

        if (usersToMatch.size < 2) {
            logger.info('Not enough users in the queue to form a match.');
            return;
        }

        // Keep trying to form pairs as long as there are users left
        while (usersToMatch.size >= 2) {
            // Pick an arbitrary user from the set to be the "source"
            const currentUser = usersToMatch.values().next().value;
            usersToMatch.delete(currentUser); // Remove them from the pool of potential partners

            // Find the best possible match for this user from the remaining candidates
            const bestMatch = await this._findBestMatchForUser(currentUser, Array.from(usersToMatch));

            if (bestMatch) {
                logger.info(`Match found: ${currentUser} and ${bestMatch}.`);

                // Propose the match
                await this.proposeMatch(currentUser, bestMatch);

                // Remove the matched partner from the set for the next iteration
                usersToMatch.delete(bestMatch);
            } else {
                logger.info(`No suitable match found for ${currentUser} in this pass.`);
            }
        }
    }


    // PRIVATE HELPER: Finds the best possible match for a single user from a list of candidates.
    // @param sourceUserId The user we are finding a match for.
    // @param candidates An array of user IDs to check against.
    // @returns The ID of the best matched user, or null if no suitable match is found.
    private async _findBestMatchForUser(sourceUserId: string, candidates: string[], fuzzyPercentage = 0.8): Promise<string | null> {
        const sourceUserPrefs = await this.getUserPreference(sourceUserId);

        // no preferences
        if (!sourceUserPrefs || sourceUserPrefs.topics.length === 0) {
            return null;
        }

        const sourceUserTopics = new Set(sourceUserPrefs.topics);
        const requiredMatches = Math.ceil(fuzzyPercentage * sourceUserTopics.size);

        const userTopicCounts = new Map<string, number>();

        for (const candidateId of candidates) {
            const candidatePrefs = await this.getUserPreference(candidateId);
            if (!candidatePrefs) continue;

            let commonTopics = 0;
            for (const topic of candidatePrefs.topics) {
                if (sourceUserTopics.has(topic)) {
                    commonTopics++;
                }
            }
            userTopicCounts.set(candidateId, commonTopics);
        }

        // Filter candidates who meet the topic threshold
        const potentialMatches = candidates.filter(id => (userTopicCounts.get(id) || 0) >= requiredMatches);

        // Sort them by the number of shared topics (descending)
        potentialMatches.sort((a, b) => (userTopicCounts.get(b) || 0) - (userTopicCounts.get(a) || 0));

        // Find the first one matches on difficulty
        for (const potentialMatchId of potentialMatches) {
            const candidatePrefs = await this.getUserPreference(potentialMatchId); // Re-fetching, can be optimized
            if (candidatePrefs && candidatePrefs.difficulty === sourceUserPrefs.difficulty) {
                logger.info(`Found a full match for ${sourceUserId}: ${potentialMatchId} (Topics: ${userTopicCounts.get(potentialMatchId)}, Difficulty: ${sourceUserPrefs.difficulty})`);
                return potentialMatchId; // Found our best match
            }
        }

        return null; // No match found
    }

    // --- Update User Preferences and Invalidate Cache ---
    async updateUserPreferences(userId: string, newPreferences: UserPreference): Promise<UserPreference | null> {
        // Update in Supabase
        try {
            await supabaseService.updateUserPreferences(newPreferences);
            logger.info(`Updated preferences in Supabase for user: ${userId}`);
        } catch (error) {
            // stop update to redis if supabase update fails
            logger.error(`Failed to update user preferences in Supabase for user: ${userId}, Redis cache not updated: `, error);
            return null;
        }

        // Update in Redis Cache
        const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}`;
        await redisService.set(cacheKey, newPreferences);
        await redisService.setTopics(userId, newPreferences.topics);
        logger.info(`Updated preferences and invalidated cache for user: ${userId}`);
        return newPreferences; // Return the updated preferences
    }

    // retrieve all members currently in the queue from supabase
    // returns an array of user IDs
    private async getQueueMembers() {
        return await supabaseService.getQueueMembers();
    }

    // --- Clear Matches for a Given Match ID ---
    async clearMatches(matchId: string) {
        try {
            await supabaseService.clearMatches(matchId);
            await redisService.removeUserMatchesFromCache(matchId);
            logger.info(`Cleared matches for match: ${matchId}`);
        } catch (error) {
            logger.error(`Failed to clear matches for match: ${matchId}`, error);
            throw error; // rethrow the error after logging
        }
    }

    // --- Propose Match to Two Users ---
    async proposeMatch(userId1: string, userId2: string): Promise<void> {
        const proposalId = uuidv4();
        
        try {
            // Create the proposal in Supabase
            await supabaseService.createMatchProposal(proposalId, userId1, userId2);
    
            // Update user statuses to take them out of the queue
            await supabaseService.updateUserStatus(userId1, false);
            await supabaseService.updateUserStatus(userId2, false);
    
            // Notify both users of the proposal
            const [rejectionRate1, rejectionRate2] = await Promise.all([
                supabaseService.getRejectionRate(userId1),
                supabaseService.getRejectionRate(userId2)
            ]);

            const message1 = {
                type: 'MATCH_PROPOSED',
                payload: {
                    proposalId,
                    opponentRejectionRate: rejectionRate2,
                }
            };
            webSocketManager.sendMessage(userId1, message1);

            const message2 = {
                type: 'MATCH_PROPOSED',
                payload: {
                    proposalId,
                    opponentRejectionRate: rejectionRate1,
                }
            };
            webSocketManager.sendMessage(userId2, message2);
    
        } catch (error) {
            logger.error(`Error creating proposal for ${userId1} and ${userId2}:`, error);
            // If proposal fails, put users back in queue
            await supabaseService.updateUserStatus(userId1, true);
            await supabaseService.updateUserStatus(userId2, true);
        }
    }

    async acceptMatch(proposalId: string, userId: string): Promise<void> {
        const proposal = await supabaseService.updateProposalStatus(proposalId, userId, 'accepted');
    
        if (!proposal) return; // Proposal not found or already handled
    
        const otherUserId = proposal.user1_id === userId ? proposal.user2_id : proposal.user1_id;
        const otherUserStatus = proposal.user1_id === userId ? proposal.user2_status : proposal.user1_status;

        if (otherUserStatus === 'accepted') {
            logger.info(`Match accepted by both users for proposal ${proposalId}. Finalizing...`);

            await supabaseService.logFeedback(userId, otherUserId, 'accepted');
            await supabaseService.logFeedback(otherUserId, userId, 'accepted');
            await supabaseService.removeUserFromQueue(userId);
            await supabaseService.removeUserFromQueue(otherUserId);
            await this.finalizeMatch(userId, otherUserId, proposalId);
        } else {
            // This user accepted, but the other is still pending.
            // We just wait. The UI will show a "waiting" state.
            logger.info(`User ${userId} accepted proposal ${proposalId}, waiting for partner.`);
        }
    }
    
    async rejectMatch(proposalId: string, userId: string): Promise<void> {
        logger.info(`User ${userId} rejected proposal ${proposalId}.`);
        
        // Get proposal details BEFORE deleting
        const proposal = await supabaseService.getProposal(proposalId);
        if (!proposal) return;
    
        const otherUserId = proposal.user1_id === userId ? proposal.user2_id : proposal.user1_id;
    
        // Log negative feedback
        await supabaseService.logFeedback(userId, otherUserId, 'rejected');
        
        // Notify the other user that the proposal was rejected
        const message = { type: 'PROPOSAL_REJECTED' };
        webSocketManager.sendMessage(otherUserId, message);
        
        // Delete the proposal
        await supabaseService.deleteProposal(proposalId);

        // remove both users from the queue and re-add them to reset their status
        await supabaseService.removeUserFromQueue(userId);
        await supabaseService.removeUserFromQueue(otherUserId);
    }

    async getCommonPref(userId1: string, userId2: string): Promise<[string | undefined, string[]]> {
        const prefs1 = await this.getUserPreference(userId1);
        const prefs2 = await this.getUserPreference(userId2);

        // Handle cases where one or both users/preferences don't exist
        if (!prefs1 || !prefs2) {
            // Return a tuple that matches the Promise return type
            return [undefined, []];
        }

        const topics1 = new Set(prefs1.topics);
        const commonTopics: string[] = [];

        for (const topic of prefs2.topics) {
            if (topics1.has(topic)) {
                commonTopics.push(topic);
            }
        }

        // Return the difficulty and common topics as a tuple (an array)
        return [prefs1.difficulty, commonTopics];
    }

    async finalizeMatch(userId1: string, userId2: string, proposalId: string): Promise<void> {
        const matchId = uuidv4();
    
        try {
            // Update the primary database
            const supabaseRes = await supabaseService.handleNewMatch(userId1, userId2, matchId);
            if (!supabaseRes.success) {
                logger.error(`Failed to handle new match in Supabase for ${userId1} and ${userId2}:`, supabaseRes.message);
                return; // Exit early if the DB write fails
            }
            logger.info(`Successfully saved match ${matchId} to Supabase.`);

            // Remove users from the queue
            await this.removeFromQueue(userId1);
            await this.removeFromQueue(userId2);

            // Get list of topics for the matched users
            let question: QuestionData
            let questionid = '';
            try {
                const commonPref = await this.getCommonPref(userId1, userId2);
                logger.info(`Common preferences for users ${userId1} and ${userId2}:`, commonPref);

                question = await getRandomQuestion(commonPref[0], commonPref[1]);
                logger.info(`Selected question for match ${matchId}:`, question._id);
            } catch (error) {
                logger.error(`Failed to get common preferences or select question for users ${userId1} and ${userId2}:`, error);
                throw error; // rethrow to be caught by outer catch
            }

            if (question) {
                questionid = question._id;
            }

            let collaborationData: CollaborationData;
            try {
                // Create the collaboration room. This is the part that can throw an ApiError.
                collaborationData = await createCollaboration(userId1, userId2, questionid);
                logger.info(`Successfully created collaboration room ${collaborationData.id} for match ${matchId}.`);

            } catch (error) {
                // This catch block specifically handles failures from createCollaboration
                if (error instanceof ApiError) {
                    logger.error(`Failed to create collaboration room for match ${matchId}. Status: ${error.status}, Message: ${error.message}`);
                } else {
                    // Catch any other unexpected errors from the collaboration call
                    logger.error(`An unexpected error occurred during collaboration room creation for match ${matchId}:`, error);
                }

                // revert the match creation in Supabase and re-add users to the queue
                await supabaseService.deleteMatch(matchId);
                await supabaseService.updateUserStatus(userId1, true);
                await supabaseService.updateUserStatus(userId2, true);
    
                return;
            }
    
            // Notify users of SUCCESS
            const payload = {
                matchId,
                users: [userId1, userId2],
                collaborationUrl: `/room/${collaborationData.id}`
            };
            
            const message = { type: 'MATCH_FOUND', payload };
            webSocketManager.sendMessage(userId1, message);
            webSocketManager.sendMessage(userId2, message);
    
            // Save history
            await supabaseService.setMatchHistory(userId1, { matchId, sessionId: collaborationData.id });
            await supabaseService.setMatchHistory(userId2, { matchId, sessionId: collaborationData.id });
    
            // Clean up the proposal
            await supabaseService.deleteProposal(proposalId);
    
        } catch (error) {
            // This outer catch block now handles critical, unexpected errors
            // from Supabase, Redis (queue), or WebSockets.
            logger.error(`A critical, unhandled error occurred in finalizeMatch for users ${userId1}, ${userId2}:`, error);
            // If finalization fails, put users back in queue
            await supabaseService.updateUserStatus(userId1, true);
            await supabaseService.updateUserStatus(userId2, true);
        }
    }

    async getMatchHistory(userId: string) {
        try {
            const historyArray = await supabaseService.getMatchHistory(userId);

            if (!historyArray || historyArray.length === 0) {
                return []; // no history
            }

            // Process all matches in parallel
            const processedMatches = await Promise.all(
              historyArray.map(async (match) => {
                  if (!match || !match.session_id) {
                      return null;
                  }

                  const { session_id, match_id } = match;

                  const collaborationHistory = await supabaseService.getCollaborationHistory(session_id);
                  if (!collaborationHistory) {
                      return null;
                  }

                  const {
                      interviewer_id,
                      interviewee_id,
                      status
                  } = collaborationHistory;

                  if (!interviewer_id || !interviewee_id) {
                      return null;
                  }

                  let oppositeName: string | null;
                  let role: string;

                  if (userId == interviewer_id) {
                      oppositeName = await supabaseService.getUserName(interviewee_id);
                      role = "interviewer";
                  } else {
                      oppositeName = await supabaseService.getUserName(interviewer_id);
                      role = "interviewee";
                  }

                  return {
                      matchId: match_id ?? null, // Handle null match_id
                      sessionId: session_id,
                      role: role,
                      status: status ?? 'unknown', // Default for null status
                      oppositeName: oppositeName ?? 'Unknown User' // Default for null name
                  };
              })
            );

            return processedMatches.filter(match => match !== null);

        } catch (error) {
            logger.error(`Failed to get match history for user: ${userId}`, error);
            throw error; // rethrow the error after logging
        }
    }

    async setMatchHistory(userId: string, param2: { matchId: string; sessionId: string }) {
        try {
            await supabaseService.setMatchHistory(userId, param2);
        } catch (error) {
            logger.error(`Failed to set match history for user: ${userId}`, error);
            throw error; // rethrow the error after logging
        }
    }
}

export const matchingService = new MatchingService();
