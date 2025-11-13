/*
AI Assistance Disclosure:
Tool: Claude Sonnet 4.5, date: 15 Oct 2025
Scope: Assisted with debugging using debug and test findings, fixed code to work correctly, and tidied up sections with small refactors. Also suggested tests for relevant edge cases.
Author review: I verified behavior and ran tests, clarified the code, and fixed small implementation issues.
*/

// Mock all dependencies BEFORE importing anything else
jest.mock("../../utils/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("../../services/sessions.service");
jest.mock("../authorization");

// Mock global fetch
global.fetch = jest.fn() as jest.Mock;

import request from "supertest";
import express, { Express, Request, Response, NextFunction } from "express";
import sessionsRouter from "../sessions.routes";
import * as sessionsService from "../../services/sessions.service";

describe("Sessions Routes - Unit Tests", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware to always pass
    const { authenticateUser } = require("../authorization");
    (authenticateUser as jest.Mock).mockImplementation(
      (req: Request, res: Response, next: NextFunction) => {
        req.user = { id: "authenticated-user-123" };
        next();
      }
    );

    app.use("/sessions", sessionsRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /sessions", () => {
    const mockQuestion = {
      id: "question-123",
      title: "Two Sum",
      difficulty: "Easy",
    };

    const mockSession = {
      id: "session-123",
      // interviewer_id: "testinterviewr",
      interviewee_id: "user-456",
      question_id: "question-123",
      current_code: "",
      status: "active",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockQuestion,
        text: async () => JSON.stringify(mockQuestion),
      });

      (sessionsService.createSession as jest.Mock).mockResolvedValue(
        mockSession
      );
    });

    it("should create a new solo session successfully", async () => {
      const response = await request(app).post("/sessions").send({
        interviewee_id: "user-456",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSession);
      expect(global.fetch).toHaveBeenCalled();
      expect(sessionsService.createSession).toHaveBeenCalledWith(
        null,
        "user-456",
        "question-123",
        ""
      );
    });

    it("should create session with custom interviewer_id", async () => {
      await request(app).post("/sessions").send({
        interviewer_id: "custom-interviewer",
        interviewee_id: "user-456",
      });

      expect(sessionsService.createSession).toHaveBeenCalledWith(
        "custom-interviewer",
        "user-456",
        "question-123",
        ""
      );
    });

    it("should create session with initial code", async () => {
      const initialCode = "console.log('Hello');";

      await request(app).post("/sessions").send({
        interviewer_id: "testinterviewr",
        interviewee_id: "user-456",
        initial_code: initialCode,
      });

      expect(sessionsService.createSession).toHaveBeenCalledWith(
        "testinterviewr",
        "user-456",
        "question-123",
        initialCode
      );
    });

    it("should return 401 if user not authenticated", async () => {
      const { authenticateUser } = require("../authorization");
      (authenticateUser as jest.Mock).mockImplementationOnce(
        (req: Request, res: Response) => {
          res.status(401).json({ error: "Unauthorized" });
        }
      );

      const newApp = express();
      newApp.use(express.json());
      newApp.use("/sessions", sessionsRouter);

      const response = await request(newApp).post("/sessions").send({
        interviewee_id: "user-456",
      });

      expect(response.status).toBe(401);
    });

    it("should fetch random question from question service", async () => {
      await request(app).post("/sessions").send({
        interviewee_id: "user-456",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/questions/random")
      );
    });

    it("should handle question service error", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => "Question service error",
      });

      const response = await request(app).post("/sessions").send({
        interviewee_id: "user-456",
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Could not retrieve random question");
    });

    it("should handle missing question id in response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ title: "Test Question" }),
      });

      const response = await request(app).post("/sessions").send({
        interviewee_id: "user-456",
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Could not retrieve random question");
    });

    it("should handle question service network error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const response = await request(app).post("/sessions").send({
        interviewee_id: "user-456",
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Could not retrieve random question");
    });

    it("should handle session creation error", async () => {
      (sessionsService.createSession as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).post("/sessions").send({
        interviewee_id: "user-456",
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Database error");
    });

    it("should use QUESTION_SERVICE_URL from environment", async () => {
      const originalUrl = process.env.QUESTION_SERVICE_URL;
      process.env.QUESTION_SERVICE_URL = "http://custom-service:5002";

      await request(app).post("/sessions").send({
        interviewee_id: "user-456",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://custom-service:5002/questions/random"
      );

      process.env.QUESTION_SERVICE_URL = originalUrl;
    });

    it("should handle question with _id instead of id", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ _id: "mongo-id-123", title: "Test" }),
      });

      await request(app).post("/sessions").send({
        interviewer_id: "testinterviewr",
        interviewee_id: "user-456",
      });

      expect(sessionsService.createSession).toHaveBeenCalledWith(
        "testinterviewr",
        "user-456",
        "mongo-id-123",
        ""
      );
    });
  });

  describe("GET /sessions/:id", () => {
    const mockSession = {
      id: "session-123",
      interviewer_id: "interviewer-1",
      interviewee_id: "interviewee-1",
      question_id: "question-1",
      current_code: "const x = 1;",
      status: "active",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    it("should retrieve session by id successfully", async () => {
      (sessionsService.getSessionById as jest.Mock).mockResolvedValue(
        mockSession
      );

      // Ensure the mocked authentication middleware sets the current user
      // to one of the session participants so the request is authorized.
      const { authenticateUser } = require("../authorization");
      (authenticateUser as jest.Mock).mockImplementation(
        (req: Request, res: Response, next: NextFunction) => {
          req.user = { id: mockSession.interviewee_id };
          next();
        }
      );

      const response = await request(app).get("/sessions/session-123");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSession);
      expect(sessionsService.getSessionById).toHaveBeenCalledWith(
        "session-123"
      );
    });

    it("should return 404 if session not found", async () => {
      (sessionsService.getSessionById as jest.Mock).mockRejectedValue(
        new Error("Session not found")
      );

      const response = await request(app).get("/sessions/invalid-id");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Session not found");
    });

    it("should handle different session ids", async () => {
      (sessionsService.getSessionById as jest.Mock).mockResolvedValue(
        mockSession
      );

      await request(app).get("/sessions/different-id-456");

      expect(sessionsService.getSessionById).toHaveBeenCalledWith(
        "different-id-456"
      );
    });
  });

  describe("PATCH /sessions/:id/snapshot", () => {
    const mockUpdatedSession = {
      id: "session-123",
      interviewer_id: "interviewer-1",
      interviewee_id: "interviewee-1",
      question_id: "question-1",
      current_code: "const updated = true;",
      status: "active",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T01:00:00Z",
    };

    it("should update session code successfully", async () => {
      const newCode = "const updated = true;";
      (sessionsService.updateSessionSnapshot as jest.Mock).mockResolvedValue(
        mockUpdatedSession
      );

      const response = await request(app)
        .patch("/sessions/session-123/snapshot")
        .send({ code: newCode });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedSession);
      expect(sessionsService.updateSessionSnapshot).toHaveBeenCalledWith(
        "session-123",
        newCode
      );
    });

    it("should return 400 if code is missing", async () => {
      const response = await request(app)
        .patch("/sessions/session-123/snapshot")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing or invalid snapshot body");
      expect(sessionsService.updateSessionSnapshot).not.toHaveBeenCalled();
    });

    it("should return 400 if code is not a string", async () => {
      const response = await request(app)
        .patch("/sessions/session-123/snapshot")
        .send({ code: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing or invalid snapshot body");
    });

    it("should accept empty string as code", async () => {
      (sessionsService.updateSessionSnapshot as jest.Mock).mockResolvedValue({
        ...mockUpdatedSession,
        current_code: "",
      });

      const response = await request(app)
        .patch("/sessions/session-123/snapshot")
        .send({ code: "" });

      expect(response.status).toBe(200);
      expect(sessionsService.updateSessionSnapshot).toHaveBeenCalledWith(
        "session-123",
        ""
      );
    });

    it("should handle update errors", async () => {
      (sessionsService.updateSessionSnapshot as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      const response = await request(app)
        .patch("/sessions/session-123/snapshot")
        .send({ code: "test" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Update failed");
    });
  });

  describe("PATCH /sessions/:id/complete", () => {
    const mockCompletedSession = {
      id: "session-123",
      interviewer_id: "interviewer-1",
      interviewee_id: "interviewee-1",
      question_id: "question-1",
      current_code: "const x = 1;",
      status: "completed",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T02:00:00Z",
    };

    it("should mark session as completed successfully", async () => {
      (sessionsService.completeSession as jest.Mock).mockResolvedValue(
        mockCompletedSession
      );

      const response = await request(app).patch(
        "/sessions/session-123/complete"
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCompletedSession);
      expect(sessionsService.completeSession).toHaveBeenCalledWith(
        "session-123"
      );
    });

    it("should handle completion errors", async () => {
      (sessionsService.completeSession as jest.Mock).mockRejectedValue(
        new Error("Completion failed")
      );

      const response = await request(app).patch(
        "/sessions/session-456/complete"
      );

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Completion failed");
    });

    it("should work with different session ids", async () => {
      (sessionsService.completeSession as jest.Mock).mockResolvedValue(
        mockCompletedSession
      );

      await request(app).patch("/sessions/different-id-789/complete");

      expect(sessionsService.completeSession).toHaveBeenCalledWith(
        "different-id-789"
      );
    });
  });
});
