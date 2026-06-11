"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { AmountInput } from "@/components/ui/AmountInput";
import { Avatar } from "@/components/ui/Avatar";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { Gauge } from "@/components/ui/Gauge";
import { Icon } from "@/components/ui/Icon";
import { LevelGate } from "@/components/ui/LevelGate";
import { Modal } from "@/components/ui/Modal";
import { PageTitle } from "@/components/ui/PageTitle";
import { StatCard } from "@/components/ui/StatCard";
import { fmtClock, fmtCompact, fmtInt, fmtSigned } from "@/lib/format";
import { BORROWER_OFFERS, botById, LOAN_PRODUCTS } from "@/lib/seed";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";
import type { LoanProductDef } from "@/lib/types";

const CREDIT_TIPS = [
  { icon: "check", text: "سدد أقساطك في مواعيدها — الالتزام بالمواعيد يحسّن تقييمك بشكل كبير" },
  { icon: "chart", text: "قلل من نسبة استخدام القروض — حافظ على نسبة أقل من 50%" },
  { icon: "clock", text: "تجنب طلب قروض متعددة في وقت قصير — الطلبات المتكررة تؤثر سلبًا" },
];

function LoanModal({ product, onClose }: { product: LoanProductDef; onClose: () => void }) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [amountStr, setAmountStr] = useState(String(Math.min(100_000, product.maxAmount)));
  const amount = Math.floor(parseFloat(amountStr) || 0);
  const totalDue = Math.round(amount * (1 + product.ratePct / 100));
  const installment = Math.ceil(totalDue / product.installments);
  const valid = amount > 0 && amount <= product.maxAmount;

  return (
    <Modal open onClose={onClose} title={`طلب ${product.name}`}>
      <div className="mb-3 grid grid-cols-3 gap-2 text-center text-[11px]">
        <div className="rounded-xl border border-edge bg-card2 p-2">
          <div className="text-muted">الفائدة</div>
          <b className="text-gold">{product.ratePct}%</b>
        </div>
        <div className="rounded-xl border border-edge bg-card2 p-2">
          <div className="text-muted">الأقساط</div>
          <b className="text-ink">{product.installments}</b>
        </div>
        <div className="rounded-xl border border-edge bg-card2 p-2">
          <div className="text-muted">الحد الأقصى</div>
          <b className="text-ink">{fmtCompact(product.maxAmount)}</b>
        </div>
      </div>
      <div className="mb-1.5 text-[11px] font-semibold text-muted">مبلغ القرض (UCN)</div>
      <AmountInput value={amountStr} onChange={setAmountStr} max={product.maxAmount} suffix="UCN" />
      <div className="mt-3 space-y-1.5 rounded-xl border border-edge bg-card2 p-3 text-[11px]">
        <div className="flex justify-between">
          <span className="text-muted">إجمالي المستحق</span>
          <b className="text-ink">{fmtInt(totalDue)} UCN</b>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">قيمة القسط ({product.installments} أقساط)</span>
          <b className="text-gold">{fmtInt(installment)} UCN</b>
        </div>
        <p className="border-t border-edge pt-1.5 leading-5 text-muted">
          يُسدد القسط تلقائيًا من رصيدك عند الاستحقاق. السداد في الموعد يرفع تقييمك الائتماني، والتعثر يخفضه.
        </p>
      </div>
      <button
        disabled={!valid}
        onClick={() => {
          dispatch({ type: "TAKE_LOAN", productId: product.id, amount });
          onClose();
        }}
        className="btn-gold mt-4 w-full py-2.5 text-sm"
      >
        تأكيد طلب القرض — استلام {fmtInt(amount)} UCN
      </button>
    </Modal>
  );
}

export default function BankPage() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [loanModal, setLoanModal] = useState<LoanProductDef | null>(null);

  const activeLoans = game.loans.filter((l) => l.status === "active");
  const loansOutstanding = activeLoans.reduce(
    (s, l) => s + (l.totalDue - l.paidInstallments * l.installment),
    0
  );
  const activeLends = game.lends.filter((l) => l.status === "active");
  const lendsTotal = activeLends.reduce((s, l) => s + l.amount, 0);
  const score = game.player.creditScore;
  const scoreLabel = score >= 750 ? "ممتاز" : score >= 650 ? "جيد جدًا" : score >= 550 ? "جيد" : "ضعيف";

  const bankTx = game.transactions
    .filter((t) => ["loan", "installment", "lend", "lend-return"].includes(t.type))
    .slice(0, 8);

  return (
    <LevelGate feature="bank">
      <PageTitle icon="bank" title="البنك" sub="إدارة القروض والودائع وتمويل مستقبلك الذكي" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon="money"
          label="النقد المتاح"
          value={fmtCompact(game.balances.UCN)}
          suffix="UCN"
          iconColor="var(--color-up)"
          glow="teal"
        />
        <StatCard
          icon="bank"
          label="القروض النشطة"
          value={fmtCompact(loansOutstanding)}
          suffix={`UCN — ${activeLoans.length} قروض`}
          iconColor="var(--color-violet)"
        />
        <StatCard
          icon="users"
          label="أموال مُقرضة للاعبين"
          value={fmtCompact(lendsTotal)}
          suffix="UCN"
          iconColor="var(--color-teal)"
        />
        <StatCard
          icon="shield"
          label="التقييم الائتماني"
          value={String(score)}
          suffix={scoreLabel}
          iconColor="var(--color-gold)"
          glow="gold"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* loan products */}
        <Card className="p-4 lg:col-span-2">
          <SectionTitle icon="bank" title="القروض" sub="اختر العرض المناسب واطلب قرضك الآن" />
          <div className="space-y-2.5">
            {LOAN_PRODUCTS.map((p) => {
              const eligible = score >= p.minCredit;
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-edge bg-card2 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-ink">
                      {p.name} <span className="text-[10px] font-normal text-muted">— {p.desc}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                      <span>
                        حتى <b className="text-gold">{fmtCompact(p.maxAmount)} UCN</b>
                      </span>
                      <span>
                        فائدة <b className="text-ink">{p.ratePct}%</b>
                      </span>
                      <span>
                        <b className="text-ink">{p.installments}</b> أقساط
                      </span>
                      {p.minCredit > 0 && (
                        <span>
                          يتطلب تقييم <b className={eligible ? "text-up" : "text-down"}>{p.minCredit}+</b>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    disabled={!eligible}
                    onClick={() => setLoanModal(p)}
                    className="btn-gold shrink-0 px-4 py-1.5 text-xs"
                  >
                    اطلب قرض
                  </button>
                </div>
              );
            })}
          </div>

          {/* active loans */}
          {activeLoans.length > 0 && (
            <div className="mt-5">
              <SectionTitle icon="clock" title="جدول الأقساط" sub="مواعيد سداد أقساطك القادمة" />
              <div className="space-y-2.5">
                {activeLoans.map((l) => {
                  const progress = (l.paidInstallments / l.installments) * 100;
                  return (
                    <div key={l.id} className="rounded-xl border border-edge bg-card2 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <b className="text-ink">
                          {l.productName} — {fmtCompact(l.principal)} UCN
                        </b>
                        <CountdownTimer endsAt={l.nextDueAt} />
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-edge">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-gold to-gold-deep transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-[10px] text-muted">
                        <span>
                          القسط {l.paidInstallments} من {l.installments} — قيمة القسط{" "}
                          <b className="text-ink">{fmtInt(l.installment)} UCN</b>
                        </span>
                        {l.missed > 0 && <span className="font-bold text-down">تعثر ×{l.missed}</span>}
                      </div>
                      <button
                        disabled={game.balances.UCN < l.installment}
                        onClick={() => dispatch({ type: "PAY_DEBT", loanId: l.id })}
                        className="btn-teal mt-2 w-full py-1.5 text-[10px]"
                      >
                        سداد مبكر لقسط الآن — {fmtInt(l.installment)} UCN (+10 XP ورفع التقييم)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* credit score */}
        <Card className="p-4" data-tour="bank-credit">
          <SectionTitle icon="shield" title="تحليل التقييم الائتماني" sub="تفاصيل تقييمك وتطوره" />
          <div className="flex justify-center">
            <Gauge value={score} min={300} max={1000} size={190} label={String(score)} sub={scoreLabel} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="text-xs font-bold text-ink">نصائح لرفع تقييمك الائتماني</div>
            {CREDIT_TIPS.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl border border-edge bg-card2 p-2.5 text-[11px] leading-5 text-muted"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-gold/40 bg-gold/10 text-gold">
                  <Icon name={tip.icon} size={12} />
                </span>
                {tip.text}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* lend to players */}
        <Card className="p-4">
          <SectionTitle
            icon="users"
            title="إقراض اللاعبين"
            sub="أقرض لاعبين موثوقين وحقق عوائد ثابتة"
          />
          <div className="space-y-2.5">
            {BORROWER_OFFERS.map((offer, idx) => {
              const bot = botById(offer.botId);
              const active = game.lends.find(
                (l) => l.botId === offer.botId && l.status === "active"
              );
              return (
                <div
                  key={offer.botId}
                  className="flex items-center gap-3 rounded-xl border border-edge bg-card2 p-3"
                >
                  <Avatar name={bot.name} avatarId={bot.avatarId} size={36} />
                  <div className="min-w-0 flex-1 text-[11px]">
                    <div className="text-xs font-bold text-ink">{bot.name}</div>
                    <div className="flex flex-wrap gap-x-3 text-muted">
                      <span>
                        يطلب <b className="text-gold">{fmtCompact(offer.amount)} UCN</b>
                      </span>
                      <span>
                        عائد <b className="text-up">{offer.ratePct}%</b>
                      </span>
                      <span>
                        تقييم <b className="text-ink">{offer.creditScore}</b>
                      </span>
                      <span>
                        مخاطرة{" "}
                        <b className={offer.risk > 0.15 ? "text-down" : "text-up"}>
                          {Math.round(offer.risk * 100)}%
                        </b>
                      </span>
                    </div>
                  </div>
                  {active ? (
                    <CountdownTimer endsAt={active.dueAt} className="shrink-0" />
                  ) : (
                    <button
                      onClick={() => dispatch({ type: "LEND", offerIdx: idx })}
                      disabled={game.balances.UCN < offer.amount}
                      className="btn-teal shrink-0 px-3.5 py-1.5 text-xs"
                    >
                      إقراض
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* bank log */}
        <Card className="p-4">
          <SectionTitle icon="refresh" title="سجل العمليات البنكية" sub="آخر العمليات المتعلقة بالبنك" />
          {bankTx.length === 0 ? (
            <div className="grid h-32 place-items-center text-xs text-muted">
              لا توجد عمليات بنكية بعد
            </div>
          ) : (
            <div className="divide-y divide-edge/50">
              {bankTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <div className="font-bold text-ink">{tx.label}</div>
                    <div className="text-[10px] text-muted">{fmtClock(tx.t)}</div>
                  </div>
                  <b className={tx.amount >= 0 ? "text-up" : "text-down"} dir="ltr">
                    {fmtSigned(tx.amount)} UCN
                  </b>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {loanModal && <LoanModal product={loanModal} onClose={() => setLoanModal(null)} />}
    </LevelGate>
  );
}
