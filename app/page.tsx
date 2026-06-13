"use client";

import Link from "next/link";
import { useState } from "react";
import { CommandCenter } from "@/components/game/CommandCenter";
import { Card, SectionTitle } from "@/components/ui/Card";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { Icon } from "@/components/ui/Icon";
import { LineChart } from "@/components/ui/LineChart";
import { PageTitle } from "@/components/ui/PageTitle";
import { StatCard } from "@/components/ui/StatCard";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { CRYPTO_CODES, CRYPTO_META, pk } from "@/lib/constants";
import { companyLevel } from "@/lib/companyPerks";
import { companyRanking } from "@/lib/engine/company";
import { fmtClock, fmtCompact, fmtInt, fmtPct, fmtSigned } from "@/lib/format";
import { GAME_EVENTS, SECTORS } from "@/lib/seed";
import { breakdown, marketItemDef, netWorth } from "@/lib/selectors";
import { useGame } from "@/lib/state/GameContext";
import type { TxType } from "@/lib/types";

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

/* categorized activity log — every interaction lives here, not in popups */
const LOG_CATS: {
  id: string;
  label: string;
  icon: string;
  color: string;
  types: TxType[];
}[] = [
  { id: "all", label: "الكل", icon: "refresh", color: "var(--color-ink)", types: [] },
  { id: "trade", label: "تداول", icon: "chart", color: "var(--color-teal)", types: ["trade-open", "trade-close"] },
  { id: "market", label: "السوق", icon: "cart", color: "var(--color-gold)", types: ["buy", "sell"] },
  { id: "estate", label: "عقارات", icon: "building", color: "var(--color-violet)", types: ["property-buy", "property-sell", "rent"] },
  { id: "auction", label: "مزاد", icon: "gavel", color: "var(--color-cyan)", types: ["auction-bid", "auction-win", "auction-refund", "auction-sale"] },
  { id: "bank", label: "بنك", icon: "bank", color: "var(--color-up)", types: ["loan", "installment", "debt-payment", "lend", "lend-return"] },
  { id: "fx", label: "عملات", icon: "coins", color: "var(--color-gold)", types: ["fx", "crypto-buy", "crypto-sell"] },
  { id: "company", label: "شركات", icon: "briefcase", color: "var(--color-violet)", types: ["company", "shares-sale", "dividend", "upgrade", "partner-capital"] },
  { id: "social", label: "اجتماعي", icon: "users", color: "var(--color-up)", types: ["donation-in", "donation-out", "direct-sale", "daily-bonus", "reward"] },
];

function catForTx(type: TxType) {
  return LOG_CATS.find((c) => c.types.includes(type)) ?? LOG_CATS[0];
}

/** the home page is the GLOBAL dashboard: individual + company empire */
function EmpireSection() {
  const game = useGame();
  if (game.companies.length === 0) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 border-teal/30 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-teal/40 bg-teal/10 text-teal">
            <Icon name="briefcase" size={22} />
          </span>
          <div>
            <div className="text-sm font-bold text-ink">إمبراطوريتك تبدأ بشركة واحدة 🏢</div>
            <div className="text-[11px] text-muted">
              أسس شركة لتفتح وضع الشركة: منسوبون، عقود، خزينة، وتوب 10 خاص
            </div>
          </div>
        </div>
        <Link href="/companies" className="btn-teal px-5 py-2 text-xs">
          أسس شركتك ←
        </Link>
      </Card>
    );
  }

  const totalTreasury = game.companies.reduce((sum, c) => sum + c.treasury, 0);
  const ranking = companyRanking(game, "valuation");
  const bestRank = ranking.findIndex((r) => r.mine) + 1;
  const top = [...game.companies].sort((a, z) => z.valuation - a.valuation)[0];
  const activeContracts = game.companies.reduce(
    (sum, c) => sum + c.contracts.filter((k) => k.status === "active").length,
    0
  );

  return (
    <Card glow="teal" className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <SectionTitle
          icon="briefcase"
          title="إمبراطوريتك"
          sub="موجز شركاتك — التفاصيل والتحكم في وضع الشركة"
        />
        <Link href="/company" className="btn-teal shrink-0 px-4 py-2 text-xs">
          دخول وضع الشركة 🏢
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-edge bg-card2 p-3 text-center">
          <div className="text-lg font-extrabold text-ink">{game.companies.length}</div>
          <div className="text-[9px] text-muted">شركات تملكها</div>
        </div>
        <div className="rounded-xl border border-edge bg-card2 p-3 text-center">
          <div className="text-lg font-extrabold text-teal">{fmtCompact(totalTreasury)}</div>
          <div className="text-[9px] text-muted">إجمالي الخزائن (UCN)</div>
        </div>
        <div className="rounded-xl border border-edge bg-card2 p-3 text-center">
          <div className="text-lg font-extrabold text-gold">
            {bestRank > 0 ? `#${bestRank}` : "—"}
          </div>
          <div className="text-[9px] text-muted">أفضل ترتيب في توب 10</div>
        </div>
        <div className="rounded-xl border border-edge bg-card2 p-3 text-center">
          <div className="text-lg font-extrabold text-violet">{activeContracts}</div>
          <div className="text-[9px] text-muted">عقود قيد التنفيذ</div>
        </div>
      </div>
      {top && (
        <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-edge bg-card2 px-3 py-2 text-[11px]">
          <Icon name={SECTORS.find((x) => x.id === top.sectorId)?.icon ?? "briefcase"} size={15} className="text-teal" />
          <span className="font-bold text-ink">{top.name}</span>
          {top.verification === "verified" && (
            <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-gold text-bg">
              <Icon name="check" size={8} strokeWidth={3} />
            </span>
          )}
          <span className="text-muted">«{companyLevel(top.level).name}»</span>
          <span className="ms-auto text-muted">
            الخزينة <b className="text-teal">{fmtInt(top.treasury)}</b> · الشهرة{" "}
            <b className="text-violet">{fmtInt(top.fame)}</b>
          </span>
        </div>
      )}
    </Card>
  );
}

function ActivityLog() {
  const game = useGame();
  const [cat, setCat] = useState("all");
  const def = LOG_CATS.find((c) => c.id === cat)!;
  const txs = game.transactions
    .filter((t) => def.types.length === 0 || def.types.includes(t.type))
    .slice(0, 30);

  return (
    <Card className="p-4" data-tour="home-log">
      <SectionTitle
        icon="refresh"
        title="سجل النشاط"
        sub="كل عملياتك موثقة هنا مصنفة — بدون نوافذ مزعجة"
      />
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {LOG_CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${
              cat === c.id
                ? "border-gold/60 bg-gold/15 text-gold"
                : "border-edge bg-card2 text-muted hover:text-ink"
            }`}
          >
            <Icon name={c.icon} size={11} />
            {c.label}
          </button>
        ))}
      </div>
      {txs.length === 0 ? (
        <div className="grid h-32 place-items-center text-center text-xs leading-6 text-muted">
          لا عمليات في هذا التصنيف بعد —<br />
          ابدأ من <Link href="/market" className="font-bold text-gold">السوق</Link> 🚀
        </div>
      ) : (
        <div className="max-h-96 divide-y divide-edge/50 overflow-y-auto">
          {txs.map((tx) => {
            const c = catForTx(tx.type);
            const isPnl = tx.type === "trade-close";
            return (
              <div key={tx.id} className="flex items-center gap-3 py-2.5 text-xs">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-edge"
                  style={{ color: c.color }}
                >
                  <Icon name={c.icon} size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-ink">
                    {tx.label}
                    {isPnl && (
                      <span className={`ms-2 text-[9px] ${tx.amount >= 0 ? "text-up" : "text-down"}`}>
                        {tx.amount >= 0 ? "ربح ✓" : "خسارة ✗"}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted">
                    {fmtClock(tx.t)} · {c.label}
                  </div>
                </div>
                <b className={`shrink-0 ${tx.amount >= 0 ? "text-up" : "text-down"}`} dir="ltr">
                  {fmtSigned(tx.amount, Math.abs(tx.amount) < 100 ? 2 : 0)} {tx.currency}
                </b>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

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

      <div className="mb-4">
        <CommandCenter />
      </div>

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

      {/* company empire summary — the home stays the global dashboard */}
      <div className="mt-4">
        <EmpireSection />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* activity log — the single source of interaction history */}
        <div className="lg:col-span-3">
          <ActivityLog />
        </div>

        {/* events */}
        <Card className="p-4 lg:col-span-3">
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

      </div>
    </div>
  );
}
