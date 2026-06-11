import type { HTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

export function Card({
  children,
  className = "",
  glow,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  glow?: "gold" | "teal";
} & HTMLAttributes<HTMLDivElement>) {
  const glowClass = glow === "gold" ? "glow-gold" : glow === "teal" ? "glow-teal" : "";
  return (
    <div className={`card-base ${glowClass} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({
  icon,
  title,
  sub,
  action,
}: {
  icon?: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-edge bg-card text-teal">
            <Icon name={icon} size={17} />
          </span>
        )}
        <div>
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          {sub && <p className="text-[11px] text-muted">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
