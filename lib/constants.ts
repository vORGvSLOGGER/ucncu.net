import type { AuctionTier, CryptoCode, FiatCode, GameMode } from "./types";

/** release tag shown in "ما الجديد" + feedback survey key */
export const UPDATE_VERSION = "2.0";

export const LEGACY_STORAGE_KEY = "ucncu:v1";
export const MODE_KEY = "ucncu:mode";
export const storageKeyFor = (m: GameMode) => `ucncu:${m}:v2`;

export const SAUDI_TZ = "Asia/Riyadh";

/* ---- bankruptcy + إحسان ---- */
export const GRACE_MS = 5 * 3600_000;
export const IHSAN_DONOR_MIN_LEVEL = 25;
export const IHSAN_RESCUER_MIN_LEVEL = 50;
export const IHSAN_LISTED_MAX_LEVEL = 48;
export const IHSAN_CAP = 12;

/* ---- social ---- */
export const FEED_CAP = 80;
export const POST_MAX_LEN = 280;
export const CHAT_CAP = 50;
export const OFFERS_CAP = 20;
export const DAILY_POST_XP_LIMIT = 5;

/* ---- auction tiers ---- */
export const AUCTION_TIERS: Record<
  AuctionTier,
  { label: string; color: string; mult: number }
> = {
  rare: { label: "نادر", color: "#a78bfa", mult: 1 },
  legendary: { label: "أسطوري", color: "#f5c451", mult: 1.6 },
  mythic: { label: "خارق", color: "#22d3ee", mult: 2.6 },
};
export const AUCTION_COMMISSION = 0.05;

export const TICK_MS = 3000;
export const SPARK_CAP = 60;
export const CANDLE_CAP = 48;
export const TICKS_PER_CANDLE = 5;
export const TX_CAP = 200;
export const NOTIF_CAP = 50;
export const NET_WORTH_CAP = 96;

/** real-time accrual periods (the game compresses time) */
export const RENT_PERIOD_MS = 60_000;
export const DIVIDEND_PERIOD_MS = 120_000;
export const INSTALLMENT_PERIOD_MS = 180_000;
/** offline catch-up cap */
export const CATCHUP_MAX_MS = 72 * 3600_000;
export const CATCHUP_MAX_TICKS = 20;

export const FX_SPREAD = 0.005;
export const TRADE_FEE = 0.001;
export const DIVIDEND_YIELD = 0.004;

export const FEATURE_LEVELS: Record<string, { level: number; label: string }> = {
  market: { level: 1, label: "السوق" },
  trading: { level: 10, label: "التداول" },
  realestate: { level: 20, label: "العقارات" },
  currencies: { level: 30, label: "العملات" },
  bank: { level: 40, label: "البنك" },
  crypto: { level: 50, label: "العملات الرقمية" },
  companies: { level: 60, label: "الشركات" },
};

export const FIAT_META: Record<
  FiatCode,
  { name: string; symbol: string; color: string; flag: string }
> = {
  UCN: { name: "عملة المنصة", symbol: "UCN", color: "#a78bfa", flag: "🅤" },
  USD: { name: "دولار أمريكي", symbol: "$", color: "#34d399", flag: "🇺🇸" },
  SAR: { name: "ريال سعودي", symbol: "ر.س", color: "#4ade80", flag: "🇸🇦" },
  EUR: { name: "يورو", symbol: "€", color: "#60a5fa", flag: "🇪🇺" },
  AED: { name: "درهم إماراتي", symbol: "د.إ", color: "#f87171", flag: "🇦🇪" },
};

export const CRYPTO_META: Record<
  CryptoCode,
  { name: string; nameAr: string; color: string }
> = {
  BTC: { name: "Bitcoin", nameAr: "بيتكوين", color: "#f7931a" },
  ETH: { name: "Ethereum", nameAr: "إيثيريوم", color: "#627eea" },
  UCNC: { name: "UCN Coin", nameAr: "عملة UCN", color: "#a78bfa" },
  USDT: { name: "Tether", nameAr: "تيثر", color: "#26a17b" },
};

export const FIAT_CODES: FiatCode[] = ["UCN", "USD", "SAR", "EUR", "AED"];
export const CRYPTO_CODES: CryptoCode[] = ["BTC", "ETH", "UCNC", "USDT"];

/** price-book key helpers */
export const pk = {
  fx: (c: FiatCode) => `fx:${c}`,
  cx: (c: CryptoCode) => `cx:${c}`,
  mk: (id: string) => `mk:${id}`,
  st: (id: string) => `st:${id}`,
  re: (id: string) => `re:${id}`,
};

export const RANKS: { minLevel: number; name: string }[] = [
  { minLevel: 1, name: "مستثمر مبتدئ" },
  { minLevel: 5, name: "تاجر ناشئ" },
  { minLevel: 10, name: "متداول نشط" },
  { minLevel: 20, name: "مستثمر متمكن" },
  { minLevel: 30, name: "خبير أسواق" },
  { minLevel: 45, name: "ممول كبير" },
  { minLevel: 60, name: "قطب أعمال" },
  { minLevel: 80, name: "أسطورة الاقتصاد" },
];

export function rankForLevel(level: number): string {
  let rank = RANKS[0].name;
  for (const r of RANKS) if (level >= r.minLevel) rank = r.name;
  return rank;
}

export const RARITY_META: Record<
  string,
  { label: string; color: string }
> = {
  common: { label: "شائع", color: "#8b9bb8" },
  uncommon: { label: "مميز", color: "#2dd4bf" },
  rare: { label: "نادر", color: "#a78bfa" },
  legendary: { label: "أسطوري", color: "#f5c451" },
};

export const CATEGORY_LABELS: Record<string, string> = {
  goods: "سلع عامة",
  resources: "موارد",
  rare: "نادرة",
  seasonal: "موسمية",
};
