import { CRYPTO_CODES, CRYPTO_META, pk } from "./constants";
import { MARKET_ITEMS, PROPERTIES, TRADE_SYMBOLS } from "./seed";
import {
  breakdown,
  fearGreed,
  itemPrice,
  netWorth,
  outstandingDebt,
  propertyValue,
  symbolPrice,
} from "./selectors";
import type { GameState, PriceEntry } from "./types";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const ratio = (part: number, total: number) => (total > 0 ? part / total : 0);

export interface MarketSignal {
  label: string;
  tone: "up" | "down" | "gold" | "teal" | "muted";
  strength: number;
  recentPct: number;
  volatility: number;
}

export interface Opportunity {
  id: string;
  title: string;
  sub: string;
  href: string;
  icon: string;
  tone: MarketSignal["tone"];
  score: number;
  changePct: number;
}

export interface StrategyMission {
  id: string;
  title: string;
  sub: string;
  href: string;
  icon: string;
  tone: MarketSignal["tone"];
  priority: number;
}

export interface StrategyBriefing {
  score: number;
  label: string;
  tone: MarketSignal["tone"];
  cashRatio: number;
  debtRatio: number;
  largestBucketRatio: number;
  activeBuckets: number;
  riskScore: number;
  marketMood: number;
  headline: string;
  missions: StrategyMission[];
  opportunities: Opportunity[];
}

function sparkMovePct(e: PriceEntry, lookback = 12): number {
  const points = e.spark.slice(-lookback);
  const first = points[0] ?? e.price;
  return first > 0 ? ((e.price - first) / first) * 100 : 0;
}

function sparkVolatility(e: PriceEntry, lookback = 14): number {
  const points = e.spark.slice(-lookback);
  if (points.length < 3) return Math.abs(e.changePct);
  let sum = 0;
  let count = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    if (!prev) continue;
    sum += Math.abs((points[i] - prev) / prev) * 100;
    count += 1;
  }
  return count ? sum / count : 0;
}

export function marketSignal(entry: PriceEntry): MarketSignal {
  const recentPct = sparkMovePct(entry);
  const volatility = sparkVolatility(entry);
  const strength = clamp(Math.round(Math.abs(recentPct) * 9 + volatility * 16), 4, 100);

  if (recentPct >= 2.5) {
    return { label: "زخم صاعد", tone: "up", strength, recentPct, volatility };
  }
  if (recentPct <= -2.5) {
    return { label: "تصحيح حاد", tone: "down", strength, recentPct, volatility };
  }
  if (volatility >= 1.2) {
    return { label: "متذبذب", tone: "gold", strength, recentPct, volatility };
  }
  if (Math.abs(entry.changePct) >= 1.5) {
    return {
      label: entry.changePct >= 0 ? "طلب متزايد" : "ضغط بيع",
      tone: entry.changePct >= 0 ? "teal" : "down",
      strength,
      recentPct,
      volatility,
    };
  }
  return { label: "هادئ", tone: "muted", strength, recentPct, volatility };
}

function toneWeight(tone: MarketSignal["tone"]) {
  return tone === "up" ? 1.15 : tone === "down" ? 1.05 : tone === "gold" ? 1 : 0.85;
}

function hrefUnlocked(s: GameState, href: string): boolean {
  if (href === "/trading") return s.player.level >= 10 || s.settings.exploreMode;
  if (href === "/realestate") return s.player.level >= 20 || s.settings.exploreMode;
  if (href === "/crypto") return s.player.level >= 50 || s.settings.exploreMode;
  return true;
}

export function topOpportunities(s: GameState, limit = 4): Opportunity[] {
  const rows: Opportunity[] = [];

  for (const item of MARKET_ITEMS) {
    const entry = s.prices[pk.mk(item.id)];
    if (!entry) continue;
    const signal = marketSignal(entry);
    rows.push({
      id: `market:${item.id}`,
      title: item.name,
      sub: `${signal.label} في السوق · ${Math.round(itemPrice(s, item.id)).toLocaleString("en-US")} UCN`,
      href: "/market",
      icon: item.icon,
      tone: signal.tone,
      score: signal.strength * toneWeight(signal.tone),
      changePct: entry.changePct,
    });
  }

  for (const sym of TRADE_SYMBOLS) {
    const entry = s.prices[pk.st(sym.id)];
    if (!entry) continue;
    const signal = marketSignal(entry);
    rows.push({
      id: `trade:${sym.id}`,
      title: sym.name,
      sub: `${signal.label} للتداول · ${Math.round(symbolPrice(s, sym.id)).toLocaleString("en-US")} UCN`,
      href: "/trading",
      icon: sym.kind === "commodity" ? "gem" : "chart",
      tone: signal.tone,
      score: signal.strength * toneWeight(signal.tone),
      changePct: entry.changePct,
    });
  }

  for (const code of CRYPTO_CODES) {
    const entry = s.prices[pk.cx(code)];
    if (!entry) continue;
    const signal = marketSignal(entry);
    rows.push({
      id: `crypto:${code}`,
      title: CRYPTO_META[code].nameAr,
      sub: `${signal.label} في العملات الرقمية`,
      href: "/crypto",
      icon: "coin",
      tone: signal.tone,
      score: signal.strength * toneWeight(signal.tone),
      changePct: entry.changePct,
    });
  }

  for (const property of PROPERTIES) {
    const entry = s.prices[pk.re(property.id)];
    if (!entry) continue;
    const signal = marketSignal(entry);
    rows.push({
      id: `property:${property.id}`,
      title: property.name,
      sub: `${property.district} · ${Math.round(propertyValue(s, property.id)).toLocaleString("en-US")} UCN`,
      href: "/realestate",
      icon: property.icon,
      tone: signal.tone,
      score: signal.strength * 0.65,
      changePct: entry.changePct,
    });
  }

  return rows
    .filter((row) => hrefUnlocked(s, row.href))
    .sort((a, z) => z.score - a.score)
    .slice(0, limit);
}

export function strategyBriefing(s: GameState): StrategyBriefing {
  const b = breakdown(s);
  const worth = netWorth(s);
  const debt = outstandingDebt(s);
  const cashRatio = ratio(b.cash, worth);
  const debtRatio = ratio(debt, worth);
  const tradingExposure = ratio(
    s.positions.reduce((sum, p) => sum + p.entry * p.qty, 0),
    worth
  );
  const buckets = [
    b.cash,
    b.fiat,
    b.crypto,
    b.inventory,
    b.properties,
    b.companies,
    b.trading,
    b.lends,
  ].filter((v) => v > 0);
  const largestBucketRatio = buckets.length ? Math.max(...buckets) / Math.max(1, worth) : 1;
  const activeBuckets = buckets.filter((v) => ratio(v, worth) >= 0.05).length;
  const concentrationPenalty = largestBucketRatio > 0.7 ? 18 : largestBucketRatio > 0.55 ? 10 : 0;
  const riskScore = clamp(
    Math.round(
      debtRatio * 42 +
        tradingExposure * 28 +
        ratio(b.crypto, worth) * 18 +
        (cashRatio < 0.08 ? 16 : 0) +
        (cashRatio > 0.82 ? 12 : 0) +
        concentrationPenalty
    ),
    0,
    100
  );
  const diversificationScore = clamp((activeBuckets - 1) * 12 + (1 - largestBucketRatio) * 45, 0, 60);
  const focusPenalty = (activeBuckets <= 1 ? 18 : 0) + (largestBucketRatio > 0.85 ? 18 : largestBucketRatio > 0.7 ? 10 : 0);
  const score = clamp(Math.round(100 - riskScore * 0.72 + diversificationScore - focusPenalty), 0, 100);
  const marketMood = fearGreed(s);
  const opportunities = topOpportunities(s);

  const missions: StrategyMission[] = [];
  const addMission = (mission: StrategyMission) => missions.push(mission);

  if (s.marketEvent) {
    addMission({
      id: "market-event",
      title: s.marketEvent.kind === "boom" ? "استغل موجة الإدارة العليا" : "خفف التعرض للقطاع المتراجع",
      sub: s.marketEvent.desc,
      href: s.marketEvent.keys.some((k) => k.startsWith("st:")) ? "/trading" : "/market",
      icon: s.marketEvent.kind === "boom" ? "fire" : "shield",
      tone: s.marketEvent.kind === "boom" ? "gold" : "down",
      priority: 98,
    });
  }

  if (debtRatio > 0.28) {
    addMission({
      id: "debt-control",
      title: "خفف ضغط الديون",
      sub: "نسبة الدين مرتفعة مقارنة بثروتك. السداد المبكر يحسن السجل الائتماني ويقلل خطر الإفلاس.",
      href: "/bank",
      icon: "bank",
      tone: "down",
      priority: 92,
    });
  }

  if (cashRatio > 0.55 && s.player.level >= 20) {
    addMission({
      id: "deploy-cash",
      title: "السيولة نائمة",
      sub: "لديك نقد مرتفع. وزعه بين عقار أو سلة سلع أو صفقة صغيرة بدل تركه خارج النمو.",
      href: "/realestate",
      icon: "bolt",
      tone: "gold",
      priority: 78,
    });
  }

  if (s.inventory.length === 0) {
    addMission({
      id: "first-basket",
      title: "ابنِ أول سلة أصول",
      sub: "ابدأ بسلعة مستقرة وراقب تغير السعر. السوق هو أسرع باب لفهم اقتصاد اللعبة.",
      href: "/market",
      icon: "cart",
      tone: "teal",
      priority: 76,
    });
  }

  if (s.positions.length === 0 && s.player.level >= 10) {
    addMission({
      id: "first-position",
      title: "افتح صفقة اختبارية",
      sub: "ابدأ بحجم صغير تحت 10% من السيولة لتتعلم حركة الشموع بدون ضغط كبير.",
      href: "/trading",
      icon: "candle",
      tone: "teal",
      priority: 70,
    });
  }

  if (s.properties.length === 0 && s.player.level >= 20) {
    addMission({
      id: "first-property",
      title: "فعّل دخل الإيجار",
      sub: "العقار يعطيك تدفقاً دورياً ويوازن مخاطرة السوق والتداول.",
      href: "/realestate",
      icon: "building",
      tone: "up",
      priority: 66,
    });
  }

  if (s.companies.length === 0 && s.player.level >= 60) {
    addMission({
      id: "first-company",
      title: "افتح مسار الإمبراطورية",
      sub: "الشركات هي نهاية اللعبة: خزينة، عقود، أعضاء، وترتيب منفصل.",
      href: "/companies",
      icon: "briefcase",
      tone: "gold",
      priority: 64,
    });
  }

  if (s.friends.length < 2) {
    addMission({
      id: "social-network",
      title: "وسّع شبكتك",
      sub: "الأصدقاء يفتحون المساومة، الصفقات المباشرة، والشراكات.",
      href: "/friends",
      icon: "users",
      tone: "teal",
      priority: 48,
    });
  }

  const hot = opportunities[0];
  if (hot) {
    addMission({
      id: "hot-opportunity",
      title: `راقب ${hot.title}`,
      sub: hot.sub,
      href: hot.href,
      icon: hot.icon,
      tone: hot.tone,
      priority: 52,
    });
  }

  const sortedMissions = missions
    .sort((a, z) => z.priority - a.priority)
    .filter((mission, idx, arr) => arr.findIndex((m) => m.id === mission.id) === idx)
    .slice(0, 4);

  const label =
    activeBuckets <= 1 || largestBucketRatio > 0.82
      ? "جاهز للتنويع"
      : score >= 78
        ? "متوازن وقوي"
        : score >= 58
          ? "قابل للنمو"
          : score >= 38
            ? "يحتاج ضبط"
            : "مخاطرة عالية";
  const tone: MarketSignal["tone"] =
    activeBuckets <= 1 || largestBucketRatio > 0.82
      ? "gold"
      : score >= 78
        ? "up"
        : score >= 58
          ? "teal"
          : score >= 38
            ? "gold"
            : "down";
  const headline =
    riskScore >= 65
      ? "الأولوية الآن لحماية رأس المال قبل التوسع."
      : cashRatio > 0.55
        ? "لديك سيولة جاهزة لبناء خطوة نمو ذكية."
        : activeBuckets >= 4
          ? "محفظتك بدأت تأخذ شكل إمبراطورية متوازنة."
          : "أفضل تطور الآن هو توسيع مصادر الدخل.";

  return {
    score,
    label,
    tone,
    cashRatio,
    debtRatio,
    largestBucketRatio,
    activeBuckets,
    riskScore,
    marketMood,
    headline,
    missions: sortedMissions,
    opportunities,
  };
}
