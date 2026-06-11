"use client";

import { useEffect, type ReactNode } from "react";
import { useGameDispatch, useMaybeGame } from "@/lib/state/GameContext";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { HydrationSplash } from "./HydrationSplash";

function Toasts() {
  const game = useMaybeGame();
  const dispatch = useGameDispatch();
  const toasts = game?.toasts ?? [];

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dispatch({ type: "DISMISS_TOAST", id: t.id }), 3800)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;
  const kindClass = (k: string) =>
    k === "gold"
      ? "border-gold/60 text-gold glow-gold"
      : k === "success"
        ? "border-up/60 text-up"
        : k === "warning"
          ? "border-down/60 text-down"
          : "border-teal/60 text-teal";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dispatch({ type: "DISMISS_TOAST", id: t.id })}
          className={`pointer-events-auto card-base max-w-md px-4 py-2.5 text-xs font-bold animate-toast-in ${kindClass(t.kind)}`}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const game = useMaybeGame();
  if (game === null) return <HydrationSplash />;
  return (
    <div className="mx-auto max-w-6xl px-3">
      <Header />
      <main className="pb-28">{children}</main>
      <BottomNav />
      <Toasts />
    </div>
  );
}
