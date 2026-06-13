import {
  CATCHUP_MAX_TICKS,
  DAILY_POST_XP_LIMIT,
  DIVIDEND_PERIOD_MS,
  FX_SPREAD,
  IHSAN_DONOR_MIN_LEVEL,
  IHSAN_RESCUER_MIN_LEVEL,
  NET_WORTH_CAP,
  OFFERS_CAP,
  POST_MAX_LEN,
  RENT_PERIOD_MS,
  TICK_MS,
  TRADE_FEE,
  UPDATE_VERSION,
} from "../constants";
import { fmtDec, fmtInt, saudiDayKey, uid } from "../format";
import { sanitizeNavOrder } from "../nav";
import {
  canDonate,
  canRescue,
  dailyBonus,
  feeDiscount,
  fxSpreadDiscount,
  loanCapMult,
  maxCompanies,
  maxLoans,
} from "../perks";
import { companyLevel, MAX_COMPANY_LEVEL } from "../companyPerks";
import {
  BORROWER_OFFERS,
  botById,
  LOAN_PRODUCTS,
  SECTORS,
  spawnPlayerAuction,
} from "../seed";
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
import { TUTORIAL_STEPS } from "../tutorial/steps";
import type { Action, GameState } from "../types";
import { processAccruals } from "./accrual";
import { tickAdmin } from "./admin";
import { tickAuctions } from "./auction";
import { tickBankruptcy } from "./bankruptcy";
import { retuneBots, tickBots } from "./bots";
import {
  companyEmployees,
  distributeTreasury,
  mkMember,
  pushCompanyEvent,
  tickBotCompanies,
  tickCompanies,
} from "./company";
import { addFeedPost, tickFeed } from "./feed";
import { addNotif, addToast, addTx } from "./log";
import { ensureThread, pushChat, returnOfferItems, tickSocial } from "./social";
import { awardXp, checkAchievements } from "./xp";
import { tickPrices } from "./prices";
import { syncSharedPrices } from "./sharedPrices";

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
      retuneBots(h);
      // real mode: prices are a deterministic function of time (shared market)
      if (h.mode === "real") syncSharedPrices(h, action.now);
      const elapsed = action.now - h.lastTickAt;
      if (elapsed > TICK_MS) {
        const ticks = Math.min(CATCHUP_MAX_TICKS, Math.floor(elapsed / TICK_MS));
        if (h.mode !== "real") tickPrices(h, ticks);
        tickBots(h, action.now, ticks, true);
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
        tickCompanies(h, action.now, true);
        tickBotCompanies(h, action.now, ticks, true);
        tickAdmin(h, action.now, ticks);
        tickBankruptcy(h, action.now, ticks);
        tickSocial(h, action.now, true);
        tickAuctions(h, action.now);
      }
      h.toasts = [];
      h.lastTickAt = action.now;
      return h;
    }

    case "RESET":
      return structuredClone(action.state);

    case "TICK": {
      if (s.mode === "real") syncSharedPrices(s, action.now);
      else tickPrices(s);
      tickBots(s, action.now);
      tickAuctions(s, action.now);
      processAccruals(s, action.now);
      tickCompanies(s, action.now);
      tickBotCompanies(s, action.now);
      tickAdmin(s, action.now);
      tickBankruptcy(s, action.now);
      tickSocial(s, action.now);
      tickFeed(s, action.now);
      // Saudi-day rollover: reset daily counters + grant the daily bonus perk
      const dayKey = saudiDayKey(action.now);
      if (dayKey !== s.lastDailyKey) {
        s.lastDailyKey = dayKey;
        s.dailyPostCount = 0;
        // fame fades 1% daily — stay active to stay famous
        for (const c of s.companies) c.fame = Math.round(c.fame * 0.99);
        for (const bc of s.botCompanies) bc.fame = Math.round(bc.fame * 0.99);
        const bonus = dailyBonus(s.player.level);
        if (bonus > 0) {
          s.balances.UCN += bonus;
          addTx(s, "daily-bonus", "المكافأة اليومية", bonus, "UCN", action.now);
          addNotif(
            s,
            "مكافأتك اليومية 🎁",
            `+${fmtInt(bonus)} UCN مع بداية اليوم بتوقيت السعودية`,
            "gold",
            action.now
          );
        }
      }
      s.netWorthHistory.push(netWorth(s));
      if (s.netWorthHistory.length > NET_WORTH_CAP) s.netWorthHistory.shift();
      s.tickCount += 1;
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
      if (inv.auctionQty) inv.auctionQty = Math.min(inv.auctionQty, inv.qty);
      if (inv.qty === 0) s.inventory = s.inventory.filter((i) => i.defId !== action.defId);
      addTx(s, "sell", `بيع ${def.name} ×${action.qty}`, proceeds, "UCN", now);
      awardXp(s, 8);
      checkAchievements(s);
      return s;
    }

    /* ================= auction ================= */

    case "PLACE_BID": {
      const a = s.auctions.find((x) => x.id === action.auctionId);
      if (!a || a.endsAt <= now) return fail(s, "انتهى هذا المزاد");
      if (a.sellerId === "player") return fail(s, "لا يمكنك المزايدة على مزادك الخاص");
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
      awardXp(s, 5);
      return s;
    }

    /* ================= trading ================= */

    case "OPEN_POSITION": {
      const price = symbolPrice(s, action.symbol);
      if (!price || action.qty <= 0) return s;
      const margin = price * action.qty;
      const fee = margin * TRADE_FEE * (1 - feeDiscount(s.player.level));
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
      awardXp(s, 10);
      checkAchievements(s);
      return s;
    }

    /* ================= fx ================= */

    case "CONVERT_FX": {
      if (action.from === action.to || action.amount <= 0) return s;
      if (s.balances[action.from] < action.amount)
        return fail(s, `رصيد ${action.from} غير كافٍ`);
      const spread = FX_SPREAD * (1 - fxSpreadDiscount(s.player.level));
      const rate = fxRate(s, action.from, action.to) * (1 - spread);
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
      awardXp(s, 5);
      return s;
    }

    /* ================= crypto ================= */

    case "BUY_CRYPTO": {
      const price = cryptoUcn(s, action.code);
      if (!price || action.spendUcn <= 0) return s;
      if (s.balances.UCN < action.spendUcn)
        return fail(s, "رصيد UCN غير كافٍ لشراء العملة الرقمية");
      const fee = action.spendUcn * TRADE_FEE * (1 - feeDiscount(s.player.level));
      const qty = (action.spendUcn - fee) / price;
      s.balances.UCN -= action.spendUcn;
      const h = s.cryptoHoldings[action.code];
      h.avgCost = h.qty + qty > 0 ? (h.avgCost * h.qty + action.spendUcn) / (h.qty + qty) : 0;
      h.qty += qty;
      addTx(s, "crypto-buy", `شراء ${action.code}`, -action.spendUcn, "UCN", now);
      awardXp(s, 8);
      checkAchievements(s);
      return s;
    }

    case "SELL_CRYPTO": {
      const h = s.cryptoHoldings[action.code];
      if (!h || h.qty < action.qty || action.qty <= 0)
        return fail(s, `لا تملك كمية كافية من ${action.code}`);
      const price = cryptoUcn(s, action.code);
      const proceeds =
        action.qty * price * (1 - TRADE_FEE * (1 - feeDiscount(s.player.level)));
      h.qty -= action.qty;
      if (h.qty <= 1e-9) {
        h.qty = 0;
        h.avgCost = 0;
      }
      s.balances.UCN += proceeds;
      addTx(s, "crypto-sell", `بيع ${action.code}`, proceeds, "UCN", now);
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
      awardXp(s, 15);
      return s;
    }

    /* ================= bank ================= */

    case "TAKE_LOAN": {
      const product = LOAN_PRODUCTS.find((p) => p.id === action.productId);
      if (!product || action.amount <= 0) return s;
      const cap = Math.round(product.maxAmount * loanCapMult(s.player.level));
      if (action.amount > cap)
        return fail(s, `الحد الأقصى لهذا القرض ${fmtInt(cap)} UCN`);
      if (s.player.creditScore < product.minCredit)
        return fail(s, `هذا القرض يتطلب تقييمًا ائتمانيًا ${product.minCredit}+`);
      const slots = maxLoans(s.player.level);
      if (s.loans.filter((l) => l.status === "active").length >= slots)
        return fail(s, `لا يمكن امتلاك أكثر من ${slots} قروض نشطة`);
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
      const coSlots = maxCompanies(s.player.level);
      if (s.companies.length >= coSlots)
        return fail(s, `الحد الأقصى ${coSlots} شركات في مستواك الحالي`);
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
      // clan roster: player = مالك, founding partner = مؤسس
      const members = [
        mkMember({
          name: s.player.name,
          avatarId: s.player.avatarId,
          rank: "owner",
          isPlayer: true,
          joinedAt: now,
          contribution: action.capital,
        }),
      ];
      if (action.partnerBotId && partnerPct) {
        const bot = botById(action.partnerBotId);
        members.push(
          mkMember({
            name: bot.name,
            avatarId: bot.avatarId,
            rank: "founder",
            botId: bot.id,
            joinedAt: now,
            contribution: partnerInvest,
          })
        );
      }
      const companyId = uid("co");
      s.companies.unshift({
        id: companyId,
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
        level: 1,
        treasury: Math.round(totalCapital * 0.15),
        fame: Math.round(valuation / 10_000),
        members,
        contracts: [],
        verification: "none",
        autoDistribute: false,
        payoutPct: 50,
      });
      if (!s.settings.activeCompanyId) s.settings.activeCompanyId = companyId;
      addTx(s, "company", `تأسيس شركة ${name}`, -action.capital, "UCN", now);
      addNotif(s, "شركة جديدة 🚀", `${name} انطلقت بتقييم ${fmtInt(valuation)} UCN`, "gold", now);
      addFeedPost(s, "player", "milestone", `أسس ${s.player.name} شركة ${name} في قطاع ${SECTORS.find((x) => x.id === action.sectorId)?.name ?? ""} 🚀`, now);
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
      if (!co.members.some((m) => m.rank === "shareholder" && m.name === "مستثمرون خارجيون")) {
        co.members.push(
          mkMember({ name: "مستثمرون خارجيون", avatarId: 11, rank: "shareholder", joinedAt: now, contribution: proceeds })
        );
      }
      co.events.unshift({ t: now, kind: "shares", text: `بيع حصة ${pct}% مقابل ${fmtInt(proceeds)} UCN` });
      addTx(s, "shares-sale", `بيع ${pct}% من ${co.name}`, proceeds, "UCN", now);
      if (co.ownershipPct < 1) {
        s.companies = s.companies.filter((c) => c.id !== co.id);
        if (s.settings.activeCompanyId === co.id)
          s.settings.activeCompanyId = s.companies[0]?.id ?? null;
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

    /* ================= tutorial ================= */

    case "TUTORIAL_START": {
      if (s.tutorial.status === "done" || s.tutorial.status === "skipped")
        s.tutorial.step = 0;
      s.tutorial.status = "active";
      return s;
    }

    case "TUTORIAL_NEXT": {
      if (s.tutorial.status !== "active") return s;
      const idx = s.tutorial.step;
      const step = TUTORIAL_STEPS[idx];
      if (step && idx > s.tutorial.rewarded) {
        awardXp(s, step.xp);
        s.tutorial.rewarded = idx;
      }
      if (idx + 1 >= TUTORIAL_STEPS.length) {
        s.tutorial.status = "done";
        s.tutorial.step = TUTORIAL_STEPS.length - 1;
        addNotif(s, "أكملت الجولة التعليمية 🎓", "أصبحت جاهزًا لعالم المال — بالتوفيق!", "gold", now);
      } else {
        s.tutorial.step = idx + 1;
      }
      return s;
    }

    case "TUTORIAL_PREV": {
      s.tutorial.step = Math.max(0, s.tutorial.step - 1);
      return s;
    }

    case "TUTORIAL_SKIP": {
      s.tutorial.status = "skipped";
      return s;
    }

    /* ================= explore feed ================= */

    case "ADD_POST": {
      const text = action.text.trim().slice(0, POST_MAX_LEN);
      if (!text) return s;
      addFeedPost(s, "player", "user", text, now);
      if (s.dailyPostCount < DAILY_POST_XP_LIMIT) {
        s.dailyPostCount += 1;
        awardXp(s, 3);
      }
      return s;
    }

    case "LIKE_POST": {
      const post = s.feed.find((p) => p.id === action.postId);
      if (!post) return s;
      if (post.likedByPlayer) {
        post.likedByPlayer = false;
        post.likes = Math.max(0, post.likes - 1);
      } else {
        post.likedByPlayer = true;
        post.likes += 1;
      }
      return s;
    }

    /* ================= إحسان ================= */

    case "DONATE_IHSAN": {
      const c = s.ihsanCases.find((x) => x.id === action.caseId);
      if (!c || c.status !== "open" || c.subjectId === "player") return s;
      if (!canDonate(s.player.level))
        return fail(s, `التبرع يتطلب المستوى ${IHSAN_DONOR_MIN_LEVEL} فأعلى`);
      const amount = Math.min(Math.round(action.amount), c.debt - c.donated);
      if (amount <= 0) return s;
      if (s.balances.UCN < amount) return fail(s, "رصيد UCN غير كافٍ للتبرع");
      s.balances.UCN -= amount;
      c.donated += amount;
      c.donations.unshift({ donorId: "player", amount, t: now });
      const subjectName = botById(c.subjectId).name;
      addTx(s, "donation-out", `تبرع لـ ${subjectName}`, -amount, "UCN", now);
      addNotif(s, "جزاك الله خيرًا 🤲", `تبرعت بـ ${fmtInt(amount)} UCN لإنقاذ ${subjectName}`, "gold", now);
      addFeedPost(s, c.subjectId, "ihsan", `شكرًا من القلب لـ ${s.player.name} على تبرعه الكريم 🤲 — المعروف لا يُنسى`, now);
      awardXp(s, 25);
      return s;
    }

    case "RESCUE_IHSAN": {
      const c = s.ihsanCases.find((x) => x.id === action.caseId);
      if (!c || c.status !== "open" || c.subjectId === "player") return s;
      if (!canRescue(s.player.level))
        return fail(s, `الفزعة الكاملة تتطلب المستوى ${IHSAN_RESCUER_MIN_LEVEL} فأعلى`);
      const remaining = c.debt - c.donated;
      if (remaining <= 0) return s;
      if (s.balances.UCN < remaining) return fail(s, `الفزعة تحتاج ${fmtInt(remaining)} UCN`);
      s.balances.UCN -= remaining;
      c.donated = c.debt;
      c.donations.unshift({ donorId: "player", amount: remaining, t: now });
      c.status = "rescued";
      c.rescuedBy = s.player.name;
      const subject = s.bots[c.subjectId];
      if (subject) {
        subject.bankrupt = false;
        subject.netWorth += Math.round(c.debt * 0.5);
      }
      const subjectName = botById(c.subjectId).name;
      addTx(s, "donation-out", `فزعة لإنقاذ ${subjectName}`, -remaining, "UCN", now);
      addToast(s, `🦅 فزعتك أنقذت ${subjectName} من الإفلاس!`, "gold");
      addNotif(s, "فزعة الكبار 🦅", `سددت ${fmtInt(remaining)} UCN وأنقذت ${subjectName} — وسام لا يُشترى`, "gold", now);
      addFeedPost(s, c.subjectId, "ihsan", `🦅 ${s.player.name} فزع لي وسدد ديني كاملًا — رجال المواقف قليل، شكرًا!`, now);
      awardXp(s, 150);
      return s;
    }

    case "PAY_DEBT": {
      const l = s.loans.find((x) => x.id === action.loanId);
      if (!l || l.status !== "active") return s;
      if (s.balances.UCN < l.installment)
        return fail(s, `سداد القسط يحتاج ${fmtInt(l.installment)} UCN`);
      s.balances.UCN -= l.installment;
      l.paidInstallments += 1;
      l.missed = Math.max(0, l.missed - 1);
      s.player.creditScore = Math.min(990, s.player.creditScore + 6);
      addTx(s, "debt-payment", `سداد مبكر — ${l.productName}`, -l.installment, "UCN", now);
      if (l.paidInstallments >= l.installments) {
        l.status = "paid";
        addNotif(s, "تم سداد القرض بالكامل ✅", `${l.productName} — سجل ائتماني ممتاز`, "success", now);
      }
      awardXp(s, 10);
      return s;
    }

    /* ================= navigation ================= */

    case "SET_NAV_ORDER": {
      s.settings.navOrder = sanitizeNavOrder(action.order);
      return s;
    }

    /* ================= friends + chat ================= */

    case "ADD_FRIEND": {
      if (s.friends.includes(action.botId)) return s;
      const bot = botById(action.botId);
      s.friends.push(action.botId);
      const thread = ensureThread(s, action.botId);
      thread.pendingReplyAt = now + 2000 + Math.random() * 5000;
      addNotif(s, `أصبحت صديقًا لـ ${bot.name} 🤝`, "يمكنكما الآن التراسل وعقد الصفقات والشراكات", "success", now);
      awardXp(s, 5);
      return s;
    }

    case "REMOVE_FRIEND": {
      s.friends = s.friends.filter((id) => id !== action.botId);
      return s;
    }

    case "SEND_CHAT": {
      if (!s.friends.includes(action.botId)) return s;
      const text = action.text.trim().slice(0, POST_MAX_LEN);
      if (!text) return s;
      pushChat(s, action.botId, "player", text, now);
      const thread = ensureThread(s, action.botId);
      thread.pendingReplyAt = now + 3000 + Math.random() * 7000;
      return s;
    }

    case "MARK_CHAT_READ": {
      const thread = s.chats[action.botId];
      if (thread) thread.unread = 0;
      return s;
    }

    /* ================= direct sales ================= */

    case "OFFER_SALE": {
      if (!s.friends.includes(action.botId)) return fail(s, "أضفه صديقًا أولًا لعرض البيع عليه");
      if (s.saleOffers.filter((o) => o.status === "pending").length >= 5)
        return fail(s, "لديك 5 عروض معلقة — انتظر ردودها أولًا");
      const inv = s.inventory.find((i) => i.defId === action.itemDefId);
      const qty = Math.floor(action.qty);
      if (!inv || qty < 1 || inv.qty < qty) return fail(s, "لا تملك هذه الكمية");
      if (action.price < 1) return fail(s, "حدد سعرًا صالحًا");
      // escrow the items until the bot decides
      const avgCost = inv.avgCost;
      inv.qty -= qty;
      if (inv.auctionQty) inv.auctionQty = Math.min(inv.auctionQty, inv.qty);
      if (inv.qty === 0) s.inventory = s.inventory.filter((i) => i.defId !== action.itemDefId);
      s.saleOffers.unshift({
        id: uid("offer"),
        toBotId: action.botId,
        itemDefId: action.itemDefId,
        qty,
        price: Math.round(action.price),
        status: "pending",
        decideAt: now + 5000 + Math.random() * 15000,
        t: now,
        avgCost,
      });
      if (s.saleOffers.length > OFFERS_CAP) s.saleOffers.length = OFFERS_CAP;
      return s;
    }

    case "ACCEPT_COUNTER": {
      const offer = s.saleOffers.find((o) => o.id === action.offerId);
      if (!offer || offer.status !== "countered" || !offer.counterPrice) return s;
      offer.status = "accepted";
      s.balances.UCN += offer.counterPrice;
      const def = marketItemDef(offer.itemDefId);
      const bot = botById(offer.toBotId);
      addTx(s, "direct-sale", `بيع مباشر لـ ${bot.name} — ${def?.name ?? "عنصر"}`, offer.counterPrice, "UCN", now);
      addNotif(s, "تمت الصفقة المباشرة ✅", `${bot.name} اشترى ${def?.name ?? "العنصر"} بـ ${fmtInt(offer.counterPrice)} UCN بعد المساومة`, "success", now);
      addFeedPost(s, offer.toBotId, "trade", `أتممت صفقة مباشرة مع ${s.player.name}: ${def?.name ?? "عنصر"} مقابل ${fmtInt(offer.counterPrice)} UCN 🤝`, now);
      awardXp(s, 15);
      return s;
    }

    case "CANCEL_OFFER": {
      const offer = s.saleOffers.find((o) => o.id === action.offerId);
      if (!offer || (offer.status !== "pending" && offer.status !== "countered")) return s;
      returnOfferItems(s, offer.itemDefId, offer.qty, offer.avgCost);
      s.saleOffers = s.saleOffers.filter((o) => o.id !== action.offerId);
      return s;
    }

    /* ================= partnerships ================= */

    case "INVITE_PARTNER": {
      if (!s.friends.includes(action.botId)) return fail(s, "أضفه صديقًا أولًا لدعوته للشراكة");
      const co = s.companies.find((c) => c.id === action.companyId);
      if (!co) return s;
      const bot = botById(action.botId);
      if (co.partners.some((p) => p.name === bot.name))
        return fail(s, `${bot.name} شريك في ${co.name} بالفعل`);
      if (
        s.partnerships.some(
          (p) => p.companyId === co.id && p.botId === action.botId && p.status === "pending"
        )
      )
        return fail(s, "دعوة الشراكة قيد الدراسة بالفعل");
      const capital = Math.round(co.valuation * (0.2 + Math.random() * 0.15));
      s.partnerships.unshift({
        id: uid("ptn"),
        companyId: co.id,
        botId: action.botId,
        botPct: 0,
        capital,
        status: "pending",
        decideAt: now + 8000 + Math.random() * 15000,
        t: now,
      });
      addNotif(s, `دعوة شراكة أُرسلت 📨`, `${bot.name} يدرس ضخ ${fmtInt(capital)} UCN في ${co.name} — سيرد خلال لحظات`, "info", now);
      return s;
    }

    /* ================= auction re-listing ================= */

    case "RELIST_AUCTION": {
      const inv = s.inventory.find((i) => i.defId === action.itemDefId);
      const def = marketItemDef(action.itemDefId);
      if (!inv || !def) return s;
      if (!inv.auctionQty || inv.auctionQty < 1)
        return fail(s, "إعادة العرض متاحة فقط لمقتنيات المزاد");
      if (s.auctions.filter((a) => a.sellerId === "player").length >= 2)
        return fail(s, "يمكنك عرض مزادين خاصين كحد أقصى في آن واحد");
      const startBid = Math.max(100, Math.round(action.startBid));
      inv.qty -= 1;
      inv.auctionQty -= 1;
      if (inv.qty === 0) s.inventory = s.inventory.filter((i) => i.defId !== action.itemDefId);
      s.auctions.push(spawnPlayerAuction(now, action.itemDefId, startBid));
      addNotif(s, "مزادك انطلق 🔨", `${def.name} معروض الآن بسعر افتتاح ${fmtInt(startBid)} UCN — عمولة المنصة 5% عند البيع`, "info", now);
      awardXp(s, 10);
      return s;
    }

    /* ================= company upgrade ================= */

    case "UPGRADE_COMPANY": {
      const co = s.companies.find((c) => c.id === action.companyId);
      if (!co) return s;
      if (co.level >= MAX_COMPANY_LEVEL) return fail(s, "شركتك إمبراطورية بالفعل — القمة!");
      const next = companyLevel(co.level + 1);
      const cost = Math.round(co.valuation * next.costPct);
      if (s.balances.UCN < cost) return fail(s, `الترقية تحتاج ${fmtInt(cost)} UCN`);
      s.balances.UCN -= cost;
      co.level += 1;
      co.valuation = Math.round((co.valuation + cost) * 1.05);
      co.fame += 100 * co.level;
      pushCompanyEvent(co, "upgrade", `ترقية الشركة إلى «${next.name}» — ${next.perks[0]}`, now);
      addTx(s, "upgrade", `ترقية ${co.name} إلى «${next.name}»`, -cost, "UCN", now);
      addNotif(s, `شركة ${next.name} 🏆`, `${co.name} ارتقت — ${next.perks.join(" · ")}`, "gold", now);
      if (co.level >= 4)
        addFeedPost(s, "player", "milestone", `شركة ${co.name} تصبح «${next.name}» 🏛️ — ${s.player.name} يبني إمبراطوريته`, now);
      awardXp(s, 40 + co.level * 10);
      return s;
    }

    /* ================= company context (وضع الشركة) ================= */

    case "SET_ACTIVE_COMPANY": {
      if (s.companies.some((c) => c.id === action.companyId))
        s.settings.activeCompanyId = action.companyId;
      return s;
    }

    case "HIRE_EMPLOYEE": {
      const co = s.companies.find((c) => c.id === action.companyId);
      if (!co) return s;
      const bot = botById(action.botId);
      const liveBot = s.bots[action.botId];
      if (co.members.some((m) => m.botId === action.botId))
        return fail(s, `${bot.name} عضو في ${co.name} بالفعل`);
      const lv = companyLevel(co.level);
      if (companyEmployees(co).length >= lv.employees)
        return fail(s, `حد المنسوبين في مستوى «${lv.name}» هو ${lv.employees} — رقِّ الشركة`);
      const friendDiscount = s.friends.includes(action.botId) ? 0.9 : 1;
      const salary = Math.max(
        500,
        Math.round(co.valuation * (0.005 + ((liveBot?.level ?? 10) / 100) * 0.01) * friendDiscount)
      );
      co.members.push(
        mkMember({
          name: bot.name,
          avatarId: bot.avatarId,
          rank: "employee",
          botId: action.botId,
          joinedAt: now,
          salary,
        })
      );
      co.fame += 10;
      pushCompanyEvent(co, "hire", `انضم ${bot.name} منسوبًا براتب ${fmtInt(salary)} UCN/دورة`, now);
      addNotif(s, `موظف جديد في ${co.name} 💼`, `${bot.name} انضم براتب ${fmtInt(salary)} UCN كل دورة — يرفع الإيراد ويخفض مخاطر العقود`, "success", now);
      if (Math.random() < 0.6)
        addFeedPost(s, action.botId, "user", `يسعدني الانضمام لفريق ${co.name} 💼 — مشاريع كبيرة قادمة`, now);
      awardXp(s, 15);
      return s;
    }

    case "FIRE_EMPLOYEE": {
      const co = s.companies.find((c) => c.id === action.companyId);
      if (!co) return s;
      const idx = co.members.findIndex((m) => m.id === action.memberId && m.rank === "employee");
      if (idx === -1) return s;
      const [m] = co.members.splice(idx, 1);
      co.fame = Math.max(0, co.fame - 10);
      pushCompanyEvent(co, "fire", `أُنهيت خدمات ${m.name}`, now);
      if (m.botId && Math.random() < 0.5)
        addFeedPost(s, m.botId, "user", `انتهت رحلتي مع ${co.name}… كل تجربة تعلمك شيئًا 🤷`, now);
      return s;
    }

    case "ACCEPT_CONTRACT": {
      const co = s.companies.find((c) => c.id === action.companyId);
      if (!co) return s;
      const k = co.contracts.find((x) => x.id === action.contractId);
      if (!k || k.status !== "offer" || k.expiresAt <= now)
        return fail(s, "انتهى هذا العرض — انتظر عروضًا جديدة");
      const lv = companyLevel(co.level);
      const active = co.contracts.filter((x) => x.status === "active").length;
      if (active >= lv.contracts)
        return fail(s, `حد العقود النشطة في «${lv.name}» هو ${lv.contracts} — رقِّ الشركة`);
      const cost = Math.round(k.cost * (1 - lv.contractDiscount));
      if (co.treasury < cost)
        return fail(s, `خزينة الشركة لا تكفي (${fmtInt(cost)} UCN) — أودع فيها من رصيدك`);
      co.treasury -= cost;
      k.cost = cost;
      k.status = "active";
      k.startedAt = now;
      k.endsAt = now + k.duration;
      pushCompanyEvent(co, "contract", `بدء تنفيذ «${k.title}» بتكلفة ${fmtInt(cost)} UCN`, now);
      awardXp(s, 10);
      return s;
    }

    case "DEPOSIT_TREASURY": {
      const co = s.companies.find((c) => c.id === action.companyId);
      if (!co) return s;
      const amount = Math.round(action.amount);
      if (amount <= 0) return s;
      if (s.balances.UCN < amount) return fail(s, "رصيدك الشخصي غير كافٍ للإيداع");
      s.balances.UCN -= amount;
      co.treasury += amount;
      const me = co.members.find((m) => m.isPlayer);
      if (me) me.contribution += amount;
      addTx(s, "treasury", `إيداع في خزينة ${co.name}`, -amount, "UCN", now);
      pushCompanyEvent(co, "deposit", `أودع ${s.player.name} مبلغ ${fmtInt(amount)} UCN في الخزينة`, now);
      return s;
    }

    case "DISTRIBUTE_PROFITS": {
      const co = s.companies.find((c) => c.id === action.companyId);
      if (!co) return s;
      // keep a two-cycle salary reserve so the team doesn't walk out
      const reserve = companyEmployees(co).reduce((sum, m) => sum + (m.salary ?? 0), 0) * 2;
      const distributable = Math.max(0, co.treasury - reserve);
      if (distributable < 1)
        return fail(s, reserve > 0 ? "الخزينة بالكاد تغطي احتياطي الرواتب" : "الخزينة فارغة");
      const before = co.treasury;
      co.treasury = distributable; // distribute from the distributable pool only
      const playerShare = distributeTreasury(s, co, 100, now, { manual: true });
      co.treasury += before - distributable; // restore the salary reserve
      addNotif(
        s,
        `وزعت أرباح ${co.name} 💰`,
        `نصيبك ${fmtInt(playerShare)} UCN أُودع في رصيدك${reserve > 0 ? ` — واحتُفظ باحتياطي رواتب ${fmtInt(reserve)} UCN` : ""}`,
        "gold",
        now
      );
      awardXp(s, 20);
      return s;
    }

    case "SET_AUTO_DISTRIBUTE": {
      const co = s.companies.find((c) => c.id === action.companyId);
      if (!co) return s;
      const lv = companyLevel(co.level);
      if (action.enabled && !lv.autoDistribute)
        return fail(s, "التوزيع التلقائي يُفتح بترقية الشركة إلى «نامية»");
      co.autoDistribute = action.enabled;
      if (action.payoutPct !== undefined) {
        if (!lv.setPayout) return fail(s, "تحديد النسبة بنفسك يُفتح في مستوى «رائدة»");
        co.payoutPct = Math.min(100, Math.max(10, Math.round(action.payoutPct)));
      }
      return s;
    }

    case "REQUEST_VERIFICATION": {
      const co = s.companies.find((c) => c.id === action.companyId);
      if (!co) return s;
      if (co.verification === "verified") return s;
      if (co.verification === "pending") return fail(s, "طلبك قيد مراجعة الإدارة العليا بالفعل");
      co.verification = "pending";
      co.verificationAt = now;
      addNotif(s, "طلب التوثيق قُدّم 🏛️", `الإدارة العليا تراجع ملف ${co.name} — القرار خلال دقائق`, "info", now);
      pushCompanyEvent(co, "verify", "قُدّم طلب التوثيق للإدارة العليا", now);
      return s;
    }

    /* ================= community feedback ================= */

    case "SUBMIT_FEEDBACK": {
      const stars = Math.min(5, Math.max(1, Math.round(action.stars)));
      const fresh = !s.feedback[UPDATE_VERSION];
      s.feedback[UPDATE_VERSION] = { stars, text: action.text.trim().slice(0, 500), t: now };
      if (fresh) {
        addNotif(s, "شكرًا لتقييمك 💛", "صوت المجتمع هو ما يطوّر UCNCU — رأيك وصل", "gold", now);
        awardXp(s, 20);
      }
      return s;
    }

    default:
      return s;
  }
}
