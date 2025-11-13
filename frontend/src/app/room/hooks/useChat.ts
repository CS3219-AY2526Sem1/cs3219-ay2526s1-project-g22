/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini
Date: 2025-10-21
Scope: Suggested tests covering edge cases highlighted by the user.
Author review: I verified correctness of the modifications by AI against requirements 
*/
"use client";

import { useEffect, useRef, useState } from "react";
import axiosInstance from "@/lib/axios";

type Message = {
  id: string;
  session_id?: string;
  sender_id: string;
  content: string;
  created_at: string; // ISO or timestamp string
  deleted_at?: string | null;
};

export default function useChat(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const pollingRef = useRef<number | null>(null);

  const fetchOnce = async () => {
    try {
      // Always fetch all messages (no 'since' parameter) to detect deletions
      // The backend filters out deleted messages, so this will sync deletions
      const res = await axiosInstance.get(
        `/api/chat-service/sessions/${sessionId}/chats`
      );
      const data: Message[] = Array.isArray(res.data) ? res.data : [];

      // Replace the entire message list with the fresh data from server
      // This ensures deleted messages are removed
      setMessages(
        data.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      );
    } catch (e) {
      setError(e);
    }
  };

  useEffect(() => {
    // initial fetch
    fetchOnce();
    // start polling
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(() => {
      fetchOnce().catch(() => void 0);
    }, 2000);
    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const sendMessage = async ({ content }: { content: string }) => {
    setIsSending(true);
    try {
      await axiosInstance.post(
        `/api/chat-service/sessions/${sessionId}/chats`,
        { content },
        { headers: { "Content-Type": "application/json" } }
      );
      // we'll pick up the new message on the next poll
      setIsSending(false);
      return true;
    } catch (e) {
      setError(e);
      setIsSending(false);
      throw e;
    }
  };

  const refresh = async () => {
    await fetchOnce();
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await axiosInstance.delete(
        `/api/chat-service/sessions/${sessionId}/chats/${messageId}`
      );
      // Optimistically remove from UI
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      return true;
    } catch (e) {
      setError(e);
      throw e;
    }
  };

  return { messages, sendMessage, isSending, error, refresh, deleteMessage };
}
