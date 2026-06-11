"use client";

import { useState } from "react";
import { CandleChart } from "@/components/ui/CandleChart";
import { Card, SectionTitle } from "@/components/ui/Card";
import { AmountInput } from "@/components/ui/AmountInput";
import { LevelGate } from "@/components/ui/LevelGate";
import { LineChart } from "@/components/ui/LineChart";
import { PageTitle } from "@/components/ui/PageTitle";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { pk, TRADE_FEE } from "@/lib/constants";
import { fmtClock, fmtDec, fmtInt, fmtPct, fmtPrice, fmtSigned } from "@/lib/format";
import { TRADE_SYMBOLS } from "@/lib/seed";
import { symbolPrice, tradeSymbolDef, unrealizedPnl } from "@/lib/selectors";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";

const KIND_LABELS: Record<string, string> = {
  stock: "أسهم",
  index: "مؤشرات",
  commodity: "سلع",
};

export default function TradingPage() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [symbol, setSymbol] = useState(TRADE_SYMBOLS[0].id);
  const [chartMode, setChartMode] = useState<"candle" | "line">("candle");
  const [side, setSide] = useState<"long" | "short">("long");
  const [qtyStr, setQtyStr] = useState("");

  const entry = game.prices[pk.st(symbol)];
  const def = tradeSymbolDef(symbol)!;
  const qty = parseFloat(qtyStr) || 0;
  const cost = entry.price * qty * (1 + TRADE_FEE);
  const maxQty = Math.floor((game.balances.UCN / (entry.price * (1 + TRADE_FEE))) * 100) / 100;
  const canOpen = qty > 0 && cost <= game.balances.UCN;

  const realized = game.closedTrades.reduce((s, t) => s + t.pnl, 0);

  return (
    <LevelGate feature="trading">
      <PageTitle
        icon="chart"
        title="التداول"
        sub="تداول الأسهم والمؤشرات والسلع — توقيت، مخاطرة، وإدارة صفقة"
      />

      {/* symbol chips */}
      <div className="space-y-2">
        {(["stock", "index", "commodity"] as const).map((kind) => (
          <div key={kind} className="flex items-center gap-2 overflow-x-auto">
            <span className="w-14 shrink-0 text-[10px] font-bold text-muted">
              {KIND_LABELS[kind]}
            </span>
            {TRADE_SYMBOLS.filter((s) => s.kind === kind).map((s) => {
              const e = game.prices[pk.st(s.id)];
              const active = s.id === symbol;
              return (
                <button
                  key={s.id}
                  onClick={() => setSymbol(s.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-edge bg-card text-muted hover:text-ink"
                  }`}
                >
                  {s.name}
                  <span className={e.changePct >= 0 ? "text-up" : "text-down"} dir="ltr">
                    {fmtPct(e.changePct)}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* chart */}
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-ink">{def.name}</span>
                <span
                  className={`text-sm font-bold ${entry.changePct >= 0 ? "text-up" : "text-down"}`}
                  dir="ltr"
                >
                  {fmtPct(entry.changePct)}
                </span>
              </div>
              <div className="text-2xl font-extrabold text-gold-grad" dir="ltr">
                {fmtPrice(entry.price)} <span className="text-xs">UCN</span>
              </div>
            </div>
            <TabSwitcher
              size="sm"
              tabs={[
                { id: "candle" as const, label: "شموع" },
                { id: "line" as const, label: "خطي" },
              ]}
              active={chartMode}
              onChange={setChartMode}
            />
          </div>
          <div data-tour="trade-chart">
            {chartMode === "candle" ? (
              <CandleChart candles={entry.candles} height={260} />
            ) : (
              <LineChart data={entry.spark} height={260} color="var(--color-teal)" />
            )}
          </div>
        </Card>

        {/* order panel */}
        <Card glow="teal" className="p-4">
          <SectionTitle icon="bolt" title="أوامر التداول" sub="افتح صفقة على السعر الحي" />
          <div data-tour="trade-side">
            <TabSwitcher
              tabs={[
                { id: "long" as const, label: "شراء (صعود)" },
                { id: "short" as const, label: "بيع (هبوط)" },
              ]}
              active={side}
              onChange={setSide}
              accent="updown"
            />
          </div>
          <div className="mt-3 mb-1.5 text-[11px] font-semibold text-muted">الكمية (وحدات)</div>
          <AmountInput value={qtyStr} onChange={setQtyStr} max={maxQty} suffix="وحدة" />
          <div className="mt-3 space-y-1.5 rounded-xl border border-edge bg-card2 p-3 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted">سعر الدخول</span>
              <b className="text-ink" dir="ltr">{fmtPrice(entry.price)}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">رسوم التنفيذ ({fmtPct(TRADE_FEE * 100, false)})</span>
              <b className="text-ink">{fmtDec(entry.price * qty * TRADE_FEE)} UCN</b>
            </div>
            <div className="flex justify-between border-t border-edge pt-1.5">
              <span className="text-muted">الهامش المطلوب</span>
              <b className="text-gold">{fmtInt(cost)} UCN</b>
            </div>
          </div>
          <button
            disabled={!canOpen}
            onClick={() => {
              dispatch({ type: "OPEN_POSITION", symbol, side, qty });
              setQtyStr("");
            }}
            className={`${side === "long" ? "btn-teal" : "btn-gold"} mt-3 w-full py-2.5 text-sm`}
          >
            {side === "long" ? `شراء ${def.name}` : `بيع ${def.name}`}
          </button>
        </Card>
      </div>

      {/* open positions */}
      <div className="mt-5">
        <SectionTitle
          icon="chart"
          title="الصفقات المفتوحة"
          sub="الربح والخسارة يتحدثان لحظيًا مع السوق"
        />
        {game.positions.length === 0 ? (
          <Card className="p-6 text-center text-xs text-muted">لا توجد صفقات مفتوحة حاليًا</Card>
        ) : (
          <Card className="overflow-x-auto p-1">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-edge text-[10px] text-muted">
                  <th className="p-2.5 text-start font-semibold">الرمز</th>
                  <th className="p-2.5 text-start font-semibold">الاتجاه</th>
                  <th className="p-2.5 text-start font-semibold">الكمية</th>
                  <th className="p-2.5 text-start font-semibold">الدخول</th>
                  <th className="p-2.5 text-start font-semibold">السعر الآن</th>
                  <th className="p-2.5 text-start font-semibold">الربح / الخسارة</th>
                  <th className="p-2.5 text-start font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {game.positions.map((p) => {
                  const pnl = unrealizedPnl(game, p);
                  const cur = symbolPrice(game, p.symbol);
                  return (
                    <tr key={p.id} className="border-b border-edge/50">
                      <td className="p-2.5 font-bold text-ink">{tradeSymbolDef(p.symbol)?.name}</td>
                      <td className={`p-2.5 font-bold ${p.side === "long" ? "text-up" : "text-down"}`}>
                        {p.side === "long" ? "شراء ↑" : "بيع ↓"}
                      </td>
                      <td className="p-2.5 text-ink" dir="ltr">{p.qty}</td>
                      <td className="p-2.5 text-muted" dir="ltr">{fmtPrice(p.entry)}</td>
                      <td className="p-2.5 text-ink" dir="ltr">{fmtPrice(cur)}</td>
                      <td className={`p-2.5 font-extrabold ${pnl >= 0 ? "text-up" : "text-down"}`} dir="ltr">
                        {fmtSigned(pnl, 2)} UCN
                      </td>
                      <td className="p-2.5">
                        <button
                          onClick={() => dispatch({ type: "CLOSE_POSITION", positionId: p.id })}
                          className="btn-ghost px-3 py-1 text-[11px]"
                        >
                          إغلاق
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* closed trades */}
      <div className="mt-5">
        <SectionTitle
          icon="check"
          title="سجل الصفقات"
          sub="الأرباح المحققة من التداول"
          action={
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-extrabold ${
                realized >= 0 ? "border-up/40 text-up" : "border-down/40 text-down"
              }`}
              dir="ltr"
            >
              {fmtSigned(realized)} UCN
            </span>
          }
        />
        {game.closedTrades.length === 0 ? (
          <Card className="p-6 text-center text-xs text-muted">لم تغلق أي صفقة بعد</Card>
        ) : (
          <Card className="divide-y divide-edge/50 p-1">
            {game.closedTrades.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2.5 text-xs">
                <div>
                  <span className="font-bold text-ink">{tradeSymbolDef(t.symbol)?.name}</span>
                  <span className={`ms-2 text-[10px] font-bold ${t.side === "long" ? "text-up" : "text-down"}`}>
                    {t.side === "long" ? "شراء" : "بيع"}
                  </span>
                  <div className="text-[10px] text-muted">
                    {fmtClock(t.closedAt)} — دخول {fmtPrice(t.entry)} / خروج {fmtPrice(t.exit)}
                  </div>
                </div>
                <b className={t.pnl >= 0 ? "text-up" : "text-down"} dir="ltr">
                  {fmtSigned(t.pnl, 2)} UCN
                </b>
              </div>
            ))}
          </Card>
        )}
      </div>
    </LevelGate>
  );
}
