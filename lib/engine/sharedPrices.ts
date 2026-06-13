import {
  CANDLE_CAP,
  REAL_EPOCH,
  REAL_PRICE_SEED,
  SPARK_CAP,
  TICK_MS,
  TICKS_PER_CANDLE,
} from "../constants";
import { buildPriceBook } from "../seed";
import type { Candle, GameState, PriceBook, PriceEntry } from "../types";

/**
 * Deterministic shared market for real (online) mode.
 *
 * The whole point: NO server price ticker. Every client computes the exact
 * same price for every asset at the same wall-clock moment by evaluating a
 * smooth, seeded multi-octave noise as a PURE function of the tick index
 * elapsed since REAL_EPOCH. Join at any time → you converge to everyone else.
 */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** stable 32-bit hash of an asset key */
function keyHash(key: string): number {
  let h = REAL_PRICE_SEED >>> 0;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  }
  return h >>> 0;
}

interface Octave {
  freq: number;
  phase: number;
  weight: number;
}

const OCTAVE_CACHE = new Map<string, { octaves: Octave[]; norm: number; amp: number }>();

function octavesFor(key: string, vol: number): { octaves: Octave[]; norm: number; amp: number } {
  const cached = OCTAVE_CACHE.get(key);
  if (cached) return cached;
  const rnd = mulberry32(keyHash(key));
  const octaves: Octave[] = [];
  // one slow macro-trend octave + a few faster wiggles
  const freqs = [0.004, 0.03, 0.08, 0.17];
  let norm = 0;
  for (let i = 0; i < freqs.length; i++) {
    const weight = (i === 0 ? 1.4 : 1) * (0.6 + rnd() * 0.8);
    octaves.push({
      freq: freqs[i] * (0.85 + rnd() * 0.3),
      phase: rnd() * Math.PI * 2,
      weight,
    });
    norm += weight;
  }
  // bounded swing amplitude derived from the asset's volatility class
  const amp = Math.min(0.5, Math.max(0.008, vol * 35));
  const out = { octaves, norm, amp };
  OCTAVE_CACHE.set(key, out);
  return out;
}

/** deterministic price of one asset at integer tick index n */
function priceAt(key: string, base: number, vol: number, n: number): number {
  const { octaves, norm, amp } = octavesFor(key, vol);
  let sum = 0;
  for (const o of octaves) sum += o.weight * Math.sin(n * o.freq + o.phase);
  const noise = sum / norm; // ~[-1, 1]
  const p = base * (1 + amp * noise);
  return Math.min(base * 1.6, Math.max(base * 0.4, p));
}

/** current global tick index since the shared epoch */
export function realTickIndex(now: number): number {
  return Math.max(0, Math.floor((now - REAL_EPOCH) / TICK_MS));
}

function buildEntry(key: string, base: number, vol: number, n: number): PriceEntry {
  const steps = CANDLE_CAP * TICKS_PER_CANDLE;
  const start = Math.max(0, n - steps + 1);
  const series: number[] = [];
  for (let i = start; i <= n; i++) series.push(priceAt(key, base, vol, i));
  // pad if very early after epoch (shouldn't happen in practice)
  while (series.length < steps) series.unshift(series[0] ?? base);

  const candles: Candle[] = [];
  for (let i = 0; i < CANDLE_CAP; i++) {
    const chunk = series.slice(i * TICKS_PER_CANDLE, (i + 1) * TICKS_PER_CANDLE);
    if (chunk.length === 0) continue;
    candles.push({
      o: chunk[0],
      h: Math.max(...chunk),
      l: Math.min(...chunk),
      c: chunk[chunk.length - 1],
    });
  }
  const spark = series.slice(-SPARK_CAP);
  const price = series[series.length - 1];
  return {
    price,
    base,
    drift: 0,
    vol,
    spark,
    candles,
    candleTicks: 0,
    changePct: (price / spark[0] - 1) * 100,
  };
}

/** full deterministic price book for the given wall-clock time */
export function buildSharedBook(now: number): PriceBook {
  const n = realTickIndex(now);
  // reuse the catalog (keys + base + vol class) from the demo builder,
  // then overwrite every series deterministically from time.
  const template = buildPriceBook();
  const book: PriceBook = {};
  for (const key of Object.keys(template)) {
    const t = template[key];
    book[key] = buildEntry(key, t.base, t.vol, n);
  }
  return book;
}

/**
 * Real-mode price step: replace the whole book with the deterministic one for
 * `now` (so all clients agree), then apply any active admin market event as a
 * temporary multiplicative overlay — same shape as demo's tickPrices overlay.
 */
export function syncSharedPrices(s: GameState, now: number): void {
  s.prices = buildSharedBook(now);
  const event = s.marketEvent && s.marketEvent.endsAt > now ? s.marketEvent : null;
  if (!event) return;
  for (const key of event.keys) {
    const e = s.prices[key];
    if (!e) continue;
    e.price = Math.min(e.base * 1.6, Math.max(e.base * 0.4, e.price * (1 + event.mult)));
    if (e.spark.length) e.spark[e.spark.length - 1] = e.price;
    const last = e.candles[e.candles.length - 1];
    if (last) last.c = e.price;
    e.changePct = (e.price / (e.spark[0] || e.price) - 1) * 100;
  }
}
