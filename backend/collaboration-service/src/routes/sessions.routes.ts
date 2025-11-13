/*
AI Assistance Disclosure:
Tool: Claude Sonnet 4.5, date: 15 Oct 2025
Scope: Assisted with debugging using debug and test findings, fixed code to work correctly, and tidied up sections with small refactors. Also suggested tests for relevant edge cases.
Author review: I verified behavior and ran tests, clarified the code, and fixed small implementation issues.
*/
import { Router, Request, Response } from "express";
import {
  createSession,
  getSessionById,
  updateSessionSnapshot,
  completeSession,
  getAllSessionSummaryOfUser,
  getActiveSession,
} from "../services/sessions.service";
import { authenticateUser } from "./authorization";

type CreateSessionBody = {
  interviewer_id?: string;
  interviewee_id: string;
  initial_code?: string;
  question_id?: string;
};

type UpdateSnapshotBody = {
  code?: string;
  language?: string;
};

type SessionParams = {
  id: string;
};
const router = Router();

// create a new session
router.post(
  "/",
  authenticateUser,
  async (req: Request<{}, {}, CreateSessionBody>, res: Response) => {
    try {
      const currentUser = req.user.id;
      if (!currentUser) {
        return res
          .status(401)
          .json({ error: "Unauthorized: Log in to start a session" });
      }

      const {
        interviewer_id = null,
        interviewee_id,
        initial_code = "",
        question_id = "",
      } = req.body;
      // if (!interviewer_id || !interviewee_id) {
      //   return res.status(400).json({ error: "Missing Participants" });
      // }

      // If question_id is provided, use it directly
      if (question_id) {
        try {
          const session = await createSession(
            interviewer_id,
            interviewee_id,
            question_id,
            initial_code
          );
          return res.json(session);
        } catch (err) {
          return res.status(500).json({ error: (err as Error).message });
        }
      }

      // Fetch a random question from the question service
      const questionServiceUrl =
        process.env.QUESTION_SERVICE_URL || "http://localhost:5002";
      let questionId: string;
      try {
        const response = await fetch(`${questionServiceUrl}/questions/random`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Question service error response:", errorText);
          throw new Error("Failed to fetch random question");
        }
        const question = await response.json();
        // Use _id or id depending on what the question service returns
        questionId = question.id || question._id;
        if (!questionId) {
          throw new Error("No question id returned from question service");
        }
      } catch (error) {
        console.error("Error fetching random question:", error);
        return res
          .status(500)
          .json({ error: "Could not retrieve random question" });
      }

      // Create the session in Supabase with the questionId
      try {
        const session = await createSession(
          interviewer_id,
          interviewee_id,
          questionId,
          initial_code
        );
        res.json(session);
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// get session by ID
// get session by ID (require auth and restrict to participants; block completed sessions)
router.get(
  "/:id",
  authenticateUser,
  async (req: Request<SessionParams>, res: Response) => {
    try {
      const { id } = req.params;
      const session = await getSessionById(id);

      // If session is already completed, do not allow joins
      if (session?.status === "completed") {
        return res.status(403).json({ error: "Session has been completed" });
      }

      // Only allow interviewer or interviewee to fetch the session
      const currentUser = req.user?.id;
      if (!currentUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const isParticipant =
        String(session?.interviewer_id) === String(currentUser) ||
        String(session?.interviewee_id) === String(currentUser);

      if (!isParticipant) {
        return res.status(403).json({ error: "Forbidden: not a session participant" });
      }

      res.json(session);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }
);

// update the code in the current session
router.patch(
  "/:id/snapshot",
  async (
    req: Request<SessionParams, {}, UpdateSnapshotBody>,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      const { code, language } = req.body;

      // Require at least one field to update
      if (typeof code !== "string" && typeof language !== "string") {
        return res
          .status(400)
          .json({ error: "Missing or invalid snapshot body" });
      }

      // Preserve existing behavior for the common code-only path (keep call
      // signature the same when only `code` is supplied so existing tests
      // and callers continue to work).
      let session;
      if (typeof code === "string" && typeof language === "undefined") {
        session = await updateSessionSnapshot(id, code);
      } else {
        session = await updateSessionSnapshot(id, code, language);
      }
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// mark session as completed
router.patch(
  "/:id/complete",
  async (req: Request<SessionParams>, res: Response) => {
    try {
      const { id } = req.params;
      const session = await completeSession(id);
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post("/getUserSessions", authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessions = await getAllSessionSummaryOfUser(userId);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user sessions" });
  }
});

router.post("/getActiveSession", authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessions = await getActiveSession(userId);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user sessions" });
  }
});

export default router;
