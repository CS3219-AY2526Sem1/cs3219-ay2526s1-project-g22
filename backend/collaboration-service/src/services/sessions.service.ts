import { supabase } from "../utils/supabase";
import { Tables, TablesInsert, TablesUpdate } from "../types/database";

export async function createSession(
  interviewer_id: string,
  interviewee_id: string,
  question_id: string,
  initial_code: string = ""
): Promise<Tables<'sessions'>> {
  const newSession: TablesInsert<'sessions'> = {
    interviewer_id,
    interviewee_id,
    question_id,
    current_code: initial_code,
  };

  const { data, error } = await supabase
    .from("sessions")
    .insert(newSession)
    .select()
    .single<Tables<'sessions'>>();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// retrieve the room session by session id
export async function getSessionById(id: string): Promise<Tables<'sessions'>> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single<Tables<'sessions'>>();

  if (error) {
    throw new Error("Session not found");
  }
  return data;
}

// update the current code in the session
export async function updateSessionSnapshot(
  id: string,
  code: string
): Promise<Tables<'sessions'>> {
  const update: TablesUpdate<'sessions'> = { current_code: code };

  const { data, error } = await supabase
    .from("sessions")
    .update(update)
    .eq("id", id)
    .select()
    .single<Tables<'sessions'>>();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// mark session as completed
export async function completeSession(id: string): Promise<Tables<'sessions'>> {
  const update: TablesUpdate<'sessions'> = { status: "completed" };

  const { data, error } = await supabase
    .from("sessions")
    .update(update)
    .eq("id", id)
    .select()
    .single<Tables<'sessions'>>();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
