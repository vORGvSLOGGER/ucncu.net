"use client";

import { useState } from "react";
import { CompanyGate } from "@/components/company/CompanyGate";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageTitle } from "@/components/ui/PageTitle";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { verificationChecks } from "@/lib/companyPerks";
import { companyRanking } from "@/lib/engine/company";
import { fmtCompact, fmtInt } from "@/lib/format";
import { SECTORS } from "@/lib/seed";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";

const VERIFIED_PERKS = [
  "علامة التوثيق ✓ الذهبية بجوار اسم الشركة في كل مكان",
  "أرباح إضافية +10% على كل دورة",
  "شهرة مضاعفة ×2 من كل إنجاز",
  "تمييز خاص في توب 10 الشركات",
  "أهلية العقود الضخمة الحصرية",
];

export default function CompanyRankPage() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [by, setBy] = useState<"valuation" | "fame">("valuation");
  const rows = companyRanking(game, by);

  return (
    <CompanyGate>
      {(c) => {
        const checks = verificationChecks(c);
        const eligible = checks.every((x) => x.met);

        return (
          <div>
            <PageTitle
              icon="trophy"
              title="ترتيب الشركات"
              sub="القمة للأفراد… لكن للشركات الكبرى مجدها الخاص — توب 10 الإمبراطوريات"
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* top 10 */}
              <Card className="p-4 lg:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <SectionTitle icon="trophy" title="توب 10 الشركات" />
                  <TabSwitcher
                    size="sm"
                    tabs={[
                      { id: "valuation", label: "التقييم" },
                      { id: "fame", label: "الشهرة" },
                    ]}
                    active={by}
                    onChange={(id) => setBy(id as "valuation" | "fame")}
                  />
                </div>
                <div className="space-y-1.5">
                  {rows.map((r, i) => (
                    <div
                      key={r.id}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs ${
                        r.mine ? "border-gold/50 bg-gold/10 glow-gold" : "border-edge bg-card2"
                      }`}
                    >
                      <span
                        className={`w-5 text-center font-extrabold ${
                          i === 0 ? "text-gold" : i < 3 ? "text-teal" : "text-muted"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-edge bg-card text-teal">
                        <Icon name={SECTORS.find((x) => x.id === r.sectorId)?.icon ?? "briefcase"} size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-ink">
                          <span className="truncate">{r.name}</span>
                          {r.verified && (
                            <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-gold text-bg" title="موثقة">
                              <Icon name="check" size={8} strokeWidth={3} />
                            </span>
                          )}
                          {r.level >= 5 && <span title="إمبراطورية">👑</span>}
                          {r.mine && <span className="text-[9px] text-gold">(شركتك)</span>}
                        </div>
                        <div className="text-[9px] text-muted">
                          {r.ownerName} · {SECTORS.find((x) => x.id === r.sectorId)?.name}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="font-extrabold text-gold">
                          {by === "valuation" ? fmtCompact(r.valuation) : fmtInt(r.fame)}
                        </div>
                        <div className="text-[8px] text-muted">{by === "valuation" ? "UCN" : "شهرة"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* verification */}
              <div className="space-y-4">
                <Card
                  glow={c.verification === "verified" ? "gold" : "teal"}
                  className="p-4"
                >
                  <SectionTitle
                    icon="shield"
                    title="توثيق الإدارة العليا"
                    sub="التوثيق ✓ امتياز تمنحه الإدارة للشركات المستوفية"
                  />
                  {c.verification === "verified" ? (
                    <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-center">
                      <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-gold text-bg">
                        <Icon name="check" size={20} strokeWidth={3} />
                      </span>
                      <div className="text-sm font-extrabold text-gold">شركتك موثقة رسميًا</div>
                      <p className="mt-1 text-[10px] text-muted">كل امتيازات التوثيق مفعلة</p>
                    </div>
                  ) : c.verification === "pending" ? (
                    <div className="rounded-xl border border-teal/40 bg-teal/10 p-4 text-center animate-pulse-glow">
                      <Icon name="clock" size={22} className="mx-auto mb-2 text-teal" />
                      <div className="text-xs font-bold text-teal">طلبك قيد مراجعة الإدارة العليا…</div>
                      <p className="mt-1 text-[10px] text-muted">القرار يصدر خلال دقائق ويصلك إشعار</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 space-y-1.5">
                        {checks.map((x) => (
                          <div key={x.label} className="flex items-center gap-2 text-[11px]">
                            <span
                              className={`grid h-4.5 w-4.5 place-items-center rounded-full border ${
                                x.met ? "border-up/50 bg-up/10 text-up" : "border-edge bg-card text-muted"
                              }`}
                            >
                              <Icon name={x.met ? "check" : "close"} size={9} strokeWidth={3} />
                            </span>
                            <span className={x.met ? "text-ink" : "text-muted"}>{x.label}</span>
                          </div>
                        ))}
                      </div>
                      {c.verification === "rejected" && (
                        <p className="mb-2 rounded-lg border border-down/40 bg-down/10 p-2 text-[10px] text-down">
                          رُفض طلبك السابق — استوفِ الشروط وأعد التقديم
                        </p>
                      )}
                      <button
                        disabled={!eligible}
                        onClick={() => dispatch({ type: "REQUEST_VERIFICATION", companyId: c.id })}
                        className="btn-gold w-full py-2.5 text-sm"
                      >
                        {eligible ? "قدّم طلب التوثيق 🏛️" : "استوفِ الشروط أولًا"}
                      </button>
                    </>
                  )}
                </Card>

                <Card className="p-4">
                  <SectionTitle icon="star" title="امتيازات الشركات الموثقة" />
                  <ul className="space-y-1.5 text-[11px] leading-5 text-muted">
                    {VERIFIED_PERKS.map((p) => (
                      <li key={p} className="flex items-start gap-1.5">
                        <Icon name="check" size={11} className="mt-0.5 shrink-0 text-gold" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        );
      }}
    </CompanyGate>
  );
}
