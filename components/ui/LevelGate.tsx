"use client";

import type { ReactNode } from "react";
import { FEATURE_LEVELS } from "@/lib/constants";
import { useGame } from "@/lib/state/GameContext";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { ProgressRing } from "./ProgressRing";

export function LevelGate({
  feature,
  children,
}: {
  feature: keyof typeof FEATURE_LEVELS | string;
  children: ReactNode;
}) {
  const game = useGame();
  const gate = FEATURE_LEVELS[feature];
  if (!gate || game.player.level >= gate.level) return <>{children}</>;

  if (game.settings.exploreMode) {
    return (
      <div>
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/8 px-3 py-2 text-[11px] font-semibold text-gold">
          <Icon name="eye" size={14} />
          وضع المعاينة — قسم {gate.label} يُفتح رسميًا عند المستوى {gate.level}
        </div>
        {children}
      </div>
    );
  }

  const pct = (game.player.level / gate.level) * 100;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40 blur-sm" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 z-10 grid place-items-start justify-center pt-16">
        <Card glow="gold" className="mx-4 flex max-w-sm flex-col items-center gap-3 p-6 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
            <Icon name="lock" size={22} />
          </span>
          <h3 className="text-base font-bold text-ink">قسم {gate.label} مقفل</h3>
          <p className="text-xs text-muted">
            يُفتح هذا القسم عند الوصول إلى المستوى {gate.level}. استمر في التداول والاستثمار لرفع مستواك!
          </p>
          <ProgressRing pct={pct} size={64} color="var(--color-gold)">
            <span className="text-[10px]">
              {game.player.level}/{gate.level}
            </span>
          </ProgressRing>
        </Card>
      </div>
    </div>
  );
}
