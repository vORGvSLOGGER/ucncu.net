import { CRYPTO_META, FIAT_META, SAUDI_TZ } from "./constants";
import type { CryptoCode, FiatCode } from "./types";

const nf = (min: number, max: number) =>
  new Intl.NumberFormat("ar", {
    numberingSystem: "latn",
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });

const intFmt = nf(0, 0);
const dec2Fmt = nf(2, 2);
const compactFmt = new Intl.NumberFormat("ar", {
  numberingSystem: "latn",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** integer with grouping: 1,250,000 */
export function fmtInt(n: number): string {
  return intFmt.format(Math.round(n));
}

/** two decimals: 3,750.00 */
export function fmtDec(n: number): string {
  return dec2Fmt.format(n);
}

/** adaptive decimals for prices that can be tiny (crypto) or huge */
export function fmtPrice(n: number): string {
  if (n >= 1000) return dec2Fmt.format(n);
  if (n >= 1) return nf(2, 4).format(n);
  return nf(2, 6).format(n);
}

/** compact: 1.2 مليون */
export function fmtCompact(n: number): string {
  return compactFmt.format(Math.round(n));
}

export function fmtSigned(n: number, dec = 0): string {
  const f = dec > 0 ? nf(dec, dec) : intFmt;
  return (n >= 0 ? "+" : "−") + f.format(Math.abs(n));
}

export function fmtPct(n: number, withSign = true): string {
  const body = nf(1, 2).format(Math.abs(n)) + "%";
  if (!withSign) return body;
  return (n >= 0 ? "+" : "−") + body;
}

export function fiatSymbol(code: FiatCode): string {
  return FIAT_META[code].symbol;
}

export function fmtMoney(n: number, code: FiatCode): string {
  const v = Math.abs(n) >= 1000 ? fmtInt(n) : fmtDec(n);
  return `${v} ${FIAT_META[code].symbol}`;
}

export function fmtCrypto(qty: number, code: CryptoCode): string {
  const dec = code === "BTC" || code === "ETH" ? nf(2, 5) : nf(2, 2);
  return `${dec.format(qty)} ${CRYPTO_META[code].name === "UCN Coin" ? "UCN" : code}`;
}

export function timeAgo(t: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return "قبل لحظات";
  const m = Math.floor(s / 60);
  if (m < 60) return m === 1 ? "منذ دقيقة" : m === 2 ? "منذ دقيقتين" : `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? "منذ ساعة" : h === 2 ? "منذ ساعتين" : `منذ ${h} ساعات`;
  const d = Math.floor(h / 24);
  return d === 1 ? "منذ يوم" : d === 2 ? "منذ يومين" : `منذ ${d} أيام`;
}

export function fmtCountdown(msLeft: number): string {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function fmtClock(t: number): string {
  return new Intl.DateTimeFormat("ar", {
    numberingSystem: "latn",
    timeZone: SAUDI_TZ,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(t));
}

const liveClockFmt = new Intl.DateTimeFormat("ar", {
  numberingSystem: "latn",
  timeZone: SAUDI_TZ,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const weekdayFmt = new Intl.DateTimeFormat("ar", {
  timeZone: SAUDI_TZ,
  weekday: "long",
});

/** "14:32:08 · الخميس" — Riyadh time, for the live header clock */
export function fmtLiveClock(t: number): { time: string; weekday: string } {
  return { time: liveClockFmt.format(new Date(t)), weekday: weekdayFmt.format(new Date(t)) };
}

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: SAUDI_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Saudi calendar day key: "2026-06-11" — drives daily events/bonuses */
export function saudiDayKey(t: number): string {
  return dayKeyFmt.format(new Date(t));
}

/** stable 7-day bucket keyed to the Saudi calendar — drives the weekly crown */
export function saudiWeekKey(t: number): string {
  const [y, m, d] = saudiDayKey(t).split("-").map(Number);
  const days = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return `W${Math.floor(days / 7)}`;
}

/** "04:59:12" hours countdown (for the 5h bankruptcy grace) */
export function fmtCountdownLong(msLeft: number): string {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

let uidCounter = 0;
export function uid(prefix = "id"): string {
  uidCounter = (uidCounter + 1) % 10_000;
  return `${prefix}-${Date.now().toString(36)}-${uidCounter.toString(36)}-${Math.floor(
    Math.random() * 1e6
  ).toString(36)}`;
}
