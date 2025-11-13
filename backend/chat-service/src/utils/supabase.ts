import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// First load any .env in the current working directory
dotenv.config();

// If required vars are not found, try the backend-level .env (one level up from chat-service)
const backendEnvPath = path.resolve(__dirname, "../../../.env");
if (
  (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) &&
  fs.existsSync(backendEnvPath)
) {
  dotenv.config({ path: backendEnvPath });
}

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl) {
  throw new Error(
    "SUPABASE_URL is required. Provide it in .env or set SUPABASE_URL env var."
  );
}
if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is required. Provide it in .env or set SUPABASE_SERVICE_ROLE_KEY env var."
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
