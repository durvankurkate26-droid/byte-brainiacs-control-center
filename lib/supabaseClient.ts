import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check your .env.local file " +
      "for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

// Single shared client for the browser (App Router client components).
// This prototype only ever does reads + one targeted update, so the
// anon key with a permissive RLS policy (see supabase/schema.sql) is fine.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
