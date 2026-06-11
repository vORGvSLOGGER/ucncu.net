"use client";

import { Card, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { LevelGate } from "@/components/ui/LevelGate";
import { PageTitle } from "@/components/ui/PageTitle";
import { Sparkline } from "@/components/ui/Sparkline";
import { StatCard } from "@/components/ui/StatCard";
import { pk, RENT_PERIOD_MS } from "@/lib/constants";
import { fmtCompact, fmtInt, fmtPct } from "@/lib/format";
import { PROPERTIES } from "@/lib/seed";
import { propertyDef, propertyValue } from "@/lib/selectors";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";

export default function RealEstatePage() {
  const game = useGame();
  const dispatch = useGameDispatch();

  const ownedDefs = new Set(game.properties.map((p) => p.defId));
  const totalValue = game.properties.reduce((s, p) => s + propertyValue(game, p.defId), 0);
  const totalPaid = game.properties.reduce((s, p) => s + p.paidPrice, 0);
  const totalRent = game.properties.reduce((s, p) => s + p.rentCollected, 0);
  const rentPerCycle = game.properties.reduce(
    (s, p) => s + (propertyDef(p.defId)?.rentPerCycle ?? 0),
    0
  );
  const appreciation = totalPaid > 0 ? ((totalValue - totalPaid) / totalPaid) * 100 : 0;

  return (
    <LevelGate feature="realestate">
      <PageTitle
        icon="building"
        title="العقارات"
        sub="استثمر في عقارات تولّد دخلًا دوريًا وتنمو قيمتها مع الوقت"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon="building"
          label="قيمة المحفظة العقارية"
          value={fmtCompact(totalValue)}
          suffix="UCN"
          deltaPct={game.properties.length > 0 ? appreciation : undefined}
          deltaLabel="منذ الشراء"
          glow="gold"
          iconColor="var(--color-gold)"
        />
        <StatCard
          icon="money"
          label="الدخل الإيجاري"
          value={fmtInt(rentPerCycle)}
          suffix={`UCN / ${RENT_PERIOD_MS / 1000} ث`}
          iconColor="var(--color-up)"
        />
        <StatCard
          icon="coins"
          label="إجمالي الإيجارات المحصلة"
          value={fmtCompact(totalRent)}
          suffix="UCN"
          iconColor="var(--color-teal)"
        />
        <StatCard
          icon="home"
          label="عدد العقارات"
          value={String(game.properties.length)}
          suffix="عقار نشط"
          iconColor="var(--color-violet)"
        />
      </div>

      {/* owned */}
      <div className="mt-6">
        <SectionTitle icon="wallet" title="عقاراتي" sub="ممتلكاتك العقارية ودخلها" />
        {game.properties.length === 0 ? (
          <Card className="p-6 text-center text-xs text-muted">
            لا تملك أي عقار بعد — تصفح العقارات المتاحة أدناه وابدأ ببناء دخلك السلبي 🏠
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {game.properties.map((p) => {
              const def = propertyDef(p.defId);
              if (!def) return null;
              const value = propertyValue(game, p.defId);
              const gain = ((value - p.paidPrice) / p.paidPrice) * 100;
              return (
                <Card key={p.id} glow="gold" className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-gold/40 bg-gold/10 text-gold">
                      <Icon name={def.icon} size={22} />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-ink">{def.name}</div>
                      <div className="text-[10px] text-muted">{def.district}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg border border-edge bg-card2 p-2">
                      <div className="text-muted">القيمة الآن</div>
                      <b className="text-ink">{fmtCompact(value)} UCN</b>
                      <span className={`ms-1 font-bold ${gain >= 0 ? "text-up" : "text-down"}`}>
                        {fmtPct(gain)}
                      </span>
                    </div>
                    <div className="rounded-lg border border-edge bg-card2 p-2">
                      <div className="text-muted">إيجار متراكم</div>
                      <b className="text-up">+{fmtInt(p.rentCollected)} UCN</b>
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch({ type: "SELL_PROPERTY", id: p.id })}
                    className="btn-teal mt-3 w-full py-2 text-xs"
                  >
                    بيع بسعر السوق — {fmtCompact(value)} UCN
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* available */}
      <div className="mt-6">
        <SectionTitle icon="cart" title="متاح للشراء" sub="فرص عقارية بعوائد دورية" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROPERTIES.filter((d) => !ownedDefs.has(d.id)).map((def) => {
            const entry = game.prices[pk.re(def.id)];
            const yieldPct = (def.rentPerCycle / entry.price) * 100;
            const affordable = game.balances.UCN >= entry.price;
            return (
              <Card key={def.id} className="p-4">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-edge bg-card text-teal">
                    <Icon name={def.icon} size={22} />
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      entry.changePct >= 0
                        ? "border-up/40 text-up"
                        : "border-down/40 text-down"
                    }`}
                    dir="ltr"
                  >
                    {fmtPct(entry.changePct)}
                  </span>
                </div>
                <div className="mt-2 text-sm font-bold text-ink">{def.name}</div>
                <div className="text-[10px] text-muted">{def.district}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-lg font-extrabold text-gold-grad">
                    {fmtCompact(entry.price)}
                  </span>
                  <span className="text-[10px] text-muted">UCN</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                  <span>
                    عائد <b className="text-up">{yieldPct.toFixed(2)}%</b> لكل دورة
                  </span>
                  <span>
                    إيجار <b className="text-ink">{fmtInt(def.rentPerCycle)}</b>
                  </span>
                </div>
                <div className="mt-1.5">
                  <Sparkline data={entry.spark.slice(-30)} width={200} height={26} />
                </div>
                <button
                  disabled={!affordable}
                  onClick={() => dispatch({ type: "BUY_PROPERTY", defId: def.id })}
                  className="btn-gold mt-2.5 w-full py-2 text-xs"
                >
                  {affordable ? "شراء العقار" : "رصيد غير كافٍ"}
                </button>
              </Card>
            );
          })}
        </div>
      </div>
    </LevelGate>
  );
}
