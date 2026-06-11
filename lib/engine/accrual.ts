import {
  CATCHUP_MAX_MS,
  DIVIDEND_PERIOD_MS,
  DIVIDEND_YIELD,
  INSTALLMENT_PERIOD_MS,
  RENT_PERIOD_MS,
} from "../constants";
import { fmtInt } from "../format";
import { BORROWER_OFFERS, botById } from "../seed";
import { insolvent, propertyDef } from "../selectors";
import type { GameState } from "../types";
import { enterBankruptcy } from "./bankruptcy";
import { addNotif, addTx } from "./log";
import { awardXp, checkAchievements } from "./xp";

export interface AccrualSummary {
  rent: number;
  dividends: number;
  installmentsPaid: number;
  lendsReturned: number;
}

/**
 * Processes everything that accrues with time: rent, dividends, loan
 * installments and player lends. Used by the live TICK and for offline
 * catch-up on HYDRATE (loops are capped at CATCHUP_MAX_MS worth of periods).
 */
export function processAccruals(
  s: GameState,
  now: number,
  quiet = false
): AccrualSummary {
  const summary: AccrualSummary = {
    rent: 0,
    dividends: 0,
    installmentsPaid: 0,
    lendsReturned: 0,
  };

  /* ---- rent ---- */
  const maxRentIter = Math.ceil(CATCHUP_MAX_MS / RENT_PERIOD_MS);
  for (const p of s.properties) {
    const def = propertyDef(p.defId);
    if (!def) continue;
    let collected = 0;
    let i = 0;
    while (p.nextRentAt <= now && i < maxRentIter) {
      collected += def.rentPerCycle;
      p.nextRentAt += RENT_PERIOD_MS;
      i++;
    }
    if (p.nextRentAt <= now) p.nextRentAt = now + RENT_PERIOD_MS;
    if (collected > 0) {
      s.balances.UCN += collected;
      p.rentCollected += collected;
      summary.rent += collected;
      addTx(s, "rent", `إيجار ${def.name}`, collected, "UCN", now);
      if (!quiet) awardXp(s, 5);
    }
  }

  /* ---- company dividends + valuation walk ---- */
  const maxDivIter = Math.ceil(CATCHUP_MAX_MS / DIVIDEND_PERIOD_MS);
  for (const c of s.companies) {
    let paid = 0;
    let i = 0;
    while (c.nextDividendAt <= now && i < maxDivIter) {
      // company level (ناشئة/نامية/رائدة) boosts the dividend yield
      const levelBoost = 1 + 0.25 * ((c.level || 1) - 1);
      const dividend = Math.round(
        c.valuation * DIVIDEND_YIELD * levelBoost * (c.ownershipPct / 100)
      );
      paid += dividend;
      const move = 1 + (Math.random() * 0.05 - 0.018);
      c.valuation = Math.max(10_000, Math.round(c.valuation * move));
      c.history.push(c.valuation);
      if (c.history.length > 48) c.history.shift();
      if (move > 1.02) {
        c.events.unshift({ t: now, kind: "growth", text: "نمو قوي في تقييم الشركة" });
      } else if (move < 0.99) {
        c.events.unshift({ t: now, kind: "drop", text: "تراجع طفيف في التقييم" });
      }
      c.nextDividendAt += DIVIDEND_PERIOD_MS;
      i++;
    }
    if (c.nextDividendAt <= now) c.nextDividendAt = now + DIVIDEND_PERIOD_MS;
    if (paid > 0) {
      s.balances.UCN += paid;
      c.dividendsPaid += paid;
      summary.dividends += paid;
      c.events.unshift({
        t: now,
        kind: "dividend",
        text: `توزيع أرباح ${fmtInt(paid)} UCN`,
      });
      if (c.events.length > 20) c.events.length = 20;
      addTx(s, "dividend", `أرباح شركة ${c.name}`, paid, "UCN", now);
    }
  }

  /* ---- loan installments (auto-pay when funds allow) ---- */
  const maxLoanIter = Math.ceil(CATCHUP_MAX_MS / INSTALLMENT_PERIOD_MS);
  for (const l of s.loans) {
    if (l.status !== "active") continue;
    let i = 0;
    while (l.status === "active" && l.nextDueAt <= now && i < maxLoanIter) {
      if (s.balances.UCN >= l.installment) {
        s.balances.UCN -= l.installment;
        l.paidInstallments += 1;
        summary.installmentsPaid += 1;
        s.player.creditScore = Math.min(990, s.player.creditScore + 6);
        addTx(s, "installment", `سداد قسط ${l.productName}`, -l.installment, "UCN", now);
        if (!quiet) awardXp(s, 20);
        if (l.paidInstallments >= l.installments) {
          l.status = "paid";
          addNotif(s, "تم سداد القرض بالكامل ✅", `${l.productName} — سجل ائتماني ممتاز`, "success", now);
        }
      } else {
        l.missed += 1;
        s.player.creditScore = Math.max(300, s.player.creditScore - 15);
        addNotif(
          s,
          "تعثر في سداد قسط ⚠️",
          `رصيدك غير كافٍ لسداد قسط ${l.productName} (${fmtInt(l.installment)} UCN) — انخفض تقييمك الائتماني`,
          "warning",
          now
        );
        // insolvency on a missed installment = bankruptcy grace period
        if (insolvent(s)) enterBankruptcy(s, now);
      }
      l.nextDueAt += INSTALLMENT_PERIOD_MS;
      i++;
    }
    if (l.nextDueAt <= now) l.nextDueAt = now + INSTALLMENT_PERIOD_MS;
  }

  /* ---- player lends coming due ---- */
  for (const lend of s.lends) {
    if (lend.status !== "active" || lend.dueAt > now) continue;
    const offer = BORROWER_OFFERS.find((o) => o.botId === lend.botId);
    const risk = offer?.risk ?? 0.1;
    const bot = botById(lend.botId);
    if (Math.random() < risk) {
      lend.status = "defaulted";
      const recovered = Math.round(lend.amount * 0.5);
      s.balances.UCN += recovered;
      addTx(s, "lend-return", `استرداد جزئي من ${bot.name}`, recovered, "UCN", now);
      addNotif(
        s,
        "تعثر المقترض 📉",
        `${bot.name} تعثر عن السداد — استُرد ${fmtInt(recovered)} UCN فقط من أصل ${fmtInt(lend.amount)}`,
        "warning",
        now
      );
    } else {
      lend.status = "repaid";
      const repay = Math.round(lend.amount * (1 + lend.ratePct / 100));
      s.balances.UCN += repay;
      summary.lendsReturned += repay;
      addTx(s, "lend-return", `سداد قرض من ${bot.name}`, repay, "UCN", now);
      if (!quiet) {
        addNotif(s, `${bot.name} سدد قرضه 🏦`, `+${fmtInt(repay)} UCN أُودعت في رصيدك`, "success", now);
        awardXp(s, 15);
      }
    }
  }

  checkAchievements(s);
  return summary;
}
