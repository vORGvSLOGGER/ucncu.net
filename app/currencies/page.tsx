"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { AmountInput } from "@/components/ui/AmountInput";
import { Icon } from "@/components/ui/Icon";
import { LevelGate } from "@/components/ui/LevelGate";
import { PageTitle } from "@/components/ui/PageTitle";
import { Sparkline } from "@/components/ui/Sparkline";
import { FIAT_CODES, FIAT_META, FX_SPREAD, pk } from "@/lib/constants";
import { fmtClock, fmtDec, fmtPct, fmtPrice } from "@/lib/format";
import { fxRate, toUcn } from "@/lib/selectors";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";
import type { FiatCode } from "@/lib/types";

const PAIRS: [FiatCode, FiatCode][] = [
  ["USD", "SAR"],
  ["EUR", "SAR"],
  ["AED", "SAR"],
  ["USD", "EUR"],
  ["UCN", "USD"],
  ["UCN", "SAR"],
];

function pairSpark(game: ReturnType<typeof useGame>, a: FiatCode, b: FiatCode): number[] {
  const sa = game.prices[pk.fx(a)].spark;
  const sb = game.prices[pk.fx(b)].spark;
  const n = Math.min(sa.length, sb.length);
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(sa[sa.length - n + i] / sb[sb.length - n + i]);
  return out;
}

function CurrencySelect({
  value,
  onChange,
  exclude,
}: {
  value: FiatCode;
  onChange: (c: FiatCode) => void;
  exclude?: FiatCode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FiatCode)}
      className="w-full rounded-xl border border-edge bg-card2 px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-teal/50"
    >
      {FIAT_CODES.filter((c) => c !== exclude).map((c) => (
        <option key={c} value={c}>
          {FIAT_META[c].flag} {FIAT_META[c].name} ({c})
        </option>
      ))}
    </select>
  );
}

export default function CurrenciesPage() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [from, setFrom] = useState<FiatCode>("USD");
  const [to, setTo] = useState<FiatCode>("SAR");
  const [amount, setAmount] = useState("");

  const num = parseFloat(amount) || 0;
  const rate = fxRate(game, from, to);
  const received = num * rate * (1 - FX_SPREAD);
  const canConvert = num > 0 && num <= game.balances[from] && from !== to;

  const swap = () => {
    setFrom(to);
    setTo(from === to ? (from === "USD" ? "SAR" : "USD") : from);
    setAmount("");
  };

  const fxHistory = game.transactions.filter((t) => t.type === "fx").slice(0, 8);

  return (
    <LevelGate feature="currencies">
      <PageTitle
        icon="coins"
        title="العملات"
        sub="شراء وبيع وتتبع أسعار العملات العالمية والمحلية"
      />

      {/* balances */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {FIAT_CODES.map((c) => (
          <Card key={c} className="p-3.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">{FIAT_META[c].flag}</span>
              <div>
                <div className="text-[11px] text-muted">{FIAT_META[c].name}</div>
                <div className="text-[10px] font-bold text-muted">{c}</div>
              </div>
            </div>
            <div className="mt-2 text-lg font-extrabold text-ink">
              {fmtDec(game.balances[c])}
              <span className="ms-1 text-[10px] font-semibold text-muted">{FIAT_META[c].symbol}</span>
            </div>
            {c !== "UCN" && (
              <div className="text-[10px] text-muted">
                ≈ {fmtDec(toUcn(game, game.balances[c], c))} UCN
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* conversion form */}
        <Card glow="teal" className="p-4 lg:col-span-2" data-tour="fx-form">
          <SectionTitle icon="swap" title="شراء / بيع" sub="تحويل فوري بين العملات" />
          <div className="mb-1.5 text-[11px] font-semibold text-muted">أدفع</div>
          <CurrencySelect value={from} onChange={(c) => { setFrom(c); if (c === to) setTo(c === "USD" ? "SAR" : "USD"); }} />
          <div className="mt-2">
            <AmountInput
              value={amount}
              onChange={setAmount}
              max={game.balances[from]}
              suffix={from}
            />
          </div>

          <div className="my-3 flex justify-center">
            <button
              onClick={swap}
              className="grid h-9 w-9 place-items-center rounded-full border border-teal/50 bg-teal/10 text-teal transition hover:rotate-180"
              aria-label="عكس الاتجاه"
            >
              <Icon name="swap" size={16} />
            </button>
          </div>

          <div className="mb-1.5 text-[11px] font-semibold text-muted">أحصل على</div>
          <CurrencySelect value={to} onChange={setTo} exclude={from} />
          <div className="mt-2 rounded-xl border border-edge bg-card2 px-3 py-2.5 text-left text-base font-extrabold text-up" dir="ltr">
            {fmtDec(received)} <span className="text-xs text-muted">{to}</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <Icon name="globe" size={12} />
              سعر الصرف: 1 {from} = {fmtPrice(rate)} {to}
            </span>
            <span>الرسوم {fmtPct(FX_SPREAD * 100, false)}</span>
          </div>

          <button
            disabled={!canConvert}
            onClick={() => {
              dispatch({ type: "CONVERT_FX", from, to, amount: num });
              setAmount("");
            }}
            className="btn-teal mt-3 w-full py-2.5 text-sm"
          >
            شراء {to}
          </button>
        </Card>

        {/* pairs table */}
        <Card className="p-4 lg:col-span-3">
          <SectionTitle icon="chart" title="أزواج العملات" sub="أسعار حية مع تغير الجلسة" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-xs">
              <thead>
                <tr className="border-b border-edge text-[10px] text-muted">
                  <th className="py-2 text-start font-semibold">الزوج</th>
                  <th className="py-2 text-start font-semibold">السعر</th>
                  <th className="py-2 text-start font-semibold">التغير</th>
                  <th className="py-2 text-start font-semibold">الرسم البياني</th>
                  <th className="py-2 text-start font-semibold">مفضلة</th>
                </tr>
              </thead>
              <tbody>
                {PAIRS.map(([a, b]) => {
                  const id = `${a}/${b}`;
                  const r = fxRate(game, a, b);
                  const change =
                    game.prices[pk.fx(a)].changePct - game.prices[pk.fx(b)].changePct;
                  const fav = game.favoritePairs.includes(id);
                  return (
                    <tr key={id} className="border-b border-edge/50">
                      <td className="py-2.5 font-bold text-ink">
                        <span className="me-1">{FIAT_META[a].flag}</span>
                        <span dir="ltr">{id}</span>
                      </td>
                      <td className="py-2.5 font-bold text-ink" dir="ltr">
                        {fmtPrice(r)}
                      </td>
                      <td
                        className={`py-2.5 font-bold ${change >= 0 ? "text-up" : "text-down"}`}
                        dir="ltr"
                      >
                        {fmtPct(change)}
                      </td>
                      <td className="py-2.5">
                        <Sparkline data={pairSpark(game, a, b).slice(-30)} width={90} height={24} />
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={() => dispatch({ type: "TOGGLE_FAVORITE", pair: id })}
                          className={fav ? "text-gold" : "text-muted hover:text-gold"}
                          aria-label="مفضلة"
                        >
                          <Icon name="star" size={15} {...(fav ? { fill: "currentColor" } : {})} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* fx history */}
      <div className="mt-5">
        <SectionTitle icon="refresh" title="عملياتي الأخيرة" sub="آخر تحويلات العملات" />
        {fxHistory.length === 0 ? (
          <Card className="p-6 text-center text-xs text-muted">لم تنفذ أي تحويل عملات بعد</Card>
        ) : (
          <Card className="divide-y divide-edge/50 p-1">
            {fxHistory.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-3 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg border border-edge bg-card text-teal">
                    <Icon name="swap" size={13} />
                  </span>
                  <div>
                    <div className="font-bold text-ink">{tx.label}</div>
                    <div className="text-[10px] text-muted">{fmtClock(tx.t)}</div>
                  </div>
                </div>
                <b className="text-up" dir="ltr">
                  +{fmtDec(tx.amount)} {tx.currency}
                </b>
              </div>
            ))}
          </Card>
        )}
      </div>
    </LevelGate>
  );
}
