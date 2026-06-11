"use client";

import { fmtCompact, fmtPrice } from "@/lib/format";
import type { Candle } from "@/lib/types";

export function CandleChart({
  candles,
  height = 240,
}: {
  candles: Candle[];
  height?: number;
}) {
  const width = 600;
  if (candles.length < 2) {
    return (
      <div className="grid place-items-center text-xs text-muted" style={{ height }}>
        لا تتوفر بيانات كافية بعد…
      </div>
    );
  }
  const min = Math.min(...candles.map((c) => c.l));
  const max = Math.max(...candles.map((c) => c.h));
  const span = max - min || 1;
  const padY = 12;
  const axisW = 58;
  const plotW = width - axisW - 8;
  const step = plotW / candles.length;
  const bodyW = Math.max(2, step * 0.55);
  const y = (v: number) => padY + (1 - (v - min) / span) * (height - padY * 2);
  const last = candles[candles.length - 1];
  const lastUp = last.c >= last.o;
  const gridYs = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full"
      style={{ height }}
      preserveAspectRatio="none"
      aria-hidden
    >
      {gridYs.map((f) => (
        <line
          key={f}
          x1={4}
          x2={4 + plotW}
          y1={padY + f * (height - padY * 2)}
          y2={padY + f * (height - padY * 2)}
          stroke="var(--color-edge)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
      ))}
      {candles.map((c, i) => {
        const x = 4 + i * step + step / 2;
        const up = c.c >= c.o;
        const color = up ? "var(--color-up)" : "var(--color-down)";
        const top = y(Math.max(c.o, c.c));
        const bot = y(Math.min(c.o, c.c));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth="1" />
            <rect
              x={x - bodyW / 2}
              y={top}
              width={bodyW}
              height={Math.max(1.5, bot - top)}
              fill={color}
              rx="1"
            />
          </g>
        );
      })}
      {/* last price marker */}
      <line
        x1={4}
        x2={4 + plotW}
        y1={y(last.c)}
        y2={y(last.c)}
        stroke={lastUp ? "var(--color-up)" : "var(--color-down)"}
        strokeWidth="1"
        strokeDasharray="2 4"
        opacity="0.7"
      />
      <rect
        x={8 + plotW}
        y={y(last.c) - 9}
        width={axisW - 12}
        height={18}
        rx="4"
        fill={lastUp ? "var(--color-up)" : "var(--color-down)"}
        opacity="0.9"
      />
      <text
        x={8 + plotW + (axisW - 12) / 2}
        y={y(last.c) + 4}
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="var(--color-bg)"
      >
        {last.c >= 1000 ? fmtCompact(last.c) : fmtPrice(last.c)}
      </text>
      {[0.12, 0.5, 0.88].map((f) => (
        <text
          key={f}
          x={width - 4}
          y={padY + f * (height - padY * 2)}
          textAnchor="end"
          fontSize="10"
          fill="var(--color-muted)"
        >
          {fmtCompact(max - f * span)}
        </text>
      ))}
    </svg>
  );
}
