"use client";

import Link from "next/link";
import { CompanyGate } from "@/components/company/CompanyGate";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { LineChart } from "@/components/ui/LineChart";
import { PageTitle } from "@/components/ui/PageTitle";
import { StatCard } from "@/components/ui/StatCard";
import { companyLevel, MAX_COMPANY_LEVEL } from "@/lib/companyPerks";
import { companyEmployees } from "@/lib/engine/company";
import { fmtClock, fmtCompact, fmtInt, fmtPct } from "@/lib/format";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";

export default function CompanyDashboard() {
  const game = useGame();
  const dispatch = useGameDispatch();

  return (
    <CompanyGate>
      {(c) => {
        const lv = companyLevel(c.level);
        const next = c.level < MAX_COMPANY_LEVEL ? companyLevel(c.level + 1) : null;
        const upgradeCost = next ? Math.round(c.valuation * next.costPct) : 0;
        const employees = companyEmployees(c);
        const activeContracts = c.contracts.filter((k) => k.status === "active").length;
        const reserve = employees.reduce((sum, m) => sum + (m.salary ?? 0), 0) * 2;
        const distributable = Math.max(0, c.treasury - reserve);
        const delta =
          c.history.length > 1 ? ((c.valuation - c.history[0]) / c.history[0]) * 100 : 0;

        return (
          <div>
            <PageTitle
              icon="briefcase"
              title="لوحة الشركة"
              sub={`مركز قيادة ${c.name} — مستوى «${lv.name}»${c.verification === "verified" ? " · موثقة ✓" : ""}`}
            />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                icon="wallet"
                label="خزينة الشركة"
                value={fmtCompact(c.treasury)}
                suffix="UCN"
                glow="teal"
                iconColor="var(--color-teal)"
              />
              <StatCard
                icon="chart"
                label="تقييم الشركة"
                value={fmtCompact(c.valuation)}
                suffix="UCN"
                deltaPct={delta}
                deltaLabel="منذ بداية السجل"
                iconColor="var(--color-gold)"
              />
              <StatCard
                icon="fire"
                label="الشهرة"
                value={fmtInt(c.fame)}
                suffix={`×${lv.fameMult} مضاعف`}
                iconColor="var(--color-violet)"
              />
              <StatCard
                icon="users"
                label="الفريق"
                value={String(c.members.length)}
                suffix={`${employees.length}/${lv.employees} منسوبين · ${activeContracts}/${lv.contracts} عقود`}
                iconColor="var(--color-cyan)"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* valuation chart */}
              <Card className="p-4 lg:col-span-2">
                <SectionTitle icon="chart" title="أداء التقييم" sub="تطور قيمة الشركة دورة بدورة" />
                <LineChart data={c.history} height={200} color="var(--color-teal)" />
                <div className="mt-2 flex items-center justify-between rounded-xl border border-edge bg-card2 px-3 py-2 text-[11px]">
                  <span className="text-muted">التغير خلال السجل</span>
                  <b className={delta >= 0 ? "text-up" : "text-down"} dir="ltr">
                    {fmtPct(delta)}
                  </b>
                </div>
              </Card>

              {/* quick actions */}
              <div className="space-y-3">
                <Card glow="gold" className="p-4">
                  <SectionTitle icon="money" title="توزيع الأرباح" />
                  <div className="mb-2 flex items-center justify-between text-[11px]">
                    <span className="text-muted">قابل للتوزيع الآن</span>
                    <b className="text-gold">{fmtInt(distributable)} UCN</b>
                  </div>
                  {reserve > 0 && (
                    <p className="mb-2 text-[9px] text-muted">
                      يُحتفظ تلقائيًا باحتياطي رواتب دورتين ({fmtInt(reserve)} UCN)
                    </p>
                  )}
                  <button
                    disabled={distributable < 1}
                    onClick={() => dispatch({ type: "DISTRIBUTE_PROFITS", companyId: c.id })}
                    className="btn-gold w-full py-2.5 text-sm"
                  >
                    وزّع الأرباح على الملاك 💰
                  </button>
                  <Link
                    href="/company/finance"
                    className="mt-2 block text-center text-[10px] font-bold text-teal hover:underline"
                  >
                    إعدادات التوزيع والخزينة ←
                  </Link>
                </Card>

                {next && (
                  <Card className="p-4">
                    <SectionTitle icon="arrow-up" title={`الترقية إلى «${next.name}»`} />
                    <ul className="mb-3 space-y-1 text-[10px] leading-4 text-muted">
                      {next.perks.slice(0, 3).map((p) => (
                        <li key={p} className="flex items-start gap-1.5">
                          <Icon name="check" size={10} className="mt-0.5 shrink-0 text-up" />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <Link href="/companies" className="btn-teal block w-full py-2 text-center text-xs">
                      رقِّ الشركة — {fmtInt(upgradeCost)} UCN
                    </Link>
                  </Card>
                )}
              </div>
            </div>

            {/* company log */}
            <div className="mt-4">
              <SectionTitle icon="refresh" title="سجل الشركة" sub="كل ما يجري داخل شركتك" />
              <Card className="divide-y divide-edge/50 p-1">
                {c.events.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted">لا أحداث بعد</div>
                )}
                {c.events.slice(0, 12).map((e, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 text-[11px]">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        e.kind === "dividend" || e.kind === "growth" || e.kind === "distribution"
                          ? "bg-up"
                          : e.kind === "drop" || e.kind === "resign" || e.kind === "fire"
                            ? "bg-down"
                            : e.kind === "verify" || e.kind === "upgrade"
                              ? "bg-gold"
                              : "bg-teal"
                      }`}
                    />
                    <span className="flex-1 text-ink">{e.text}</span>
                    <span className="shrink-0 text-[9px] text-muted">{fmtClock(e.t)}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        );
      }}
    </CompanyGate>
  );
}
