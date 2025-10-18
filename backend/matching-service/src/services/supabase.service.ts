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
            .from('matches')
            .delete()
            .eq('id', matchId);

        if (error) {
            logger.error(`Error deleting match with ID ${matchId}:`, error.message);
            throw error;
        }

        return data;
    }
}

export const supabaseService = new SupabaseService();