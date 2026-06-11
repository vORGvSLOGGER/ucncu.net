import {
  CANDLE_CAP,
  pk,
  SPARK_CAP,
  TICKS_PER_CANDLE,
} from "./constants";
import { uid } from "./format";
import type {
  AchievementDef,
  Auction,
  BorrowerOfferDef,
  BotDef,
  Candle,
  GameEventDef,
  GameState,
  LoanProductDef,
  MarketItemDef,
  PriceBook,
  PriceEntry,
  PropertyDef,
  SectorDef,
  TradeSymbolDef,
} from "./types";

/* =================== static catalogs =================== */

export const MARKET_ITEMS: MarketItemDef[] = [
  { id: "coffee", name: "قهوة فاخرة", category: "goods", icon: "coffee", basePrice: 850, rarity: "common" },
  { id: "electronics", name: "شحنة إلكترونيات", category: "goods", icon: "chip", basePrice: 4200, rarity: "uncommon" },
  { id: "silk", name: "أقمشة حريرية", category: "goods", icon: "ribbon", basePrice: 1500, rarity: "common" },
  { id: "watches", name: "ساعات فاخرة", category: "goods", icon: "watch", basePrice: 9800, rarity: "rare" },
  { id: "iron", name: "حديد خام", category: "resources", icon: "cube", basePrice: 620, rarity: "common" },
  { id: "copper", name: "نحاس", category: "resources", icon: "bolt", basePrice: 980, rarity: "common" },
  { id: "wood", name: "خشب صلب", category: "resources", icon: "tree", basePrice: 450, rarity: "common" },
  { id: "fuel", name: "وقود", category: "resources", icon: "fire", basePrice: 720, rarity: "uncommon" },
  { id: "painting", name: "لوحة فنية نادرة", category: "rare", icon: "frame", basePrice: 24000, rarity: "rare" },
  { id: "manuscript", name: "مخطوطة تاريخية", category: "rare", icon: "scroll", basePrice: 18500, rarity: "rare" },
  { id: "diamond", name: "ألماسة زرقاء", category: "rare", icon: "gem", basePrice: 56000, rarity: "legendary" },
  { id: "statue", name: "تمثال أثري", category: "rare", icon: "trophy", basePrice: 32000, rarity: "legendary" },
  { id: "ramadan-box", name: "صندوق رمضان الذهبي", category: "seasonal", icon: "giftbox", basePrice: 7500, rarity: "rare" },
  { id: "season-shield", name: "درع الموسم", category: "seasonal", icon: "shield", basePrice: 12000, rarity: "rare" },
  { id: "festival", name: "تذكرة المهرجان", category: "seasonal", icon: "ticket", basePrice: 3200, rarity: "uncommon" },
  { id: "winter-gift", name: "هدية الشتاء", category: "seasonal", icon: "snow", basePrice: 5400, rarity: "uncommon" },
];

export const PROPERTIES: PropertyDef[] = [
  { id: "apartment", name: "شقة وسط المدينة", district: "حي المركز", icon: "building", basePrice: 250_000, rentPerCycle: 380 },
  { id: "villa", name: "فيلا الواحة", district: "حي الواحة", icon: "villa", basePrice: 850_000, rentPerCycle: 1150 },
  { id: "shop", name: "محل تجاري", district: "شارع التحلية", icon: "store", basePrice: 180_000, rentPerCycle: 310 },
  { id: "office", name: "مكتب برج الأعمال", district: "المنطقة المالية", icon: "office", basePrice: 420_000, rentPerCycle: 620 },
  { id: "warehouse", name: "مستودع لوجستي", district: "المنطقة الصناعية", icon: "warehouse", basePrice: 320_000, rentPerCycle: 470 },
  { id: "chalet", name: "شاليه الساحل", district: "الواجهة البحرية", icon: "beach", basePrice: 560_000, rentPerCycle: 760 },
  { id: "tower", name: "برج سكني", district: "حي الأبراج", icon: "tower", basePrice: 2_400_000, rentPerCycle: 3400 },
  { id: "farm", name: "مزرعة جرين فارم", district: "الريف الشمالي", icon: "farm", basePrice: 1_500_000, rentPerCycle: 2050 },
];

export const TRADE_SYMBOLS: TradeSymbolDef[] = [
  { id: "aramco", name: "أرامكو", kind: "stock", basePrice: 27.55 },
  { id: "sabic", name: "سابك", kind: "stock", basePrice: 68.4 },
  { id: "rajhi", name: "الراجحي", kind: "stock", basePrice: 84.2 },
  { id: "neotech", name: "نيو تك", kind: "stock", basePrice: 142.6 },
  { id: "tasi", name: "مؤشر تاسي", kind: "index", basePrice: 11850 },
  { id: "ucn50", name: "مؤشر UCN 50", kind: "index", basePrice: 4520 },
  { id: "gold", name: "الذهب", kind: "commodity", basePrice: 2380 },
  { id: "oil", name: "نفط برنت", kind: "commodity", basePrice: 82.5 },
];

export const SECTORS: SectorDef[] = [
  { id: "tech", name: "التقنية", icon: "chip" },
  { id: "health", name: "الرعاية الصحية", icon: "health" },
  { id: "agri", name: "الزراعة والتقنية الحيوية", icon: "leaf" },
  { id: "logistics", name: "النقل والخدمات اللوجستية", icon: "truck" },
  { id: "energy", name: "الطاقة", icon: "bolt" },
  { id: "retail", name: "التجزئة والتجارة", icon: "store" },
];

export const BOTS: BotDef[] = [
  { id: "saud", name: "سعود القحطاني", avatarId: 2, netWorth: 4_850_000 },
  { id: "fahad", name: "فهد السبيعي", avatarId: 3, netWorth: 3_120_000 },
  { id: "sara", name: "سارة المحمد", avatarId: 4, netWorth: 2_440_000 },
  { id: "abdullah", name: "عبدالله الشهري", avatarId: 5, netWorth: 1_870_000 },
  { id: "noura", name: "نورة العتيبي", avatarId: 6, netWorth: 1_260_000 },
  { id: "khaled", name: "خالد الدوسري", avatarId: 7, netWorth: 840_000 },
  { id: "reem", name: "ريم الحربي", avatarId: 8, netWorth: 520_000 },
  { id: "majed", name: "ماجد العنزي", avatarId: 9, netWorth: 260_000 },
  { id: "faisal", name: "فيصل السبيعي", avatarId: 10, netWorth: 145_000 },
  { id: "future-co", name: "شركة المستقبل القابضة", avatarId: 11, netWorth: 5_600_000 },
];

export function botById(id: string): BotDef {
  return BOTS.find((b) => b.id === id) ?? BOTS[0];
}

export const BORROWER_OFFERS: BorrowerOfferDef[] = [
  { botId: "saud", amount: 500_000, ratePct: 8, durationMs: 300_000, risk: 0.05, creditScore: 820 },
  { botId: "abdullah", amount: 300_000, ratePct: 10.5, durationMs: 240_000, risk: 0.12, creditScore: 760 },
  { botId: "faisal", amount: 250_000, ratePct: 13, durationMs: 180_000, risk: 0.2, creditScore: 700 },
  { botId: "majed", amount: 120_000, ratePct: 16, durationMs: 150_000, risk: 0.3, creditScore: 640 },
];

export const LOAN_PRODUCTS: LoanProductDef[] = [
  { id: "quick", name: "قرض سريع", desc: "تمويل فوري", maxAmount: 1_000_000, ratePct: 3.25, installments: 4, minCredit: 0 },
  { id: "balanced", name: "قرض متوازن", desc: "خيار مثالي", maxAmount: 3_000_000, ratePct: 4.75, installments: 6, minCredit: 550 },
  { id: "longterm", name: "قرض طويل الأجل", desc: "للمشاريع الكبيرة", maxAmount: 10_000_000, ratePct: 6.25, installments: 8, minCredit: 650 },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-buy", name: "أول صفقة", desc: "أتممت أول عملية شراء من السوق", icon: "cart" },
  { id: "first-sell", name: "بائع ناشئ", desc: "أتممت أول عملية بيع", icon: "tag" },
  { id: "first-trade", name: "متداول جديد", desc: "فتحت أول صفقة تداول", icon: "chart" },
  { id: "trade-profit", name: "صائد الأرباح", desc: "حققت ربحًا محققًا يتجاوز 1,000 UCN من التداول", icon: "money" },
  { id: "first-property", name: "مالك عقار", desc: "اشتريت أول عقار", icon: "building" },
  { id: "landlord", name: "إمبراطور العقارات", desc: "امتلكت 3 عقارات في وقت واحد", icon: "tower" },
  { id: "first-company", name: "رائد أعمال", desc: "أسست أول شركة", icon: "briefcase" },
  { id: "loan-paid", name: "سجل نظيف", desc: "سددت قرضًا كاملًا", icon: "shield" },
  { id: "auction-win", name: "ملك المزاد", desc: "فزت بمزاد", icon: "gavel" },
  { id: "crypto-holder", name: "مستثمر رقمي", desc: "امتلكت أول عملة رقمية", icon: "coin" },
  { id: "millionaire", name: "مليونير", desc: "تجاوزت ثروتك 1,000,000 UCN", icon: "crown" },
  { id: "level-5", name: "صاعد بقوة", desc: "وصلت إلى المستوى 5", icon: "star" },
];

export const GAME_EVENTS: GameEventDef[] = [
  { id: "d1", kind: "daily", title: "مزاد اليوم الخاص", desc: "قطعة نادرة تُطرح في المزاد", reward: "+40 XP عند الفوز", icon: "gavel" },
  { id: "d2", kind: "daily", title: "فرصة السوق", desc: "خصم على الموارد لفترة محدودة", reward: "أسعار مخفضة", icon: "cart" },
  { id: "w1", kind: "weekly", title: "تحدي المتداولين", desc: "أعلى ربح أسبوعي يدخل لوحة الشرف", reward: "+200 XP", icon: "chart" },
  { id: "w2", kind: "weekly", title: "طرح شركة جديدة", desc: "قطاع التقنية يستقبل منافسًا جديدًا", reward: "فرصة استثمار", icon: "briefcase" },
  { id: "m1", kind: "monthly", title: "عقار الشهر النادر", desc: "برج استثماري بعائد مرتفع", reward: "عائد +20%", icon: "tower" },
  { id: "m2", kind: "monthly", title: "موسم الأرباح", desc: "توزيعات أرباح مضاعفة للشركات", reward: "أرباح ×2", icon: "money" },
];

/* =================== price history generation =================== */

function genEntry(base: number, vol: number, drift: number): PriceEntry {
  const steps = CANDLE_CAP * TICKS_PER_CANDLE;
  const series: number[] = [];
  let p = base * (0.92 + Math.random() * 0.08);
  for (let i = 0; i < steps; i++) {
    p = p * (1 + drift + vol * (Math.random() * 2 - 1));
    p = Math.min(base * 1.6, Math.max(base * 0.4, p));
    series.push(p);
  }
  const candles: Candle[] = [];
  for (let i = 0; i < CANDLE_CAP; i++) {
    const chunk = series.slice(i * TICKS_PER_CANDLE, (i + 1) * TICKS_PER_CANDLE);
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
    drift,
    vol,
    spark,
    candles,
    candleTicks: 0,
    changePct: (price / spark[0] - 1) * 100,
  };
}

export function buildPriceBook(): PriceBook {
  const book: PriceBook = {};
  // fiat: USD value per 1 unit
  book[pk.fx("USD")] = genEntry(1, 0.0002, 0);
  book[pk.fx("SAR")] = genEntry(1 / 3.75, 0.0002, 0);
  book[pk.fx("EUR")] = genEntry(1.08, 0.001, 0);
  book[pk.fx("AED")] = genEntry(1 / 3.6725, 0.0002, 0);
  book[pk.fx("UCN")] = genEntry(0.25, 0.0015, 0.0001);
  // crypto: USD per unit
  book[pk.cx("BTC")] = genEntry(116_725, 0.008, 0.0004);
  book[pk.cx("ETH")] = genEntry(2495, 0.01, 0.0004);
  book[pk.cx("UCNC")] = genEntry(2.5, 0.014, 0.0006);
  book[pk.cx("USDT")] = genEntry(1, 0.0003, 0);
  // trading symbols: UCN per unit
  for (const s of TRADE_SYMBOLS) {
    const vol = s.kind === "index" ? 0.0025 : s.kind === "commodity" ? 0.004 : 0.005;
    book[pk.st(s.id)] = genEntry(s.basePrice, vol, 0.0002);
  }
  // market items: UCN
  for (const m of MARKET_ITEMS) book[pk.mk(m.id)] = genEntry(m.basePrice, 0.006, 0.0002);
  // real estate: UCN, slow & upward
  for (const r of PROPERTIES) book[pk.re(r.id)] = genEntry(r.basePrice, 0.0015, 0.0004);
  return book;
}

/* =================== auctions =================== */

const AUCTIONABLE = MARKET_ITEMS.filter(
  (m) => m.category === "rare" || m.category === "seasonal"
);

export function spawnAuction(now: number): Auction {
  const item = AUCTIONABLE[Math.floor(Math.random() * AUCTIONABLE.length)];
  const startBid = Math.round(item.basePrice * 0.55);
  const botPool = [...BOTS].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
  return {
    id: uid("auc"),
    itemDefId: item.id,
    endsAt: now + (3 + Math.random() * 5) * 60_000,
    startBid,
    currentBid: startBid,
    leader: botPool[0] ? botById(botPool[0].id).name : "النظام",
    leaderIsPlayer: false,
    bids: [
      { bidder: botPool[0] ? botById(botPool[0].id).name : "النظام", amount: startBid, t: now },
    ],
    bots: botPool.map((b) => ({
      botId: b.id,
      maxBudget: Math.round(item.basePrice * (0.9 + Math.random() * 0.5)),
      aggressiveness: 0.3 + Math.random() * 0.6,
    })),
  };
}

/* =================== initial state =================== */

export function seed(now = Date.now()): GameState {
  const prices = buildPriceBook();
  return {
    version: 1,
    player: {
      name: "مستثمر جديد",
      avatarId: 1,
      level: 1,
      xp: 0,
      creditScore: 500,
      joinedAt: now,
    },
    balances: { UCN: 10_000, USD: 100, SAR: 0, EUR: 0, AED: 0 },
    cryptoHoldings: {
      BTC: { qty: 0, avgCost: 0 },
      ETH: { qty: 0, avgCost: 0 },
      UCNC: { qty: 0, avgCost: 0 },
      USDT: { qty: 0, avgCost: 0 },
    },
    inventory: [],
    properties: [],
    companies: [],
    positions: [],
    closedTrades: [],
    loans: [],
    lends: [],
    auctions: [spawnAuction(now), spawnAuction(now), spawnAuction(now)],
    auctionResults: [],
    prices,
    netWorthHistory: [],
    transactions: [],
    achievements: [],
    notifications: [
      {
        id: uid("ntf"),
        t: now,
        title: "مرحبًا بك في UCNCU.NET 🎉",
        body: "ابدأ رحلتك الاستثمارية من السوق: اشترِ بسعر منخفض وبِع بسعر أعلى لتكسب الخبرة ورأس المال.",
        kind: "gold",
      },
    ],
    favoritePairs: ["USD/SAR", "EUR/SAR"],
    settings: { exploreMode: true },
    toasts: [],
    lastTickAt: now,
  };
}
