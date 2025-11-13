/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 2025-09-18
Scope: Reviewed utility code, caught small issues, and suggested tidy-ups.
Author review: I verified correctness of the modifications by AI against requirements. I cleaned up a few utilities and validated they still behave as expected.
*/
"use server";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/supabase-server";

export async function signUp(email: string, password: string, name: string) {
  const supabase = await createClient();

  await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  return {
    success: true,
    message: "Please check your email to confirm your account",
  };
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }
  return {
    success: true,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/landing");
}
