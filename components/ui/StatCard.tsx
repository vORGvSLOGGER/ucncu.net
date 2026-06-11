import type { ReactNode } from "react";
import { fmtPct } from "@/lib/format";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { Sparkline } from "./Sparkline";

export function StatCard({
  icon,
  iconColor = "var(--color-teal)",
  label,
  value,
  suffix,
  deltaPct,
  deltaLabel,
  spark,
  glow,
  children,
}: {
  icon?: string;
  iconColor?: string;
  label: string;
  value: string;
  suffix?: string;
  deltaPct?: number;
  deltaLabel?: string;
  spark?: number[];
  glow?: "gold" | "teal";
  children?: ReactNode;
}) {
  return (
    <Card glow={glow} className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] text-muted">{label}</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="truncate text-lg font-extrabold text-ink sm:text-xl">{value}</span>
            {suffix && <span className="text-[10px] font-semibold text-muted">{suffix}</span>}
          </div>
          {deltaPct !== undefined && (
            <div
              className={`mt-0.5 flex items-center gap-1 text-[11px] font-bold ${
                deltaPct >= 0 ? "text-up" : "text-down"
              }`}
            >
              <Icon name={deltaPct >= 0 ? "arrow-up" : "arrow-down"} size={11} strokeWidth={2.4} />
              {fmtPct(deltaPct)}
              {deltaLabel && <span className="font-normal text-muted">{deltaLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-edge"
            style={{ color: iconColor, background: "rgba(13,20,36,0.7)" }}
          >
            <Icon name={icon} size={18} />
          </span>
        )}
      </div>
      {spark && spark.length > 1 && (
        <div className="mt-2">
          <Sparkline data={spark} width={180} height={26} />
        </div>
      )}
      {children}
    </Card>
  );
}
