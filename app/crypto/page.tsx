"use client";

import { useState } from "react";
import { CandleChart } from "@/components/ui/CandleChart";
import { Card, SectionTitle } from "@/components/ui/Card";
import { AmountInput } from "@/components/ui/AmountInput";
import { DonutChart } from "@/components/ui/DonutChart";
import { Gauge } from "@/components/ui/Gauge";
import { LevelGate } from "@/components/ui/LevelGate";
import { PageTitle } from "@/components/ui/PageTitle";
import { Sparkline } from "@/components/ui/Sparkline";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { CRYPTO_CODES, CRYPTO_META, pk } from "@/lib/constants";
import { fmtInt, fmtPct, fmtPrice } from "@/lib/format";
import { cryptoUcn, fearGreed } from "@/lib/selectors";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";
import type { CryptoCode } from "@/lib/types";

const TIMEFRAMES = [
  { id: "1h", label: "ساعة", candles: 12 },
  { id: "4h", label: "٤ ساعات", candles: 24 },
  { id: "1d", label: "يوم", candles: 48 },
] as const;

export default function CryptoPage() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [coin, setCoin] = useState<CryptoCode>("BTC");
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]["id"]>("1d");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amountStr, setAmountStr] = useState("");

  const entry = game.prices[pk.cx(coin)];
  const priceUcn = cryptoUcn(game, coin);
  const holding = game.cryptoHoldings[coin];
  const tfDef = TIMEFRAMES.find((t) => t.id === tf)!;

  const amount = parseFloat(amountStr) || 0;
  const expectedQty = side === "buy" && priceUcn > 0 ? amount / priceUcn : 0;
  const expectedUcn = side === "sell" ? amount * priceUcn : 0;
  const max = side === "buy" ? game.balances.UCN : holding.qty;
  const canSubmit = amount > 0 && amount <= max;

  const fg = fearGreed(game);
  const sorted = [...CRYPTO_CODES].sort(
    (a, b) => game.prices[pk.cx(b)].changePct - game.prices[pk.cx(a)].changePct
  );

  const donutSlices = CRYPTO_CODES.map((c) => ({
    label: c,
    value: game.cryptoHoldings[c].qty * cryptoUcn(game, c),
    color: CRYPTO_META[c].color,
  }));
  const portfolioTotal = donutSlices.reduce((s, x) => s + x.value, 0);

  return (
    <LevelGate feature="crypto">
      <PageTitle
        icon="coin"
        title="العملات الرقمية"
        sub="تداول وإدارة أصولك الرقمية بأمان وسرعة"
      />

      {/* coin summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CRYPTO_CODES.map((c) => {
          const e = game.prices[pk.cx(c)];
          const h = game.cryptoHoldings[c];
          const active = c === coin;
          return (
            <button key={c} onClick={() => setCoin(c)} className="text-start">
              <Card className={`p-3.5 transition ${active ? "glow-gold border-gold/40" : ""}`}>
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold text-bg"
                    style={{ background: CRYPTO_META[c].color }}
                  >
                    {c.slice(0, 1)}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-ink">{CRYPTO_META[c].name}</div>
                    <div className="text-[10px] text-muted">{CRYPTO_META[c].nameAr}</div>
                  </div>
                </div>
                <div className="mt-2 text-base font-extrabold text-ink" dir="ltr">
                  {h.qty.toFixed(c === "BTC" || c === "ETH" ? 4 : 2)} {c}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted">
                    ≈ {fmtInt(h.qty * cryptoUcn(game, c))} UCN
                  </span>
                  <span
                    className={`text-[11px] font-bold ${e.changePct >= 0 ? "text-up" : "text-down"}`}
                    dir="ltr"
                  >
                    {fmtPct(e.changePct)}
                  </span>
                </div>
                <div className="mt-1">
                  <Sparkline data={e.spark.slice(-25)} width={170} height={22} />
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* chart */}
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-extrabold text-bg"
                  style={{ background: CRYPTO_META[coin].color }}
                >
                  {coin.slice(0, 1)}
                </span>
                <span className="text-base font-extrabold text-ink" dir="ltr">
                  {coin} / USDT
                </span>
                <span
                  className={`text-sm font-bold ${entry.changePct >= 0 ? "text-up" : "text-down"}`}
                  dir="ltr"
                >
                  {fmtPct(entry.changePct)}
                </span>
              </div>
              <div className="mt-1 text-2xl font-extrabold text-gold-grad" dir="ltr">
                {fmtPrice(entry.price)} <span className="text-xs">USDT</span>
              </div>
              <div className="text-[10px] text-muted">≈ {fmtPrice(priceUcn)} UCN للوحدة</div>
            </div>
            <TabSwitcher
              size="sm"
              tabs={TIMEFRAMES.map((t) => ({ id: t.id, label: t.label }))}
              active={tf}
              onChange={setTf}
              accent="gold"
            />
          </div>
          <CandleChart candles={entry.candles.slice(-tfDef.candles)} height={280} />
        </Card>

        {/* order form */}
        <Card glow="teal" className="p-4">
          <SectionTitle icon="bolt" title="أوامر الشراء والبيع" sub="تنفيذ فوري بسعر السوق" />
          <TabSwitcher
            tabs={[
              { id: "buy" as const, label: "شراء" },
              { id: "sell" as const, label: "بيع" },
            ]}
            active={side}
            onChange={(v) => {
              setSide(v);
              setAmountStr("");
            }}
            accent="updown"
          />
          <div className="mt-3 mb-1.5 text-[11px] font-semibold text-muted">العملة</div>
          <select
            value={coin}
            onChange={(e) => setCoin(e.target.value as CryptoCode)}
            className="w-full rounded-xl border border-edge bg-card2 px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-teal/50"
          >
            {CRYPTO_CODES.map((c) => (
              <option key={c} value={c}>
                {CRYPTO_META[c].name} ({c})
              </option>
            ))}
          </select>
          <div className="mt-3 mb-1.5 text-[11px] font-semibold text-muted">
            {side === "buy" ? "المبلغ (UCN)" : `الكمية (${coin})`}
          </div>
          <AmountInput
            value={amountStr}
            onChange={setAmountStr}
            max={max}
            suffix={side === "buy" ? "UCN" : coin}
          />
          <div className="mt-3 flex items-center justify-between rounded-xl border border-edge bg-card2 p-3 text-[11px]">
            <span className="text-muted">{side === "buy" ? "الكمية المتوقعة" : "ستحصل على"}</span>
            <b className="text-ink" dir="ltr">
              {side === "buy" ? `${expectedQty.toFixed(6)} ${coin}` : `${fmtInt(expectedUcn)} UCN`}
            </b>
          </div>
          <button
            disabled={!canSubmit}
            onClick={() => {
              dispatch(
                side === "buy"
                  ? { type: "BUY_CRYPTO", code: coin, spendUcn: amount }
                  : { type: "SELL_CRYPTO", code: coin, qty: amount }
              );
              setAmountStr("");
            }}
            className={`${side === "buy" ? "btn-teal" : "btn-gold"} mt-3 w-full py-2.5 text-sm`}
          >
            {side === "buy" ? `شراء ${coin}` : `بيع ${coin}`}
          </button>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* movers */}
        <Card className="p-4">
          <SectionTitle icon="fire" title="أبرز التحركات" sub="الأعلى ارتفاعًا وانخفاضًا" />
          <div className="space-y-2">
            {sorted.map((c, i) => {
              const e = game.prices[pk.cx(c)];
              return (
                <div
                  key={c}
                  className="flex items-center justify-between rounded-xl border border-edge bg-card2 px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-center font-bold text-muted">{i + 1}</span>
                    <span
                      className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-extrabold text-bg"
                      style={{ background: CRYPTO_META[c].color }}
                    >
                      {c.slice(0, 1)}
                    </span>
                    <span className="font-bold text-ink">{CRYPTO_META[c].name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkline data={e.spark.slice(-20)} width={60} height={20} filled={false} />
                    <span
                      className={`w-14 text-end text-xs font-extrabold ${
                        e.changePct >= 0 ? "text-up" : "text-down"
                      }`}
                      dir="ltr"
                    >
                      {fmtPct(e.changePct)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* portfolio donut */}
        <Card className="p-4">
          <SectionTitle icon="coin" title="توزيع المحفظة الرقمية" sub="حسب القيمة السوقية" />
          {portfolioTotal > 0 ? (
            <DonutChart
              slices={donutSlices}
              centerTitle="إجمالي المحفظة"
              centerValue={`${fmtInt(portfolioTotal)} UCN`}
            />
          ) : (
            <div className="grid h-36 place-items-center text-center text-xs text-muted">
              لا تملك أصولًا رقمية بعد — ابدأ بشراء أول عملة 🪙
            </div>
          )}
        </Card>

        {/* fear & greed */}
        <Card className="p-4">
          <SectionTitle icon="eye" title="نظرة على السوق" sub="مؤشر الخوف والطمع" />
          <div className="flex justify-center">
            <Gauge
              value={fg}
              min={0}
              max={100}
              size={190}
              label={String(fg)}
              sub={fg < 35 ? "خوف شديد" : fg < 50 ? "خوف" : fg < 65 ? "حياد" : fg < 80 ? "طمع" : "طمع شديد"}
            />
          </div>
          <p className="mt-3 text-center text-[11px] leading-5 text-muted">
            يُحتسب المؤشر من زخم أسعار البيتكوين والإيثيريوم خلال الجلسة الحالية
          </p>
        </Card>
      </div>
    </LevelGate>
  );
}
