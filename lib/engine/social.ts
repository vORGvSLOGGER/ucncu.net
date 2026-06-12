import { CHAT_CAP } from "../constants";
import { fmtInt, uid } from "../format";
import { personaById, pick, type Persona } from "../ai/personas";
import { botById } from "../seed";
import { itemPrice, marketItemDef } from "../selectors";
import type { ChatThread, GameState } from "../types";
import { mkMember } from "./company";
import { addFeedPost, keyName } from "./feed";
import { addNotif } from "./log";
import { awardXp } from "./xp";

export function ensureThread(s: GameState, botId: string): ChatThread {
  if (!s.chats[botId]) s.chats[botId] = { messages: [], unread: 0 };
  return s.chats[botId];
}

export function pushChat(
  s: GameState,
  botId: string,
  from: "player" | "bot",
  text: string,
  t: number
): void {
  const thread = ensureThread(s, botId);
  thread.messages.push({ id: uid("msg"), from, text, t });
  if (thread.messages.length > CHAT_CAP) thread.messages.shift();
  if (from === "bot") thread.unread += 1;
}

/** persona-flavored reply, sometimes tied to a real market move */
function genReply(s: GameState, persona: Persona, thread: ChatThread): string {
  const botSpoke = thread.messages.some((m) => m.from === "bot");
  if (!botSpoke) return pick(persona.greetings);
  if (Math.random() < 0.4) {
    let bestKey = "";
    let bestChg = 0;
    for (const key of Object.keys(s.prices)) {
      if (!key.startsWith("st:") && !key.startsWith("cx:")) continue;
      const chg = s.prices[key].changePct;
      if (Math.abs(chg) > Math.abs(bestChg)) {
        bestChg = chg;
        bestKey = key;
      }
    }
    if (bestKey) {
      return pick(persona.marketReplies)
        .replace("{sym}", keyName(bestKey))
        .replace("{chg}", `${bestChg >= 0 ? "+" : "−"}${Math.abs(bestChg).toFixed(1)}%`);
    }
  }
  return pick(persona.replies);
}

/**
 * Social life loop: pending chat replies, sale-offer decisions,
 * partnership decisions, and the occasional spontaneous message.
 */
export function tickSocial(s: GameState, now: number, quiet = false): void {
  /* ---- chat replies coming due ---- */
  for (const botId of Object.keys(s.chats)) {
    const thread = s.chats[botId];
    if (!thread.pendingReplyAt || thread.pendingReplyAt > now) continue;
    thread.pendingReplyAt = undefined;
    const persona = personaById(botId);
    pushChat(s, botId, "bot", genReply(s, persona, thread), now);
    if (!quiet)
      addNotif(s, `رسالة من ${botById(botId).name} 💬`, undefined, "info", now);
  }

  /* ---- spontaneous messages from friends (rare) ---- */
  if (!quiet) {
    for (const botId of s.friends) {
      const thread = s.chats[botId];
      if (thread && (thread.pendingReplyAt || thread.unread >= 3)) continue;
      if (Math.random() < 0.0012) {
        const persona = personaById(botId);
        pushChat(s, botId, "bot", genReply(s, persona, ensureThread(s, botId)), now);
        addNotif(s, `رسالة من ${botById(botId).name} 💬`, undefined, "info", now);
      }
    }
  }

  /* ---- sale offers: bot decides (items are escrowed at offer time) ---- */
  for (const offer of s.saleOffers) {
    if (offer.status !== "pending" || offer.decideAt > now) continue;
    const persona = personaById(offer.toBotId);
    const def = marketItemDef(offer.itemDefId);
    const botName = botById(offer.toBotId).name;
    const fair = itemPrice(s, offer.itemDefId) * offer.qty;
    const ratio = fair > 0 ? offer.price / fair : 99;
    const rarityBonus = def?.rarity === "legendary" ? 0.15 : def?.rarity === "rare" ? 0.08 : 0;
    const acceptCap = 1.02 + persona.risk * 0.6 + rarityBonus;
    if (ratio <= acceptCap) {
      offer.status = "accepted";
      s.balances.UCN += offer.price;
      addNotif(
        s,
        `${botName} قبل عرضك ✅`,
        `${def?.name ?? "العنصر"} ×${offer.qty} مقابل ${fmtInt(offer.price)} UCN — أُودع المبلغ في رصيدك`,
        "success",
        now
      );
      addFeedPost(
        s,
        offer.toBotId,
        "trade",
        `أتممت صفقة مباشرة مع ${s.player.name}: ${def?.name ?? "عنصر"} مقابل ${fmtInt(offer.price)} UCN 🤝`,
        now
      );
      if (!quiet) awardXp(s, 15);
    } else if (ratio <= 1.6) {
      offer.status = "countered";
      offer.counterPrice = Math.max(1, Math.round(fair * (0.95 + Math.random() * 0.15)));
      addNotif(
        s,
        `${botName} يساومك 💬`,
        `يعرض ${fmtInt(offer.counterPrice)} UCN بدلًا من ${fmtInt(offer.price)} — اقبل أو ألغِ من صفحة الأصدقاء`,
        "info",
        now
      );
    } else {
      offer.status = "rejected";
      returnOfferItems(s, offer.itemDefId, offer.qty, offer.avgCost);
      addNotif(
        s,
        `${botName} رفض عرضك ❌`,
        `السعر بعيد عن القيمة العادلة (${fmtInt(fair)} UCN) — أُعيد العنصر لمخزونك`,
        "warning",
        now
      );
    }
  }

  /* ---- partnership invitations: bot decides ---- */
  for (const p of s.partnerships) {
    if (p.status !== "pending" || p.decideAt > now) continue;
    const persona = personaById(p.botId);
    const botName = botById(p.botId).name;
    const co = s.companies.find((c) => c.id === p.companyId);
    if (!co) {
      p.status = "declined";
      continue;
    }
    const acceptP = persona.strategy === "whale" || persona.strategy === "value" ? 0.75 : 0.5;
    if (Math.random() < acceptP) {
      p.status = "active";
      const K = p.capital;
      const oldVal = co.valuation;
      const dilute = oldVal / (oldVal + K);
      for (const partner of co.partners) partner.pct = partner.pct * dilute;
      co.ownershipPct = co.ownershipPct * dilute;
      p.botPct = Math.round((100 * K) / (oldVal + K) * 10) / 10;
      const bot = botById(p.botId);
      co.partners.push({
        name: bot.name,
        pct: p.botPct,
        isPlayer: false,
        avatarId: bot.avatarId,
        invested: K,
      });
      // clan roster: the new partner appears as a member with rank شريك
      co.members.push(
        mkMember({
          name: bot.name,
          avatarId: bot.avatarId,
          rank: "partner",
          botId: p.botId,
          joinedAt: now,
          contribution: K,
        })
      );
      // synergy bump: the partner's capital + network grows the whole pie
      co.valuation = Math.round((oldVal + K) * 1.08);
      co.events.unshift({
        t: now,
        kind: "partner",
        text: `انضم ${bot.name} شريكًا بحصة ${p.botPct}% ورأسمال ${fmtInt(K)} UCN`,
      });
      addNotif(
        s,
        `${botName} قبل الشراكة 🤝`,
        `ضخ ${fmtInt(K)} UCN في ${co.name} — التقييم ارتفع إلى ${fmtInt(co.valuation)} UCN`,
        "gold",
        now
      );
      addFeedPost(
        s,
        p.botId,
        "milestone",
        `يسعدني الإعلان عن شراكتي مع ${s.player.name} في شركة ${co.name} 🤝🚀`,
        now
      );
      if (!quiet) awardXp(s, 50);
    } else {
      p.status = "declined";
      addNotif(
        s,
        `${botName} اعتذر عن الشراكة`,
        `لم تقنعه أرقام ${co.name} حاليًا — جرّب بعد أن ينمو التقييم`,
        "info",
        now
      );
    }
  }

  // prune resolved offers/partnerships (keep recent few for the UI)
  if (s.saleOffers.length > 20)
    s.saleOffers = s.saleOffers.filter((o, i) => o.status === "pending" || o.status === "countered" || i < 20);
  if (s.partnerships.length > 20)
    s.partnerships = s.partnerships.filter((p, i) => p.status !== "declined" || i < 20);
}

/** put escrowed offer items back into inventory */
export function returnOfferItems(s: GameState, defId: string, qty: number, avgCost: number): void {
  const inv = s.inventory.find((i) => i.defId === defId);
  if (inv) {
    inv.avgCost = (inv.avgCost * inv.qty + avgCost * qty) / (inv.qty + qty);
    inv.qty += qty;
  } else {
    s.inventory.push({ defId, qty, avgCost });
  }
}
