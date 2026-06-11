"use client";

import { useId } from "react";

export function Sparkline({
  data,
  width = 96,
  height = 32,
  color,
  filled = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
}) {
  const gid = useId();
  if (data.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const up = data[data.length - 1] >= data[0];
  const stroke = color ?? (up ? "var(--color-up)" : "var(--color-down)");
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;
  return (
    <svg width={width} height={height} className="block" aria-hidden>
      {filled && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill={`url(#${gid})`} />
        </>
      )}
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
