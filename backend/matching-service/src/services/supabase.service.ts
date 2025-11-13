/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 01 Oct 2025
Scope: Helped implement several functions per requirements and simplified code  and added comments. 
Author review: I checked correctness, executed tests, and refined unclear implementations while debugging minor issues.
*/
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../config';
import { logger } from '../utils/logger';
import {UserPreference} from "../types";

class SupabaseService {
    public client: SupabaseClient;

    constructor() {
        if (!config.supabase.url || !config.supabase.servicekey) {
            logger.error('Supabase URL or Service Key is not provided. Cannot initialize Supabase client.');
            throw new Error('Supabase configuration missing.');
        }
        this.client = createClient(config.supabase.url, config.supabase.servicekey, {
            auth: {
                persistSession: false, // Disable local storage persistence
            },
        });
        logger.info('Supabase client initialized.');
    }

    // Example: Fetch a user's matching preferences
    async getUserPreferences(userId: string) {
        const { data , error } = await this.client
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            logger.error(`Error fetching user preferences for ${userId}:`, error.message);
            return null;
        }

        return data[0] || null; // Assuming user_id is unique
    }

    async fetchMembers(topics: string[]): Promise<string[][]> {
        logger.info(`Fetching members for topics: ${topics.join(', ')}`);

        if (!topics || topics.length === 0) {
            logger.warn('No topics provided for fetching members.');
            return [];
        }

        try {
            const promises = topics.map(async (topic) => {
                const { data, error } = await this.client
                    .from('user_preferences')
                    .select('user_id')
                    .overlaps('topics', [topic]); // Wrap the topic in an array for 'overlaps'

                if (error) {
                    logger.error(
                        `Error fetching members for topic '${topic}':`,
                        error.message,
                    );
                    return []; // Return an empty array for this specific topic's error
                }

                if (!data) {
                    return [];
                }

                // Map directly to user_id strings for clarity and efficiency
                return data.map((record) => record.user_id as string);
            });

            return await Promise.all(promises);
        } catch (error: any) {
            logger.error('Unhandled error in fetchMembers:', error.message || error);
            // Return an array of empty arrays, matching the structure of successful calls
            return topics.map(() => []);
        }
    }

    async addUserToQueue(userId: string) {
        const { data, error } = await this.client
            .from('users')
            .update({ in_queue: true })
            .eq('id', userId);

        if (error) {
            logger.error(`Error adding user ${userId} to matching queue:`, error.message);
            throw error;
        }

        return data ? data[0] : null;
    }

    async removeUserFromQueue(userId: string) {
        const { data, error } = await this.client
            .from('users')
            .update({ in_queue: false })
            .eq('id', userId);

        if (error) {
            logger.error(`Error removing user ${userId} from matching queue:`, error.message);
            throw error;
        }

        return data ? data[0] : null;
    }

    // Fetch all users currently in the matching queue
    async getQueueMembers() {
        const { data, error } = await this.client
            .from('users')
            .select('id')
            .eq('in_queue', true);

        if (error) {
            logger.error(`Error fetching queue members from Supabase: ${error.message}`);
            return [];
        }

        return data ? data.map(user => user.id) : [];
    }

    async updateUserPreferences(preferences: UserPreference) {
        const { data, error } = await this.client
            .from('user_preferences')
            .upsert({ ...preferences}, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            logger.error(`Error updating preferences for user ${preferences.user_id}:`, error.message);
            throw error;
        }

        return data;
    }

    async handleNewMatch(
        sourceUserId: string,
        matchUserId: string,
        matchId: string // Assuming matchId is a string for the SQL function
    ): Promise<{ success: boolean; message: string }> {
        const { data, error } = await this.client.rpc(
            'handle_new_match_transaction',
            {
                p_source_user_id: sourceUserId,
                p_match_user_id: matchUserId,
                p_match_id: matchId
            }
        );

        if (error) {
            logger.error(
                `Error calling handle_new_match_transaction for ${sourceUserId} and ${matchUserId}:`,
                error.message
            );
            throw error;
        }

        // The data returned from the RPC call will be the JSON object from your SQL function
        return data as { success: boolean; message: string };
    }

    async clearMatches(matchId: string) {
        const { data, error } = await this.client
            .from('users')
            .update({ match_id: null })
            .eq('match_id', matchId);

        if (error) {
            logger.error(`Error clearing matches for match ID ${matchId}:`, error.message);
            throw error;
        }

        return data;
    }

    // Retrieve the current matchID for a user
    async getMatchStatus(userId: string) {
        const { data, error } = await this.client
            .from('users')
            .select('match_id')
            .eq('id', userId)
            .single();

        if (error) {
            logger.error(`Error fetching match status for user ${userId}:`, error.message);
            throw error;
        }

        return data ? data.match_id : null;
    }

    async deleteMatch(matchId: string | Uint8Array<ArrayBufferLike>) {
        const { data, error } = await this.client
          .from('users')
          .update({ match_id: null })
          .eq('match_id', matchId);

        if (error) {
            logger.error(`Error deleting match with ID ${matchId}:`, error.message);
            throw error;
        }

        return data;
    }

    async setMatchHistory(userId: string, param2: { matchId: string; sessionId: string }) {
        const { matchId, sessionId } = param2;
        const { data, error } = await this.client
            .from('match_history')
            .insert([{ user_id: userId, match_id: matchId, session_id: sessionId }])
            .select()
            .single();

        if (error) {
            logger.error(`Error setting match history for user ${userId}:`, error.message);
            throw error;
        }

        return data;
    }

    async checkExistingSession(userId: string) {
        const { count, error } = await this.client
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .or(
            `interviewer_id.eq.${userId},` +
            `interviewee_id.eq.${userId}`
          );

        if (error) {
            logger.error(`Error checking existing session for user ${userId}:`, error.message);
            throw error;
        }

        return count;
    }

    async getMatchHistory(userId: string) {
        const { data, error } = await this.client
            .from('match_history')
            .select('session_id, match_id')
            .eq('user_id', userId);

        if (error) {
            logger.error(`Error fetching match history for user ${userId}:`, error.message);
            throw error;
        }

        return data;
    }

    async getCollaborationHistory(session_id: any) {
        const { data, error } = await this.client
            .from('sessions')
            .select('interviewer_id, interviewee_id, status')
            .eq('id', session_id)
            .single();

        if (error) {
            logger.error(`Error fetching collaboration history for session ${session_id}:`, error.message);
            return null;
        }

        return data;
    }

    async createMatchProposal(proposalId: string, userId1: string, userId2: string) {
        const { data, error } = await this.client
            .from('match_proposals')
            .insert([{ id: proposalId, user1_id: userId1, user2_id: userId2 }])
            .select()
            .single();

        if (error) {
            logger.error(`Error creating match proposal for users ${userId1} and ${userId2}:`, error.message);
            throw error;
        }
        return data;
    }

    async updateProposalStatus(proposalId: string, userId: string, status: 'accepted' | 'rejected') {
        // First, fetch the proposal to know which user column to update
        const { data: proposal, error: fetchError } = await this.client
            .from('match_proposals')
            .select('user1_id, user2_id')
            .eq('id', proposalId)
            .single();

        if (fetchError || !proposal) {
            logger.error(`Error fetching proposal ${proposalId} to update status:`, fetchError?.message);
            throw fetchError || new Error('Proposal not found');
        }

        const statusColumn = proposal.user1_id === userId ? 'user1_status' : 'user2_status';

        const { data, error } = await this.client
            .from('match_proposals')
            .update({ [statusColumn]: status })
            .eq('id', proposalId)
            .select()
            .single();

        if (error) {
            logger.error(`Error updating proposal status for user ${userId} on proposal ${proposalId}:`, error.message);
            throw error;
        }
        return data;
    }

    async getProposal(proposalId: string) {
        const { data, error } = await this.client
            .from('match_proposals')
            .select('*')
            .eq('id', proposalId)
            .single();

        if (error) {
            logger.error(`Error fetching proposal ${proposalId}:`, error.message);
            throw error;
        }
        return data;
    }

    async deleteProposal(proposalId: string) {
        const { error } = await this.client
            .from('match_proposals')
            .delete()
            .eq('id', proposalId);

        if (error) {
            logger.error(`Error deleting proposal ${proposalId}:`, error.message);
            throw error;
        }
    }

    async logFeedback(userId: string, otherUserId: string, action: 'accepted' | 'rejected') {
        const { data, error } = await this.client
            .from('user_feedback')
            .insert([{ user_id: userId, other_user_id: otherUserId, action: action }]);

        if (error) {
            logger.error(`Error logging feedback from ${userId} to ${otherUserId}:`, error.message);
            throw error;
        }
        return data;
    }

    async getRejectionRate(userId: string): Promise<number> {
        // Get total proposals where the user was the "other user"
        const { count: totalCount, error: totalError } = await this.client
            .from('user_feedback')
            .select('*', { count: 'exact', head: true })
            .eq('other_user_id', userId);

        if (totalError) {
            logger.error(`Error fetching total feedback count for user ${userId} as other_user:`, totalError.message);
            return 0;
        }

        if (totalCount === 0 || totalCount === null) {
            return 0;
        }

        // Get count of times user was rejected
        const { count: rejectedCount, error: rejectedError } = await this.client
            .from('user_feedback')
            .select('*', { count: 'exact', head: true })
            .eq('other_user_id', userId)
            .eq('action', 'rejected');

        if (rejectedError) {
            logger.error(`Error fetching rejected feedback count for user ${userId} as other_user:`, rejectedError.message);
            return 0;
        }
        
        if (rejectedCount === null) {
            return 0;
        }

        return rejectedCount / totalCount;
    }

    async updateUserStatus(userId: string, in_queue: boolean) {
        const { data, error } = await this.client
            .from('users')
            .update({ in_queue: in_queue })
            .eq('id', userId);

        if (error) {
            logger.error(`Error updating status for user ${userId}:`, error.message);
            throw error;
        }

        return data;
    }

    async getUserName(id: any) {
        const { data, error } = await this.client
            .from('users')
            .select('name')
            .eq('id', id)
            .single();

        if (error) {
            logger.error(`Error fetching username for user ${id}:`, error.message);
            throw error;
        }

        return data ? data.name : null;
    }
}

export const supabaseService = new SupabaseService();
