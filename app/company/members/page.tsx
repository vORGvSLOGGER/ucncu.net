"use client";

import { useState } from "react";
import { CompanyGate } from "@/components/company/CompanyGate";
import { Avatar } from "@/components/ui/Avatar";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { PageTitle } from "@/components/ui/PageTitle";
import { companyLevel, RANK_META } from "@/lib/companyPerks";
import { companyEmployees } from "@/lib/engine/company";
import { fmtCompact, fmtInt, timeAgo } from "@/lib/format";
import { BOTS } from "@/lib/seed";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";
import type { Company } from "@/lib/types";

function HireModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const candidates = BOTS.filter((b) => !company.members.some((m) => m.botId === b.id));

  return (
    <Modal open onClose={onClose} title={`توظيف منسوب في ${company.name} 💼`}>
      <p className="mb-3 text-[11px] leading-5 text-muted">
        المنسوب يرفع إيراد كل دورة بنسبة 8% ويخفض مخاطر العقود 5% — راتبه يُخصم من
        الخزينة تلقائيًا كل دورة. الأصدقاء يقبلون براتب أقل 10%.
      </p>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {candidates.map((b) => {
          const live = game.bots[b.id];
          const friend = game.friends.includes(b.id);
          const salary = Math.max(
            500,
            Math.round(
              company.valuation * (0.005 + ((live?.level ?? 10) / 100) * 0.01) * (friend ? 0.9 : 1)
            )
          );
          return (
            <button
              key={b.id}
              onClick={() => {
                dispatch({ type: "HIRE_EMPLOYEE", companyId: company.id, botId: b.id });
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-edge bg-card2 p-3 text-start transition hover:border-teal/40"
            >
              <Avatar name={b.name} avatarId={b.avatarId} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  {b.name}
                  {friend && (
                    <span className="rounded-full border border-up/40 bg-up/10 px-1.5 text-[8px] font-bold text-up">
                      صديق −10%
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-muted">
                  م{live?.level ?? "?"} · ثروته {fmtCompact(live?.netWorth ?? 0)} UCN
                </div>
              </div>
              <div className="text-end">
                <div className="text-[10px] font-extrabold text-teal">{fmtInt(salary)} UCN</div>
                <div className="text-[8px] text-muted">لكل دورة</div>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

export default function CompanyMembersPage() {
  const dispatch = useGameDispatch();
  const [hiring, setHiring] = useState(false);

  return (
    <CompanyGate>
      {(c) => {
        const lv = companyLevel(c.level);
        const employees = companyEmployees(c);
        const sorted = [...c.members].sort(
          (a, z) => (RANK_META[a.rank]?.weight ?? 9) - (RANK_META[z.rank]?.weight ?? 9)
        );

        return (
          <div>
            <PageTitle
              icon="users"
              title="أعضاء الشركة"
              sub={`${c.members.length} عضوًا — الرتب: مالك · مؤسس · شريك · منسوب · مساهم`}
            />

            <Card glow="teal" className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-teal/40 bg-teal/10 text-teal">
                  <Icon name="plus" size={22} />
                </span>
                <div>
                  <div className="text-sm font-bold text-ink">وظّف منسوبًا جديدًا</div>
                  <div className="text-[11px] text-muted">
                    {employees.length}/{lv.employees} منسوبين في مستوى «{lv.name}» — كل منسوب
                    يرفع الإيراد ويخفض مخاطر العقود
                  </div>
                </div>
              </div>
              <button
                onClick={() => setHiring(true)}
                disabled={employees.length >= lv.employees}
                className="btn-teal px-5 py-2 text-xs"
              >
                {employees.length >= lv.employees ? "بلغت حد المستوى — رقِّ الشركة" : "+ توظيف"}
              </button>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              {sorted.map((m) => {
                const meta = RANK_META[m.rank];
                return (
                  <Card key={m.id} className="card-hover p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} avatarId={m.avatarId} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-ink">
                          {m.name}
                          {m.isPlayer && <span className="text-[9px] text-gold">(أنت)</span>}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[9px] text-muted">
                          <span
                            className="rounded-full border px-2 py-0.5 font-extrabold"
                            style={{ color: meta.color, borderColor: `${meta.color}66`, background: `${meta.color}14` }}
                          >
                            {meta.label}
                          </span>
                          <span>انضم {timeAgo(m.joinedAt)}</span>
                        </div>
                      </div>
                      {m.rank === "employee" && (
                        <button
                          onClick={() =>
                            dispatch({ type: "FIRE_EMPLOYEE", companyId: c.id, memberId: m.id })
                          }
                          className="text-muted/50 transition hover:text-down"
                          aria-label="إنهاء الخدمات"
                          title="إنهاء الخدمات"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[10px]">
                      <div className="rounded-lg border border-edge bg-card2 p-2">
                        <div className="font-extrabold text-ink">{fmtCompact(m.contribution)}</div>
                        <div className="text-muted">المساهمة (UCN)</div>
                      </div>
                      <div className="rounded-lg border border-edge bg-card2 p-2">
                        {m.rank === "employee" ? (
                          <>
                            <div className="font-extrabold text-teal">{fmtInt(m.salary ?? 0)}</div>
                            <div className="text-muted">
                              الراتب/دورة
                              {(m.missedSalaries ?? 0) > 0 && (
                                <span className="text-down"> · متأخر ×{m.missedSalaries}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-extrabold text-gold">
                              {Math.round(
                                c.partners.find((p) => p.name === m.name)?.pct ?? 0
                              )}
                              %
                            </div>
                            <div className="text-muted">حصة الملكية</div>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="mt-4">
              <SectionTitle icon="handshake" title="هل تريد شريكًا برأسمال؟" />
              <Card className="p-4 text-[11px] leading-6 text-muted">
                الشراكات تُعقد من صفحة <b className="text-teal">الأصدقاء</b> في وضع الفرد، أو من
                بطاقة الشركة في <b className="text-teal">قسم الشركات</b> — الشريك المقبول يظهر
                هنا تلقائيًا برتبة «شريك» وبحصته من كل توزيعات الأرباح.
              </Card>
            </div>

            {hiring && <HireModal company={c} onClose={() => setHiring(false)} />}
          </div>
        );
      }}
    </CompanyGate>
  );
}
