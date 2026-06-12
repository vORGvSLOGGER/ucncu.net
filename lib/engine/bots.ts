import { PERSONAS, PERSONAS_VERSION, personaById, pick } from "../ai/personas";
import { fmtInt } from "../format";
import { BOTS } from "../seed";
import type { BotState, BotStrategy, GameState } from "../types";
import { addFeedPost, keyName } from "./feed";

const BOT_HISTORY_CAP = 48;
const MAX_BOT_POSITIONS = 3;
const BOT_WORTH_FLOOR = 5_000;

/** take-profit % / stop-loss % / max holding time per strategy */
const EXIT_RULES: Record<BotStrategy, { tp: number; sl: number; maxMs: number }> = {
  scalper: { tp: 0.015, sl: 0.02, maxMs: 10 * 60_000 },
  momentum: { tp: 0.04, sl: 0.05, maxMs: 45 * 60_000 },
  value: { tp: 0.08, sl: 0.06, maxMs: 3 * 3600_000 },
  whale: { tp: 0.08, sl: 0.06, maxMs: 3 * 3600_000 },
  contrarian: { tp: 0.05, sl: 0.05, maxMs: 90 * 60_000 },
  hodler: { tp: 0.15, sl: 0.12, maxMs: 6 * 3600_000 },
};

export function seedBots(): Record<string, BotState> {
  const bots: Record<string, BotState> = {};
  for (const def of BOTS) {
    const persona = personaById(def.id);
    bots[def.id] = {
      netWorth: def.netWorth,
      seedWorth: def.netWorth,
      level: persona.level,
      positions: [],
      history: [def.netWorth],
      lastActionAt: 0,
      bankrupt: false,
    };
  }
  return bots;
}

/** re-apply persona tuning after a PERSONAS_VERSION bump (keeps evolved wealth) */
export function retuneBots(s: GameState): void {
  if (s.botsVersion >= PERSONAS_VERSION) return;
  for (const def of BOTS) {
    const b = s.bots[def.id];
    const persona = personaById(def.id);
    if (!b) {
      s.bots[def.id] = seedBots()[def.id];
    } else if (b.level < persona.level) {
      b.level = persona.level;
    }
  }
  s.botsVersion = PERSONAS_VERSION;
}

function positionPnl(s: GameState, key: string, side: "long" | "short", alloc: number, entry: number): number {
  const cur = s.prices[key]?.price ?? entry;
  const movePct = cur / entry - 1;
  return alloc * (side === "long" ? movePct : -movePct);
}

/** tradable keys a bot strategy can pick from */
function candidateKeys(s: GameState): string[] {
  return Object.keys(s.prices).filter(
    (k) => k.startsWith("st:") || k.startsWith("cx:") || k.startsWith("mk:")
  );
}

function pickEntry(
  s: GameState,
  strategy: BotStrategy
): { key: string; side: "long" | "short" } | null {
  const keys = candidateKeys(s);
  const byChange = (fn: (chg: number) => boolean) =>
    keys.filter((k) => fn(s.prices[k].changePct));
  // الإدارة العليا market events: smart bots trade the announcement
  const event = s.marketEvent;
  switch (strategy) {
    case "momentum": {
      // momentum riders pile into an official boom (and short a crash)
      if (event && Math.random() < 0.6) {
        return { key: pick(event.keys), side: event.kind === "boom" ? "long" : "short" };
      }
      const up = byChange((c) => c > 2);
      const down = byChange((c) => c < -2);
      if (up.length && (Math.random() < 0.65 || !down.length))
        return { key: pick(up), side: "long" };
      if (down.length) return { key: pick(down), side: "short" };
      return null;
    }
    case "contrarian": {
      // contrarians fade the crowd: short the boom, buy the crash
      if (event && Math.random() < 0.5) {
        return { key: pick(event.keys), side: event.kind === "boom" ? "short" : "long" };
      }
      const crashed = byChange((c) => c < -3);
      const euphoric = byChange((c) => c > 4);
      if (crashed.length) return { key: pick(crashed), side: "long" };
      if (euphoric.length) return { key: pick(euphoric), side: "short" };
      return null;
    }
    case "value": {
      const cheap = keys.filter((k) => s.prices[k].price < s.prices[k].base * 0.92);
      return cheap.length ? { key: pick(cheap), side: "long" } : null;
    }
    case "whale": {
      const blue = keys.filter((k) =>
        ["st:tasi", "st:ucn50", "cx:BTC", "st:gold", "st:aramco"].includes(k)
      );
      return blue.length ? { key: pick(blue), side: Math.random() < 0.8 ? "long" : "short" } : null;
    }
    case "scalper":
      return { key: pick(keys), side: Math.random() < 0.5 ? "long" : "short" };
    case "hodler": {
      const held = keys.filter((k) => k.startsWith("cx:") || k.startsWith("mk:"));
      return held.length ? { key: pick(held), side: "long" } : null;
    }
  }
}

/**
 * The living-traders loop. Piggybacks on the 3s TICK:
 *  1. mark-to-market exits for every open bot position
 *  2. at most ONE new entry globally per tick (human pace)
 *  3. slow idle drift + level evolution every 10th tick
 * `steps` compresses offline catch-up (entries suppressed when quiet).
 */
export function tickBots(s: GameState, now: number, steps = 1, quiet = false): void {
  /* ---- exits ---- */
  for (const def of BOTS) {
    const b = s.bots[def.id];
    if (!b) continue;
    const persona = personaById(def.id);
    const rules = EXIT_RULES[persona.strategy];
    for (let i = b.positions.length - 1; i >= 0; i--) {
      const p = b.positions[i];
      const pnl = positionPnl(s, p.key, p.side, p.alloc, p.entry);
      const pnlPct = pnl / p.alloc;
      const expired = now - p.openedAt > rules.maxMs;
      // smart profit-taking: cash out winning event trades before the event ends
      const eventEnding =
        s.marketEvent &&
        s.marketEvent.keys.includes(p.key) &&
        s.marketEvent.endsAt - now < 60_000 &&
        pnl > 0;
      if (pnlPct >= rules.tp || pnlPct <= -rules.sl || expired || eventEnding) {
        b.netWorth = Math.max(BOT_WORTH_FLOOR, b.netWorth + pnl);
        b.positions.splice(i, 1);
        if (!quiet && Math.random() < persona.chattiness) {
          const tmpl = pnl >= 0 ? pick(persona.win) : pick(persona.loss);
          addFeedPost(
            s,
            def.id,
            "trade",
            tmpl.replace("{item}", keyName(p.key)).replace("{pnl}", fmtInt(Math.abs(pnl))),
            now
          );
        }
      }
    }
  }

  /* ---- one entry max per tick (skip during catch-up) ---- */
  if (!quiet && Math.random() < 0.35) {
    const eligible = BOTS.filter((d) => {
      const b = s.bots[d.id];
      return b && !b.bankrupt && b.positions.length < MAX_BOT_POSITIONS;
    });
    const totalActivity = eligible.reduce((sum, d) => sum + personaById(d.id).activity, 0);
    let roll = Math.random() * totalActivity;
    for (const def of eligible) {
      const persona = personaById(def.id);
      roll -= persona.activity;
      if (roll > 0) continue;
      const b = s.bots[def.id];
      const entry = pickEntry(s, persona.strategy);
      if (entry) {
        const alloc = Math.max(
          1000,
          Math.round(b.netWorth * persona.risk * (0.4 + 0.6 * Math.random()))
        );
        b.positions.push({
          key: entry.key,
          side: entry.side,
          alloc,
          entry: s.prices[entry.key].price,
          openedAt: now,
        });
        b.lastActionAt = now;
        if (Math.random() < persona.chattiness) {
          addFeedPost(
            s,
            def.id,
            "trade",
            pick(persona.open).replace("{item}", keyName(entry.key)),
            now
          );
        }
      }
      break;
    }
  }

  /* ---- idle drift + history + levels (every 10th tick) ---- */
  if (s.tickCount % 10 === 0 || steps > 1) {
    const driftSteps = Math.min(50, Math.max(1, Math.round(steps / 10)));
    for (const def of BOTS) {
      const b = s.bots[def.id];
      if (!b) continue;
      for (let i = 0; i < driftSteps; i++) {
        b.netWorth = Math.max(
          BOT_WORTH_FLOOR,
          Math.round(b.netWorth * (1 + (Math.random() * 2 - 1) * 0.004))
        );
      }
      b.history.push(b.netWorth);
      if (b.history.length > BOT_HISTORY_CAP) b.history.shift();
      // slow level evolution: +1 per doubling over seed wealth, capped +5
      const gain = Math.floor(Math.log2(Math.max(1, b.netWorth / b.seedWorth)));
      const persona = personaById(def.id);
      b.level = persona.level + Math.min(5, Math.max(0, gain));
    }
  }

  /* ---- rare flavor: whales/value bots "found companies" ---- */
  if (!quiet && Math.random() < 0.003) {
    const persona = pick(PERSONAS.filter((p) => p.strategy === "whale" || p.strategy === "value"));
    const sectors = ["التقنية", "الطاقة", "التجزئة", "اللوجستيات", "الرعاية الصحية"];
    addFeedPost(
      s,
      persona.botId,
      "milestone",
      `أعلنّا اليوم عن مشروع جديد في قطاع ${pick(sectors)} 🚀 — المنافسة تشتد!`,
      now
    );
  }
}
