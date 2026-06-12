import { CRYPTO_META, FEED_CAP } from "../constants";
import { uid } from "../format";
import { personaById, pick } from "../ai/personas";
import { BOTS, MARKET_ITEMS, TRADE_SYMBOLS } from "../seed";
import type { CryptoCode, FeedKind, GameState } from "../types";

export function addFeedPost(
  s: GameState,
  authorId: string,
  kind: FeedKind,
  text: string,
  t = Date.now()
): void {
  s.feed.unshift({ id: uid("post"), t, authorId, kind, text, likes: 0, likedByPlayer: false });
  if (s.feed.length > FEED_CAP) s.feed.length = FEED_CAP;
}

/** display name for a feed/chat author id */
export function authorName(s: GameState, authorId: string): string {
  if (authorId === "player") return s.player.name;
  if (authorId === "system") return "إدارة UCNCU";
  if (authorId === "admin") return "الإدارة العليا ★";
  return BOTS.find((b) => b.id === authorId)?.name ?? "متداول";
}

/** Arabic display name for a price-book key (st:aramco → أرامكو) */
export function keyName(key: string): string {
  const [kind, id] = key.split(":");
  if (kind === "st") return TRADE_SYMBOLS.find((t) => t.id === id)?.name ?? id;
  if (kind === "mk") return MARKET_ITEMS.find((m) => m.id === id)?.name ?? id;
  if (kind === "cx") return CRYPTO_META[id as CryptoCode]?.nameAr ?? id;
  return id ?? key;
}

/**
 * Ambient feed life, runs inside TICK:
 *  - market commentary when something moves hard (~every minute check)
 *  - bot likes trickling onto fresh player posts
 */
export function tickFeed(s: GameState, now: number): void {
  // market commentary every 20 ticks (~1 min)
  if (s.tickCount % 20 === 0 && Math.random() < 0.5) {
    let bestKey = "";
    let bestChg = 0;
    for (const key of Object.keys(s.prices)) {
      if (!key.startsWith("st:") && !key.startsWith("cx:") && !key.startsWith("mk:")) continue;
      const chg = s.prices[key].changePct;
      if (Math.abs(chg) > Math.abs(bestChg)) {
        bestChg = chg;
        bestKey = key;
      }
    }
    if (bestKey && Math.abs(bestChg) > 3.5) {
      const persona = pick(
        BOTS.filter((b) => !s.bots[b.id]?.bankrupt).map((b) => personaById(b.id))
      );
      const text = pick(persona.comment)
        .replace("{sym}", keyName(bestKey))
        .replace("{chg}", `${bestChg >= 0 ? "+" : "−"}${Math.abs(bestChg).toFixed(1)}%`);
      // avoid repeating the same commentary back-to-back
      if (s.feed[0]?.text !== text) addFeedPost(s, persona.botId, "commentary", text, now);
    }
  }

  // bots like fresh player posts organically
  for (const post of s.feed) {
    if (post.authorId !== "player") continue;
    if (now - post.t > 5 * 60_000 || post.likes >= 6) continue;
    if (Math.random() < 0.08) post.likes += 1;
  }
}

/** 3-4 backdated posts so a fresh feed isn't empty */
export function seedFeed(s: GameState, now: number): void {
  addFeedPost(s, "system", "milestone", "أهلًا بكم في إكسبلور 🌍 — هنا ينبض مجتمع UCNCU: صفقات، تحليلات، فزعات، وإنجازات.", now - 50 * 60_000);
  addFeedPost(s, "saud", "commentary", "السوق اليوم يفرز الصبورين من المتعجلين — أين تقف أنت؟ 🌴", now - 34 * 60_000);
  addFeedPost(s, "fahad", "trade", "دخلت مؤشر UCN 50 مع الزخم 🚀 الموجة بدأت", now - 18 * 60_000);
  addFeedPost(s, "noura", "commentary", "نصيحة اليوم: حين يتفق الجميع على رأي واحد، راجع محفظتك 😏", now - 7 * 60_000);
  // keep chronological order (newest first)
  s.feed.sort((a, b) => b.t - a.t);
}
