import {
  GRACE_MS,
  IHSAN_CAP,
  IHSAN_DONOR_MIN_LEVEL,
  IHSAN_LISTED_MAX_LEVEL,
  IHSAN_RESCUER_MIN_LEVEL,
} from "../constants";
import { fmtInt, uid } from "../format";
import { BOTS, botById } from "../seed";
import { insolvent, outstandingDebt } from "../selectors";
import type { GameState, IhsanCase } from "../types";
import { addFeedPost } from "./feed";
import { addNotif, addToast, addTx } from "./log";

/**
 * Bankruptcy lifecycle (demo mode):
 *   none → grace (5h, persisted deadline) → recovered | gameover
 * In real mode (next milestone) gameover becomes a permanent email ban.
 * Bot إحسان cases run on the same machinery so the player can give back.
 */

function playerCase(s: GameState): IhsanCase | undefined {
  return s.ihsanCases.find((c) => c.id === s.bankruptcy.caseId);
}

/** called from accrual when an installment is missed while insolvent */
export function enterBankruptcy(s: GameState, now: number): void {
  if (s.bankruptcy.status !== "none") return;
  const debt = outstandingDebt(s);
  s.bankruptcy = {
    status: "grace",
    startedAt: now,
    deadline: now + GRACE_MS,
    debtAtStart: debt,
  };
  if (s.player.level <= IHSAN_LISTED_MAX_LEVEL) {
    const c: IhsanCase = {
      id: uid("ihsan"),
      subjectId: "player",
      startedAt: now,
      deadline: now + GRACE_MS,
      debt,
      donated: 0,
      donations: [],
      status: "open",
    };
    s.ihsanCases.unshift(c);
    trimCases(s);
    s.bankruptcy.caseId = c.id;
  }
  addToast(s, "🚨 أُعلن إعسارك — أمامك 5 ساعات للنجاة", "warning");
  addNotif(
    s,
    "حالة إفلاس 🚨",
    `أصولك لا تغطي ديونك (${fmtInt(debt)} UCN). أمامك 5 ساعات: بِع أصولًا، سدّد مبكرًا، أو انتظر فزعة أهل الخير من صفحة الإحسان.`,
    "warning",
    now
  );
  addFeedPost(
    s,
    "system",
    "bankruptcy",
    `⚠️ ${s.player.name} يواجه الإفلاس — حالته معروضة الآن في الإحسان. من يفزع له؟`,
    now
  );
}

function resolvePlayerCase(s: GameState, now: number, rescuedBy?: string): void {
  const c = playerCase(s);
  if (c && c.status === "open") {
    c.status = "rescued";
    if (rescuedBy) c.rescuedBy = rescuedBy;
  }
  s.bankruptcy = { status: "none" };
  addToast(s, "🌅 نجوت من الإفلاس!", "gold");
  addNotif(
    s,
    "نجوت من الإفلاس 🌅",
    rescuedBy
      ? `${rescuedBy} فزع لك وسدد ما تبقى من دينك — لا تنسَ ردّ الجميل يومًا`
      : "أصولك عادت لتغطية ديونك — إدارة حكيمة!",
    "gold",
    now
  );
  addFeedPost(
    s,
    "system",
    "ihsan",
    rescuedBy
      ? `🦅 فزعة! ${rescuedBy} أنقذ ${s.player.name} من الإفلاس — هكذا يكون المجتمع`
      : `🌅 ${s.player.name} نهض من حافة الإفلاس بجهده — قصة كفاح`,
    now
  );
}

function trimCases(s: GameState): void {
  if (s.ihsanCases.length <= IHSAN_CAP) return;
  // drop oldest closed cases first
  for (let i = s.ihsanCases.length - 1; i >= 0 && s.ihsanCases.length > IHSAN_CAP; i--) {
    if (s.ihsanCases[i].status !== "open") s.ihsanCases.splice(i, 1);
  }
  if (s.ihsanCases.length > IHSAN_CAP) s.ihsanCases.length = IHSAN_CAP;
}

/** scaled probability for catch-up steps, capped */
function p(base: number, steps: number, cap = 0.6): number {
  return Math.min(cap, base * steps);
}

export function tickBankruptcy(s: GameState, now: number, steps = 1): void {
  /* ================= player case ================= */
  if (s.bankruptcy.status === "grace") {
    if (!insolvent(s)) {
      resolvePlayerCase(s, now);
    } else if (now > (s.bankruptcy.deadline ?? 0)) {
      s.bankruptcy.status = "gameover";
      const c = playerCase(s);
      if (c && c.status === "open") c.status = "failed";
      addFeedPost(s, "system", "bankruptcy", `💥 أُشهر إفلاس ${s.player.name} — السوق لا يرحم المتأخرين`, now);
    } else {
      const c = playerCase(s);
      const remaining = outstandingDebt(s);
      /* bot donations + فزعة while the player bleeds */
      for (const def of BOTS) {
        const bot = s.bots[def.id];
        if (!bot || bot.bankrupt) continue;
        if (bot.level >= IHSAN_RESCUER_MIN_LEVEL && Math.random() < p(0.0006, steps, 0.25)) {
          // full rescue: pays the whole remaining debt straight into the loans
          for (const l of s.loans) {
            if (l.status !== "active") continue;
            l.paidInstallments = l.installments;
            l.status = "paid";
          }
          bot.netWorth = Math.max(5000, bot.netWorth - remaining);
          if (c) {
            c.donations.unshift({ donorId: def.id, amount: remaining, t: now });
            c.donated += remaining;
          }
          addTx(s, "donation-in", `فزعة ${def.name}`, remaining, "UCN", now);
          resolvePlayerCase(s, now, def.name);
          return;
        }
        if (bot.level >= IHSAN_DONOR_MIN_LEVEL && Math.random() < p(0.012, steps)) {
          const amount = Math.max(
            500,
            Math.round((s.bankruptcy.debtAtStart ?? remaining) * (0.02 + Math.random() * 0.03))
          );
          s.balances.UCN += amount;
          bot.netWorth = Math.max(5000, bot.netWorth - amount);
          if (c) {
            c.donations.unshift({ donorId: def.id, amount, t: now });
            c.donated += amount;
          }
          addTx(s, "donation-in", `تبرع من ${def.name}`, amount, "UCN", now);
          addToast(s, `🤲 ${def.name} تبرع لك بـ ${fmtInt(amount)} UCN`, "gold");
          break; // one donation per tick max
        }
      }
    }
  }

  /* ================= bot cases ================= */
  const openBotCases = s.ihsanCases.filter((c) => c.status === "open" && c.subjectId !== "player");

  // spawn a new bot case occasionally (~one per 100 min)
  if (openBotCases.length < 2 && Math.random() < p(0.0005, steps, 0.3)) {
    const candidates = BOTS.filter((d) => {
      const b = s.bots[d.id];
      return b && !b.bankrupt && b.level <= IHSAN_LISTED_MAX_LEVEL;
    });
    if (candidates.length) {
      // weight toward the poorest
      candidates.sort((a, b) => (s.bots[a.id]?.netWorth ?? 0) - (s.bots[b.id]?.netWorth ?? 0));
      const def = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))];
      const bot = s.bots[def.id];
      const debt = Math.round(bot.netWorth * (0.1 + Math.random() * 0.2));
      bot.bankrupt = true;
      s.ihsanCases.unshift({
        id: uid("ihsan"),
        subjectId: def.id,
        startedAt: now,
        deadline: now + GRACE_MS,
        debt,
        donated: 0,
        donations: [],
        status: "open",
      });
      trimCases(s);
      addFeedPost(
        s,
        "system",
        "bankruptcy",
        `⚠️ ${def.name} يواجه الإفلاس بدين ${fmtInt(debt)} UCN — حالته في الإحسان الآن 🤲`,
        now
      );
      addNotif(s, `${def.name} يحتاج فزعتك 🤲`, `حالة إفلاس جديدة في صفحة الإحسان بدين ${fmtInt(debt)} UCN`, "info", now);
    }
  }

  // other bots donate to open bot cases; cases resolve both ways
  for (const c of openBotCases) {
    const subject = s.bots[c.subjectId];
    const subjectName = botById(c.subjectId).name;
    if (!subject) continue;
    if (c.donated >= c.debt) {
      c.status = "rescued";
      subject.bankrupt = false;
      subject.netWorth += Math.round(c.debt * 0.5); // back on his feet with a bump
      addFeedPost(s, c.subjectId, "ihsan", `الحمدلله — تجاوزت أزمتي بفضل الله ثم بفزعتكم. لن أنسى هذا الجميل 🤲❤️`, now);
      continue;
    }
    if (now > c.deadline) {
      c.status = "failed";
      subject.bankrupt = false;
      subject.netWorth = Math.max(5000, Math.round(subject.netWorth * 0.6));
      addFeedPost(s, "system", "bankruptcy", `💔 لم تكتمل فزعة ${subjectName} — خسر 40% من ثروته وبدأ من جديد`, now);
      continue;
    }
    for (const def of BOTS) {
      if (def.id === c.subjectId) continue;
      const donor = s.bots[def.id];
      if (!donor || donor.bankrupt || donor.level < IHSAN_DONOR_MIN_LEVEL) continue;
      if (Math.random() < p(0.004, steps)) {
        const amount = Math.max(500, Math.round(c.debt * (0.03 + Math.random() * 0.05)));
        c.donations.unshift({ donorId: def.id, amount, t: now });
        c.donated += amount;
        donor.netWorth = Math.max(5000, donor.netWorth - amount);
        break;
      }
    }
  }
}
