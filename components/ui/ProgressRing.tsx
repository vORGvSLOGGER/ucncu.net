"use client";

import type { ReactNode } from "react";

export function ProgressRing({
  pct,
  size = 56,
  stroke = 5,
  color = "var(--color-teal)",
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-edge)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
          style={{
            transition: "stroke-dashoffset 0.6s ease",
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-bold text-ink">
        {children ?? `${Math.round(clamped)}%`}
      </div>
    </div>
  );
}
