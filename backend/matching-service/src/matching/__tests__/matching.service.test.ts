// Mock all dependencies before imports
jest.mock("../../services/redis.service", () => ({
  redisService: {
    get: jest.fn(),
    set: jest.fn(),
    setTopics: jest.fn(),
    removeUserMatchesFromCache: jest.fn(),
    getMatchFromCache: jest.fn(),
    addMatchToCache: jest.fn(),
  },
}));

jest.mock("../../services/supabase.service", () => ({
  supabaseService: {
    getUserPreferences: jest.fn(),
    addUserToQueue: jest.fn(),
    removeUserFromQueue: jest.fn(),
    getQueueMembers: jest.fn(),
    updateUserPreferences: jest.fn(),
    clearMatches: jest.fn(),
    getMatchStatus: jest.fn(),
    handleNewMatch: jest.fn(),
    deleteMatch: jest.fn(),
  },
}));

jest.mock("../../services/collaborate.service", () => ({
  createCollaboration: jest.fn(),
  ApiError: class ApiError extends Error {
    constructor(message: string, public status: number) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

jest.mock("../../websockets/websocket.manager", () => ({
  webSocketManager: {
    sendMessage: jest.fn(),
  },
}));

jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

import { MatchingService } from "../matching.service";
import { redisService } from "../../services/redis.service";
import { supabaseService } from "../../services/supabase.service";
import {
  createCollaboration,
  ApiError,
} from "../../services/collaborate.service";
import { webSocketManager } from "../../websockets/websocket.manager";
import { logger } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";
import { UserPreference } from "../../types";

describe("MatchingService", () => {
  let matchingService: MatchingService;

  beforeEach(() => {
    matchingService = new MatchingService();
    jest.clearAllMocks();
  });

  describe("getUserPreference", () => {
    it("should return cached preferences when available", async () => {
      const mockPreference: UserPreference = {
        user_id: "user123",
        topics: ["arrays", "strings"],
        difficulty: "medium",
      };

      (redisService.get as jest.Mock).mockResolvedValue(mockPreference);

      const result = await matchingService.getUserPreference("user123");

      expect(redisService.get).toHaveBeenCalledWith("user_match_pref:user123");
      expect(supabaseService.getUserPreferences).not.toHaveBeenCalled();
      expect(result).toEqual(mockPreference);
      expect(logger.info).toHaveBeenCalledWith(
        "Cache hit for user preferences: user123"
      );
    });

    it("should fetch from Supabase and cache when not in Redis", async () => {
      const mockPreference: UserPreference = {
        user_id: "user123",
        topics: ["algorithms"],
        difficulty: "hard",
      };

      (redisService.get as jest.Mock).mockResolvedValue(null);
      (supabaseService.getUserPreferences as jest.Mock).mockResolvedValue(
        mockPreference
      );

      const result = await matchingService.getUserPreference("user123");

      expect(redisService.get).toHaveBeenCalledWith("user_match_pref:user123");
      expect(supabaseService.getUserPreferences).toHaveBeenCalledWith(
        "user123"
      );
      expect(redisService.set).toHaveBeenCalledWith(
        "user_match_pref:user123",
        mockPreference
      );
      expect(result).toEqual(mockPreference);
    });

    it("should return null when user preferences do not exist", async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (supabaseService.getUserPreferences as jest.Mock).mockResolvedValue(null);

      const result = await matchingService.getUserPreference("user123");

      expect(result).toBeNull();
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe("addToQueue", () => {
    it("should add user to queue and trigger matching", async () => {
      (supabaseService.addUserToQueue as jest.Mock).mockResolvedValue(
        undefined
      );
      (supabaseService.getQueueMembers as jest.Mock).mockResolvedValue([
        "user123",
      ]);

      await matchingService.addToQueue("user123");

      expect(supabaseService.addUserToQueue).toHaveBeenCalledWith("user123");
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should log error and rethrow when addUserToQueue fails", async () => {
      const error = new Error("Queue full");
      (supabaseService.addUserToQueue as jest.Mock).mockRejectedValue(error);

      await expect(matchingService.addToQueue("user123")).rejects.toThrow(
        "Queue full"
      );

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to add user user123 to Supabase queue:",
        error
      );
    });
  });

  describe("removeFromQueue", () => {
    it("should remove user from queue successfully", async () => {
      (supabaseService.removeUserFromQueue as jest.Mock).mockResolvedValue(
        undefined
      );

      await matchingService.removeFromQueue("user123");

      expect(supabaseService.removeUserFromQueue).toHaveBeenCalledWith(
        "user123"
      );
    });

    it("should log error and rethrow when removeUserFromQueue fails", async () => {
      const error = new Error("User not in queue");
      (supabaseService.removeUserFromQueue as jest.Mock).mockRejectedValue(
        error
      );

      await expect(matchingService.removeFromQueue("user123")).rejects.toThrow(
        "User not in queue"
      );

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to remove user user123 from Supabase queue:",
        error
      );
    });
  });

  describe("addToQueueWithoutMatchMaking", () => {
    it("should add user to queue without triggering matching", async () => {
      (supabaseService.addUserToQueue as jest.Mock).mockResolvedValue(
        undefined
      );

      await matchingService.addToQueueWithoutMatchMaking("user123");

      expect(supabaseService.addUserToQueue).toHaveBeenCalledWith("user123");
      // Should not trigger processMatchingQueue (no additional calls)
    });

    it("should log error and rethrow when addUserToQueue fails", async () => {
      const error = new Error("Queue error");
      (supabaseService.addUserToQueue as jest.Mock).mockRejectedValue(error);

      await expect(
        matchingService.addToQueueWithoutMatchMaking("user123")
      ).rejects.toThrow("Queue error");

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to add user user123 to Supabase queue:",
        error
      );
    });
  });

  describe("processMatchingQueue", () => {
    it("should not process when less than 2 users in queue", async () => {
      (supabaseService.getQueueMembers as jest.Mock).mockResolvedValue([
        "user1",
      ]);

      await matchingService.processMatchingQueue();

      expect(logger.info).toHaveBeenCalledWith(
        "Not enough users in the queue to form a match."
      );
    });

    it("should not match users with different difficulty", async () => {
      const user1Pref: UserPreference = {
        user_id: "user1",
        topics: ["arrays", "strings"],
        difficulty: "easy",
      };

      const user2Pref: UserPreference = {
        user_id: "user2",
        topics: ["arrays", "strings"],
        difficulty: "hard",
      };

      (supabaseService.getQueueMembers as jest.Mock).mockResolvedValue([
        "user1",
        "user2",
      ]);
      (redisService.get as jest.Mock)
        .mockResolvedValueOnce(user1Pref)
        .mockResolvedValueOnce(user2Pref);

      await matchingService.processMatchingQueue();

      expect(logger.info).toHaveBeenCalledWith(
        "No suitable match found for user1 in this pass."
      );
    });
  });

  describe("updateUserPreferences", () => {
    it("should update preferences in Supabase and Redis", async () => {
      const newPreferences: UserPreference = {
        user_id: "user123",
        topics: ["graphs", "trees"],
        difficulty: "hard",
      };

      (supabaseService.updateUserPreferences as jest.Mock).mockResolvedValue(
        undefined
      );

      const result = await matchingService.updateUserPreferences(
        "user123",
        newPreferences
      );

      expect(supabaseService.updateUserPreferences).toHaveBeenCalledWith(
        newPreferences
      );
      expect(redisService.set).toHaveBeenCalledWith(
        "user_match_pref:user123",
        newPreferences
      );
      expect(redisService.setTopics).toHaveBeenCalledWith("user123", [
        "graphs",
        "trees",
      ]);
      expect(result).toEqual(newPreferences);
    });

    it("should return null when Supabase update fails", async () => {
      const newPreferences: UserPreference = {
        user_id: "user123",
        topics: ["arrays"],
        difficulty: "easy",
      };

      (supabaseService.updateUserPreferences as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      const result = await matchingService.updateUserPreferences(
        "user123",
        newPreferences
      );

      expect(result).toBeNull();
      expect(redisService.set).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("clearMatches", () => {
    it("should clear matches in Supabase and Redis", async () => {
      (supabaseService.clearMatches as jest.Mock).mockResolvedValue(undefined);
      (redisService.removeUserMatchesFromCache as jest.Mock).mockResolvedValue(
        undefined
      );

      await matchingService.clearMatches("match123");

      expect(supabaseService.clearMatches).toHaveBeenCalledWith("match123");
      expect(redisService.removeUserMatchesFromCache).toHaveBeenCalledWith(
        "match123"
      );
      expect(logger.info).toHaveBeenCalledWith(
        "Cleared matches for match: match123"
      );
    });

    it("should log error and rethrow when clearing fails", async () => {
      const error = new Error("Clear failed");
      (supabaseService.clearMatches as jest.Mock).mockRejectedValue(error);

      await expect(matchingService.clearMatches("match123")).rejects.toThrow(
        "Clear failed"
      );

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to clear matches for match: match123",
        error
      );
    });
  });

  describe("getMatchStatus", () => {
    it("should return match from Redis cache", async () => {
      const mockMatches = [{ matchId: "match123", users: ["user1", "user2"] }];
      (redisService.getMatchFromCache as jest.Mock).mockResolvedValue(
        mockMatches
      );

      const result = await matchingService.getMatchStatus("user123");

      expect(redisService.getMatchFromCache).toHaveBeenCalledWith("user123");
      expect(supabaseService.getMatchStatus).not.toHaveBeenCalled();
      expect(result).toEqual(mockMatches);
    });

    it("should fetch from Supabase and cache when not in Redis", async () => {
      const mockMatch = {
        match_id: "match123",
        user1_id: "user1",
        user2_id: "user2",
      };

      (redisService.getMatchFromCache as jest.Mock).mockResolvedValue(null);
      (supabaseService.getMatchStatus as jest.Mock).mockResolvedValue(
        mockMatch
      );

      const result = await matchingService.getMatchStatus("user123");

      expect(supabaseService.getMatchStatus).toHaveBeenCalledWith("user123");
      expect(redisService.addMatchToCache).toHaveBeenCalledWith(
        "user1",
        "user2",
        "match123"
      );
      expect(result).toBe("match123");
    });

    it("should return null when no match found", async () => {
      (redisService.getMatchFromCache as jest.Mock).mockResolvedValue(null);
      (supabaseService.getMatchStatus as jest.Mock).mockResolvedValue(null);

      const result = await matchingService.getMatchStatus("user123");

      expect(result).toBeNull();
    });
  });

  describe("createMatch", () => {
    it("should create match successfully", async () => {
      const mockCollabData = {
        id: "collab123",
        interviewer_id: "user1",
        interviewee_id: "user2",
        initial_code: "",
        created_at: new Date().toISOString(),
        status: "active",
      };

      (uuidv4 as jest.Mock).mockReturnValue("match123");
      (supabaseService.handleNewMatch as jest.Mock).mockResolvedValue({
        success: true,
      });
      (supabaseService.removeUserFromQueue as jest.Mock).mockResolvedValue(
        undefined
      );
      (createCollaboration as jest.Mock).mockResolvedValue(mockCollabData);

      await matchingService.createMatch("user1", "user2");

      expect(supabaseService.handleNewMatch).toHaveBeenCalledWith(
        "user1",
        "user2",
        "match123"
      );
      expect(createCollaboration).toHaveBeenCalledWith("user1", "user2");
      expect(webSocketManager.sendMessage).toHaveBeenCalledTimes(2);
      expect(webSocketManager.sendMessage).toHaveBeenCalledWith(
        "user1",
        expect.objectContaining({
          type: "MATCH_FOUND",
          payload: expect.objectContaining({
            matchId: "match123",
            users: ["user1", "user2"],
            collaborationUrl: "/room/collab123",
          }),
        })
      );
    });

    it("should rollback match when collaboration creation fails", async () => {
      (uuidv4 as jest.Mock).mockReturnValue("match123");
      (supabaseService.handleNewMatch as jest.Mock).mockResolvedValue({
        success: true,
      });
      (supabaseService.removeUserFromQueue as jest.Mock).mockResolvedValue(
        undefined
      );
      (createCollaboration as jest.Mock).mockRejectedValue(
        new ApiError("Collaboration failed", 500)
      );
      (supabaseService.deleteMatch as jest.Mock).mockResolvedValue(undefined);
      (supabaseService.addUserToQueue as jest.Mock).mockResolvedValue(
        undefined
      );

      await matchingService.createMatch("user1", "user2");

      expect(supabaseService.deleteMatch).toHaveBeenCalledWith("match123");
      expect(supabaseService.addUserToQueue).toHaveBeenCalledWith("user1");
      expect(supabaseService.addUserToQueue).toHaveBeenCalledWith("user2");
      expect(webSocketManager.sendMessage).not.toHaveBeenCalled();
    });

    it("should not create match when Supabase handleNewMatch fails", async () => {
      (uuidv4 as jest.Mock).mockReturnValue("match123");
      (supabaseService.handleNewMatch as jest.Mock).mockResolvedValue({
        success: false,
        message: "Database error",
      });

      await matchingService.createMatch("user1", "user2");

      expect(createCollaboration).not.toHaveBeenCalled();
      expect(webSocketManager.sendMessage).not.toHaveBeenCalled();
    });
  });
});
