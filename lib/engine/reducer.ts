import {
  CATCHUP_MAX_TICKS,
  DIVIDEND_PERIOD_MS,
  FX_SPREAD,
  NET_WORTH_CAP,
  RENT_PERIOD_MS,
  TICK_MS,
  TRADE_FEE,
} from "../constants";
import { fmtDec, fmtInt, uid } from "../format";
import { BORROWER_OFFERS, botById, LOAN_PRODUCTS, SECTORS } from "../seed";
import {
  cryptoUcn,
  fxRate,
  itemPrice,
  marketItemDef,
  netWorth,
  propertyDef,
  propertyValue,
  symbolPrice,
  unrealizedPnl,
} from "../selectors";
import type { Action, GameState } from "../types";
import { processAccruals } from "./accrual";
import { tickAuctions } from "./auction";
import { addNotif, addToast, addTx } from "./log";
import { awardXp, checkAchievements } from "./xp";
import { tickPrices } from "./prices";

function fail(s: GameState, msg: string): GameState {
  addToast(s, msg, "warning");
  return s;
}

export function gameReducer(state: GameState, action: Action): GameState {
  const s = structuredClone(state);
  const now = Date.now();

  switch (action.type) {
    case "HYDRATE": {
      const h = structuredClone(action.state);
      const elapsed = action.now - h.lastTickAt;
      if (elapsed > TICK_MS) {
        tickPrices(h, Math.min(CATCHUP_MAX_TICKS, Math.floor(elapsed / TICK_MS)));
        const summary = processAccruals(h, action.now, true);
        const gained = summary.rent + summary.dividends + summary.lendsReturned;
        if (elapsed > 2 * 60_000 && gained > 0) {
          addNotif(
            h,
            "بينما كنت غائبًا 🌙",
            `تحصّلت ${fmtInt(gained)} UCN (إيجارات وأرباح وسدادات) أثناء غيابك`,
            "gold",
            action.now
          );
        }
        tickAuctions(h, action.now);
      }
      h.toasts = [];
      h.lastTickAt = action.now;
      return h;
    }

    case "RESET":
      return structuredClone(action.state);

    case "TICK": {
      tickPrices(s);
      tickAuctions(s, action.now);
      processAccruals(s, action.now);
      s.netWorthHistory.push(netWorth(s));
      if (s.netWorthHistory.length > NET_WORTH_CAP) s.netWorthHistory.shift();
      s.lastTickAt = action.now;
      return s;
    }

    /* ================= market ================= */

    case "BUY_ITEM": {
      const def = marketItemDef(action.defId);
      if (!def || action.qty < 1) return s;
      const cost = itemPrice(s, action.defId) * action.qty;
      if (s.balances.UCN < cost) return fail(s, "رصيد UCN غير كافٍ لإتمام الشراء");
      s.balances.UCN -= cost;
      const inv = s.inventory.find((i) => i.defId === action.defId);
      if (inv) {
        inv.avgCost = (inv.avgCost * inv.qty + cost) / (inv.qty + action.qty);
        inv.qty += action.qty;
      } else {
        s.inventory.push({ defId: action.defId, qty: action.qty, avgCost: cost / action.qty });
      }
      addTx(s, "buy", `شراء ${def.name} ×${action.qty}`, -cost, "UCN", now);
      addToast(s, `🛒 اشتريت ${def.name} ×${action.qty} مقابل ${fmtInt(cost)} UCN`, "success");
      awardXp(s, 8);
      checkAchievements(s);
      return s;
    }

    case "SELL_ITEM": {
      const def = marketItemDef(action.defId);
      const inv = s.inventory.find((i) => i.defId === action.defId);
      if (!def || !inv || inv.qty < action.qty || action.qty < 1)
        return fail(s, "لا تملك كمية كافية من هذا الأصل");
      const proceeds = itemPrice(s, action.defId) * action.qty;
      s.balances.UCN += proceeds;
      inv.qty -= action.qty;
      if (inv.qty === 0) s.inventory = s.inventory.filter((i) => i.defId !== action.defId);
      addTx(s, "sell", `بيع ${def.name} ×${action.qty}`, proceeds, "UCN", now);
      addToast(s, `💰 بعت ${def.name} ×${action.qty} مقابل ${fmtInt(proceeds)} UCN`, "success");
      awardXp(s, 8);
      checkAchievements(s);
      return s;
    }

    /* ================= auction ================= */

    case "PLACE_BID": {
      const a = s.auctions.find((x) => x.id === action.auctionId);
      if (!a || a.endsAt <= now) return fail(s, "انتهى هذا المزاد");
      const minBid = Math.ceil(a.currentBid * 1.01);
      if (action.amount < minBid)
        return fail(s, `الحد الأدنى للمزايدة ${fmtInt(minBid)} UCN`);
      if (a.leaderIsPlayer) return fail(s, "أنت المتصدر حاليًا في هذا المزاد");
      if (s.balances.UCN < action.amount) return fail(s, "رصيد UCN غير كافٍ للمزايدة");
      const item = marketItemDef(a.itemDefId);
      s.balances.UCN -= action.amount;
      a.currentBid = Math.round(action.amount);
      a.leader = s.player.name;
      a.leaderIsPlayer = true;
      a.bids.unshift({ bidder: s.player.name, amount: a.currentBid, t: now, isPlayer: true });
      if (a.bids.length > 30) a.bids.length = 30;
      addTx(s, "auction-bid", `مزايدة على ${item?.name ?? "أصل"}`, -a.currentBid, "UCN", now);
      addToast(s, `🔨 أنت المتصدر الآن بمبلغ ${fmtInt(a.currentBid)} UCN`, "gold");
      awardXp(s, 5);
      return s;
    }

    /* ================= trading ================= */

    case "OPEN_POSITION": {
      const price = symbolPrice(s, action.symbol);
      if (!price || action.qty <= 0) return s;
      const margin = price * action.qty;
      const fee = margin * TRADE_FEE;
      if (s.balances.UCN < margin + fee)
        return fail(s, "رصيد UCN غير كافٍ لفتح الصفقة");
      s.balances.UCN -= margin + fee;
      s.positions.push({
        id: uid("pos"),
        symbol: action.symbol,
        side: action.side,
        qty: action.qty,
        entry: price,
        openedAt: now,
      });
      addTx(
        s,
        "trade-open",
        `فتح صفقة ${action.side === "long" ? "شراء" : "بيع"} — ${action.symbol}`,
        -(margin + fee),
        "UCN",
        now
      );
      addToast(s, `📈 فُتحت الصفقة عند ${fmtDec(price)}`, "info");
      awardXp(s, 10);
      checkAchievements(s);
      return s;
    }

    case "CLOSE_POSITION": {
      const pos = s.positions.find((p) => p.id === action.positionId);
      if (!pos) return s;
      const pnl = unrealizedPnl(s, pos);
      const exit = symbolPrice(s, pos.symbol);
      s.balances.UCN += pos.entry * pos.qty + pnl;
      s.positions = s.positions.filter((p) => p.id !== action.positionId);
      s.closedTrades.unshift({
        id: pos.id,
        symbol: pos.symbol,
        side: pos.side,
        qty: pos.qty,
        entry: pos.entry,
        exit,
        pnl,
        closedAt: now,
      });
      if (s.closedTrades.length > 30) s.closedTrades.length = 30;
      addTx(s, "trade-close", `إغلاق صفقة ${pos.symbol}`, pnl, "UCN", now);
      addToast(
        s,
        pnl >= 0
          ? `✅ أُغلقت الصفقة بربح +${fmtInt(pnl)} UCN`
          : `❌ أُغلقت الصفقة بخسارة −${fmtInt(Math.abs(pnl))} UCN`,
        pnl >= 0 ? "success" : "warning"
      );
      awardXp(s, 10);
      checkAchievements(s);
      return s;
    }

    /* ================= fx ================= */

    case "CONVERT_FX": {
      if (action.from === action.to || action.amount <= 0) return s;
      if (s.balances[action.from] < action.amount)
        return fail(s, `رصيد ${action.from} غير كافٍ`);
      const rate = fxRate(s, action.from, action.to) * (1 - FX_SPREAD);
      const received = action.amount * rate;
      s.balances[action.from] -= action.amount;
      s.balances[action.to] += received;
      addTx(
        s,
        "fx",
        `تحويل ${action.from} ← ${action.to}`,
        received,
        action.to,
        now
      );
      addToast(
        s,
        `💱 حوّلت ${fmtDec(action.amount)} ${action.from} إلى ${fmtDec(received)} ${action.to}`,
        "success"
      );
      awardXp(s, 5);
      return s;
    }

    /* ================= crypto ================= */

    case "BUY_CRYPTO": {
      const price = cryptoUcn(s, action.code);
      if (!price || action.spendUcn <= 0) return s;
      if (s.balances.UCN < action.spendUcn)
        return fail(s, "رصيد UCN غير كافٍ لشراء العملة الرقمية");
      const fee = action.spendUcn * TRADE_FEE;
      const qty = (action.spendUcn - fee) / price;
      s.balances.UCN -= action.spendUcn;
      const h = s.cryptoHoldings[action.code];
      h.avgCost = h.qty + qty > 0 ? (h.avgCost * h.qty + action.spendUcn) / (h.qty + qty) : 0;
      h.qty += qty;
      addTx(s, "crypto-buy", `شراء ${action.code}`, -action.spendUcn, "UCN", now);
      addToast(s, `🪙 اشتريت ${qty.toFixed(6)} ${action.code}`, "success");
      awardXp(s, 8);
      checkAchievements(s);
      return s;
    }

    case "SELL_CRYPTO": {
      const h = s.cryptoHoldings[action.code];
      if (!h || h.qty < action.qty || action.qty <= 0)
        return fail(s, `لا تملك كمية كافية من ${action.code}`);
      const price = cryptoUcn(s, action.code);
      const proceeds = action.qty * price * (1 - TRADE_FEE);
      h.qty -= action.qty;
      if (h.qty <= 1e-9) {
        h.qty = 0;
        h.avgCost = 0;
      }
      s.balances.UCN += proceeds;
      addTx(s, "crypto-sell", `بيع ${action.code}`, proceeds, "UCN", now);
      addToast(s, `💰 بعت ${action.qty.toFixed(6)} ${action.code} مقابل ${fmtInt(proceeds)} UCN`, "success");
      awardXp(s, 8);
      return s;
    }

    /* ================= real estate ================= */

    case "BUY_PROPERTY": {
      const def = propertyDef(action.defId);
      if (!def) return s;
      if (s.properties.some((p) => p.defId === action.defId))
        return fail(s, "تملك هذا العقار بالفعل");
      const price = propertyValue(s, action.defId);
      if (s.balances.UCN < price) return fail(s, "رصيد UCN غير كافٍ لشراء العقار");
      s.balances.UCN -= price;
      s.properties.push({
        id: uid("prop"),
        defId: action.defId,
        paidPrice: price,
        boughtAt: now,
        rentCollected: 0,
        nextRentAt: now + RENT_PERIOD_MS,
      });
      addTx(s, "property-buy", `شراء ${def.name}`, -price, "UCN", now);
      addToast(s, `🏠 مبروك! اشتريت ${def.name}`, "gold");
      awardXp(s, 30);
      checkAchievements(s);
      return s;
    }

    case "SELL_PROPERTY": {
      const prop = s.properties.find((p) => p.id === action.id);
      if (!prop) return s;
      const def = propertyDef(prop.defId);
      const value = propertyValue(s, prop.defId);
      s.balances.UCN += value;
      s.properties = s.properties.filter((p) => p.id !== action.id);
      addTx(s, "property-sell", `بيع ${def?.name ?? "عقار"}`, value, "UCN", now);
      addToast(s, `💰 بعت ${def?.name ?? "العقار"} مقابل ${fmtInt(value)} UCN`, "success");
      awardXp(s, 15);
      return s;
    }

    /* ================= bank ================= */

    case "TAKE_LOAN": {
      const product = LOAN_PRODUCTS.find((p) => p.id === action.productId);
      if (!product || action.amount <= 0) return s;
      if (action.amount > product.maxAmount)
        return fail(s, `الحد الأقصى لهذا القرض ${fmtInt(product.maxAmount)} UCN`);
      if (s.player.creditScore < product.minCredit)
        return fail(s, `هذا القرض يتطلب تقييمًا ائتمانيًا ${product.minCredit}+`);
      if (s.loans.filter((l) => l.status === "active").length >= 3)
        return fail(s, "لا يمكن امتلاك أكثر من 3 قروض نشطة");
      const totalDue = Math.round(action.amount * (1 + product.ratePct / 100));
      s.balances.UCN += action.amount;
      s.loans.unshift({
        id: uid("loan"),
        productName: product.name,
        principal: action.amount,
        totalDue,
        installment: Math.ceil(totalDue / product.installments),
        installments: product.installments,
        paidInstallments: 0,
        nextDueAt: now + 180_000,
        status: "active",
        missed: 0,
        takenAt: now,
      });
      addTx(s, "loan", `${product.name} — إيداع`, action.amount, "UCN", now);
      addToast(s, `🏦 حصلت على ${product.name}: +${fmtInt(action.amount)} UCN`, "gold");
      addNotif(
        s,
        "تم صرف القرض 🏦",
        `${product.name} بمبلغ ${fmtInt(action.amount)} UCN — ${product.installments} أقساط، يُسدد القسط تلقائيًا عند الاستحقاق`,
        "info",
        now
      );
      return s;
    }

    case "LEND": {
      const offer = BORROWER_OFFERS[action.offerIdx];
      if (!offer) return s;
      if (s.lends.some((l) => l.botId === offer.botId && l.status === "active"))
        return fail(s, "لديك قرض نشط لهذا اللاعب بالفعل");
      if (s.balances.UCN < offer.amount) return fail(s, "رصيد UCN غير كافٍ للإقراض");
      s.balances.UCN -= offer.amount;
      s.lends.unshift({
        id: uid("lend"),
        botId: offer.botId,
        amount: offer.amount,
        ratePct: offer.ratePct,
        dueAt: now + offer.durationMs,
        status: "active",
      });
      const bot = botById(offer.botId);
      addTx(s, "lend", `إقراض ${bot.name}`, -offer.amount, "UCN", now);
      addToast(s, `🤝 أقرضت ${bot.name} مبلغ ${fmtInt(offer.amount)} UCN`, "info");
      awardXp(s, 10);
      return s;
    }

    /* ================= companies ================= */

    case "FOUND_COMPANY": {
      if (action.capital < 50_000)
        return fail(s, "الحد الأدنى لرأس المال 50,000 UCN");
      if (s.balances.UCN < action.capital)
        return fail(s, "رصيد UCN غير كافٍ لتأسيس الشركة");
      if (!SECTORS.some((x) => x.id === action.sectorId)) return s;
      if (s.companies.length >= 5) return fail(s, "الحد الأقصى 5 شركات");
      const name = action.name.trim() || "شركتي الجديدة";
      const partnerPct = action.partnerBotId
        ? Math.min(49, Math.max(5, action.partnerPct ?? 30))
        : 0;
      const partnerInvest = partnerPct
        ? Math.round((action.capital * partnerPct) / (100 - partnerPct))
        : 0;
      const totalCapital = action.capital + partnerInvest;
      const valuation = Math.round(totalCapital * (1.4 + Math.random() * 0.8));
      const ownershipPct = 100 - partnerPct;
      s.balances.UCN -= action.capital;
      const partners = [
        {
          name: s.player.name,
          pct: ownershipPct,
          isPlayer: true,
          avatarId: s.player.avatarId,
          invested: action.capital,
        },
      ];
      if (action.partnerBotId && partnerPct) {
        const bot = botById(action.partnerBotId);
        partners.push({
          name: bot.name,
          pct: partnerPct,
          isPlayer: false,
          avatarId: bot.avatarId,
          invested: partnerInvest,
        });
      }
      const history: number[] = [];
      for (let i = 8; i > 0; i--) history.push(Math.round(valuation * (0.94 + 0.06 * (8 - i) / 8)));
      history.push(valuation);
      s.companies.unshift({
        id: uid("co"),
        name,
        sectorId: action.sectorId,
        foundedAt: now,
        valuation,
        history,
        ownershipPct,
        partners,
        dividendsPaid: 0,
        events: [{ t: now, kind: "founded", text: `تأسست الشركة برأس مال ${fmtInt(totalCapital)} UCN` }],
        nextDividendAt: now + DIVIDEND_PERIOD_MS,
      });
      addTx(s, "company", `تأسيس شركة ${name}`, -action.capital, "UCN", now);
      addToast(s, `🚀 تأسست شركة ${name} بنجاح!`, "gold");
      addNotif(s, "شركة جديدة 🚀", `${name} انطلقت بتقييم ${fmtInt(valuation)} UCN`, "gold", now);
      awardXp(s, 100);
      checkAchievements(s);
      return s;
    }

    case "SELL_SHARES": {
      const co = s.companies.find((c) => c.id === action.companyId);
      if (!co) return s;
      const pct = Math.min(co.ownershipPct, Math.max(1, action.pct));
      const proceeds = Math.round(((co.valuation * pct) / 100) * 0.97);
      s.balances.UCN += proceeds;
      co.ownershipPct -= pct;
      const me = co.partners.find((p) => p.isPlayer);
      if (me) me.pct = co.ownershipPct;
      const ext = co.partners.find((p) => p.name === "مستثمرون خارجيون");
      if (ext) ext.pct += pct;
      else co.partners.push({ name: "مستثمرون خارجيون", pct, invested: proceeds });
      co.events.unshift({ t: now, kind: "shares", text: `بيع حصة ${pct}% مقابل ${fmtInt(proceeds)} UCN` });
      addTx(s, "shares-sale", `بيع ${pct}% من ${co.name}`, proceeds, "UCN", now);
      addToast(s, `💼 بعت ${pct}% من ${co.name} مقابل ${fmtInt(proceeds)} UCN`, "success");
      if (co.ownershipPct < 1) {
        s.companies = s.companies.filter((c) => c.id !== co.id);
        addNotif(s, "خروج كامل", `تخارجت بالكامل من شركة ${co.name}`, "info", now);
      }
      awardXp(s, 20);
      return s;
    }

    /* ================= misc ================= */

    case "SET_NAME": {
      const name = action.name.trim();
      if (!name) return s;
      s.player.name = name.slice(0, 24);
      return s;
    }

    case "TOGGLE_FAVORITE": {
      if (s.favoritePairs.includes(action.pair)) {
        s.favoritePairs = s.favoritePairs.filter((p) => p !== action.pair);
      } else {
        s.favoritePairs.push(action.pair);
      }
      return s;
    }

    case "MARK_NOTIFICATIONS_READ": {
      for (const n of s.notifications) n.read = true;
      return s;
    }

    case "TOGGLE_EXPLORE": {
      s.settings.exploreMode = !s.settings.exploreMode;
      return s;
    }

    case "DISMISS_TOAST": {
      s.toasts = s.toasts.filter((t) => t.id !== action.id);
      return s;
    }

    default:
      return s;
  }
}
