"use client";

import { useEffect, useState } from "react";
import { fmtLiveClock } from "@/lib/format";
import { Icon } from "./Icon";

/** Riyadh-time live clock, self-ticking every second */
export function LiveClock() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return null;
  const { time, weekday } = fmtLiveClock(now);

  return (
    <span className="hidden items-center gap-1.5 rounded-full border border-edge bg-card px-3 py-1 text-[10px] font-semibold text-muted sm:inline-flex">
      <Icon name="clock" size={12} className="text-teal" />
      <span className="font-mono tabular-nums text-ink" dir="ltr">
        {time}
      </span>
      <span>· {weekday} · بتوقيت السعودية 🇸🇦</span>
    </span>
  );
}
