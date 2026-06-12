"use client";

import Link from "next/link";
import { CompanyGate } from "@/components/company/CompanyGate";
import { Card, SectionTitle } from "@/components/ui/Card";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { Icon } from "@/components/ui/Icon";
import { PageTitle } from "@/components/ui/PageTitle";
import { companyLevel } from "@/lib/companyPerks";
import { companyEmployees } from "@/lib/engine/company";
import { fmtInt, timeAgo } from "@/lib/format";
import { SECTORS } from "@/lib/seed";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";

export default function CompanyContractsPage() {
  const game = useGame();
  const dispatch = useGameDispatch();

  return (
    <CompanyGate>
      {(c) => {
        const lv = companyLevel(c.level);
        const employees = companyEmployees(c).length;
        const offers = c.contracts.filter((k) => k.status === "offer");
        const active = c.contracts.filter((k) => k.status === "active");
        const history = c.contracts.filter((k) => k.status === "done" || k.status === "failed");
        const eventSector = game.marketEvent?.kind === "boom" ? game.marketEvent.sectorId : null;

        return (
          <div>
            <PageTitle
              icon="scroll"
              title="عقود الشركة"
              sub={`خذ العقود، نفّذها، واملأ الخزينة — ${active.length}/${lv.contracts} عقود نشطة في مستوى «${lv.name}»`}
            />

            {game.marketEvent && (
              <Card glow="gold" className="mb-4 flex items-center gap-3 p-3">
                <Icon name={game.marketEvent.kind === "boom" ? "fire" : "arrow-down"} size={18} className={game.marketEvent.kind === "boom" ? "text-gold" : "text-down"} />
                <div className="flex-1 text-[11px]">
                  <b className="text-ink">{game.marketEvent.desc}</b>
                  <div className="text-muted">
                    {game.marketEvent.kind === "boom"
                      ? "عقود هذا القطاع تدفع +25% حتى نهاية الحدث!"
                      : "تجنب المخاطرة الزائدة خلال التصحيح"}
                  </div>
                </div>
                <CountdownTimer endsAt={game.marketEvent.endsAt} />
              </Card>
            )}

            {/* offers */}
            <SectionTitle
              icon="tag"
              title="عروض متاحة"
              sub={`المخاطرة تنخفض 5% عن كل منسوب (لديك ${employees}) — العروض تنتهي سريعًا`}
            />
            {offers.length === 0 ? (
              <Card className="mb-4 p-6 text-center text-xs text-muted">
                لا عروض حاليًا — عروض جديدة تصل كل دقيقتين تقريبًا ⏳
              </Card>
            ) : (
              <div className="mb-4 grid gap-3 lg:grid-cols-3 sm:grid-cols-2">
                {offers.map((k) => {
                  const cost = Math.round(k.cost * (1 - lv.contractDiscount));
                  const effRisk = Math.max(0.02, k.risk - 0.05 * employees);
                  const boosted = eventSector === k.sectorId;
                  return (
                    <Card key={k.id} glow={k.mega ? "gold" : undefined} className={`p-4 ${k.mega ? "border-gold/40" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${k.mega ? "border-gold/40 bg-gold/10 text-gold" : "border-teal/40 bg-teal/10 text-teal"}`}>
                            <Icon name={SECTORS.find((x) => x.id === k.sectorId)?.icon ?? "scroll"} size={17} />
                          </span>
                          <div>
                            <div className="text-[11px] font-bold leading-4 text-ink">{k.title}</div>
                            {boosted && <span className="text-[8px] font-bold text-gold">🔥 معزز بحدث السوق +25%</span>}
                          </div>
                        </div>
                        <CountdownTimer endsAt={k.expiresAt} />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[9px]">
                        <div className="rounded-lg border border-edge bg-card2 p-1.5">
                          <div className="font-extrabold text-down">{fmtInt(cost)}</div>
                          <div className="text-muted">التكلفة</div>
                        </div>
                        <div className="rounded-lg border border-edge bg-card2 p-1.5">
                          <div className="font-extrabold text-up">{fmtInt(k.reward)}</div>
                          <div className="text-muted">العائد</div>
                        </div>
                        <div className="rounded-lg border border-edge bg-card2 p-1.5">
                          <div className={`font-extrabold ${effRisk > 0.2 ? "text-down" : "text-gold"}`}>
                            {Math.round(effRisk * 100)}%
                          </div>
                          <div className="text-muted">المخاطرة</div>
                        </div>
                      </div>
                      <button
                        onClick={() => dispatch({ type: "ACCEPT_CONTRACT", companyId: c.id, contractId: k.id })}
                        disabled={c.treasury < cost || active.length >= lv.contracts}
                        className={`${k.mega ? "btn-gold" : "btn-teal"} mt-3 w-full py-2 text-[11px]`}
                      >
                        {c.treasury < cost
                          ? `الخزينة لا تكفي (${fmtInt(cost)})`
                          : active.length >= lv.contracts
                            ? "بلغت حد العقود — رقِّ الشركة"
                            : `ابدأ التنفيذ — مدة ${Math.round(k.duration / 60_000)} دقائق`}
                      </button>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* active */}
            {active.length > 0 && (
              <>
                <SectionTitle icon="clock" title="قيد التنفيذ" />
                <div className="mb-4 space-y-2">
                  {active.map((k) => {
                    const progress = Math.min(
                      100,
                      ((Date.now() - (k.startedAt ?? 0)) / k.duration) * 100
                    );
                    return (
                      <Card key={k.id} className="p-3.5">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <b className="text-ink">{k.title}</b>
                          <CountdownTimer endsAt={k.endsAt ?? 0} />
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-edge">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-teal to-cyan transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex justify-between text-[9px] text-muted">
                          <span>استثمرت {fmtInt(k.cost)} UCN</span>
                          <span>
                            العائد المتوقع <b className="text-up">{fmtInt(k.reward)} UCN</b>
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {/* treasury hint */}
            {c.treasury < 5000 && (
              <Card className="mb-4 flex items-center gap-3 border-gold/30 p-3 text-[11px]">
                <Icon name="wallet" size={16} className="text-gold" />
                <span className="flex-1 text-muted">
                  خزينتك شبه فارغة ({fmtInt(c.treasury)} UCN) — العقود تُموّل من الخزينة
                </span>
                <Link href="/company/finance" className="btn-gold px-3 py-1.5 text-[10px]">
                  أودع الآن
                </Link>
              </Card>
            )}

            {/* history */}
            {history.length > 0 && (
              <>
                <SectionTitle icon="refresh" title="سجل العقود" />
                <Card className="divide-y divide-edge/50 p-1">
                  {history.map((k) => (
                    <div key={k.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[11px]">
                      <span className="min-w-0 flex-1 truncate font-bold text-ink">{k.title}</span>
                      <span className="text-[9px] text-muted">{timeAgo(k.endsAt ?? k.expiresAt)}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${
                          k.status === "done" ? "border-up/40 text-up" : "border-down/40 text-down"
                        }`}
                      >
                        {k.status === "done" ? `نجح +${fmtInt(k.reward)}` : "تعثر"}
                      </span>
                    </div>
                  ))}
                </Card>
              </>
            )}
          </div>
        );
      }}
    </CompanyGate>
  );
}
