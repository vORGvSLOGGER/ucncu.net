"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { AmountInput } from "@/components/ui/AmountInput";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { LevelGate } from "@/components/ui/LevelGate";
import { LineChart } from "@/components/ui/LineChart";
import { Modal } from "@/components/ui/Modal";
import { PageTitle } from "@/components/ui/PageTitle";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatCard } from "@/components/ui/StatCard";
import { fmtClock, fmtCompact, fmtInt, fmtPct } from "@/lib/format";
import { BOTS, botById, SECTORS } from "@/lib/seed";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";
import type { Company } from "@/lib/types";

const LEVEL_LABELS = ["", "ناشئة", "نامية", "رائدة"];

function UpgradeModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const level = company.level || 1;
  const cost = Math.round(company.valuation * (level === 1 ? 0.3 : 0.5));
  const nextLabel = LEVEL_LABELS[level + 1];
  const can = game.balances.UCN >= cost;

  return (
    <Modal open onClose={onClose} title={`ترقية ${company.name} 🏆`}>
      <div className="mb-3 flex items-center justify-center gap-3 text-sm font-extrabold">
        <span className="text-muted">{LEVEL_LABELS[level]}</span>
        <Icon name="arrow-up" size={16} className="rotate-90 text-gold" />
        <span className="text-gold">{nextLabel}</span>
      </div>
      <div className="space-y-2 text-[11px] leading-5 text-muted">
        <div className="flex items-center justify-between rounded-xl border border-edge bg-card2 p-3">
          <span>تكلفة الترقية (تُضخ في الشركة)</span>
          <b className="text-ink">{fmtInt(cost)} UCN</b>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-edge bg-card2 p-3">
          <span>عائد التوزيعات</span>
          <b className="text-up">+25% لكل مستوى</b>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-edge bg-card2 p-3">
          <span>التقييم بعد الترقية</span>
          <b className="text-gold">≈ {fmtInt(Math.round((company.valuation + cost) * 1.05))} UCN</b>
        </div>
      </div>
      <button
        disabled={!can}
        onClick={() => {
          dispatch({ type: "UPGRADE_COMPANY", companyId: company.id });
          onClose();
        }}
        className="btn-gold mt-4 w-full py-2.5 text-sm"
      >
        {can ? `رقِّ الشركة — ${fmtInt(cost)} UCN` : `تحتاج ${fmtInt(cost)} UCN`}
      </button>
    </Modal>
  );
}

function InvitePartnerModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const eligible = game.friends.filter(
    (id) =>
      !company.partners.some((p) => p.name === botById(id).name) &&
      !game.partnerships.some(
        (p) => p.companyId === company.id && p.botId === id && p.status === "pending"
      )
  );

  return (
    <Modal open onClose={onClose} title={`دعوة شريك إلى ${company.name}`}>
      {game.friends.length === 0 ? (
        <p className="py-4 text-center text-xs leading-6 text-muted">
          الشراكات تُعقد بين الأصدقاء —{" "}
          <Link href="/friends" className="font-bold text-teal hover:underline">
            أضف أصدقاء أولًا ←
          </Link>
        </p>
      ) : eligible.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted">
          كل أصدقائك شركاء بالفعل أو يدرسون دعوات سابقة
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] leading-5 text-muted">
            الشريك يضخ 20-35% من التقييم رأسمالًا مقابل حصة — وترتفع قيمة الشركة بقوة
            الاسم المنضم.
          </p>
          {eligible.map((id) => {
            const bot = botById(id);
            const live = game.bots[id];
            return (
              <button
                key={id}
                onClick={() => {
                  dispatch({ type: "INVITE_PARTNER", botId: id, companyId: company.id });
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-edge bg-card2 p-3 text-start transition hover:border-gold/40"
              >
                <Avatar name={bot.name} avatarId={bot.avatarId} size={32} />
                <div className="flex-1">
                  <div className="text-xs font-bold text-ink">{bot.name}</div>
                  <div className="text-[9px] text-muted">
                    ثروته {fmtCompact(live?.netWorth ?? 0)} UCN · م{live?.level}
                  </div>
                </div>
                <Icon name="handshake" size={15} className="text-teal" />
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function FoundCompanyModal({ onClose }: { onClose: () => void }) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [name, setName] = useState("");
  const [sectorId, setSectorId] = useState(SECTORS[0].id);
  const [capitalStr, setCapitalStr] = useState("100000");
  const [partnerBotId, setPartnerBotId] = useState("");
  const [partnerPct, setPartnerPct] = useState(30);

  const capital = Math.floor(parseFloat(capitalStr) || 0);
  const valid = capital >= 50_000 && capital <= game.balances.UCN && name.trim().length >= 2;

  return (
    <Modal open onClose={onClose} title="إنشاء شركة 🚀">
      <div className="mb-1.5 text-[11px] font-semibold text-muted">اسم الشركة</div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="مثال: نيو تك"
        className="mb-3 w-full rounded-xl border border-edge bg-card2 px-3 py-2.5 text-sm font-bold text-ink outline-none placeholder:text-muted/50 focus:border-teal/50"
      />

      <div className="mb-1.5 text-[11px] font-semibold text-muted">اختر القطاع المناسب</div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {SECTORS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSectorId(s.id)}
            className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-[10px] font-bold transition ${
              sectorId === s.id
                ? "border-gold/50 bg-gold/10 text-gold"
                : "border-edge bg-card2 text-muted"
            }`}
          >
            <Icon name={s.icon} size={18} />
            {s.name}
          </button>
        ))}
      </div>

      <div className="mb-1.5 text-[11px] font-semibold text-muted">
        رأس المال (الحد الأدنى 50,000 UCN)
      </div>
      <AmountInput value={capitalStr} onChange={setCapitalStr} max={game.balances.UCN} suffix="UCN" />

      <div className="mt-3 mb-1.5 text-[11px] font-semibold text-muted">شريك مؤسس (اختياري)</div>
      <select
        value={partnerBotId}
        onChange={(e) => setPartnerBotId(e.target.value)}
        className="w-full rounded-xl border border-edge bg-card2 px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-teal/50"
      >
        <option value="">بدون شريك — ملكية 100%</option>
        {BOTS.slice(0, 6).map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      {partnerBotId && (
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-[11px] text-muted">
            <span>حصة الشريك</span>
            <b className="text-gold">{partnerPct}%</b>
          </div>
          <input
            type="range"
            min={5}
            max={49}
            value={partnerPct}
            onChange={(e) => setPartnerPct(Number(e.target.value))}
            className="w-full accent-[#f5c451]"
          />
          <p className="mt-1 text-[10px] leading-4 text-muted">
            الشريك يضخ رأس مال إضافيًا بنسبة حصته، فيرتفع تقييم الشركة — وتوزَّع الأرباح حسب النسب.
          </p>
        </div>
      )}

      <button
        disabled={!valid}
        onClick={() => {
          dispatch({
            type: "FOUND_COMPANY",
            name,
            sectorId,
            capital,
            partnerBotId: partnerBotId || undefined,
            partnerPct: partnerBotId ? partnerPct : undefined,
          });
          onClose();
        }}
        className="btn-gold mt-4 w-full py-2.5 text-sm"
      >
        إطلاق الشركة — {fmtInt(capital)} UCN
      </button>
    </Modal>
  );
}

function SellSharesModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const dispatch = useGameDispatch();
  const [pct, setPct] = useState(Math.min(10, company.ownershipPct));
  const proceeds = Math.round(((company.valuation * pct) / 100) * 0.97);

  return (
    <Modal open onClose={onClose} title={`بيع حصص — ${company.name}`}>
      <div className="mb-1 flex justify-between text-[11px] text-muted">
        <span>النسبة المراد بيعها</span>
        <b className="text-gold">{pct}%</b>
      </div>
      <input
        type="range"
        min={1}
        max={Math.floor(company.ownershipPct)}
        value={pct}
        onChange={(e) => setPct(Number(e.target.value))}
        className="w-full accent-[#f5c451]"
      />
      <div className="mt-3 flex items-center justify-between rounded-xl border border-edge bg-card2 p-3 text-sm">
        <span className="text-muted">ستحصل على (بعد خصم سيولة 3%)</span>
        <b className="text-up">{fmtInt(proceeds)} UCN</b>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-muted">
        ملكيتك بعد البيع: {(company.ownershipPct - pct).toFixed(0)}% — إذا وصلت ملكيتك إلى 0% تتخارج من الشركة نهائيًا.
      </p>
      <button
        onClick={() => {
          dispatch({ type: "SELL_SHARES", companyId: company.id, pct });
          onClose();
        }}
        className="btn-teal mt-4 w-full py-2.5 text-sm"
      >
        تأكيد البيع
      </button>
    </Modal>
  );
}

export default function CompaniesPage() {
  const game = useGame();
  const [foundOpen, setFoundOpen] = useState(false);
  const [sellCompany, setSellCompany] = useState<Company | null>(null);
  const [upgradeCompany, setUpgradeCompany] = useState<Company | null>(null);
  const [inviteCompany, setInviteCompany] = useState<Company | null>(null);

  const totalValuation = game.companies.reduce((s, c) => s + c.valuation, 0);
  const myEquity = game.companies.reduce((s, c) => s + (c.valuation * c.ownershipPct) / 100, 0);
  const totalDividends = game.companies.reduce((s, c) => s + c.dividendsPaid, 0);

  return (
    <LevelGate feature="companies">
      <PageTitle
        icon="briefcase"
        title="الشركات"
        sub="بناء وإدارة والاستثمار في الشركات لتحقيق النمو والهيمنة الاقتصادية"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon="briefcase"
          label="عدد الشركات المملوكة"
          value={String(game.companies.length)}
          suffix="شركة نشطة"
          iconColor="var(--color-teal)"
        />
        <StatCard
          icon="chart"
          label="إجمالي تقييم الشركات"
          value={fmtCompact(totalValuation)}
          suffix="UCN"
          glow="gold"
          iconColor="var(--color-gold)"
        />
        <StatCard
          icon="wallet"
          label="قيمة حصصي"
          value={fmtCompact(myEquity)}
          suffix="UCN"
          iconColor="var(--color-violet)"
        />
        <StatCard
          icon="money"
          label="الأرباح الموزعة"
          value={fmtCompact(totalDividends)}
          suffix="UCN"
          iconColor="var(--color-up)"
        />
      </div>

      {/* found company CTA */}
      <Card glow="gold" className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-gold/40 bg-gold/10 text-gold">
            <Icon name="plus" size={22} />
          </span>
          <div>
            <div className="text-sm font-bold text-ink">إنشاء شركة ✈️</div>
            <div className="text-[11px] text-muted">
              أطلق شركتك الجديدة وابدأ رحلتك نحو التوسع — اختر القطاع، حدد رأس المال، وأدخل شركاء
            </div>
          </div>
        </div>
        <button onClick={() => setFoundOpen(true)} className="btn-gold px-5 py-2 text-xs">
          + إطلاق جديدة
        </button>
      </Card>

      {/* companies */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {game.companies.length === 0 && (
          <Card className="p-8 text-center text-xs text-muted lg:col-span-2">
            لا تملك أي شركة بعد — أسس شركتك الأولى وكن رائد أعمال 🚀
            <br />
            <span className="text-[10px]">(الحد الأدنى لرأس المال: 50,000 UCN)</span>
          </Card>
        )}
        {game.companies.map((c) => {
          const sector = SECTORS.find((s) => s.id === c.sectorId);
          const delta =
            c.history.length > 1
              ? ((c.valuation - c.history[0]) / c.history[0]) * 100
              : 0;
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-teal/40 bg-teal/10 text-teal">
                    <Icon name={sector?.icon ?? "briefcase"} size={22} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-extrabold text-ink">
                      {c.name}
                      <span className="flex items-center gap-0.5" title={LEVEL_LABELS[c.level || 1]}>
                        {[1, 2, 3].map((n) => (
                          <Icon
                            key={n}
                            name="star"
                            size={11}
                            className={n <= (c.level || 1) ? "text-gold" : "text-edge"}
                            fill={n <= (c.level || 1) ? "currentColor" : "none"}
                          />
                        ))}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted">
                      {sector?.name} · شركة {LEVEL_LABELS[c.level || 1]}
                      {(c.level || 1) > 1 && (
                        <span className="text-up"> · توزيعات +{((c.level || 1) - 1) * 25}%</span>
                      )}
                    </div>
                  </div>
                </div>
                <ProgressRing pct={c.ownershipPct} size={52} color="var(--color-gold)">
                  <span className="text-[10px]">{Math.round(c.ownershipPct)}%</span>
                </ProgressRing>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-gold-grad">
                  {fmtCompact(c.valuation)}
                </span>
                <span className="text-[10px] text-muted">UCN تقييم الشركة</span>
                <span
                  className={`ms-auto text-xs font-bold ${delta >= 0 ? "text-up" : "text-down"}`}
                  dir="ltr"
                >
                  {fmtPct(delta)}
                </span>
              </div>

              <div className="mt-2">
                <LineChart data={c.history} height={110} color="var(--color-teal)" showAxis={false} />
              </div>

              {/* partners */}
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] font-bold text-muted">الشركاء والمساهمون</div>
                <div className="space-y-1.5">
                  {c.partners.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between rounded-lg border border-edge bg-card2 px-2.5 py-1.5 text-[11px]"
                    >
                      <span className="flex items-center gap-2">
                        <Avatar name={p.name} avatarId={p.avatarId ?? 11} size={22} />
                        <b className="text-ink">{p.name}</b>
                        {p.isPlayer && (
                          <span className="rounded-full border border-gold/40 bg-gold/10 px-1.5 text-[9px] font-bold text-gold">
                            أنت
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-3 text-muted">
                        <span>
                          استثمار <b className="text-ink">{fmtCompact(p.invested)}</b>
                        </span>
                        <b className="w-9 text-end text-gold">{Math.round(p.pct)}%</b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* events */}
              <div className="mt-3 max-h-24 space-y-1 overflow-y-auto">
                {c.events.slice(0, 4).map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-muted">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        e.kind === "dividend" || e.kind === "growth"
                          ? "bg-up"
                          : e.kind === "drop"
                            ? "bg-down"
                            : "bg-gold"
                      }`}
                    />
                    {e.text} — {fmtClock(e.t)}
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-muted">
                  أرباح موزعة: <b className="text-up">+{fmtInt(c.dividendsPaid)} UCN</b>
                </span>
                <div className="flex gap-1.5">
                  {(c.level || 1) < 3 && (
                    <button
                      onClick={() => setUpgradeCompany(c)}
                      className="btn-gold px-3.5 py-1.5 text-[11px]"
                    >
                      ⬆ ترقية
                    </button>
                  )}
                  <button
                    onClick={() => setInviteCompany(c)}
                    className="btn-teal px-3.5 py-1.5 text-[11px]"
                  >
                    🤝 شريك
                  </button>
                  <button
                    onClick={() => setSellCompany(c)}
                    className="btn-ghost px-3.5 py-1.5 text-[11px]"
                  >
                    بيع حصص
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {foundOpen && <FoundCompanyModal onClose={() => setFoundOpen(false)} />}
      {sellCompany && (
        <SellSharesModal
          company={game.companies.find((c) => c.id === sellCompany.id) ?? sellCompany}
          onClose={() => setSellCompany(null)}
        />
      )}
      {upgradeCompany && (
        <UpgradeModal
          company={game.companies.find((c) => c.id === upgradeCompany.id) ?? upgradeCompany}
          onClose={() => setUpgradeCompany(null)}
        />
      )}
      {inviteCompany && (
        <InvitePartnerModal
          company={game.companies.find((c) => c.id === inviteCompany.id) ?? inviteCompany}
          onClose={() => setInviteCompany(null)}
        />
      )}
    </LevelGate>
  );
}
