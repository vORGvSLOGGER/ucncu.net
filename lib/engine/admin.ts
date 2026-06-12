import { VERIFICATION_REQUIREMENTS } from "../companyPerks";
import { fmtInt, saudiWeekKey, uid } from "../format";
import { BOTS, botById } from "../seed";
import { netWorth } from "../selectors";
import type { GameState, MarketEvent } from "../types";
import { pushCompanyEvent } from "./company";
import { addFeedPost } from "./feed";
import { addNotif } from "./log";

/**
 * الإدارة العليا — the game's automated governing council (demo mode).
 * Reviews verification requests with real criteria, runs market events that
 * actually move prices, crowns the weekly richest, and hypes mythic auctions.
 * In real mode these powers move to human admin accounts (next milestone).
 */

export const ADMIN_AUTHOR = "admin";

const VERIFY_MIN_REVIEW_MS = 2 * 60_000;

/* ---- market event targets: sector ↔ price-book keys ---- */
const EVENT_TARGETS: Array<{ sectorId: string; label: string; keys: string[] }> = [
  { sectorId: "energy", label: "قطاع الطاقة", keys: ["st:oil", "st:aramco"] },
  { sectorId: "tech", label: "قطاع التقنية", keys: ["st:neotech", "cx:ETH", "cx:BTC"] },
  { sectorId: "retail", label: "قطاع التجزئة", keys: ["st:rajhi", "mk:electronics", "mk:watches"] },
  { sectorId: "logistics", label: "قطاع اللوجستيات", keys: ["st:sabic", "mk:fuel", "mk:iron"] },
  { sectorId: "agri", label: "القطاع الزراعي", keys: ["mk:wood", "mk:coffee"] },
  { sectorId: "health", label: "قطاع الصحة", keys: ["st:tasi", "st:ucn50"] },
];

function p(base: number, steps: number, cap = 0.5): number {
  return Math.min(cap, base * steps);
}

export function tickAdmin(s: GameState, now: number, steps = 1): void {
  reviewVerifications(s, now, steps);
  runMarketEvents(s, now, steps);
  weeklyCrown(s, now);
  hypeMythicAuctions(s, now, steps);
}

/* =================== verification review =================== */

function reviewVerifications(s: GameState, now: number, steps: number): void {
  for (const c of s.companies) {
    if (c.verification !== "pending") continue;
    const waited = now - (c.verificationAt ?? now);
    if (waited < VERIFY_MIN_REVIEW_MS) continue;
    // decision lands probabilistically after the minimum review window (~5 min avg)
    if (Math.random() >= p(0.01, steps) && waited < 10 * 60_000) continue;

    const R = VERIFICATION_REQUIREMENTS;
    const failures: string[] = [];
    if (c.level < R.minLevel) failures.push("مستوى الشركة دون «نامية»");
    if (c.valuation < R.minValuation) failures.push(`التقييم دون ${fmtInt(R.minValuation)} UCN`);
    if (c.members.length < R.minMembers) failures.push("عدد الأعضاء أقل من 3");
    if (now - c.foundedAt < R.minAgeMs) failures.push("عمر الشركة أقل من 30 دقيقة");
    if (s.player.creditScore < 500) failures.push("السجل الائتماني للمالك دون المقبول");

    if (failures.length === 0) {
      c.verification = "verified";
      c.fame += 200;
      pushCompanyEvent(c, "verify", "حصلت الشركة على التوثيق الرسمي ✓ من الإدارة العليا", now);
      addNotif(s, "✓ شركتك موثقة رسميًا!", `الإدارة العليا اعتمدت ${c.name}: أرباح +10%، شهرة ×2، وأهلية العقود الحصرية`, "gold", now);
      addFeedPost(s, ADMIN_AUTHOR, "milestone", `قرار رسمي: منحت الإدارة العليا التوثيق ✓ لشركة «${c.name}» بعد استيفائها معايير الجودة. مبروك للملاك والمنسوبين 🏛️`, now);
    } else {
      c.verification = "rejected";
      addNotif(s, "رُفض طلب التوثيق ❌", `الإدارة العليا: ${failures[0]}. حسّن الوضع وأعد التقديم`, "warning", now);
      pushCompanyEvent(c, "verify", `رفض التوثيق: ${failures[0]}`, now);
    }
  }
}

/* =================== market events =================== */

function runMarketEvents(s: GameState, now: number, steps: number): void {
  if (s.marketEvent) {
    if (now > s.marketEvent.endsAt) {
      const ev = s.marketEvent;
      addFeedPost(
        s,
        ADMIN_AUTHOR,
        "commentary",
        ev.kind === "boom"
          ? `انتهت طفرة ${ev.title} — الإدارة ترصد عودة التداولات لمستوياتها الطبيعية 🏛️`
          : `استقرت الأسواق بعد تصحيح ${ev.title} — أحسن من اشترى في القاع 🏛️`,
        now
      );
      s.marketEvent = null;
    }
    return;
  }
  // spawn ~every 30-60 min
  if (Math.random() >= p(0.0006, steps, 0.3)) return;
  const target = EVENT_TARGETS[Math.floor(Math.random() * EVENT_TARGETS.length)];
  const boom = Math.random() < 0.7;
  const ev: MarketEvent = {
    id: uid("mev"),
    title: target.label,
    desc: boom
      ? `الإدارة العليا تعلن حزمة محفزات في ${target.label} — سيولة ضخمة تتدفق`
      : `الإدارة العليا تحذر من فقاعة في ${target.label} — تصحيح متوقع`,
    keys: target.keys,
    sectorId: target.sectorId,
    mult: boom ? 0.004 : -0.004,
    endsAt: now + (5 + Math.random() * 5) * 60_000,
    kind: boom ? "boom" : "crash",
  };
  s.marketEvent = ev;
  addNotif(s, boom ? `📈 طفرة في ${target.label}!` : `📉 تصحيح في ${target.label}`, ev.desc, boom ? "gold" : "warning", now);
  addFeedPost(s, ADMIN_AUTHOR, "commentary", `${boom ? "🟢 إعلان رسمي: طفرة" : "🔴 تحذير رسمي: تصحيح"} في ${target.label} خلال الدقائق القادمة — ${ev.desc}`, now);
}

/* =================== weekly crown (التتويج) =================== */

function weeklyCrown(s: GameState, now: number): void {
  const weekKey = saudiWeekKey(now);
  if (s.crown.weekKey === weekKey) return;
  // richest individual
  let holder = "player";
  let best = netWorth(s);
  for (const def of BOTS) {
    const b = s.bots[def.id];
    if (b && b.netWorth > best) {
      best = b.netWorth;
      holder = def.id;
    }
  }
  s.crown = { weekKey, holder };
  // grandest company
  const allCos = [
    ...s.companies.map((c) => ({ name: c.name, fame: c.fame })),
    ...s.botCompanies.map((b) => ({ name: b.name, fame: b.fame })),
  ].sort((a, z) => z.fame - a.fame);
  const topCo = allCos[0];
  const holderName = holder === "player" ? s.player.name : botById(holder).name;
  addFeedPost(
    s,
    ADMIN_AUTHOR,
    "milestone",
    `👑 تتويج الأسبوع: «${holderName}» أغنى أثرياء UCNCU بثروة ${fmtInt(best)} UCN${topCo ? ` · وشركة «${topCo.name}» الأكثر شهرة 🏆` : ""} — بقرار رسمي من الإدارة العليا`,
    now
  );
  if (holder === "player") {
    addNotif(s, "👑 توّجتك الإدارة العليا!", "أنت أغنى أثرياء هذا الأسبوع — اللقب بجوار اسمك حتى نهاية الأسبوع", "gold", now);
  }
}

/* =================== mythic auction hype =================== */

function hypeMythicAuctions(s: GameState, now: number, steps: number): void {
  if (Math.random() >= p(0.002, steps, 0.2)) return;
  const mythic = s.auctions.find(
    (a) => a.tier === "mythic" && a.sellerId === "system" && a.endsAt - now > 3 * 60_000 && a.bids.length <= 2
  );
  if (!mythic) return;
  addFeedPost(s, ADMIN_AUTHOR, "commentary", `🏛️ الإدارة العليا تطرح قطعة خارقة ✦ في المزاد الآن — فرصة لا تتكرر، من يجرؤ على المنافسة؟`, now);
}
