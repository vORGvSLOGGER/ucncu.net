import { PERSONAS_VERSION } from "../ai/personas";
import { seedBots, retuneBots } from "../engine/bots";
import { seedFeed } from "../engine/feed";
import { saudiDayKey } from "../format";
import { DEFAULT_NAV_ORDER, sanitizeNavOrder } from "../nav";
import type { GameState } from "../types";

/**
 * Brings any stored save up to GameState v2. Returns null when the blob is
 * unusable (caller falls back to a fresh seed).
 * v1 saves are adopted as demo-mode saves with full progress; existing
 * players are NOT forced through the tutorial.
 */
export function migrate(parsed: unknown): GameState | null {
  if (!parsed || typeof parsed !== "object") return null;
  const s = parsed as GameState & { version: number };
  if (!s.player || !s.prices) return null;

  if (s.version === 2) {
    s.toasts = [];
    s.settings.navOrder = sanitizeNavOrder(s.settings.navOrder);
    retuneBots(s);
    return s;
  }

  if (s.version !== 1) return null;

  /* ---- v1 → v2 ---- */
  const now = Date.now();
  s.version = 2;
  s.mode = "demo";
  s.toasts = [];
  s.tickCount = 0;
  s.bots = seedBots();
  s.botsVersion = PERSONAS_VERSION;
  s.feed = [];
  s.ihsanCases = [];
  s.bankruptcy = { status: "none" };
  // veterans skip the tour (replayable from settings)
  s.tutorial = { status: "done", step: 0, rewarded: -1 };
  s.friends = [];
  s.chats = {};
  s.saleOffers = [];
  s.partnerships = [];
  s.feedback = {};
  s.lastDailyKey = saudiDayKey(now);
  s.dailyPostCount = 0;
  s.settings = {
    exploreMode: s.settings?.exploreMode ?? true,
    navOrder: [...DEFAULT_NAV_ORDER],
  };
  for (const c of s.companies) c.level = c.level || 1;
  for (const a of s.auctions) {
    a.sellerId = a.sellerId ?? "system";
    a.tier = a.tier ?? "rare";
  }
  seedFeed(s, now);
  return s;
}
