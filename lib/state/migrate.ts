import { PERSONAS_VERSION } from "../ai/personas";
import { seedBots, retuneBots } from "../engine/bots";
import { mkMember, seedBotCompanies } from "../engine/company";
import { seedFeed } from "../engine/feed";
import { saudiDayKey } from "../format";
import { DEFAULT_NAV_ORDER, sanitizeNavOrder } from "../nav";
import { BOTS } from "../seed";
import type { Company, GameState } from "../types";

/**
 * Brings any stored save up to GameState v3 (chain: v1 → v2 → v3).
 * Returns null when the blob is unusable (caller falls back to a fresh seed).
 */
type AnyVersionState = Omit<GameState, "version"> & { version: number };

export function migrate(parsed: unknown): GameState | null {
  if (!parsed || typeof parsed !== "object") return null;
  const raw = parsed as AnyVersionState;
  if (!raw.player || !raw.prices) return null;
  if (raw.version !== 1 && raw.version !== 2 && raw.version !== 3) return null;

  if (raw.version === 1) v1to2(raw);
  if (raw.version === 2) v2to3(raw);
  const s = raw as unknown as GameState;

  /* ---- common sanitize ---- */
  s.toasts = [];
  s.settings.navOrder = sanitizeNavOrder(s.settings.navOrder);
  if (
    s.settings.activeCompanyId &&
    !s.companies.some((c) => c.id === s.settings.activeCompanyId)
  ) {
    s.settings.activeCompanyId = s.companies[0]?.id ?? null;
  }
  retuneBots(s);
  return s;
}

/* ---- v1 → v2: living world (bots/feed/ihsan/social) ---- */
function v1to2(s: AnyVersionState): void {
  const now = Date.now();
  s.version = 2;
  s.mode = "demo";
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
    activeCompanyId: null,
  };
  for (const c of s.companies) c.level = c.level || 1;
  for (const a of s.auctions) {
    a.sellerId = a.sellerId ?? "system";
    a.tier = a.tier ?? "rare";
  }
  seedFeed(s as unknown as GameState, now);
}

/* ---- v2 → v3: company world + الإدارة العليا ---- */
function v2to3(s: AnyVersionState): void {
  const now = Date.now();
  s.version = 3;
  for (const c of s.companies) upgradeCompany(s as unknown as GameState, c, now);
  s.botCompanies = seedBotCompanies();
  s.crown = { weekKey: "", holder: "" };
  s.marketEvent = null;
  s.settings.activeCompanyId = s.companies[0]?.id ?? null;
}

function upgradeCompany(s: GameState, c: Company, now: number): void {
  c.treasury = c.treasury ?? 0;
  c.fame = c.fame ?? Math.round(c.dividendsPaid / 1000 + c.valuation / 10_000);
  c.contracts = c.contracts ?? [];
  c.verification = c.verification ?? "none";
  c.autoDistribute = c.autoDistribute ?? false;
  c.payoutPct = c.payoutPct ?? 50;
  if (!c.members || c.members.length === 0) {
    // derive the clan roster from the existing partner registry
    c.members = c.partners.map((p) => {
      const bot = BOTS.find((b) => b.name === p.name);
      const viaPartnership =
        bot &&
        s.partnerships.some(
          (x) => x.companyId === c.id && x.botId === bot.id && x.status === "active"
        );
      return mkMember({
        name: p.name,
        avatarId: p.avatarId ?? 11,
        rank: p.isPlayer
          ? "owner"
          : p.name === "مستثمرون خارجيون"
            ? "shareholder"
            : viaPartnership
              ? "partner"
              : "founder",
        botId: bot?.id,
        isPlayer: p.isPlayer,
        joinedAt: c.foundedAt,
        contribution: p.invested,
      });
    });
  }
  void now;
}
