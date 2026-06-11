"use client";

import { useEffect, type ReactNode } from "react";
import { useGameDispatch, useGameMode, useMaybeGame } from "@/lib/state/GameContext";
import { TutorialOverlay } from "../tutorial/TutorialOverlay";
import { Modal } from "../ui/Modal";
import { BankruptcyBanner } from "./BankruptcyBanner";
import { BottomNav } from "./BottomNav";
import { GameOverScreen } from "./GameOverScreen";
import { Header } from "./Header";
import { HydrationSplash } from "./HydrationSplash";
import { ModeSelect } from "./ModeSelect";

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

/** ripple feedback on every button press — pure CSS + touch coordinates */
function useRipple() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest?.(
        "button, .btn-gold, .btn-teal, .btn-ghost"
      ) as HTMLElement | null;
      if (!target || target.dataset.noRipple !== undefined) return;
      const rect = target.getBoundingClientRect();
      const span = document.createElement("span");
      const size = Math.max(rect.width, rect.height) * 2;
      span.className = "ui-ripple";
      span.style.width = span.style.height = `${size}px`;
      span.style.left = `${e.clientX - rect.left - size / 2}px`;
      span.style.top = `${e.clientY - rect.top - size / 2}px`;
      const style = getComputedStyle(target);
      if (style.position === "static") target.style.position = "relative";
      if (style.overflow !== "hidden") target.style.overflow = "hidden";
      target.appendChild(span);
      setTimeout(() => span.remove(), 650);
    };
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);
}

function TutorialInvite() {
  const game = useMaybeGame();
  const dispatch = useGameDispatch();
  if (!game || game.tutorial.status !== "pending") return null;
  return (
    <Modal open onClose={() => dispatch({ type: "TUTORIAL_SKIP" })} title="جولة تعليمية تفاعلية 🎓">
      <p className="text-xs leading-6 text-muted">
        أول مرة هنا؟ جولة من {`14`} خطوة تشرح لك صافي الثروة والشموع اليابانية والسبريد
        والتقييم الائتماني وأسرار المزاد — وتكسبك أكثر من <b className="text-gold">250 XP</b> مكافآت.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => dispatch({ type: "TUTORIAL_START" })}
          className="btn-gold flex-1 px-4 py-2.5 text-sm"
        >
          ابدأ الجولة ✨
        </button>
        <button
          onClick={() => dispatch({ type: "TUTORIAL_SKIP" })}
          className="btn-ghost px-4 py-2.5 text-sm"
        >
          لاحقًا
        </button>
      </div>
    </Modal>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const game = useMaybeGame();
  const { mode } = useGameMode();
  useRipple();

  if (mode === undefined) return <HydrationSplash />;
  if (mode === null) return <ModeSelect />;
  if (game === null) return <HydrationSplash />;
  if (game.bankruptcy.status === "gameover") return <GameOverScreen />;

  return (
    <div className="mx-auto max-w-6xl px-3">
      <Header />
      <BankruptcyBanner />
      <main className="pb-28 animate-page-in">{children}</main>
      <BottomNav />
      <Toasts />
      <TutorialInvite />
      <TutorialOverlay />
    </div>
  );
}
