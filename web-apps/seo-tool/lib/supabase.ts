// lib/supabase.ts — Supabase client
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  plan: "free" | "pro";
  searches_remaining: number;
  created_at: string;
}

export interface KeywordReport {
  id: string;
  user_id: string;
  seed_keyword: string;
  keywords: string[];
  content_brief: string;
  created_at: string;
}
