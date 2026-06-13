import type { GameState } from "../types";
import { getSupabase, isAuthConfigured } from "../auth/supabaseClient";

/**
 * Real-mode cloud data layer (Supabase). Every call is disabled-safe: when
 * Supabase isn't configured (no env keys) it returns a benign fallback so the
 * static build and demo mode are never affected. Live behaviour is verified
 * once the project + keys exist (see lib/cloud/schema.sql).
 */

export function cloudConfigured(): boolean {
  return isAuthConfigured();
}

export interface LeaderboardRow {
  user_id: string;
  name: string;
  net_worth: number;
  level: number;
  fame: number;
}

export interface CloudFeedPost {
  id: string;
  author_id: string;
  author_name: string;
  kind: string;
  text: string;
  is_admin: boolean;
  created_at: string;
}

/* ---------------- saves (cloud progress) ---------------- */

export async function loadCloudSave(userId: string): Promise<GameState | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from("saves").select("state").eq("user_id", userId).maybeSingle();
    if (error || !data) return null;
    return (data.state as GameState) ?? null;
  } catch {
    return null;
  }
}

export async function saveCloudSave(
  userId: string,
  email: string,
  state: GameState,
  netWorth: number
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("saves").upsert(
      {
        user_id: userId,
        email,
        state,
        net_worth: Math.round(netWorth),
        level: state.player.level,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch {
    // offline / transient — the localStorage mirror still holds progress
  }
}

/* ---------------- shared leaderboard ---------------- */

export async function upsertLeaderboard(row: LeaderboardRow): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("leaderboard").upsert(
      { ...row, net_worth: Math.round(row.net_worth), fame: Math.round(row.fame), updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  } catch {
    /* ignore */
  }
}

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("leaderboard")
      .select("user_id,name,net_worth,level,fame")
      .order("net_worth", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as LeaderboardRow[];
  } catch {
    return [];
  }
}

/* ---------------- shared feed ---------------- */

export async function fetchFeed(limit = 60): Promise<CloudFeedPost[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("feed_posts")
      .select("id,author_id,author_name,kind,text,is_admin,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as CloudFeedPost[];
  } catch {
    return [];
  }
}

export async function postFeed(opts: {
  authorId: string;
  authorName: string;
  kind: string;
  text: string;
  isAdmin?: boolean;
}): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from("feed_posts").insert({
      author_id: opts.authorId,
      author_name: opts.authorName,
      kind: opts.kind,
      text: opts.text,
      is_admin: opts.isAdmin ?? false,
    });
    return !error;
  } catch {
    return false;
  }
}

/* ---------------- permanent ban (bankruptcy) ---------------- */

export async function isBanned(email: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { data } = await sb
      .from("banned_emails")
      .select("email")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function banEmail(email: string, reason = "إفلاس نهائي"): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("banned_emails").upsert(
      { email: email.toLowerCase(), reason, banned_at: new Date().toISOString() },
      { onConflict: "email" }
    );
  } catch {
    /* ignore */
  }
}
