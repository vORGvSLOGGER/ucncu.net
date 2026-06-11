"use client";

import { useEffect, useState } from "react";
import { fmtCountdown } from "@/lib/format";
import { Icon } from "./Icon";

export function CountdownTimer({
  endsAt,
  className = "",
}: {
  endsAt: number;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = endsAt - now;
  const urgent = left < 60_000;
  return (
    <span
      dir="ltr"
      className={`inline-flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums ${
        urgent ? "text-down animate-pulse-glow" : "text-gold"
      } ${className}`}
    >
      <Icon name="clock" size={14} />
      {fmtCountdown(left)}
    </span>
  );
}
