import { Request, Response } from 'express';
import { matchingService } from './matching.service';
import { logger } from '../utils/logger';

class MatchingController {
    // Get fuzzy matches for a user based on preferences and queue status
    async getMatches(req: Request, res: Response) {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        try {
            const matches = await matchingService.findFuzzyMatches(userId);
            res.status(200).json(matches);
        } catch (error) {
            logger.error(`Error in getMatches for user ${userId}:`, error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }

    // Get user preferences
    async getUserPreferences(req: Request, res: Response) {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        try {
            const preferences = await matchingService.getUserPreference(userId);
            if (preferences) {
                res.status(200).json(preferences);
            } else {
                res.status(404).json({ message: 'User preferences not found.' });
            }
        } catch (error) {
            logger.error(`Error in getUserPreferences for user ${userId}:`, error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }

    // Example: Endpoint to set/update user preferences
    async setUserPreferences(req: Request, res: Response) {
        type Difficulty = "easy" | "medium" | "hard";
        const userId = req.params.userId;
        const { topics, difficulty } = req.body as { topics: string[]; difficulty: Difficulty };

        if (!userId || !topics || !Array.isArray(topics) || !difficulty) {
            return res.status(400).json({ message: 'User ID, topics (array), and difficulty are required.' });
        }

        const validDifficulties = ['easy', 'medium', 'hard'];
        if (!validDifficulties.includes(difficulty)) {
            return res.status(400).json({ message: 'Invalid difficulty. Must be easy, medium, or hard.' });
        }

        try {
            const updatedPreferences = await matchingService.updateUserPreferences(
                userId,
                { user_id: userId, topics, difficulty }
            );
            res.status(200).json(updatedPreferences);
        } catch (error) {
            logger.error(`Error in setUserPreferences for user ${userId}:`, error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }

    async addToQueue(req: Request, res: Response) {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        try {
            await matchingService.addToQueue(userId);
            res.status(200).json({ message: 'User added to matching queue.' });
        } catch (error) {
            logger.error(`Error in addUserToQueue for user ${userId}:`, error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }

    async removeFromQueue(req: Request, res: Response) {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        try {
            await matchingService.removeFromQueue(userId);
            res.status(200).json({ message: 'User removed from matching queue.' });
        } catch (error) {
            logger.error(`Error in removeUserFromQueue for user ${userId}:`, error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }

    async clearMatches(req: Request, res: Response) {
        const matchId = req.params.matchId;

        if (!matchId) {
            return res.status(400).json({ message: 'Match ID is required.' });
        }

        try {
            await matchingService.clearMatches(matchId);
            res.status(200).json({ message: 'Matches cleared for user.' });
        } catch (error) {
            logger.error(`Error in clearMatches for match ${matchId}:`, error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }

    async getMatchStatus (req: Request, res: Response) {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        try {
            const status = await matchingService.getMatchStatus(userId);
            res.status(200).json({ status });
        } catch (error) {
            logger.error(`Error in getMatchStatus for user ${userId}:`, error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }
}

export const matchingController = new MatchingController();