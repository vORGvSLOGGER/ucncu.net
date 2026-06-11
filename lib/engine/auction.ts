import { fmtInt } from "../format";
import { botById, spawnAuction } from "../seed";
import { marketItemDef } from "../selectors";
import type { GameState } from "../types";
import { addNotif, addToast, addTx } from "./log";
import { awardXp, checkAchievements } from "./xp";

export function tickAuctions(s: GameState, now: number): void {
  for (let idx = 0; idx < s.auctions.length; idx++) {
    const a = s.auctions[idx];
    const item = marketItemDef(a.itemDefId);
    if (!item) continue;

    /* ----- settle finished auctions ----- */
    if (a.endsAt <= now) {
      const playerParticipated = a.bids.some((b) => b.isPlayer);
      if (a.leaderIsPlayer) {
        // money was escrowed at bid time — grant the item
        const inv = s.inventory.find((i) => i.defId === a.itemDefId);
        if (inv) {
          inv.avgCost = (inv.avgCost * inv.qty + a.currentBid) / (inv.qty + 1);
          inv.qty += 1;
        } else {
          s.inventory.push({ defId: a.itemDefId, qty: 1, avgCost: a.currentBid });
        }
        s.auctionResults.unshift({
          id: a.id,
          itemName: item.name,
          finalBid: a.currentBid,
          won: true,
          t: now,
        });
        addTx(s, "auction-win", `الفوز بمزاد ${item.name}`, -a.currentBid, "UCN", now);
        addToast(s, `🔨 مبروك! فزت بمزاد ${item.name}`, "gold");
        addNotif(
          s,
          `فزت بالمزاد 🔨`,
          `${item.name} أصبح ملكك مقابل ${fmtInt(a.currentBid)} UCN`,
          "gold",
          now
        );
        awardXp(s, 40);
      } else if (playerParticipated) {
        s.auctionResults.unshift({
          id: a.id,
          itemName: item.name,
          finalBid: a.currentBid,
          won: false,
          t: now,
        });
        addNotif(
          s,
          "انتهى المزاد",
          `${a.leader} فاز بمزاد ${item.name} بمبلغ ${fmtInt(a.currentBid)} UCN`,
          "info",
          now
        );
      }
      if (s.auctionResults.length > 20) s.auctionResults.length = 20;
      s.auctions[idx] = spawnAuction(now);
      continue;
    }

    /* ----- bot bidding ----- */
    const timeLeft = a.endsAt - now;
    if (timeLeft < 2000) continue;
    for (const bot of a.bots) {
      const factor = a.leaderIsPlayer ? 0.28 : 0.07;
      if (Math.random() > bot.aggressiveness * factor) continue;
      const next = Math.round(a.currentBid * (1.03 + Math.random() * 0.05));
      if (next > bot.maxBudget) continue;
      const name = botById(bot.botId).name;
      if (name === a.leader && !a.leaderIsPlayer) continue;
      if (a.leaderIsPlayer) {
        // refund the player's escrowed bid
        s.balances.UCN += a.currentBid;
        addTx(s, "auction-refund", `رد مزايدة ${item.name}`, a.currentBid, "UCN", now);
        addToast(s, `⚔️ ${name} زايد ضدك على ${item.name} — استُرد مبلغك`, "warning");
      }
      a.currentBid = next;
      a.leader = name;
      a.leaderIsPlayer = false;
      a.bids.unshift({ bidder: name, amount: next, t: now });
      if (a.bids.length > 30) a.bids.length = 30;
      break; // one bot bid per auction per tick
    }
  }
  checkAchievements(s);
}
