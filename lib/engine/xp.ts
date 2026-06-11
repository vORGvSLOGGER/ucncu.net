import { rankForLevel } from "../constants";
import { fmtInt } from "../format";
import { PERKS } from "../perks";
import { ACHIEVEMENTS } from "../seed";
import { netWorth } from "../selectors";
import type { GameState } from "../types";
import { addFeedPost } from "./feed";
import { addNotif, addToast } from "./log";

/** XP needed to advance FROM `level` to `level + 1` */
export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

export function awardXp(s: GameState, amount: number): void {
  s.player.xp += amount;
  const before = s.player.level;
  while (s.player.xp >= xpForLevel(s.player.level)) {
    s.player.xp -= xpForLevel(s.player.level);
    s.player.level += 1;
  }
  if (s.player.level > before) {
    addToast(s, `🎉 ارتفع مستواك إلى ${s.player.level} — ${rankForLevel(s.player.level)}`, "gold");
    addNotif(
      s,
      `المستوى ${s.player.level} 🎖️`,
      `رتبتك الآن: ${rankForLevel(s.player.level)}`,
      "gold"
    );
    // announce each newly unlocked perk
    for (const perk of PERKS) {
      if (perk.level > before && perk.level <= s.player.level) {
        addNotif(s, `ميزة جديدة 🎁 ${perk.name}`, perk.desc, "gold");
      }
    }
    // milestone feed post every 5 levels (avoid spam)
    if (Math.floor(s.player.level / 5) > Math.floor(before / 5)) {
      addFeedPost(
        s,
        "player",
        "milestone",
        `وصل ${s.player.name} إلى المستوى ${s.player.level} — ${rankForLevel(s.player.level)} 🎖️`
      );
    }
  }
}

const CHECKS: Record<string, (s: GameState) => boolean> = {
  "first-buy": (s) => s.transactions.some((t) => t.type === "buy"),
  "first-sell": (s) => s.transactions.some((t) => t.type === "sell"),
  "first-trade": (s) => s.positions.length > 0 || s.closedTrades.length > 0,
  "trade-profit": (s) =>
    s.closedTrades.reduce((sum, t) => sum + Math.max(0, t.pnl), 0) >= 1000,
  "first-property": (s) => s.properties.length > 0,
  landlord: (s) => s.properties.length >= 3,
  "first-company": (s) => s.companies.length > 0,
  "loan-paid": (s) => s.loans.some((l) => l.status === "paid"),
  "auction-win": (s) => s.auctionResults.some((r) => r.won),
  "crypto-holder": (s) =>
    Object.values(s.cryptoHoldings).some((h) => h.qty > 0),
  millionaire: (s) => netWorth(s) >= 1_000_000,
  "level-5": (s) => s.player.level >= 5,
};

export function checkAchievements(s: GameState): void {
  for (const def of ACHIEVEMENTS) {
    if (s.achievements.some((a) => a.id === def.id)) continue;
    const check = CHECKS[def.id];
    if (check && check(s)) {
      s.achievements.push({ id: def.id, unlockedAt: Date.now() });
      awardXp(s, 25);
      addToast(s, `🏆 إنجاز جديد: ${def.name}`, "gold");
      addNotif(s, `إنجاز جديد: ${def.name} 🏆`, def.desc, "gold");
    }
  }
}

export function xpSummary(s: GameState): { needed: number; pct: number } {
  const needed = xpForLevel(s.player.level);
  return { needed, pct: Math.min(100, (s.player.xp / needed) * 100) };
}

export function fmtXp(s: GameState): string {
  return `${fmtInt(s.player.xp)} / ${fmtInt(xpForLevel(s.player.level))} XP`;
}
