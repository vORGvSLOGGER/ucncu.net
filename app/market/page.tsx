"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { LevelGate } from "@/components/ui/LevelGate";
import { Modal } from "@/components/ui/Modal";
import { PageTitle } from "@/components/ui/PageTitle";
import { Sparkline } from "@/components/ui/Sparkline";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { CATEGORY_LABELS, pk, RARITY_META } from "@/lib/constants";
import { fmtInt, fmtPct } from "@/lib/format";
import { MARKET_ITEMS } from "@/lib/seed";
import { itemPrice, marketItemDef } from "@/lib/selectors";
import { marketSignal } from "@/lib/strategy";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";
import type { MarketCategory } from "@/lib/types";

const SIGNAL_CLASS = {
  up: "border-up/40 bg-up/10 text-up",
  down: "border-down/40 bg-down/10 text-down",
  gold: "border-gold/40 bg-gold/10 text-gold",
  teal: "border-teal/40 bg-teal/10 text-teal",
  muted: "border-edge bg-card text-muted",
} as const;

function TradeItemModal({
  defId,
  mode,
  onClose,
}: {
  defId: string;
  mode: "buy" | "sell";
  onClose: () => void;
}) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [qty, setQty] = useState(1);
  const def = marketItemDef(defId);
  if (!def) return null;
  const price = itemPrice(game, defId);
  const owned = game.inventory.find((i) => i.defId === defId)?.qty ?? 0;
  const maxQty = mode === "buy" ? Math.max(1, Math.floor(game.balances.UCN / price)) : owned;
  const total = price * qty;
  const canConfirm =
    qty >= 1 && (mode === "buy" ? total <= game.balances.UCN : qty <= owned);

  return (
    <Modal open onClose={onClose} title={mode === "buy" ? `شراء ${def.name}` : `بيع ${def.name}`}>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-edge bg-card2 p-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Icon name={def.icon} size={18} className="text-teal" />
          سعر الوحدة الحالي
        </div>
        <b className="text-ink">{fmtInt(price)} UCN</b>
      </div>
      <div className="mb-2 text-xs font-semibold text-muted">الكمية</div>
      <div className="flex items-center gap-2">
        <button className="btn-ghost h-10 w-10 text-lg" onClick={() => setQty(Math.max(1, qty - 1))}>
          −
        </button>
        <div className="flex-1 rounded-xl border border-edge bg-card2 py-2 text-center text-lg font-extrabold text-ink">
          {qty}
        </div>
        <button
          className="btn-ghost h-10 w-10 text-lg"
          onClick={() => setQty(Math.min(maxQty, qty + 1))}
        >
          +
        </button>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {[1, 5, 10, maxQty].map((q, i) => (
          <button key={i} className="btn-ghost py-1 text-[11px]" onClick={() => setQty(Math.max(1, q))}>
            {i === 3 ? "الأقصى" : `×${q}`}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-edge bg-card2 p-3 text-sm">
        <span className="text-muted">{mode === "buy" ? "الإجمالي المطلوب" : "ستحصل على"}</span>
        <b className={mode === "buy" ? "text-gold" : "text-up"}>{fmtInt(total)} UCN</b>
      </div>
      {mode === "sell" && (
        <div className="mt-1 px-1 text-[11px] text-muted">تملك حاليًا: {owned} وحدة</div>
      )}
      <button
        disabled={!canConfirm}
        onClick={() => {
          dispatch(
            mode === "buy"
              ? { type: "BUY_ITEM", defId, qty }
              : { type: "SELL_ITEM", defId, qty }
          );
          onClose();
        }}
        className={`${mode === "buy" ? "btn-gold" : "btn-teal"} mt-4 w-full py-2.5 text-sm`}
      >
        {mode === "buy" ? `تأكيد الشراء — ${fmtInt(total)} UCN` : `تأكيد البيع — ${fmtInt(total)} UCN`}
      </button>
    </Modal>
  );
}

export default function MarketPage() {
  const game = useGame();
  const [cat, setCat] = useState<MarketCategory>("goods");
  const [modal, setModal] = useState<{ defId: string; mode: "buy" | "sell" } | null>(null);

  const items = MARKET_ITEMS.filter((m) => m.category === cat);

  return (
    <LevelGate feature="market">
      <PageTitle
        icon="cart"
        title="السوق"
        sub="شراء وبيع السلع والموارد والأصول النادرة بأسعار حية"
      />

      <TabSwitcher
        tabs={(Object.keys(CATEGORY_LABELS) as MarketCategory[]).map((c) => ({
          id: c,
          label: CATEGORY_LABELS[c],
        }))}
        active={cat}
        onChange={setCat}
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" data-tour="market-list">
        {items.map((def) => {
          const entry = game.prices[pk.mk(def.id)];
          const rarity = RARITY_META[def.rarity];
          const owned = game.inventory.find((i) => i.defId === def.id)?.qty ?? 0;
          const signal = marketSignal(entry);
          return (
            <Card key={def.id} className="p-3.5">
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-edge bg-card text-teal">
                  <Icon name={def.icon} size={20} />
                </span>
                <span
                  className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                  style={{ color: rarity.color, borderColor: `${rarity.color}66` }}
                >
                  {rarity.label}
                </span>
              </div>
              <div className="mt-2 text-sm font-bold text-ink">{def.name}</div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${SIGNAL_CLASS[signal.tone]}`}>
                  {signal.label}
                </span>
                <span className="text-[9px] text-muted" dir="ltr">
                  قوة {signal.strength}/100
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-ink">{fmtInt(entry.price)}</span>
                <span className="text-[10px] text-muted">UCN</span>
                <span
                  className={`ms-auto text-[11px] font-bold ${entry.changePct >= 0 ? "text-up" : "text-down"}`}
                >
                  {fmtPct(entry.changePct)}
                </span>
              </div>
              <div className="mt-1.5">
                <Sparkline data={entry.spark.slice(-30)} width={200} height={28} />
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setModal({ defId: def.id, mode: "buy" })}
                  className="btn-gold flex-1 py-1.5 text-xs"
                >
                  شراء
                </button>
                {owned > 0 && (
                  <button
                    onClick={() => setModal({ defId: def.id, mode: "sell" })}
                    className="btn-teal flex-1 py-1.5 text-xs"
                  >
                    بيع ({owned})
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* inventory */}
      <div className="mt-6">
        <SectionTitle
          icon="wallet"
          title="ممتلكاتي"
          sub="أصولك من السوق وقيمتها الحالية — بِع عندما يرتفع السعر"
        />
        {game.inventory.length === 0 ? (
          <Card className="p-6 text-center text-xs text-muted">
            لا تملك أي أصول بعد — ابدأ بشراء سلعة من السوق أعلاه 🛒
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {game.inventory.map((inv) => {
              const def = marketItemDef(inv.defId);
              if (!def) return null;
              const price = itemPrice(game, inv.defId);
              const value = price * inv.qty;
              const cost = inv.avgCost * inv.qty;
              const pnlPct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
              return (
                <Card key={inv.defId} className="flex items-center gap-3 p-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-edge bg-card text-gold">
                    <Icon name={def.icon} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-ink">
                      {def.name} <span className="text-[11px] text-muted">×{inv.qty}</span>
                    </div>
                    <div className="text-[11px] text-muted">
                      متوسط التكلفة {fmtInt(inv.avgCost)} — القيمة الآن{" "}
                      <b className="text-ink">{fmtInt(value)} UCN</b>{" "}
                      <span className={pnlPct >= 0 ? "text-up" : "text-down"}>{fmtPct(pnlPct)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setModal({ defId: inv.defId, mode: "sell" })}
                    className="btn-teal shrink-0 px-3 py-1.5 text-xs"
                  >
                    بيع
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <TradeItemModal defId={modal.defId} mode={modal.mode} onClose={() => setModal(null)} />
      )}
    </LevelGate>
  );
}
