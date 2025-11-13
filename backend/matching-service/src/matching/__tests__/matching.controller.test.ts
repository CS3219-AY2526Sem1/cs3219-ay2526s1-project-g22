/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 01 Oct 2025
Scope: Helped implement several functions 
Author review: I checked correctness, and ran tests and did a bit of debugging of minor issues.
*/
// Mock all dependencies before imports
jest.mock("../matching.service", () => ({
  matchingService: {
    findFuzzyMatches: jest.fn(),
    getUserPreference: jest.fn(),
    updateUserPreferences: jest.fn(),
    addToQueue: jest.fn(),
    removeFromQueue: jest.fn(),
    clearMatches: jest.fn(),
  },
}));

jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { Request, Response } from "express";
import { matchingController } from "../matching.controller";
import { matchingService } from "../matching.service";
import { logger } from "../../utils/logger";

describe("MatchingController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();

    mockRequest = {
      params: {},
      body: {},
    };

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    jest.clearAllMocks();
  });

  describe("getMatches", () => {
    it("should return 400 when userId is missing", async () => {
      mockRequest.params = {};

      await matchingController.getMatches(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: "User ID is required.",
      });
    });

    it("should return matches successfully", async () => {
      const mockMatches = [
        { userId: "user2", topics: ["arrays"], difficulty: "medium" },
      ];

      mockRequest.params = { userId: "user123" };
      (
        (matchingService as any).findFuzzyMatches as jest.Mock
      ).mockResolvedValue(mockMatches);

      await matchingController.getMatches(
        mockRequest as Request,
        mockResponse as Response
      );

      expect((matchingService as any).findFuzzyMatches).toHaveBeenCalledWith(
        "user123"
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockMatches);
    });

    it("should handle errors", async () => {
      mockRequest.params = { userId: "user123" };
      (
        (matchingService as any).findFuzzyMatches as jest.Mock
      ).mockRejectedValue(new Error("Database error"));

      await matchingController.getMatches(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(logger.error).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Internal server error.",
      });
    });
  });

  describe("getUserPreferences", () => {
    it("should return 400 when userId is missing", async () => {
      mockRequest.params = {};

      await matchingController.getUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: "User ID is required.",
      });
    });

    it("should return preferences successfully", async () => {
      const mockPreferences = {
        user_id: "user123",
        topics: ["arrays", "strings"],
        difficulty: "medium" as const,
      };

      mockRequest.params = { userId: "user123" };
      (matchingService.getUserPreference as jest.Mock).mockResolvedValue(
        mockPreferences
      );

      await matchingController.getUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(matchingService.getUserPreference).toHaveBeenCalledWith("user123");
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockPreferences);
    });

    it("should return 404 when preferences not found", async () => {
      mockRequest.params = { userId: "user123" };
      (matchingService.getUserPreference as jest.Mock).mockResolvedValue(null);

      await matchingController.getUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "User preferences not found.",
      });
    });

    it("should handle errors", async () => {
      mockRequest.params = { userId: "user123" };
      (matchingService.getUserPreference as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await matchingController.getUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(logger.error).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe("setUserPreferences", () => {
    it("should return 400 when userId is missing", async () => {
      mockRequest.params = {};
      mockRequest.body = { topics: ["arrays"], difficulty: "easy" };

      await matchingController.setUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should return 400 when topics is not an array", async () => {
      mockRequest.params = { userId: "user123" };
      mockRequest.body = { topics: "not-array", difficulty: "easy" };

      await matchingController.setUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should return 400 when difficulty is invalid", async () => {
      mockRequest.params = { userId: "user123" };
      mockRequest.body = { topics: ["arrays"], difficulty: "invalid" };

      await matchingController.setUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Invalid difficulty. Must be easy, medium, or hard.",
      });
    });

    it("should update preferences successfully", async () => {
      const mockUpdated = {
        user_id: "user123",
        topics: ["arrays", "strings"],
        difficulty: "medium" as const,
      };

      mockRequest.params = { userId: "user123" };
      mockRequest.body = {
        topics: ["arrays", "strings"],
        difficulty: "medium",
      };
      (matchingService.updateUserPreferences as jest.Mock).mockResolvedValue(
        mockUpdated
      );

      await matchingController.setUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(matchingService.updateUserPreferences).toHaveBeenCalledWith(
        "user123",
        {
          user_id: "user123",
          topics: ["arrays", "strings"],
          difficulty: "medium",
        }
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockUpdated);
    });

    it("should handle errors", async () => {
      mockRequest.params = { userId: "user123" };
      mockRequest.body = { topics: ["arrays"], difficulty: "easy" };
      (matchingService.updateUserPreferences as jest.Mock).mockRejectedValue(
        new Error("Update error")
      );

      await matchingController.setUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(logger.error).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe("addToQueue", () => {
    it("should return 400 when userId is missing", async () => {
      mockRequest.params = {};

      await matchingController.addToQueue(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should add user to queue successfully", async () => {
      mockRequest.params = { userId: "user123" };
      (matchingService.addToQueue as jest.Mock).mockResolvedValue(undefined);

      await matchingController.addToQueue(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(matchingService.addToQueue).toHaveBeenCalledWith("user123");
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: "User added to matching queue.",
      });
    });

    it("should handle errors", async () => {
      mockRequest.params = { userId: "user123" };
      (matchingService.addToQueue as jest.Mock).mockRejectedValue(
        new Error("Queue error")
      );

      await matchingController.addToQueue(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(logger.error).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe("removeFromQueue", () => {
    it("should return 400 when userId is missing", async () => {
      mockRequest.params = {};

      await matchingController.removeFromQueue(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should remove user from queue successfully", async () => {
      mockRequest.params = { userId: "user123" };
      (matchingService.removeFromQueue as jest.Mock).mockResolvedValue(
        undefined
      );

      await matchingController.removeFromQueue(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(matchingService.removeFromQueue).toHaveBeenCalledWith("user123");
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: "User removed from matching queue.",
      });
    });

    it("should handle errors", async () => {
      mockRequest.params = { userId: "user123" };
      (matchingService.removeFromQueue as jest.Mock).mockRejectedValue(
        new Error("Remove error")
      );

      await matchingController.removeFromQueue(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(logger.error).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe("clearMatches", () => {
    it("should return 400 when matchId is missing", async () => {
      mockRequest.params = {};

      await matchingController.clearMatches(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should clear matches successfully", async () => {
      mockRequest.params = { matchId: "match123" };
      (matchingService.clearMatches as jest.Mock).mockResolvedValue(undefined);

      await matchingController.clearMatches(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(matchingService.clearMatches).toHaveBeenCalledWith("match123");
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Matches cleared for user.",
      });
    });

    it("should handle errors", async () => {
      mockRequest.params = { matchId: "match123" };
      (matchingService.clearMatches as jest.Mock).mockRejectedValue(
        new Error("Clear error")
      );

      await matchingController.clearMatches(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(logger.error).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });
});
