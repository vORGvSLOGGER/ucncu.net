"use client";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  slices,
  size = 150,
  centerTitle,
  centerValue,
}: {
  slices: DonutSlice[];
  size?: number;
  centerTitle?: string;
  centerValue?: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const visible = slices.filter((s) => s.value > 0);

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-edge)"
            strokeWidth="12"
            opacity="0.5"
          />
          {total > 0 &&
            visible.map((s) => {
              const frac = s.value / total;
              const dash = `${(frac * c).toFixed(2)} ${(c - frac * c).toFixed(2)}`;
              const el = (
                <circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="13"
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += frac * c;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            {centerTitle && <div className="text-[10px] text-muted">{centerTitle}</div>}
            {centerValue && (
              <div className="text-sm font-bold text-ink">{centerValue}</div>
            )}
          </div>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-muted">{s.label}</span>
            <span className="font-semibold text-ink">
              {total > 0 ? ((s.value / total) * 100).toFixed(1) : "0.0"}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
