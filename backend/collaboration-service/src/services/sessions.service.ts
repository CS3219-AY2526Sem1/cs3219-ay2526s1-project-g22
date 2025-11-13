/*
AI Assistance Disclosure:
Tool: Claude Sonnet 4.5, date: 15 Oct 2025
Scope: Assisted with debugging using the test findings, fixed code to work correctly, and tidied up sections with small refactors. Also suggested tests for relevant edge cases.
Author review: I verified behavior and ran tests, clarified the code, and fixed small implementation issues.
*/
import { supabase } from "../utils/supabase";
import { Tables, TablesInsert, TablesUpdate } from "../types/database";
import { PostgrestError } from "@supabase/supabase-js";

export async function createSession(
  interviewer_id: string | null,
  interviewee_id: string,
  question_id: string,
  initial_code: string = ""
): Promise<Tables<"sessions">> {
  const newSession: TablesInsert<"sessions"> = {
    interviewer_id,
    interviewee_id,
    question_id,
    current_code: initial_code,
  };

  const { data, error } = await supabase
    .from("sessions")
    .insert(newSession)
    .select()
    .single<Tables<"sessions">>();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// retrieve the room session by session id
export async function getSessionById(id: string): Promise<Tables<"sessions">> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single<Tables<"sessions">>();

  if (error) {
    throw new Error("Session not found");
  }
  return data;
}

type SessionSummaryBase = Pick<
  Tables<"sessions">,
  "id" | "created_at" | "current_code"
>;
type SesasionSummary = SessionSummaryBase & {
  interviewer: { name: string };
  interviewee: { name: string };
  question_title: string;
};

type SessionSummary = {
  id: string;
  created_at: string | null;
  current_code: string | null;
  interviewer: { name: string };
  interviewee: { name: string };
  question: {
    _id: string;
    questionId: string;
    title: string;
    difficulty: string;
    tags: string[];
  } | null;
};

export async function getoAllSessionSummaryOfUser(userId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      id,
      created_at,
      current_code,
      question_id,
      interviewer:interviewer_id(name),
      interviewee:interviewee_id(name)
      `
    )
    .or(`interviewer_id.eq.${userId},interviewee_id.eq.${userId}`);
  if (error) throw new Error(error.message);
  return data;
}

interface Question {
  _id: string;
  questionId: string;
  title: string;
  difficulty: string;
  tags: string[];
}

export async function getAllSessionSummaryOfUser(
  userId: string
): Promise<SessionSummary[]> {
  const { data, error } = (await supabase
    .from("sessions")
    .select(
      `
      id,
      created_at,
      current_code,
      question_id,
      interviewer:interviewer_id(name),
      interviewee:interviewee_id(name)
    `
    )
    .or(`interviewer_id.eq.${userId},interviewee_id.eq.${userId}`)) as {
    data:
      | {
          id: string;
          created_at: string | null;
          current_code: string | null;
          question_id: string | null;
          interviewer: { name: string };
          interviewee: { name: string };
        }[]
      | null;
    error: PostgrestError | null;
  };

  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  const ids = [...new Set(data.map((s) => s.question_id).filter(Boolean))];

  const questionMap: Record<string, Question> = {};
  if (ids.length) {
    const res = await fetch("http://question-service:6002/questions/by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    if (res.ok) {
      const questions = (await res.json()) as any[];
      for (const q of questions) {
        questionMap[String(q._id)] = {
          _id: String(q._id),
          questionId: q.questionId,
          title: q.title,
          difficulty: q.difficulty,
          tags: q.tags,
        };
      }
    }
  }

  return data.map((s) => ({
    id: s.id,
    created_at: s.created_at,
    current_code: s.current_code,
    interviewer: s.interviewer,
    interviewee: s.interviewee,
    question: s.question_id ? questionMap[s.question_id] ?? null : null,
  }));
}

export async function getActiveSession(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id, updated_at, status")
    .or(`interviewer_id.eq.${userId},interviewee_id.eq.${userId}`)
    .eq("status", "active") // only get active sessions
    .order("updated_at", { ascending: false }) // newest first
    .limit(1);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  const session = data[0];
  if (!session.updated_at) return null;

  const updatedAt = new Date(session.updated_at);
  if (isNaN(updatedAt.getTime())) {
    console.warn(
      "Invalid updated_at for session:",
      session.id,
      session.updated_at
    );
    return null;
  }

  const now = new Date();
  const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

  // mark completed if last updated more than 3 minutes ago
  if (diffMinutes > 1) {
    const { error: updateError } = await supabase
      .from("sessions")
      .update({ status: "completed" })
      .eq("id", session.id);

    if (updateError)
      console.error("Failed to mark session completed:", updateError);
    return null;
  }

  // Session still active
  return session.id;
}

// update the current code in the session
export async function updateSessionSnapshot(
  id: string,
  code?: string,
  language?: string
): Promise<Tables<"sessions">> {
  const update: TablesUpdate<"sessions"> = {};
  if (typeof code === "string") update.current_code = code;
  if (typeof language === "string") update.current_language = language;

  if (Object.keys(update).length === 0) {
    throw new Error("No fields to update");
  }

  const { data, error } = await supabase
    .from("sessions")
    .update(update)
    .eq("id", id)
    .select()
    .single<Tables<"sessions">>();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// mark session as completed
export async function completeSession(id: string): Promise<Tables<"sessions">> {
  const update: TablesUpdate<"sessions"> = { status: "completed" };

  const { data, error } = await supabase
    .from("sessions")
    .update(update)
    .eq("id", id)
    .select()
    .single<Tables<"sessions">>();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
