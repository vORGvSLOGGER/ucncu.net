"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { AmountInput } from "@/components/ui/AmountInput";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { PageTitle } from "@/components/ui/PageTitle";
import { AUCTION_TIERS, RARITY_META } from "@/lib/constants";
import { fmtInt, timeAgo } from "@/lib/format";
import { itemPrice, marketItemDef } from "@/lib/selectors";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";
import type { Auction } from "@/lib/types";

function TierBadge({ auction }: { auction: Auction }) {
  const tier = AUCTION_TIERS[auction.tier ?? "rare"];
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
      style={{ color: tier.color, borderColor: `${tier.color}66`, background: `${tier.color}14` }}
    >
      {tier.label} ✦
    </span>
  );
}

function RelistModal({ defId, onClose }: { defId: string; onClose: () => void }) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const def = marketItemDef(defId);
  const fair = itemPrice(game, defId);
  const [startStr, setStartStr] = useState(String(Math.round(fair * 0.6)));
  const start = Math.floor(parseFloat(startStr) || 0);

  return (
    <Modal open onClose={onClose} title={`إعادة عرض ${def?.name ?? ""} بالمزاد 🔨`}>
      <p className="text-[11px] leading-5 text-muted">
        حدد سعر الافتتاح — السعر المنخفض يجذب مزايدين أكثر. القيمة السوقية الحالية ≈{" "}
        <b className="text-teal">{fmtInt(fair)} UCN</b>. عمولة المنصة 5% من سعر البيع
        النهائي، وإن لم يزايد أحد يعود العنصر لمخزونك.
      </p>
      <div className="mt-3">
        <AmountInput value={startStr} onChange={setStartStr} suffix="UCN" showPctButtons={false} />
      </div>
      <button
        disabled={start < 100}
        onClick={() => {
          dispatch({ type: "RELIST_AUCTION", itemDefId: defId, startBid: start });
          onClose();
        }}
        className="btn-gold mt-4 w-full py-2.5 text-sm"
      >
        اعرضه للمزاد — افتتاح {fmtInt(start)} UCN
      </button>
    </Modal>
  );
}

function BidPanel({ auction }: { auction: Auction }) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [customStr, setCustomStr] = useState("");

  const bid = (amount: number) =>
    dispatch({ type: "PLACE_BID", auctionId: auction.id, amount: Math.ceil(amount) });
  const custom = parseFloat(customStr) || 0;
  const minBid = Math.ceil(auction.currentBid * 1.01);

  if (auction.leaderIsPlayer) {
    return (
      <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-center text-xs font-bold text-gold">
        👑 أنت المتصدر حاليًا — راقب المزاد حتى النهاية!
      </div>
    );
  }
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => bid(auction.currentBid * 1.05)} className="btn-gold py-2 text-xs">
          مزايدة +5% — {fmtInt(auction.currentBid * 1.05)}
        </button>
        <button onClick={() => bid(auction.currentBid * 1.1)} className="btn-gold py-2 text-xs">
          مزايدة +10% — {fmtInt(auction.currentBid * 1.1)}
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <div className="flex-1">
          <AmountInput
            value={customStr}
            onChange={setCustomStr}
            placeholder={`الحد الأدنى ${fmtInt(minBid)}`}
            suffix="UCN"
            showPctButtons={false}
          />
        </div>
        <button
          disabled={custom < minBid || custom > game.balances.UCN}
          onClick={() => {
            bid(custom);
            setCustomStr("");
          }}
          className="btn-teal shrink-0 self-start px-4 py-2.5 text-xs"
        >
          زايد
        </button>
      </div>
    </div>
  );
}

export default function AuctionPage() {
  const game = useGame();
  const [relistId, setRelistId] = useState<string | null>(null);
  const systemAuctions = game.auctions.filter((a) => a.sellerId !== "player");
  const myAuctions = game.auctions.filter((a) => a.sellerId === "player");
  const [featured, ...others] = systemAuctions;
  const featuredItem = featured ? marketItemDef(featured.itemDefId) : null;
  const relistable = game.inventory.filter((i) => (i.auctionQty ?? 0) >= 1);

  return (
    <div>
      <PageTitle
        icon="gavel"
        title="المزاد"
        sub="قطع نادرة وأسطورية وخارقة يطرحها الذكاء — وما تفوز به يمكنك إعادة عرضه للربح"
      />

      {/* my live listings */}
      {myAuctions.length > 0 && (
        <div className="mb-4">
          <SectionTitle icon="tag" title="مزاداتي المعروضة" sub="عمولة 5% عند البيع — وإن لم يزايد أحد يعود العنصر إليك" />
          <div className="grid gap-3 sm:grid-cols-2">
            {myAuctions.map((a) => {
              const item = marketItemDef(a.itemDefId);
              if (!item) return null;
              return (
                <Card key={a.id} glow="teal" className="p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-teal/40 bg-teal/10 text-teal">
                      <Icon name={item.icon} size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-ink">
                        {item.name}
                        <TierBadge auction={a} />
                      </div>
                      <div className="text-[10px] text-muted">
                        {a.bids.length === 0
                          ? "بانتظار أول مزايدة…"
                          : `${a.bids.length} مزايدة · المتصدر ${a.leader}`}
                      </div>
                    </div>
                    <CountdownTimer endsAt={a.endsAt} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted text-[10px]">المزايدة الحالية</span>
                    <b className="text-gold">{fmtInt(a.currentBid)} UCN</b>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" data-tour="auction-list">
        {/* featured auction */}
        {featured && featuredItem && (
          <Card glow="gold" className="p-4 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-gold/50 bg-gold/10 text-gold">
                  <Icon name={featuredItem.icon} size={28} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-ink">{featuredItem.name}</h2>
                    <TierBadge auction={featured} />
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        color: RARITY_META[featuredItem.rarity].color,
                        borderColor: `${RARITY_META[featuredItem.rarity].color}66`,
                      }}
                    >
                      {RARITY_META[featuredItem.rarity].label}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted">المزاد المميز — ينتهي خلال</div>
                </div>
              </div>
              <CountdownTimer endsAt={featured.endsAt} className="text-lg" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-edge bg-card2 p-3">
                <div className="text-[10px] text-muted">المزايدة الحالية</div>
                <div className="text-xl font-extrabold text-gold-grad">
                  {fmtInt(featured.currentBid)} <span className="text-xs">UCN</span>
                </div>
              </div>
              <div className="rounded-xl border border-edge bg-card2 p-3">
                <div className="text-[10px] text-muted">المتصدر</div>
                <div
                  className={`text-sm font-extrabold ${featured.leaderIsPlayer ? "text-gold" : "text-ink"}`}
                >
                  {featured.leaderIsPlayer ? "أنت 👑" : featured.leader}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <BidPanel auction={featured} />
            </div>

            {/* live bids feed */}
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-muted">
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-up" />
                سجل المزايدات الحي
              </div>
              <div className="max-h-44 space-y-1.5 overflow-y-auto">
                {featured.bids.map((b, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-[11px] ${
                      b.isPlayer ? "border-gold/40 bg-gold/8 text-gold" : "border-edge bg-card2"
                    }`}
                  >
                    <span className={b.isPlayer ? "font-bold" : "font-bold text-ink"}>
                      {b.isPlayer ? `${b.bidder} (أنت)` : b.bidder}
                    </span>
                    <span className="flex items-center gap-3">
                      <b>{fmtInt(b.amount)} UCN</b>
                      <span className="text-[10px] text-muted">{timeAgo(b.t)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* side column: other auctions + results */}
        <div className="space-y-4">
          <div>
            <SectionTitle icon="gavel" title="مزادات أخرى نشطة" />
            <div className="space-y-3">
              {others.map((a) => {
                const item = marketItemDef(a.itemDefId);
                if (!item) return null;
                return (
                  <Card key={a.id} className="p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-edge bg-card text-teal">
                        <Icon name={item.icon} size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                          {item.name}
                          <TierBadge auction={a} />
                        </div>
                        <div className="text-[10px] text-muted">
                          المتصدر: {a.leaderIsPlayer ? "أنت 👑" : a.leader}
                        </div>
                      </div>
                      <CountdownTimer endsAt={a.endsAt} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-gold">
                        {fmtInt(a.currentBid)} UCN
                      </span>
                      <BidQuick auction={a} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* relistable winnings */}
          {relistable.length > 0 && (
            <div>
              <SectionTitle
                icon="refresh"
                title="مقتنياتي من المزاد"
                sub="اعرضها في مزاد جديد واربح من الفارق"
              />
              <div className="space-y-2">
                {relistable.map((inv) => {
                  const def = marketItemDef(inv.defId);
                  if (!def) return null;
                  return (
                    <Card key={inv.defId} className="flex items-center gap-3 p-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gold/40 bg-gold/10 text-gold">
                        <Icon name={def.icon} size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-ink">
                          {def.name} <span className="text-muted">×{inv.auctionQty}</span>
                        </div>
                        <div className="text-[9px] text-muted">
                          القيمة الآن {fmtInt(itemPrice(game, inv.defId))} UCN
                        </div>
                      </div>
                      <button
                        onClick={() => setRelistId(inv.defId)}
                        className="btn-gold px-3 py-1.5 text-[10px]"
                      >
                        🔨 أعد عرضه
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <SectionTitle icon="trophy" title="نتائج مزاداتي" />
            {game.auctionResults.length === 0 ? (
              <Card className="p-5 text-center text-[11px] text-muted">
                لم تشارك في أي مزاد بعد — جرّب حظك في المزاد المميز!
              </Card>
            ) : (
              <Card className="divide-y divide-edge/50 p-1">
                {game.auctionResults.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-3 py-2 text-[11px]">
                    <span className="font-bold text-ink">{r.itemName}</span>
                    <span className="flex items-center gap-2">
                      <b className="text-muted">{fmtInt(r.finalBid)} UCN</b>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${
                          r.won ? "border-up/40 text-up" : "border-down/40 text-down"
                        }`}
                      >
                        {r.won ? "فوز 🏆" : "خسارة"}
                      </span>
                    </span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </div>
      </div>

      {relistId && <RelistModal defId={relistId} onClose={() => setRelistId(null)} />}
    </div>
  );
}

function BidQuick({ auction }: { auction: Auction }) {
  const dispatch = useGameDispatch();
  if (auction.leaderIsPlayer) {
    return <span className="text-[10px] font-bold text-gold">متصدر 👑</span>;
  }
  return (
    <button
      onClick={() =>
        dispatch({
          type: "PLACE_BID",
          auctionId: auction.id,
          amount: Math.ceil(auction.currentBid * 1.05),
        })
      }
      className="btn-gold px-3 py-1 text-[10px]"
    >
      مزايدة +5%
    </button>
  );
}
