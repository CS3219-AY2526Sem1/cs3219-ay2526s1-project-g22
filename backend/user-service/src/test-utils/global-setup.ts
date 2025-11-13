/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 16 Sep 2025
Scope: Generated boilerplate for this file from the team's requirements and guidance. 
Author review: I validated correctness against the team's requirements, then made some modifications for improved clarity.
*/
// tests/global-setup.ts
import path from "node:path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.test"),
  override: true,
});

import { createClient } from "@supabase/supabase-js";

export default async function globalSetup() {
  const url = process.env.SUPABASE_URL!;
  const srk = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const email = process.env.TEST_USER_EMAIL!;
  const password = process.env.TEST_USER_PASSWORD!;

  console.log("SUPABASE_URL:", url);
  console.log(
    "SUPABASE_SERVICE_ROLE_KEY (first 10 chars):",
    srk.substring(0, 10) + "..."
  );

  const admin = createClient(url, srk);

  try {
    const { data: users, error: listError } =
      await admin.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError.message);
      throw listError;
    }

    let user = users.users.find((u) => u.email === email);
    if (!user) {
      const { data: newUser, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Set to true to confirm immediately
      });
      if (error) {
        console.error("Error creating user:", error.message);
        throw error;
      }
      user = newUser.user;
      console.log("Test user created successfully");
    } else {
      console.log("Test user already exists");
    }

    // Ensure the user is confirmed
    if (user && !user.email_confirmed_at) {
      const { error: updateError } = await admin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );
      if (updateError) {
        console.error("Error confirming user:", updateError.message);
        throw updateError;
      }
      console.log("Test user confirmed successfully");
    }
  } catch (err) {
    console.error("Global setup failed:", err);
    throw err;
  }
}
