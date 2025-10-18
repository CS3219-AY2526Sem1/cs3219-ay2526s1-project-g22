import {redisService} from '../services/redis.service';
import {supabaseService} from '../services/supabase.service';
import {logger} from '../utils/logger';
import {UserPreference} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { webSocketManager } from '../websockets/websocket.manager';
import {CollaborationData, createCollaboration, ApiError} from "../services/collaborate.service";

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
            await supabaseService.addUserToQueue(userId);
        } catch (error) {
            logger.error(`Failed to add user ${userId} to Supabase queue:`, error);
            throw error; // rethrow the error after logging
        }

        this.processMatchingQueue();
    }

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

                // Create the match
                await this.createMatch(currentUser, bestMatch);

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

    async getMatchStatus(userId: string) {
        try {
            const matchStatus = await redisService.getMatchFromCache(userId);
            if (!matchStatus) {
                // try to find in supabase
                const matchFromSupabase = await supabaseService.getMatchStatus(userId);
                if (matchFromSupabase && matchFromSupabase.match_id) {
                    // cache the match status
                    await redisService.addMatchToCache(
                        matchFromSupabase.user1_id,
                        matchFromSupabase.user2_id,
                        matchFromSupabase.match_id
                    );
                    return matchFromSupabase.match_id;
                }
                return null;
            }
            return matchStatus;
        } catch (error) {
            logger.error(`Failed to get match status for user: ${userId}`, error);
            throw error; // rethrow the error after logging
        }
    }


    // Finalizes a match between two users. This function handles all side effects:
    // creating a database record, removing users from the queue, and sending WebSocket notifications.
    async createMatch(userId1: string, userId2: string): Promise<void> {
        const matchId = uuidv4();

        try {
            // Step 1: Update the primary database
            const supabaseRes = await supabaseService.handleNewMatch(userId1, userId2, matchId);
            if (!supabaseRes.success) {
                logger.error(`Failed to handle new match in Supabase for ${userId1} and ${userId2}:`, supabaseRes.message);
                return; // Exit early if the DB write fails
            }
            logger.info(`Successfully saved match ${matchId} to Supabase.`);

            // Step 2: Remove users from the queue
            await this.removeFromQueue(userId1);
            await this.removeFromQueue(userId2);

            let collaborationData: CollaborationData;
            try {
                // Step 3: Create the collaboration room. This is the part that can throw an ApiError.
                collaborationData = await createCollaboration(userId1, userId2);
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
                await this.addToQueue(userId1);
                await this.addToQueue(userId2);

                return; // Stop execution
            }

            // Step 4: If we get here, the room was created successfully. Notify users.
            const payload = {
                matchId,
                users: [userId1, userId2],
                // `collaborationData` is guaranteed to be defined here
                collaborationUrl: `/room/${collaborationData.id}`
            };

            const message = {
                type: 'MATCH_FOUND',
                payload
            };

            webSocketManager.sendMessage(userId1, message);
            webSocketManager.sendMessage(userId2, message);

        } catch (error) {
            // This outer catch block now handles critical, unexpected errors
            // from Supabase, Redis (queue), or WebSockets.
            logger.error(`A critical, unhandled error occurred in createMatch for users ${userId1}, ${userId2}:`, error);
        }
    }
}

export const matchingService = new MatchingService();