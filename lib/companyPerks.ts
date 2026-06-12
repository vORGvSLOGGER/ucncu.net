/**
 * Company progression — 5 levels, each upgrade unlocks real mechanics.
 * Mechanical values are read by the reducer/engine; `perks` strings render
 * in the upgrade modal and the company dashboard.
 */

export interface CompanyLevelDef {
  level: number;
  name: string;
  /** upgrade cost into THIS level as a fraction of valuation (0 = base) */
  costPct: number;
  employees: number; // max منسوبين
  contracts: number; // max active contracts
  profitBoost: number; // dividend gross multiplier
  autoDistribute: boolean; // auto profit distribution unlocked
  setPayout: boolean; // owner can tune the auto payout %
  contractDiscount: number; // 0..1 off contract costs
  fameMult: number;
  treasuryInterest: number; // per dividend cycle on treasury
  megaContracts: boolean;
  perks: string[];
}

export const COMPANY_LEVELS: CompanyLevelDef[] = [
  {
    level: 1,
    name: "ناشئة",
    costPct: 0,
    employees: 2,
    contracts: 1,
    profitBoost: 1,
    autoDistribute: false,
    setPayout: false,
    contractDiscount: 0,
    fameMult: 1,
    treasuryInterest: 0,
    megaContracts: false,
    perks: ["منسوبان كحد أقصى", "عقد نشط واحد", "توزيع الأرباح يدوي فقط"],
  },
  {
    level: 2,
    name: "نامية",
    costPct: 0.3,
    employees: 4,
    contracts: 2,
    profitBoost: 1.25,
    autoDistribute: true,
    setPayout: false,
    contractDiscount: 0,
    fameMult: 1,
    treasuryInterest: 0,
    megaContracts: false,
    perks: [
      "أرباح +25%",
      "4 منسوبين وعقدان نشطان",
      "🔓 يفتح التوزيع التلقائي للأرباح",
      "أهلية طلب التوثيق من الإدارة العليا",
    ],
  },
  {
    level: 3,
    name: "رائدة",
    costPct: 0.5,
    employees: 6,
    contracts: 3,
    profitBoost: 1.5,
    autoDistribute: true,
    setPayout: true,
    contractDiscount: 0.1,
    fameMult: 1.5,
    treasuryInterest: 0,
    megaContracts: false,
    perks: [
      "أرباح +50%",
      "6 منسوبين و3 عقود",
      "🔓 تحديد نسبة التوزيع التلقائي بنفسك",
      "خصم 10% على تكاليف العقود",
      "شهرة ×1.5",
    ],
  },
  {
    level: 4,
    name: "كبرى",
    costPct: 0.6,
    employees: 8,
    contracts: 4,
    profitBoost: 1.75,
    autoDistribute: true,
    setPayout: true,
    contractDiscount: 0.1,
    fameMult: 1.5,
    treasuryInterest: 0.005,
    megaContracts: true,
    perks: [
      "أرباح +75%",
      "8 منسوبين و4 عقود",
      "🔓 فائدة على الخزينة +0.5% كل دورة",
      "🔓 عقود ضخمة حصرية بعوائد مضاعفة",
    ],
  },
  {
    level: 5,
    name: "إمبراطورية",
    costPct: 0.75,
    employees: 10,
    contracts: 5,
    profitBoost: 2,
    autoDistribute: true,
    setPayout: true,
    contractDiscount: 0.15,
    fameMult: 2,
    treasuryInterest: 0.005,
    megaContracts: true,
    perks: [
      "أرباح ×2",
      "10 منسوبين و5 عقود",
      "شهرة ×2 وخصم عقود 15%",
      "👑 شارة الإمبراطورية في توب 10 وأولوية التتويج",
    ],
  },
];

export function companyLevel(level: number): CompanyLevelDef {
  return COMPANY_LEVELS[Math.min(COMPANY_LEVELS.length, Math.max(1, level)) - 1];
}

export const MAX_COMPANY_LEVEL = COMPANY_LEVELS.length;

/* ---- verification (التوثيق) ---- */

export const VERIFICATION_REQUIREMENTS = {
  minLevel: 2,
  minValuation: 500_000,
  minMembers: 3,
  minAgeMs: 30 * 60_000,
};

/** dividend boost for verified companies */
export const VERIFIED_PROFIT_BOOST = 1.1;
export const VERIFIED_FAME_MULT = 2;

export interface VerificationCheck {
  label: string;
  met: boolean;
}

export function verificationChecks(c: {
  level: number;
  valuation: number;
  members: unknown[];
  foundedAt: number;
}): VerificationCheck[] {
  const R = VERIFICATION_REQUIREMENTS;
  return [
    { label: `مستوى «نامية» فأعلى`, met: c.level >= R.minLevel },
    { label: `تقييم ≥ 500 ألف UCN`, met: c.valuation >= R.minValuation },
    { label: `3 أعضاء فأكثر`, met: c.members.length >= R.minMembers },
    { label: `عمر الشركة ≥ 30 دقيقة`, met: Date.now() - c.foundedAt >= R.minAgeMs },
  ];
}

export const RANK_META: Record<
  string,
  { label: string; color: string; weight: number }
> = {
  owner: { label: "مالك", color: "#f5c451", weight: 0 },
  founder: { label: "مؤسس", color: "#22d3ee", weight: 1 },
  partner: { label: "شريك", color: "#2dd4bf", weight: 2 },
  employee: { label: "منسوب", color: "#a78bfa", weight: 3 },
  shareholder: { label: "مساهم", color: "#8b9bb8", weight: 4 },
};
