"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { fmtCompact, fmtPct } from "@/lib/format";
import { netWorth } from "@/lib/selectors";
import { strategyBriefing } from "@/lib/strategy";
import { useGame } from "@/lib/state/GameContext";

const toneClass = {
  up: "border-up/40 bg-up/10 text-up",
  down: "border-down/40 bg-down/10 text-down",
  gold: "border-gold/40 bg-gold/10 text-gold",
  teal: "border-teal/40 bg-teal/10 text-teal",
  muted: "border-edge bg-card2 text-muted",
} as const;

const toneText = {
  up: "text-up",
  down: "text-down",
  gold: "text-gold",
  teal: "text-teal",
  muted: "text-muted",
} as const;

function Meter({ value, tone }: { value: number; tone: keyof typeof toneText }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-edge">
      <div
        className={`h-full rounded-full transition-all duration-700 ${
          tone === "down"
            ? "bg-down"
            : tone === "gold"
              ? "bg-gold"
              : tone === "up"
                ? "bg-up"
                : "bg-teal"
        }`}
        style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function CommandCenter() {
  const game = useGame();
  const briefing = strategyBriefing(game);
  const worth = netWorth(game);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const artUrl = `${basePath}/images/ucncu-command-room.jpg`;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/30 bg-card2 p-4 shadow-2xl">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: `url(${artUrl})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-bg via-bg/80 to-bg/35" aria-hidden="true" />
      <div className="relative grid gap-4 lg:grid-cols-[1.05fr_1.35fr]">
        <div className="flex min-h-72 flex-col justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-extrabold text-gold">
              <Icon name="shield" size={13} />
              مركز القيادة الذكي
            </div>
            <h2 className="max-w-lg text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
              قرارات أسرع من السوق، مبنية على محفظتك الآن
            </h2>
            <p className="mt-2 max-w-lg text-xs leading-6 text-muted">{briefing.headline}</p>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-edge bg-bg/70 p-3 backdrop-blur">
              <div className="text-[9px] font-bold text-muted">صافي الثروة</div>
              <div className="mt-1 text-lg font-extrabold text-gold">{fmtCompact(worth)}</div>
            </div>
            <div className="rounded-xl border border-edge bg-bg/70 p-3 backdrop-blur">
              <div className="text-[9px] font-bold text-muted">المعنويات</div>
              <div className="mt-1 text-lg font-extrabold text-teal" dir="ltr">
                {briefing.marketMood}/100
              </div>
            </div>
            <div className="rounded-xl border border-edge bg-bg/70 p-3 backdrop-blur">
              <div className="text-[9px] font-bold text-muted">الحالة</div>
              <div className={`mt-1 text-sm font-extrabold ${toneText[briefing.tone]}`}>
                {briefing.label}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-edge bg-bg/75 p-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-ink">مؤشر السيطرة</div>
                <div className="text-[10px] text-muted">توازن السيولة، الدين، والتنويع</div>
              </div>
              <b className={`text-2xl ${toneText[briefing.tone]}`} dir="ltr">
                {briefing.score}
              </b>
            </div>
            <Meter value={briefing.score} tone={briefing.tone} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-xl border border-edge bg-card2/80 p-2">
                <span className="text-muted">السيولة</span>
                <b className="ms-1 text-ink" dir="ltr">{fmtPct(briefing.cashRatio * 100, false)}</b>
              </div>
              <div className="rounded-xl border border-edge bg-card2/80 p-2">
                <span className="text-muted">الدين</span>
                <b className={briefing.debtRatio > 0.25 ? "ms-1 text-down" : "ms-1 text-up"} dir="ltr">
                  {fmtPct(briefing.debtRatio * 100, false)}
                </b>
              </div>
              <div className="rounded-xl border border-edge bg-card2/80 p-2">
                <span className="text-muted">مصادر نشطة</span>
                <b className="ms-1 text-teal" dir="ltr">{briefing.activeBuckets}</b>
              </div>
              <div className="rounded-xl border border-edge bg-card2/80 p-2">
                <span className="text-muted">أكبر تركّز</span>
                <b className="ms-1 text-gold" dir="ltr">{fmtPct(briefing.largestBucketRatio * 100, false)}</b>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-edge bg-bg/75 p-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-ink">مهام ذكية</div>
                <div className="text-[10px] text-muted">أفضل خطواتك التالية</div>
              </div>
              <Icon name="bolt" size={18} className="text-gold" />
            </div>
            <div className="space-y-2">
              {briefing.missions.map((m) => (
                <Link
                  key={m.id}
                  href={m.href}
                  className={`flex items-start gap-2 rounded-xl border p-2.5 transition hover:brightness-110 ${toneClass[m.tone]}`}
                >
                  <Icon name={m.icon} size={16} className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <b className="block text-[11px]">{m.title}</b>
                    <span className="line-clamp-2 text-[10px] leading-4 text-muted">{m.sub}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-edge bg-bg/75 p-4 backdrop-blur md:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-ink">رادار الفرص</div>
                <div className="text-[10px] text-muted">أقوى الحركات في السوق الآن</div>
              </div>
              <Icon name="chart" size={18} className="text-teal" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {briefing.opportunities.map((o) => (
                <Link
                  key={o.id}
                  href={o.href}
                  className="flex items-center gap-2 rounded-xl border border-edge bg-card2/80 p-2.5 transition hover:border-teal/40"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${toneClass[o.tone]}`}>
                    <Icon name={o.icon} size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[11px] text-ink">{o.title}</b>
                    <span className="block truncate text-[10px] text-muted">{o.sub}</span>
                  </span>
                  <b className={o.changePct >= 0 ? "text-up" : "text-down"} dir="ltr">
                    {fmtPct(o.changePct)}
                  </b>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
