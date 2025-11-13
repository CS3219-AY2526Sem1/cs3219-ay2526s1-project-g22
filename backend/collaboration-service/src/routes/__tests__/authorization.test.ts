/*
AI Assistance Disclosure:
Tool: Claude Sonnet 4.5, date: 15 Oct 2025
Scope: Assisted with debugging using debug and test findings, fixed code to work correctly, and tidied up sections with small refactors. Also suggested tests for relevant edge cases.
Author review: I verified behavior and ran tests, clarified the code, and fixed small implementation issues.
*/

import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

// Mock jsonwebtoken
jest.mock("jsonwebtoken");

// Mock the dotenv config and set SECRET_KEY before importing the module
const TEST_SECRET = "test-secret-key";
process.env.SECRET_KEY = TEST_SECRET;

// Now import after setting the env var
import { authenticateUser } from "../authorization";

describe("Authorization Middleware - Unit Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe("authenticateUser", () => {
    it("should authenticate valid token successfully", async () => {
      const mockPayload = { sub: "user-123" };
      mockRequest.headers = {
        authorization: "Bearer valid-token",
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jwt.verify).toHaveBeenCalledWith("valid-token", TEST_SECRET);
      expect(mockRequest.user).toEqual({ id: "user-123" });
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("should reject request without authorization header", async () => {
      mockRequest.headers = {};

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Authorization header is required.",
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it("should reject token without sub claim", async () => {
      mockRequest.headers = {
        authorization: "Bearer token-without-sub",
      };

      (jwt.verify as jest.Mock).mockReturnValue({});

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Sorry, but you are not authorized to view this page.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject invalid token", async () => {
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "JWT verification failed:",
        expect.any(Error)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject expired token", async () => {
      mockRequest.headers = {
        authorization: "Bearer expired-token",
      };

      const expiredError = new Error("Token expired");
      expiredError.name = "TokenExpiredError";
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should strip 'Bearer ' prefix from token", async () => {
      const mockPayload = { sub: "user-456" };
      mockRequest.headers = {
        authorization: "Bearer my-jwt-token",
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jwt.verify).toHaveBeenCalledWith("my-jwt-token", TEST_SECRET);
      expect(mockRequest.user?.id).toBe("user-456");
    });

    it("should handle malformed authorization header", async () => {
      mockRequest.headers = {
        authorization: "InvalidFormat",
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Malformed token");
      });

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
    });

    it("should attach user id to request object", async () => {
      const userId = "test-user-789";
      const mockPayload = { sub: userId };
      mockRequest.headers = {
        authorization: "Bearer valid-token",
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe(userId);
    });

    it("should use SECRET_KEY from environment", async () => {
      // This test verifies the module uses the SECRET_KEY set at import time
      const mockPayload = { sub: "user-123" };
      mockRequest.headers = {
        authorization: "Bearer token",
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jwt.verify).toHaveBeenCalledWith("token", TEST_SECRET);
    });

    it("should handle JsonWebTokenError", async () => {
      mockRequest.headers = {
        authorization: "Bearer bad-token",
      };

      const jwtError = new Error("jwt malformed");
      jwtError.name = "JsonWebTokenError";
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw jwtError;
      });

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
    });
  });
});
