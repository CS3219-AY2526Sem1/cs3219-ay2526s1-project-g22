/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 16 Sep 2025
Scope: Generated boilerplate for this file from the team's requirements and guidance. 
Author review: I validated correctness against the team's requirements, ran tests.
*/
// tests/getTestSession.ts
import { createClient } from "@supabase/supabase-js";
require("dotenv").config({ path: ".env.test" });

export async function getTestSession() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const email = process.env.TEST_USER_EMAIL!;
  const password = process.env.TEST_USER_PASSWORD!;

  // small retry to avoid race after globalSetup
  let lastErr: any = null;
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data?.session) return data.session;
    lastErr = error ?? new Error("No session returned");
    await new Promise((r) => setTimeout(r, 150));
  }
  throw lastErr;
}
