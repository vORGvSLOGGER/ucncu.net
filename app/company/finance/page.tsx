"use client";

import { useState } from "react";
import { CompanyGate } from "@/components/company/CompanyGate";
import { AmountInput } from "@/components/ui/AmountInput";
import { Avatar } from "@/components/ui/Avatar";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageTitle } from "@/components/ui/PageTitle";
import { StatCard } from "@/components/ui/StatCard";
import { companyLevel } from "@/lib/companyPerks";
import { companyEmployees } from "@/lib/engine/company";
import { fmtClock, fmtCompact, fmtInt } from "@/lib/format";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";

const FLOW_KINDS = new Set(["dividend", "salary", "contract", "deposit", "distribution"]);

export default function CompanyFinancePage() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [depositStr, setDepositStr] = useState("");

  return (
    <CompanyGate>
      {(c) => {
        const lv = companyLevel(c.level);
        const employees = companyEmployees(c);
        const salaries = employees.reduce((sum, m) => sum + (m.salary ?? 0), 0);
        const reserve = salaries * 2;
        const distributable = Math.max(0, c.treasury - reserve);
        const deposit = Math.floor(parseFloat(depositStr) || 0);
        const flows = c.events.filter((e) => FLOW_KINDS.has(e.kind)).slice(0, 15);

        return (
          <div>
            <PageTitle
              icon="wallet"
              title="مالية الشركة"
              sub="الخزينة، الرواتب، والتوزيعات — هنا يُدار مال الإمبراطورية"
            />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon="wallet" label="رصيد الخزينة" value={fmtCompact(c.treasury)} suffix="UCN" glow="teal" iconColor="var(--color-teal)" />
              <StatCard icon="money" label="قابل للتوزيع" value={fmtCompact(distributable)} suffix="UCN" iconColor="var(--color-gold)" />
              <StatCard icon="users" label="رواتب كل دورة" value={fmtCompact(salaries)} suffix={`${employees.length} منسوبين`} iconColor="var(--color-violet)" />
              <StatCard icon="chart" label="أرباح وزعت تاريخيًا" value={fmtCompact(c.dividendsPaid)} suffix="UCN" iconColor="var(--color-up)" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* manual distribution */}
              <Card glow="gold" className="p-4">
                <SectionTitle
                  icon="money"
                  title="التوزيع اليدوي"
                  sub="وزّع الخزينة على حملة الحصص بنسبهم — نصيبك يدخل رصيدك الشخصي"
                />
                <div className="mb-3 space-y-1.5">
                  {c.partners.map((p) => (
                    <div key={p.name} className="flex items-center gap-2 rounded-lg border border-edge bg-card2 px-2.5 py-1.5 text-[11px]">
                      <Avatar name={p.name} avatarId={p.avatarId ?? 11} size={22} />
                      <span className="flex-1 font-bold text-ink">
                        {p.name}
                        {p.isPlayer && <span className="text-gold"> (أنت)</span>}
                      </span>
                      <span className="text-muted">{Math.round(p.pct)}%</span>
                      <b className="w-20 text-end text-up">
                        +{fmtInt(Math.round((distributable * p.pct) / 100))}
                      </b>
                    </div>
                  ))}
                </div>
                {reserve > 0 && (
                  <p className="mb-2 text-[9px] text-muted">
                    🛡️ يُحتفظ تلقائيًا باحتياطي رواتب دورتين ({fmtInt(reserve)} UCN) حتى لا يستقيل
                    فريقك
                  </p>
                )}
                <button
                  disabled={distributable < 1}
                  onClick={() => dispatch({ type: "DISTRIBUTE_PROFITS", companyId: c.id })}
                  className="btn-gold w-full py-2.5 text-sm"
                >
                  وزّع {fmtInt(distributable)} UCN الآن 💰
                </button>

                {/* auto distribution */}
                <div className="mt-4 border-t border-edge/50 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                        التوزيع التلقائي
                        {!lv.autoDistribute && (
                          <span className="flex items-center gap-0.5 text-[9px] text-gold">
                            <Icon name="lock" size={10} /> يفتح في «نامية»
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted">
                        يوزع {lv.setPayout ? `${c.payoutPct}%` : "50%"} من الخزينة كل دورة دون تدخل
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        dispatch({ type: "SET_AUTO_DISTRIBUTE", companyId: c.id, enabled: !c.autoDistribute })
                      }
                      disabled={!lv.autoDistribute}
                      className={`relative h-6 w-11 shrink-0 rounded-full border transition disabled:opacity-40 ${
                        c.autoDistribute ? "border-gold/60 bg-gold/30" : "border-edge bg-card2"
                      }`}
                      aria-label="التوزيع التلقائي"
                    >
                      <span
                        className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${
                          c.autoDistribute ? "right-0.5 bg-gold" : "right-5.5 bg-muted"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-muted">
                        نسبة التوزيع التلقائي
                        {!lv.setPayout && (
                          <span className="flex items-center gap-0.5 text-gold">
                            <Icon name="lock" size={9} /> تُضبط من «رائدة»
                          </span>
                        )}
                      </span>
                      <b className="text-gold">{lv.setPayout ? c.payoutPct : 50}%</b>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={lv.setPayout ? c.payoutPct : 50}
                      disabled={!lv.setPayout || !c.autoDistribute}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_AUTO_DISTRIBUTE",
                          companyId: c.id,
                          enabled: c.autoDistribute,
                          payoutPct: Number(e.target.value),
                        })
                      }
                      className="w-full accent-[#f5c451] disabled:opacity-40"
                    />
                  </div>
                </div>
              </Card>

              {/* deposit + flows */}
              <div className="space-y-4">
                <Card glow="teal" className="p-4">
                  <SectionTitle
                    icon="arrow-up"
                    title="إيداع في الخزينة"
                    sub={`موّل عقود شركتك من رصيدك الشخصي (${fmtInt(game.balances.UCN)} UCN متاح)`}
                  />
                  <AmountInput value={depositStr} onChange={setDepositStr} max={game.balances.UCN} suffix="UCN" />
                  <button
                    disabled={deposit < 1 || deposit > game.balances.UCN}
                    onClick={() => {
                      dispatch({ type: "DEPOSIT_TREASURY", companyId: c.id, amount: deposit });
                      setDepositStr("");
                    }}
                    className="btn-teal mt-3 w-full py-2.5 text-sm"
                  >
                    أودع {deposit > 0 ? fmtInt(deposit) : ""} UCN في الخزينة
                  </button>
                </Card>

                <Card className="p-4">
                  <SectionTitle icon="refresh" title="تدفقات الخزينة" />
                  {flows.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted">لا تدفقات بعد</p>
                  ) : (
                    <div className="max-h-64 space-y-1.5 overflow-y-auto">
                      {flows.map((e, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              e.kind === "distribution" || e.kind === "dividend"
                                ? "bg-up"
                                : e.kind === "salary"
                                  ? "bg-violet"
                                  : e.kind === "deposit"
                                    ? "bg-teal"
                                    : "bg-gold"
                            }`}
                          />
                          <span className="flex-1 leading-4 text-ink">{e.text}</span>
                          <span className="shrink-0 text-[9px] text-muted">{fmtClock(e.t)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        );
      }}
    </CompanyGate>
  );
}
