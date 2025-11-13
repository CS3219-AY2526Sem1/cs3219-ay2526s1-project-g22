import { Database } from "../types/database";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// service role key → full access (be careful, only use server-side)
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
