/*
AI Assistance Disclosure:
Tool: Claude Haiku, date: 30 Oct 2025
Scope: Helped debug issues reported during testing, corrected small faults, and made minor refactors to improve clarity and robustness.
Author review: I validated behavior by running tests where relevant, clarified confusing parts, and fixed small implementation issues.
*/
import { supabase } from "../utils/supabase";

export type ChatRow = {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  role?: string | null;
  metadata?: any;
  created_at: string;
  deleted_at?: string | null;
};

export async function fetchChats(
  sessionId: string,
  since?: string | number,
  limit = 50
): Promise<ChatRow[]> {
  let query = supabase
    .from("chats")
    .select("*")
    .eq("session_id", sessionId)
    .is("deleted_at", null) // Only fetch non-deleted messages
    .order("created_at", { ascending: true });

  if (since) {
    // The frontend may send a numeric epoch ms value (e.g. Date.getTime()).
    // Postgres/Supabase expect a timestamp string, so convert numeric
    // milliseconds (or numeric-strings) to an ISO timestamp before querying.
    let sinceIso: string;
    if (typeof since === "number") {
      sinceIso = new Date(since).toISOString();
    } else if (/^\d+$/.test(since)) {
      // numeric string
      sinceIso = new Date(Number(since)).toISOString();
    } else {
      // assume it's already an ISO timestamp or valid comparison value
      sinceIso = since as string;
    }
    query = query.gt("created_at", sinceIso);
  } else {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ChatRow[]) || [];
}

export async function postChat(
  sessionId: string,
  senderId: string,
  content: string,
  role?: string,
  metadata?: any
): Promise<ChatRow> {
  const insertObj: any = {
    session_id: sessionId,
    sender_id: senderId,
    content,
  };
  if (role) insertObj.role = role;
  if (metadata) insertObj.metadata = metadata;

  const { data, error } = await supabase
    .from("chats")
    .insert(insertObj)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ChatRow;
}

// helper: verify whether user is participant in session
export async function isParticipant(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("sessions")
    .select("interviewer_id, interviewee_id")
    .eq("id", sessionId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) return false;
  return data.interviewer_id === userId || data.interviewee_id === userId;
}

// Delete a chat message (soft delete)
export async function deleteChat(
  chatId: string,
  sessionId: string,
  userId: string
): Promise<void> {
  // 1. Fetch the chat to verify it exists and belongs to this session
  const { data: chat, error: fetchError } = await supabase
    .from("chats")
    .select("id, session_id, sender_id, deleted_at")
    .eq("id", chatId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!chat) throw new Error("Chat message not found");

  // 2. Verify the message belongs to the specified session
  if (chat.session_id !== sessionId) {
    throw new Error("Chat message does not belong to this session");
  }

  // 3. Verify the user is the sender of the message
  if (chat.sender_id !== userId) {
    throw new Error("Unauthorized: You can only delete your own messages");
  }

  // 4. Check if already deleted
  if (chat.deleted_at) {
    throw new Error("Message already deleted");
  }

  // 5. Soft delete by setting deleted_at timestamp
  const { error: deleteError } = await supabase
    .from("chats")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", chatId);

  if (deleteError) throw new Error(deleteError.message);
}
