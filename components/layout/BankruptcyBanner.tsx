"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fmtCountdownLong, fmtInt } from "@/lib/format";
import { outstandingDebt, totalAssets } from "@/lib/selectors";
import { useGame } from "@/lib/state/GameContext";
import { Icon } from "../ui/Icon";

export function BankruptcyBanner() {
  const game = useGame();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (game.bankruptcy.status !== "grace") return null;
  const left = (game.bankruptcy.deadline ?? 0) - now;
  const debt = outstandingDebt(game);
  const gap = Math.max(0, debt - totalAssets(game));

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-down/50 bg-down/10 p-4 animate-pulse-glow">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-down/50 bg-down/15 text-down">
          <Icon name="fire" size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-down">⚠️ حالة إفلاس — انجُ قبل فوات الأوان</div>
          <div className="mt-0.5 text-[11px] leading-5 text-muted">
            ديونك {fmtInt(debt)} UCN تتجاوز أصولك بـ {fmtInt(gap)} UCN. بِع أصولًا، سدّد
            مبكرًا، أو انتظر فزعة المجتمع — وإلا فالنهاية معروفة.
          </div>
        </div>
        <div className="text-center">
          <div className="font-mono text-xl font-extrabold tabular-nums text-down" dir="ltr">
            {fmtCountdownLong(left)}
          </div>
          <div className="text-[9px] text-muted">المتبقي من المهلة</div>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Link href="/bank" className="btn-gold flex-1 px-4 py-2 text-center text-xs sm:flex-none">
            سداد الآن
          </Link>
          <Link href="/explore?tab=ihsan" className="btn-ghost flex-1 px-4 py-2 text-center text-xs sm:flex-none">
            صفحة الإحسان 🤲
          </Link>
        </div>
      </div>
    </div>
  );
}
