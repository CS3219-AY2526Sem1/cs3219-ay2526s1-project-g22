/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 01 Oct 2025
Scope: Helped implement several functions to meet requirements and simplified code through refactoring and added clarifying comments. 
Author review: I checked correctness, executed tests, and refined unclear implementations while debugging minor issues.
*/
import Redis from 'ioredis';
import config from '../config';
import { logger } from '../utils/logger';
import {supabaseService} from "./supabase.service";

class RedisService {
    public client: Redis;
    private readonly CACHE_TTL_SECONDS = 3600; // Cache for 1 hour
    private readonly MATCHES_KEY_PREFIX = 'matches';
    private readonly TOPIC_KEY_PREFIX = 'topic';

    constructor() {
        this.client = new Redis({
            host: config.redis.host,
            port: config.redis.port,
        });

        this.client.on('connect', () => {
            logger.info('Connected to Redis');
        });

        this.client.on('error', (err) => {
            logger.error('Redis Error:', err);
        });

        logger.info(`Redis client initialized for ${config.redis.host}:${config.redis.port}`);
    }

    // Generic get method with JSON parsing
    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Error getting from Redis for key ${key}:`, error);
            return null;
        }
    }

    // Fetch all members of a set for a given key
    async getTopics(key: string): Promise<Set<string>> {
        try {
            const members = await this.client.smembers(key);
            return new Set(members);
        } catch (error) {
            logger.error(`Error getting set members from Redis for key ${key}:`, error);
            return new Set();
        }
    }

    // Add user ID to multiple topic sets with TTL
    async setTopics(userId: string, topics: string[], ttlSeconds: number = this.CACHE_TTL_SECONDS): Promise<void> {
        for (const topic of topics) {
            const topicKey = `topic:${topic}`;
            try {
                await this.client.sadd(topicKey, userId);
                await this.client.expire(topicKey, ttlSeconds);
            } catch (error) {
                logger.error(`Error adding user ${userId} to topic set ${topicKey}:`, error);
            }
        }
    }

    // Batch fetch set members for multiple keys using pipeline
    // Returns an array of arrays, each containing the members of the corresponding set
    // If a key does not exist or an error occurs, returns an empty array for that key
    async fetchMembers(keys: string[]): Promise<string[][]> {
        try {
            const pipeline = this.client.pipeline();
            keys.forEach((key) => pipeline.smembers(`${this.TOPIC_KEY_PREFIX}:${key}`));

            // pipeline.exec() returns Promise<Array<[Error | null, unknown]>>
            const results = await pipeline.exec();

            if (!results) {
                logger.warn(
                    'Pipeline execution returned no results. Defaulting to empty arrays.',
                );
                return keys.map(() => []);
            }

            // Correctly type the callback parameters based on pipeline.exec() return
            return results.map((resultTuple, index) => {
                const [err, membersUntyped] = resultTuple;
                const members = membersUntyped as string[] | null | undefined;

                if (err) {
                    logger.error(`Error fetching members for key:`, err);
                    return [];
                }

                // Check if members is null/undefined or an empty array
                if (!members || members.length === 0) {
                    logger.info(
                        'No members found for one of the keys. Trying to fetch from Supabase as fallback.',
                    );
                    // Fallback to Supabase
                    supabaseService.fetchMembers([keys[index]]).then((fetched) => {
                        if (fetched && fetched.length > 0) {
                            // Cache the fetched members in Redis
                            fetched[0].forEach((userId) => {
                                this.client.sadd(`${this.TOPIC_KEY_PREFIX}:${keys[index]}`, userId);
                            });
                            this.client.expire(`${this.TOPIC_KEY_PREFIX}:${keys[index]}`, this.CACHE_TTL_SECONDS);
                            logger.info(
                                `Fetched and cached ${fetched[0].length} members for key ${keys[index]} from Supabase.`,
                            );

                            // Return the fetched members
                            return fetched[0];
                        }
                    }
                    ).catch((error) => {
                        logger.error(`Error fetching from Supabase for key ${keys[index]}:`, error);
                    });
                    return [];
                }
                return members;
            });
        } catch (error) {
            logger.error(`Error executing pipeline for keys ${keys}:`, error);
            return keys.map(() => []);
        }
    }

    // Generic set method with JSON stringification
    async set<T>(key: string, value: T, ttlSeconds: number = this.CACHE_TTL_SECONDS): Promise<void> {
        try {
            await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (error) {
            logger.error(`Error setting to Redis for key ${key}:`, error);
        }
    }

    // Generic delete method
    async del(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            logger.error(`Error deleting from Redis for key ${key}:`, error);
        }
    }

    // --- Method to Add a Match Record ---
    async addMatchToCache(sourceUserId: string, targetUserId: string, matchId: string) {
        try {
            const matchRecord = {
                matchId,
                users: [sourceUserId, targetUserId],
                timestamp: Date.now(),
            };
            const matchKey = `${this.MATCHES_KEY_PREFIX}:${matchId}`;

            // Use a transaction to ensure atomicity
            const transaction = this.client.multi();

            transaction.set(matchKey, JSON.stringify(matchRecord));
            transaction.sadd(`all_match_ids`, matchId);
            transaction.expire(matchKey, this.CACHE_TTL_SECONDS);
            transaction.sadd(`user_matches:${sourceUserId}`, matchId);
            transaction.sadd(`user_matches:${targetUserId}`, matchId);
            transaction.expire(`user_matches:${sourceUserId}`, this.CACHE_TTL_SECONDS);
            transaction.expire(`user_matches:${targetUserId}`, this.CACHE_TTL_SECONDS);
            await transaction.exec();

            logger.info(`Added match record to cache for user ${sourceUserId}`);
        } catch (error) {
            logger.error(`Error adding match record to cache for user ${sourceUserId}:`, error);
        }
    }

    // --- Method to Remove a Match Record ---
    async removeMatchFromCache(matchId: string) {
        try {
            const matchKey = `${this.MATCHES_KEY_PREFIX}:${matchId}`;
            const matchData = await this.get<{ matchId: string; users: string[]; timestamp: number }>(matchKey);
            if (matchData) {
                const transaction = this.client.multi();
                transaction.del(matchKey);
                transaction.srem(`all_match_ids`, matchId);
                for (const userId of matchData.users) {
                    transaction.srem(`user_matches:${userId}`, matchId);
                }
                await transaction.exec();
                logger.info(`Removed match record from cache for match ID ${matchId}`);
            } else {
                logger.warn(`No match data found in cache for match ID ${matchId}`);
            }
        } catch (error) {
            logger.error(`Error removing match record from cache for match ID ${matchId}:`, error);
        }
    }

    async saveFetchedMembersToCache(topicKeys: string[], queryResult: string[][]) {
        const pipeline = this.client.pipeline();
        topicKeys.forEach((key, index) => {
            if (queryResult[index] && queryResult[index].length > 0) {
                queryResult[index].forEach(userId => {
                    pipeline.sadd(key, userId);
                });
                pipeline.expire(key, this.CACHE_TTL_SECONDS);
            }
        });
        pipeline.exec().catch(error => {
            logger.error('Error saving fetched members to cache:', error);
        });
    }

    async removeUserMatchesFromCache(matchId: string) {
        await this.removeMatchFromCache(matchId);
    }

    async getMatchFromCache(userId: string) {
        const userMatchesKey = `user_matches:${userId}`;
        const matchIds = await this.client.smembers(userMatchesKey);

        if (matchIds.length === 0) return [];

        const keys = matchIds.map(
            (matchId) => `${this.MATCHES_KEY_PREFIX}:${matchId}`
        );

        const values = await this.client.mget(keys);

        const matches = [];
        for (let i = 0; i < values.length; i++) {
            const raw = values[i];
            if (!raw) continue;
            try {
                const parsed = JSON.parse(raw);
                matches.push(parsed);
            } catch (e) {
                logger.error(
                    'Error parsing match data from cache',
                    { userId, key: keys[i], err: e }
                );
            }
        }

        return matches;
    }
}

export const redisService = new RedisService();