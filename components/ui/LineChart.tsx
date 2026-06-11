"use client";

import { useId } from "react";
import { fmtCompact } from "@/lib/format";

export function LineChart({
  data,
  height = 180,
  color = "var(--color-teal)",
  showAxis = true,
}: {
  data: number[];
  height?: number;
  color?: string;
  showAxis?: boolean;
}) {
  const gid = useId();
  const width = 600; // viewBox units, scales to container
  if (data.length < 2) {
    return (
      <div
        className="grid place-items-center text-xs text-muted"
        style={{ height }}
      >
        لا تتوفر بيانات كافية بعد…
      </div>
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const padX = showAxis ? 8 : 4;
  const padY = 10;
  const axisW = showAxis ? 56 : 0;
  const plotW = width - axisW - padX * 2;
  const pts = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * plotW;
    const y = padY + (1 - (v - min) / span) * (height - padY * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${padX},${height - padY} ${line} ${padX + plotW},${height - padY}`;
  const [lx, ly] = pts[pts.length - 1];
  const gridYs = [0.25, 0.5, 0.75].map((f) => padY + f * (height - padY * 2));
  const labels = showAxis
    ? [max, min + span / 2, min].map((v, i) => ({
        v,
        y: padY + (i / 2) * (height - padY * 2),
      }))
    : [];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full"
      style={{ height }}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridYs.map((y) => (
        <line
          key={y}
          x1={padX}
          x2={padX + plotW}
          y1={y}
          y2={y}
          stroke="var(--color-edge)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
      ))}
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lx} cy={ly} r="4" fill={color} opacity="0.9" />
      <circle cx={lx} cy={ly} r="8" fill={color} opacity="0.25" />
      {labels.map((l) => (
        <text
          key={l.y}
          x={width - 4}
          y={l.y + 4}
          textAnchor="end"
          fontSize="11"
          fill="var(--color-muted)"
        >
          {fmtCompact(l.v)}
        </text>
      ))}
    </svg>
  );
}
