/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 01 Oct 2025
Scope: Helped implement several functions to meet team's requirements and simplified code through by refactoring. Also added comments to help
Author review: I checked correctness, and refined unclear implementatio and did a bit of debugging of minor issues.
*/
import { Request, Response } from "express";
import { matchingService } from "./matching.service";
import { logger } from "../utils/logger";

class MatchingController {
  // Get fuzzy matches for a user based on preferences and queue status
  async getMatches(req: Request, res: Response) {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    try {
      // @ts-ignore - Method not yet implemented in service
      const matches = await matchingService.findFuzzyMatches(userId);
      res.status(200).json(matches);
    } catch (error) {
      logger.error(`Error in getMatches for user ${userId}:`, error);
      res.status(500).json({ message: "Internal server error." });
    }
  }

  /* --- Match Making functions --- */
  // Get user preferences
  async getUserPreferences(req: Request, res: Response) {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    try {
      const preferences = await matchingService.getUserPreference(userId);
      if (preferences) {
        res.status(200).json(preferences);
      } else {
        res.status(404).json({ message: "User preferences not found." });
      }
    } catch (error) {
      logger.error(`Error in getUserPreferences for user ${userId}:`, error);
      res.status(500).json({ message: "Internal server error." });
    }
  }

  // Example: Endpoint to set/update user preferences
  async setUserPreferences(req: Request, res: Response) {
    type Difficulty = "easy" | "medium" | "hard";
    const userId = req.params.userId;
    const { topics, difficulty } = req.body as {
      topics: string[];
      difficulty: Difficulty;
    };

    if (!userId || !topics || !Array.isArray(topics) || !difficulty) {
      return res
        .status(400)
        .json({
          message: "User ID, topics (array), and difficulty are required.",
        });
    }

    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(difficulty)) {
      return res
        .status(400)
        .json({
          message: "Invalid difficulty. Must be easy, medium, or hard.",
        });
    }

    try {
      const updatedPreferences = await matchingService.updateUserPreferences(
        userId,
        { user_id: userId, topics, difficulty }
      );
      res.status(200).json(updatedPreferences);
    } catch (error) {
      logger.error(`Error in setUserPreferences for user ${userId}:`, error);
      res.status(500).json({ message: "Internal server error." });
    }
  }

  async addToQueue(req: Request, res: Response) {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    try {
      await matchingService.addToQueue(userId);
      res.status(200).json({ message: "User added to matching queue." });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "User is already in an active session."
      ) {
        return res
          .status(400)
          .json({ message: "You are already in an active session." });
      }

      logger.error(`Error in addUserToQueue for user ${userId}:`, error);
      res.status(500).json({ message: "Internal server error." });
    }
  }

  async removeFromQueue(req: Request, res: Response) {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    try {
      await matchingService.removeFromQueue(userId);
      res.status(200).json({ message: "User removed from matching queue." });
    } catch (error) {
      logger.error(`Error in removeUserFromQueue for user ${userId}:`, error);
      res.status(500).json({ message: "Internal server error." });
    }
  }

  async clearMatches(req: Request, res: Response) {
    const matchId = req.params.matchId;

    if (!matchId) {
      return res.status(400).json({ message: "Match ID is required." });
    }

    try {
      await matchingService.clearMatches(matchId);
      res.status(200).json({ message: "Matches cleared for user." });
    } catch (error) {
      logger.error(`Error in clearMatches for match ${matchId}:`, error);
      res.status(500).json({ message: "Internal server error." });
    }
  }

  /* --- Match History functions --- */
  // Get matching history for a user
  async getMatchHistory(req: Request, res: Response) {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    try {
      const history = await matchingService.getMatchHistory(userId);
      res.status(200).json(history);
    } catch (error) {
      logger.error(`Error in getMatchHistory for user ${userId}:`, error);
      res.status(500).json({ message: "Internal server error." });
    }
  }

  // Set matching history for a user
  async setMatchHistory(req: Request, res: Response) {
    const userId = req.params.userId;
    const { matchId, sessionId } = req.body as {
      matchId: string;
      sessionId: string;
    };

    if (!userId || !matchId || !sessionId) {
      return res
        .status(400)
        .json({ message: "User ID, match ID, and timestamp are required." });
    }

    try {
      await matchingService.setMatchHistory(userId, { matchId, sessionId });
      res.status(200).json({ message: "Match history updated for user." });
    } catch (error) {
      logger.error(`Error in setMatchHistory for user ${userId}:`, error);
      res.status(500).json({ message: "Internal server error." });
    }
  }

  async acceptMatch(req: Request, res: Response) {
    const { proposalId } = req.params;
    const userId = req.user.id; // Assuming auth middleware

    try {
      await matchingService.acceptMatch(proposalId, userId);
      res.status(200).json({ message: "Acceptance registered." });
    } catch (error) {
      logger.error(`Error in acceptMatch for user ${userId}:`, error);
      res.status(500).json({ message: "Internal server error." });
    }
  }

  async rejectMatch(req: Request, res: Response) {
    const { proposalId } = req.params;
    const userId = req.user.id;

    try {
      await matchingService.rejectMatch(proposalId, userId);
      res.status(200).json({ message: "Rejection registered." });
    } catch (error) {
      logger.error(`Error in rejectMatch for user ${userId}:`, error);
      res.status(500).json({ message: "Internal server error." });
    }
  }
}

export const matchingController = new MatchingController();
