import { companyLevel } from "../companyPerks";
import { fmtInt, uid } from "../format";
import { BOTS, SECTORS } from "../seed";
import type {
  BotCompany,
  Company,
  CompanyContract,
  CompanyMember,
  CompanyRank,
  GameState,
} from "../types";
import { addFeedPost } from "./feed";
import { addNotif, addTx } from "./log";

const CONTRACTS_CAP = 8;
const OFFER_TTL = 5 * 60_000;

export function mkMember(opts: {
  name: string;
  avatarId: number;
  rank: CompanyRank;
  botId?: string;
  isPlayer?: boolean;
  joinedAt: number;
  salary?: number;
  contribution?: number;
}): CompanyMember {
  return {
    id: uid("mem"),
    name: opts.name,
    avatarId: opts.avatarId,
    rank: opts.rank,
    botId: opts.botId,
    isPlayer: opts.isPlayer,
    joinedAt: opts.joinedAt,
    salary: opts.salary,
    contribution: opts.contribution ?? 0,
    missedSalaries: 0,
  };
}

export function activeCompany(s: GameState): Company | null {
  return (
    s.companies.find((c) => c.id === s.settings.activeCompanyId) ?? s.companies[0] ?? null
  );
}

export function companyEmployees(c: Company): CompanyMember[] {
  return c.members.filter((m) => m.rank === "employee");
}

export function pushCompanyEvent(c: Company, kind: Company["events"][number]["kind"], text: string, t: number): void {
  c.events.unshift({ t, kind, text });
  if (c.events.length > 30) c.events.length = 30;
}

/* =================== contracts =================== */

const CONTRACT_TITLES = [
  "عقد توريد لقطاع {s}",
  "تطوير منصة رقمية — {s}",
  "عقد صيانة وتشغيل {s}",
  "توسعة مشروع في {s}",
  "شحنة عاجلة — {s}",
  "استشارات متخصصة في {s}",
];
const MEGA_TITLES = ["مناقصة ضخمة — {s} 🏛️", "مشروع وطني استراتيجي — {s} 🏗️"];

function sectorName(id: string): string {
  return SECTORS.find((x) => x.id === id)?.name ?? id;
}

export function genContractOffer(c: Company, now: number, mega = false): CompanyContract {
  const sector =
    Math.random() < 0.45 ? c.sectorId : SECTORS[Math.floor(Math.random() * SECTORS.length)].id;
  const titles = mega ? MEGA_TITLES : CONTRACT_TITLES;
  const title = titles[Math.floor(Math.random() * titles.length)].replace("{s}", sectorName(sector));
  const costBase = mega ? 0.2 + Math.random() * 0.15 : 0.05 + Math.random() * 0.1;
  const cost = Math.max(2000, Math.round(c.valuation * costBase));
  const rewardMult = mega ? 1.5 + Math.random() * 0.7 : 1.15 + Math.random() * 0.65;
  return {
    id: uid("ctr"),
    title,
    sectorId: sector,
    cost,
    reward: Math.round(cost * rewardMult),
    risk: mega ? 0.2 + Math.random() * 0.2 : 0.1 + Math.random() * 0.25,
    duration: (3 + Math.random() * 7) * 60_000,
    status: "offer",
    expiresAt: now + OFFER_TTL,
  };
}

/**
 * Per-tick company life: refresh contract offers, mature active contracts,
 * accrue fame. Salaries/treasury interest run on the dividend cycle (accrual).
 */
export function tickCompanies(s: GameState, now: number, quiet = false): void {
  for (const c of s.companies) {
    const lv = companyLevel(c.level);

    /* expire stale offers */
    c.contracts = c.contracts.filter(
      (k) => !(k.status === "offer" && k.expiresAt <= now)
    );

    /* fresh offers (~every 2-3 min), more for verified/mega-capable */
    const offers = c.contracts.filter((k) => k.status === "offer");
    if (offers.length < 3 && Math.random() < 0.022) {
      const mega =
        (lv.megaContracts || c.verification === "verified") && Math.random() < 0.25;
      c.contracts.unshift(genContractOffer(c, now, mega));
    }

    /* mature active contracts */
    for (const k of c.contracts) {
      if (k.status !== "active" || (k.endsAt ?? 0) > now) continue;
      const employees = companyEmployees(c).length;
      const effRisk = Math.max(0.02, k.risk - 0.05 * employees);
      const eventBoost =
        s.marketEvent &&
        s.marketEvent.kind === "boom" &&
        s.marketEvent.sectorId === k.sectorId &&
        s.marketEvent.endsAt > (k.startedAt ?? 0)
          ? 1.25
          : 1;
      if (Math.random() >= effRisk) {
        k.status = "done";
        const payout = Math.round(k.reward * eventBoost);
        c.treasury += payout;
        c.fame += Math.round((payout / 10_000) * lv.fameMult * (c.verification === "verified" ? 2 : 1));
        pushCompanyEvent(c, "contract", `نجاح «${k.title}» — ‏+${fmtInt(payout)} UCN للخزينة`, now);
        if (!quiet) {
          addNotif(s, `عقد ناجح ✅ ${c.name}`, `«${k.title}» أضاف ${fmtInt(payout)} UCN لخزينة الشركة`, "success", now);
          if (k.mega) {
            addFeedPost(s, "player", "milestone", `شركة ${c.name} تنجز ${k.title} بعائد ${fmtInt(payout)} UCN 🏗️🔥`, now);
          }
        }
      } else {
        k.status = "failed";
        const refund = Math.round(k.cost * 0.5);
        c.treasury += refund;
        c.fame = Math.max(0, c.fame - 5);
        pushCompanyEvent(c, "contract", `تعثر «${k.title}» — استُرد ${fmtInt(refund)} UCN فقط`, now);
        if (!quiet)
          addNotif(s, `تعثر عقد ⚠️ ${c.name}`, `«${k.title}» فشل — عاد نصف التكلفة فقط للخزينة`, "warning", now);
      }
    }

    /* cap history */
    if (c.contracts.length > CONTRACTS_CAP) {
      const keep = c.contracts.filter((k) => k.status === "offer" || k.status === "active");
      const hist = c.contracts.filter((k) => k.status === "done" || k.status === "failed");
      c.contracts = [...keep, ...hist.slice(0, Math.max(0, CONTRACTS_CAP - keep.length))];
    }
  }
}

/* =================== distribution =================== */

/**
 * Pays out `pct`% of the treasury to share holders by their partner pct.
 * The player's share lands in his UCN balance (company profit reaches the
 * individual); bot partners absorb theirs into live net worth.
 * Returns the player's share.
 */
export function distributeTreasury(
  s: GameState,
  c: Company,
  pct: number,
  now: number,
  opts: { manual?: boolean; quiet?: boolean } = {}
): number {
  const amount = Math.floor((c.treasury * Math.min(100, Math.max(1, pct))) / 100);
  if (amount < 1) return 0;
  c.treasury -= amount;
  c.dividendsPaid += amount;
  let playerShare = 0;
  for (const p of c.partners) {
    const share = Math.round((amount * p.pct) / 100);
    if (share <= 0) continue;
    if (p.isPlayer) {
      playerShare += share;
      s.balances.UCN += share;
    } else {
      const bot = BOTS.find((b) => b.name === p.name);
      if (bot && s.bots[bot.id]) s.bots[bot.id].netWorth += share;
    }
  }
  if (playerShare > 0)
    addTx(s, "distribution", `توزيعات ${c.name}${opts.manual ? "" : " (تلقائي)"}`, playerShare, "UCN", now);
  pushCompanyEvent(
    c,
    "distribution",
    `توزيع أرباح ${fmtInt(amount)} UCN على ${c.partners.length} من الملاك${opts.manual ? "" : " — تلقائي"}`,
    now
  );
  return playerShare;
}

/* =================== bot companies =================== */

const BOT_COMPANY_SEED: Array<Omit<BotCompany, "history" | "fame"> & { fame?: number }> = [
  { id: "bc-future", name: "المستقبل القابضة", ownerBotId: "future-co", sectorId: "tech", valuation: 12_000_000, level: 5, verified: true },
  { id: "bc-saud", name: "واحة الاستثمار", ownerBotId: "saud", sectorId: "retail", valuation: 8_500_000, level: 4, verified: true },
  { id: "bc-fahad", name: "زخم المتاجرة", ownerBotId: "fahad", sectorId: "logistics", valuation: 5_200_000, level: 3, verified: false },
  { id: "bc-sara", name: "قمم التحليل", ownerBotId: "sara", sectorId: "tech", valuation: 4_100_000, level: 3, verified: true },
  { id: "bc-abdullah", name: "ركائز الاستثمار", ownerBotId: "abdullah", sectorId: "energy", valuation: 3_600_000, level: 3, verified: false },
  { id: "bc-noura", name: "عكس التيار", ownerBotId: "noura", sectorId: "health", valuation: 2_200_000, level: 2, verified: false },
  { id: "bc-reem", name: "كنوز الادخار", ownerBotId: "reem", sectorId: "agri", valuation: 1_800_000, level: 2, verified: true },
  { id: "bc-khaled", name: "البرق السريع", ownerBotId: "khaled", sectorId: "logistics", valuation: 1_400_000, level: 2, verified: false },
];

export function seedBotCompanies(): BotCompany[] {
  return BOT_COMPANY_SEED.map((b) => ({
    ...b,
    history: [b.valuation],
    fame: Math.round(b.valuation / 8000) * (b.verified ? 2 : 1),
  }));
}

/** slow drift + occasional contract-win jumps and milestones for the top-10 race */
export function tickBotCompanies(s: GameState, now: number, steps = 1, quiet = false): void {
  if (s.tickCount % 10 !== 0 && steps === 1) return;
  const driftSteps = Math.min(50, Math.max(1, Math.round(steps / 10)));
  for (const bc of s.botCompanies) {
    for (let i = 0; i < driftSteps; i++) {
      bc.valuation = Math.max(
        100_000,
        Math.round(bc.valuation * (1 + (Math.random() * 2 - 1) * 0.005))
      );
    }
    bc.history.push(bc.valuation);
    if (bc.history.length > 48) bc.history.shift();
    // contract-win jump
    if (!quiet && Math.random() < 0.004) {
      const gain = Math.round(bc.valuation * (0.01 + Math.random() * 0.03));
      bc.valuation += gain;
      bc.fame += Math.round(gain / 10_000) * (bc.verified ? 2 : 1);
      if (Math.random() < 0.4) {
        const owner = BOTS.find((b) => b.id === bc.ownerBotId);
        addFeedPost(s, bc.ownerBotId, "milestone", `${bc.name} توقع عقدًا جديدًا بقيمة ${fmtInt(gain)} UCN 🏗️ — ${owner?.name ?? ""} يواصل التوسع`, now);
      }
    }
    bc.fame = Math.max(0, bc.fame + (Math.random() < 0.3 ? 1 : 0));
  }
}

/** unified top-10 rows: player companies + bot companies */
export interface CompanyRankRow {
  id: string;
  name: string;
  sectorId: string;
  valuation: number;
  fame: number;
  level: number;
  verified: boolean;
  mine: boolean;
  ownerName: string;
}

export function companyRanking(s: GameState, by: "valuation" | "fame"): CompanyRankRow[] {
  const rows: CompanyRankRow[] = [
    ...s.companies.map((c) => ({
      id: c.id,
      name: c.name,
      sectorId: c.sectorId,
      valuation: c.valuation,
      fame: Math.round(c.fame),
      level: c.level,
      verified: c.verification === "verified",
      mine: true,
      ownerName: s.player.name,
    })),
    ...s.botCompanies.map((b) => ({
      id: b.id,
      name: b.name,
      sectorId: b.sectorId,
      valuation: b.valuation,
      fame: Math.round(b.fame),
      level: b.level,
      verified: b.verified,
      mine: false,
      ownerName: BOTS.find((x) => x.id === b.ownerBotId)?.name ?? "",
    })),
  ];
  rows.sort((a, z) => (by === "fame" ? z.fame - a.fame : z.valuation - a.valuation));
  return rows.slice(0, 10);
}
