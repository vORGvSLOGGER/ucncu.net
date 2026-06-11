import type { IconName } from "@/components/ui/Icon";

/**
 * Level perks ladder — one perk per level, 1..100.
 * Mechanical perks hook into the reducer through the aggregation
 * selectors at the bottom; cosmetic perks render in the profile ladder.
 */

export type PerkEffect =
  | { type: "fee-discount"; pct: number } // trading/crypto fee, cumulative
  | { type: "fx-spread-discount"; pct: number } // currency conversion spread
  | { type: "loan-cap-mult"; mult: number }
  | { type: "loan-slot"; plus: number } // base 3
  | { type: "company-slot"; plus: number } // base 5
  | { type: "auction-calm"; pct: number } // reduces bot counter-bids vs player
  | { type: "daily-bonus"; ucn: number }
  | { type: "ihsan-donate" }
  | { type: "ihsan-rescue" }
  | { type: "title"; text: string }
  | { type: "frame"; color: string };

export interface Perk {
  level: number;
  name: string;
  desc: string;
  icon: IconName;
  kind: "mechanical" | "cosmetic";
  effect: PerkEffect;
  milestone?: boolean;
}

/** hand-authored milestone levels (override the generated slot) */
const MILESTONES: Record<number, Omit<Perk, "level">> = {
  2: {
    name: "خصم رسوم التداول 5%",
    desc: "تنخفض رسوم فتح الصفقات وشراء العملات الرقمية بنسبة 5%",
    icon: "chart",
    kind: "mechanical",
    effect: { type: "fee-discount", pct: 5 },
  },
  5: {
    name: "لقب «تاجر ناشئ» + إطار برونزي",
    desc: "إطار برونزي حول صورتك يظهر للجميع",
    icon: "star",
    kind: "cosmetic",
    effect: { type: "frame", color: "#b08d57" },
  },
  10: {
    name: "فتح التداول + خصم سبريد 10%",
    desc: "قسم التداول يفتح رسميًا، وخصم 10% على فرق تحويل العملات",
    icon: "candle",
    kind: "mechanical",
    effect: { type: "fx-spread-discount", pct: 10 },
  },
  15: {
    name: "فتحة قرض رابعة",
    desc: "يمكنك امتلاك 4 قروض نشطة بدلًا من 3",
    icon: "bank",
    kind: "mechanical",
    effect: { type: "loan-slot", plus: 1 },
  },
  20: {
    name: "هدوء المزاد I",
    desc: "مزايدات المنافسين ضدك تقل حدتها بنسبة 15%",
    icon: "gavel",
    kind: "mechanical",
    effect: { type: "auction-calm", pct: 15 },
  },
  25: {
    name: "حق الإحسان 🤲",
    desc: "يمكنك الآن التبرع لحالات الإفلاس في صفحة الإحسان",
    icon: "health",
    kind: "mechanical",
    effect: { type: "ihsan-donate" },
  },
  30: {
    name: "سقف القروض ×1.5",
    desc: "الحد الأقصى لكل منتج تمويلي يرتفع بنسبة 50%",
    icon: "money",
    kind: "mechanical",
    effect: { type: "loan-cap-mult", mult: 1.5 },
  },
  35: {
    name: "فتحة شركة سادسة",
    desc: "يمكنك تأسيس 6 شركات بدلًا من 5",
    icon: "briefcase",
    kind: "mechanical",
    effect: { type: "company-slot", plus: 1 },
  },
  40: {
    name: "مكافأة يومية 1,000 UCN",
    desc: "تُصرف تلقائيًا مع بداية كل يوم بتوقيت السعودية",
    icon: "giftbox",
    kind: "mechanical",
    effect: { type: "daily-bonus", ucn: 1000 },
  },
  45: {
    name: "لقب «ممول كبير» + إطار فضي",
    desc: "إطار فضي لامع حول صورتك",
    icon: "crown",
    kind: "cosmetic",
    effect: { type: "frame", color: "#c0c8d8" },
  },
  50: {
    name: "حق الفزعة 🦅 + إطار ذهبي",
    desc: "يمكنك إنقاذ مفلس بالكامل في صفحة الإحسان — وإطار ذهبي يليق بالمنقذين",
    icon: "shield",
    kind: "mechanical",
    effect: { type: "ihsan-rescue" },
  },
  60: {
    name: "فتحة شركة سابعة",
    desc: "إمبراطوريتك تتوسع: 7 شركات",
    icon: "tower",
    kind: "mechanical",
    effect: { type: "company-slot", plus: 1 },
  },
  70: {
    name: "سقف القروض ×2",
    desc: "البنك يثق بك: الحد الأقصى للتمويل يتضاعف",
    icon: "bank",
    kind: "mechanical",
    effect: { type: "loan-cap-mult", mult: 1.33 },
  },
  75: {
    name: "لقب «حوت السوق» + هدوء المزاد II",
    desc: "مزايدات المنافسين ضدك تقل بنسبة إضافية 15%",
    icon: "gem",
    kind: "mechanical",
    effect: { type: "auction-calm", pct: 15 },
  },
  80: {
    name: "مكافأة يومية إضافية 1,500 UCN",
    desc: "إجمالي المكافأة اليومية يتجاوز 2,500 UCN",
    icon: "giftbox",
    kind: "mechanical",
    effect: { type: "daily-bonus", ucn: 1500 },
  },
  90: {
    name: "فتحة قرض خامسة",
    desc: "5 قروض نشطة في آن واحد",
    icon: "bank",
    kind: "mechanical",
    effect: { type: "loan-slot", plus: 1 },
  },
  100: {
    name: "«أسطورة الاقتصاد» 👑",
    desc: "إطار أسطوري + بلوغ الحد الأقصى لخصم الرسوم (50%)",
    icon: "crown",
    kind: "cosmetic",
    effect: { type: "frame", color: "#f5c451" },
  },
};

const FILLER_TITLES = [
  "صاعد بثبات",
  "قارئ السوق",
  "صائد الفرص",
  "محنك التداول",
  "ثعلب الأسواق",
  "عين الصقر",
  "رابح الجولات",
  "ركيزة الاقتصاد",
];

function buildPerks(): Perk[] {
  const perks: Perk[] = [];
  for (let level = 1; level <= 100; level++) {
    const m = MILESTONES[level];
    if (m) {
      perks.push({ level, milestone: true, ...m });
      continue;
    }
    if (level === 1) {
      perks.push({
        level,
        name: "بداية الرحلة",
        desc: "السوق مفتوح أمامك — اشترِ رخيصًا وبِع غاليًا",
        icon: "cart",
        kind: "cosmetic",
        effect: { type: "title", text: "مستثمر مبتدئ" },
      });
      continue;
    }
    switch (level % 3) {
      case 0:
        perks.push({
          level,
          name: "خصم رسوم +0.4%",
          desc: "خصم تراكمي صغير على رسوم التداول",
          icon: "chart",
          kind: "mechanical",
          effect: { type: "fee-discount", pct: 0.4 },
        });
        break;
      case 1:
        perks.push({
          level,
          name: "خصم سبريد +0.6%",
          desc: "خصم تراكمي على فرق تحويل العملات",
          icon: "coins",
          kind: "mechanical",
          effect: { type: "fx-spread-discount", pct: 0.6 },
        });
        break;
      default:
        perks.push({
          level,
          name: `لقب «${FILLER_TITLES[Math.floor(level / 13) % FILLER_TITLES.length]}»`,
          desc: "وسام تقدير يُعرض في سلم الميزات",
          icon: "star",
          kind: "cosmetic",
          effect: {
            type: "title",
            text: FILLER_TITLES[Math.floor(level / 13) % FILLER_TITLES.length],
          },
        });
    }
  }
  return perks;
}

export const PERKS: Perk[] = buildPerks();

/* =================== aggregation selectors (reducer hooks) =================== */

function unlocked(level: number): Perk[] {
  return PERKS.filter((p) => p.level <= level);
}

/** 0..0.5 — multiply TRADE_FEE by (1 − d) */
export function feeDiscount(level: number): number {
  let pct = 0;
  for (const p of unlocked(level))
    if (p.effect.type === "fee-discount") pct += p.effect.pct;
  return Math.min(50, pct) / 100;
}

/** 0..0.6 — multiply FX_SPREAD by (1 − d) */
export function fxSpreadDiscount(level: number): number {
  let pct = 0;
  for (const p of unlocked(level))
    if (p.effect.type === "fx-spread-discount") pct += p.effect.pct;
  return Math.min(60, pct) / 100;
}

export function loanCapMult(level: number): number {
  let mult = 1;
  for (const p of unlocked(level))
    if (p.effect.type === "loan-cap-mult") mult *= p.effect.mult;
  return mult;
}

export function maxLoans(level: number): number {
  let n = 3;
  for (const p of unlocked(level))
    if (p.effect.type === "loan-slot") n += p.effect.plus;
  return n;
}

export function maxCompanies(level: number): number {
  let n = 5;
  for (const p of unlocked(level))
    if (p.effect.type === "company-slot") n += p.effect.plus;
  return n;
}

/** 0..0.3 — bot counter-bid factor vs player becomes f·(1−calm) */
export function auctionCalm(level: number): number {
  let pct = 0;
  for (const p of unlocked(level))
    if (p.effect.type === "auction-calm") pct += p.effect.pct;
  return Math.min(30, pct) / 100;
}

export function dailyBonus(level: number): number {
  let ucn = 0;
  for (const p of unlocked(level))
    if (p.effect.type === "daily-bonus") ucn += p.effect.ucn;
  return ucn;
}

export function canDonate(level: number): boolean {
  return level >= 25;
}

export function canRescue(level: number): boolean {
  return level >= 50;
}

/** highest unlocked frame color (avatar ring), if any */
export function activeFrame(level: number): string | null {
  let color: string | null = null;
  for (const p of unlocked(level)) if (p.effect.type === "frame") color = p.effect.color;
  return color;
}

/** the next perk the player will unlock */
export function nextPerk(level: number): Perk | null {
  return PERKS.find((p) => p.level > level) ?? null;
}
