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

// update the current code in the session
export async function updateSessionSnapshot(
  id: string,
  code: string
): Promise<Tables<"sessions">> {
  const update: TablesUpdate<"sessions"> = { current_code: code };

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
