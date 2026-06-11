import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Env-driven Supabase client (static-site friendly — runs fully client-side).
 * When NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are absent the
 * app keeps working as guest/demo and the login UI shows "غير مفعّل بعد".
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isAuthConfigured(): boolean {
  return Boolean(url && anonKey);
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) client = createClient(url, anonKey);
  return client;
}
