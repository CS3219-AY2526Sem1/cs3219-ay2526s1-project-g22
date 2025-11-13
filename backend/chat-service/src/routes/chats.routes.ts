import { Router, Request, Response } from "express";
import { authenticateUser } from "./authorization";
import {
  fetchChats,
  postChat,
  isParticipant,
  deleteChat,
} from "../services/chats.service";

const router = Router();

// GET /sessions/:sessionId/chats?since=...
router.get(
  "/:sessionId/chats",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { since } = req.query as { since?: string };
      const currentUser = (req as any).user?.id;
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

      const participant = await isParticipant(sessionId, currentUser);
      if (!participant) return res.status(403).json({ error: "Forbidden" });

      const chats = await fetchChats(sessionId, since);
      res.json(chats);
    } catch (err: any) {
      console.error("Error in GET /sessions/:sessionId/chats:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /sessions/:sessionId/chats
router.post(
  "/:sessionId/chats",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { content, role, metadata } = req.body as {
        content?: string;
        role?: string;
        metadata?: any;
      };
      const currentUser = (req as any).user?.id;
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Invalid content" });
      }

      const participant = await isParticipant(sessionId, currentUser);
      if (!participant) return res.status(403).json({ error: "Forbidden" });

      const chat = await postChat(
        sessionId,
        currentUser,
        content,
        role,
        metadata
      );
      res.json(chat);
    } catch (err: any) {
      console.error("Error in POST /sessions/:sessionId/chats:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /sessions/:sessionId/chats/:chatId
router.delete(
  "/:sessionId/chats/:chatId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { sessionId, chatId } = req.params;
      const currentUser = (req as any).user?.id;
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

      // Verify user is participant in the session
      const participant = await isParticipant(sessionId, currentUser);
      if (!participant) return res.status(403).json({ error: "Forbidden" });

      // Delete the chat message (will verify ownership inside service)
      await deleteChat(chatId, sessionId, currentUser);
      res.status(200).json({ success: true, message: "Message deleted" });
    } catch (err: any) {
      console.error("Error in DELETE /sessions/:sessionId/chats/:chatId:", err);

      // Handle specific error cases
      if (err.message.includes("not found")) {
        return res.status(404).json({ error: err.message });
      }
      if (
        err.message.includes("Unauthorized") ||
        err.message.includes("only delete your own")
      ) {
        return res.status(403).json({ error: err.message });
      }
      if (err.message.includes("already deleted")) {
        return res.status(410).json({ error: err.message });
      }

      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
