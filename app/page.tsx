"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { Icon } from "@/components/ui/Icon";
import { LineChart } from "@/components/ui/LineChart";
import { PageTitle } from "@/components/ui/PageTitle";
import { StatCard } from "@/components/ui/StatCard";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { CRYPTO_CODES, CRYPTO_META, pk } from "@/lib/constants";
import { fmtClock, fmtCompact, fmtPct, fmtSigned } from "@/lib/format";
import { GAME_EVENTS } from "@/lib/seed";
import { breakdown, marketItemDef, netWorth } from "@/lib/selectors";
import { useGame } from "@/lib/state/GameContext";

const EVENT_KIND_META = {
  daily: { label: "يومي", color: "var(--color-teal)" },
  weekly: { label: "أسبوعي", color: "var(--color-gold)" },
  monthly: { label: "شهري", color: "var(--color-violet)" },
} as const;

const TIMEFRAMES = [
  { id: "short", label: "قصير", points: 24 },
  { id: "mid", label: "متوسط", points: 48 },
  { id: "all", label: "الكل", points: 96 },
] as const;

export default function HomePage() {
  const game = useGame();
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]["id"]>("all");

  const b = breakdown(game);
  const worth = netWorth(game);
  const history = game.netWorthHistory.length > 1 ? game.netWorthHistory : [worth, worth];
  const tfDef = TIMEFRAMES.find((t) => t.id === tf)!;
  const series = history.slice(-tfDef.points);
  const deltaPct = series.length > 1 ? ((worth - series[0]) / (series[0] || 1)) * 100 : 0;

  const investments = b.inventory + b.trading + b.companies + b.lends;
  const recentTx = game.transactions.slice(0, 5);

  /* opportunities derived from live state */
  const hotAuction = [...game.auctions].sort((a, z) => a.endsAt - z.endsAt)[0];
  const hotItem = hotAuction ? marketItemDef(hotAuction.itemDefId) : null;
  const topCrypto = [...CRYPTO_CODES].sort(
    (a, z) => Math.abs(game.prices[pk.cx(z)].changePct) - Math.abs(game.prices[pk.cx(a)].changePct)
  )[0];
  const topCryptoChange = game.prices[pk.cx(topCrypto)].changePct;
  const nextLoan = game.loans
    .filter((l) => l.status === "active")
    .sort((a, z) => a.nextDueAt - z.nextDueAt)[0];

  return (
    <div>
      <PageTitle
        icon="home"
        title="الرئيسية"
        sub={`أهلًا ${game.player.name} — هذه نظرة سريعة على وضعك الاستثماري اليوم`}
      />

      {/* hero stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <StatCard
            icon="crown"
            iconColor="var(--color-gold)"
            label="صافي الثروة"
            value={fmtCompact(worth)}
            suffix="UCN"
            deltaPct={deltaPct}
            deltaLabel="هذه الجلسة"
            glow="gold"
          />
        </div>
        <StatCard icon="money" label="السيولة النقدية" value={fmtCompact(b.cash)} suffix="UCN" iconColor="var(--color-up)" />
        <StatCard icon="chart" label="الاستثمارات" value={fmtCompact(investments)} suffix="UCN" iconColor="var(--color-teal)" />
        <StatCard icon="building" label="العقارات" value={fmtCompact(b.properties)} suffix="UCN" iconColor="var(--color-violet)" />
        <StatCard icon="coin" label="المحفظة الرقمية" value={fmtCompact(b.crypto)} suffix="UCN" iconColor="var(--color-cyan)" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* performance chart */}
        <Card className="p-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle icon="chart" title="أداء المحفظة" sub="تطور صافي ثروتك لحظة بلحظة" />
            <TabSwitcher
              size="sm"
              tabs={TIMEFRAMES.map((t) => ({ id: t.id, label: t.label }))}
              active={tf}
              onChange={setTf}
            />
          </div>
          <LineChart data={series} height={220} color="var(--color-teal)" />
          <div className="mt-2 flex items-center justify-between rounded-xl border border-edge bg-card2 px-3 py-2 text-[11px]">
            <span className="text-muted">التغير خلال الفترة المعروضة</span>
            <b className={deltaPct >= 0 ? "text-up" : "text-down"} dir="ltr">
              {fmtPct(deltaPct)}
            </b>
          </div>
        </Card>

        {/* opportunities */}
        <Card className="p-4">
          <SectionTitle icon="fire" title="فرص وتنبيهات" sub="أهم ما يستحق انتباهك الآن" />
          <div className="space-y-2.5">
            {hotAuction && hotItem && (
              <Link
                href="/auction"
                className="flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/8 p-3 transition hover:bg-gold/15"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gold/40 text-gold">
                  <Icon name="gavel" size={17} />
                </span>
                <div className="min-w-0 flex-1 text-[11px]">
                  <b className="text-ink">مزاد {hotItem.name} ينتهي قريبًا!</b>
                  <div className="text-muted">
                    المزايدة الحالية {fmtCompact(hotAuction.currentBid)} UCN
                  </div>
                </div>
                <CountdownTimer endsAt={hotAuction.endsAt} />
              </Link>
            )}
            <Link
              href="/crypto"
              className="flex items-center gap-3 rounded-xl border border-edge bg-card2 p-3 transition hover:border-teal/40"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-bg"
                style={{ background: CRYPTO_META[topCrypto].color }}
              >
                <b className="text-xs">{topCrypto.slice(0, 1)}</b>
              </span>
              <div className="min-w-0 flex-1 text-[11px]">
                <b className="text-ink">{CRYPTO_META[topCrypto].name} يتحرك بقوة</b>
                <div className="text-muted">أكبر حركة في سوق الكريبتو الآن</div>
              </div>
              <b className={topCryptoChange >= 0 ? "text-up" : "text-down"} dir="ltr">
                {fmtPct(topCryptoChange)}
              </b>
            </Link>
            {nextLoan && (
              <Link
                href="/bank"
                className="flex items-center gap-3 rounded-xl border border-edge bg-card2 p-3 transition hover:border-down/40"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-down/40 text-down">
                  <Icon name="clock" size={17} />
                </span>
                <div className="min-w-0 flex-1 text-[11px]">
                  <b className="text-ink">قسط {nextLoan.productName} يستحق قريبًا</b>
                  <div className="text-muted">
                    قيمة القسط {fmtCompact(nextLoan.installment)} UCN — تأكد من توفر الرصيد
                  </div>
                </div>
                <CountdownTimer endsAt={nextLoan.nextDueAt} />
              </Link>
            )}
            {game.notifications.slice(0, nextLoan ? 1 : 2).map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-xl border border-edge bg-card2 p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-teal/40 text-teal">
                  <Icon name="bell" size={16} />
                </span>
                <div className="min-w-0 text-[11px]">
                  <b className="text-ink">{n.title}</b>
                  {n.body && <div className="mt-0.5 leading-4 text-muted">{n.body}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* events */}
        <Card className="p-4 lg:col-span-2">
          <SectionTitle icon="star" title="أحداث المنصة" sub="فعاليات يومية وأسبوعية وشهرية بمكافآت حقيقية" />
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {GAME_EVENTS.map((e) => {
              const meta = EVENT_KIND_META[e.kind];
              return (
                <div key={e.id} className="rounded-xl border border-edge bg-card2 p-3">
                  <div className="flex items-center justify-between">
                    <span className="grid h-8 w-8 place-items-center rounded-lg border border-edge text-teal">
                      <Icon name={e.icon} size={15} />
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-extrabold"
                      style={{ color: meta.color, border: `1px solid ${meta.color}66` }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-bold text-ink">{e.title}</div>
                  <div className="mt-0.5 text-[10px] leading-4 text-muted">{e.desc}</div>
                  <div className="mt-1.5 text-[10px] font-bold text-gold">🎁 {e.reward}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* recent transactions */}
        <Card className="p-4">
          <SectionTitle
            icon="refresh"
            title="آخر العمليات"
            action={
              <Link href="/profile" className="text-[11px] font-bold text-teal hover:underline">
                عرض السجل الكامل ←
              </Link>
            }
          />
          {recentTx.length === 0 ? (
            <div className="grid h-40 place-items-center text-center text-xs leading-6 text-muted">
              لا توجد عمليات بعد —<br />
              ابدأ أول صفقة لك من <Link href="/market" className="font-bold text-gold">السوق</Link> 🚀
            </div>
          ) : (
            <div className="divide-y divide-edge/50">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-ink">{tx.label}</div>
                    <div className="text-[10px] text-muted">{fmtClock(tx.t)}</div>
                  </div>
                  <b className={`shrink-0 ${tx.amount >= 0 ? "text-up" : "text-down"}`} dir="ltr">
                    {fmtSigned(tx.amount, Math.abs(tx.amount) < 100 ? 2 : 0)} {tx.currency}
                  </b>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
