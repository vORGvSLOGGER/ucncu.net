"use client";

/** semicircle gauge — used for credit score and fear/greed */
export function Gauge({
  value,
  min = 0,
  max = 1000,
  size = 180,
  label,
  sub,
  bands = [
    { upTo: 0.45, color: "var(--color-down)" },
    { upTo: 0.65, color: "var(--color-gold)" },
    { upTo: 1, color: "var(--color-up)" },
  ],
}: {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  label?: string;
  sub?: string;
  bands?: { upTo: number; color: string }[];
}) {
  const w = size;
  const h = size * 0.62;
  const cx = w / 2;
  const cy = h - 6;
  const r = w / 2 - 12;
  const frac = Math.min(1, Math.max(0, (value - min) / (max - min)));

  const arc = (from: number, to: number) => {
    // 180° sweep: from/to are fractions 0..1 (right-to-left visually flipped for RTL is fine)
    const a0 = Math.PI - from * Math.PI;
    const a1 = Math.PI - to * Math.PI;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };

  const needleA = Math.PI - frac * Math.PI;
  const nx = cx + (r - 14) * Math.cos(needleA);
  const ny = cy - (r - 14) * Math.sin(needleA);
  const active = bands.find((b) => frac <= b.upTo)?.color ?? bands[bands.length - 1].color;

  let prev = 0;
  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={h} aria-hidden>
        {bands.map((b, i) => {
          const seg = arc(prev + 0.005, b.upTo - 0.005);
          prev = b.upTo;
          return (
            <path
              key={i}
              d={seg}
              fill="none"
              stroke={b.color}
              strokeWidth="9"
              strokeLinecap="round"
              opacity="0.32"
            />
          );
        })}
        <path
          d={arc(0.002, Math.max(0.01, frac))}
          fill="none"
          stroke={active}
          strokeWidth="9"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${active})` }}
        />
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="var(--color-ink)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill={active} />
      </svg>
      <div className="-mt-7 text-center">
        <div className="text-3xl font-extrabold text-ink">{label ?? value}</div>
        {sub && <div className="text-xs font-semibold" style={{ color: active }}>{sub}</div>}
      </div>
    </div>
  );
}
