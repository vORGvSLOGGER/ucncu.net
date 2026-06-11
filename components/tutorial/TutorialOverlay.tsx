"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";
import { TUTORIAL_STEPS } from "@/lib/tutorial/steps";
import { Icon } from "../ui/Icon";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

/**
 * Hand-rolled guided tour: one element + a huge box-shadow dims everything
 * except the [data-tour] target; auto-navigates between pages and re-measures
 * continuously because live price ticks shift the layout.
 */
export function TutorialOverlay() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [rect, setRect] = useState<Rect | null>(null);
  const [searching, setSearching] = useState(true);
  const giveUpAt = useRef(0);

  const active = game.tutorial.status === "active";
  const stepIdx = game.tutorial.step;
  const step = TUTORIAL_STEPS[stepIdx];

  // auto-navigate to the step's page
  useEffect(() => {
    if (!active || !step) return;
    if (pathname !== step.route) router.push(step.route);
  }, [active, step, pathname, router]);

  // locate + track the target element
  useEffect(() => {
    if (!active || !step) return;
    setRect(null);
    setSearching(true);
    giveUpAt.current = Date.now() + 2500;
    if (!step.target || pathname !== step.route) {
      if (!step.target) setSearching(false);
      return;
    }
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
          setSearching(false);
          return;
        }
      }
      if (Date.now() > giveUpAt.current) setSearching(false); // fall back to centered card
    };
    measure();
    const t = setInterval(measure, 250);
    window.addEventListener("resize", measure);
    return () => {
      clearInterval(t);
      window.removeEventListener("resize", measure);
    };
  }, [active, step, stepIdx, pathname]);

  if (!active || !step) return null;
  if (pathname !== step.route) return null;
  if (searching && step.target) return null;

  const hasSpot = rect !== null;
  // tooltip above or below the spotlight depending on free space
  const below = hasSpot ? rect.top + rect.height / 2 < window.innerHeight * 0.5 : false;

  const cardStyle: React.CSSProperties = hasSpot
    ? {
        position: "fixed",
        left: 16,
        right: 16,
        ...(below
          ? { top: Math.min(rect.top + rect.height + PAD + 10, window.innerHeight - 280) }
          : { bottom: Math.max(window.innerHeight - rect.top + PAD + 10, 110) }),
        zIndex: 95,
      }
    : {
        position: "fixed",
        left: 16,
        right: 16,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 95,
      };

  return (
    <>
      {/* dim layer / spotlight */}
      {hasSpot ? (
        <div
          className="pointer-events-none fixed z-[90] rounded-2xl border-2 border-gold transition-all duration-300"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(4, 8, 16, 0.8), 0 0 24px rgba(245,196,81,0.35)",
          }}
        />
      ) : (
        <div className="fixed inset-0 z-[90] bg-[rgba(4,8,16,0.85)]" />
      )}

      {/* explanation card */}
      <div style={cardStyle} className="mx-auto max-w-md">
        <div className="card-base glow-gold p-5 animate-toast-in">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gold">{step.title}</h3>
            <span className="rounded-full border border-teal/40 bg-teal/10 px-2 py-0.5 text-[9px] font-bold text-teal">
              +{step.xp} XP
            </span>
          </div>
          <p className="text-[12px] leading-6 text-ink">{step.body}</p>

          {/* progress dots */}
          <div className="mt-3 flex items-center justify-center gap-1" dir="ltr">
            {TUTORIAL_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIdx ? "w-5 bg-gold" : i < stepIdx ? "w-1.5 bg-teal" : "w-1.5 bg-edge"
                }`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            {stepIdx > 0 && (
              <button
                onClick={() => dispatch({ type: "TUTORIAL_PREV" })}
                className="btn-ghost px-3 py-2 text-xs"
              >
                السابق
              </button>
            )}
            <button
              onClick={() => dispatch({ type: "TUTORIAL_NEXT" })}
              className="btn-gold flex-1 px-4 py-2 text-xs"
            >
              {stepIdx + 1 >= TUTORIAL_STEPS.length ? "إنهاء الجولة 🎉" : "التالي ←"}
            </button>
            <button
              onClick={() => dispatch({ type: "TUTORIAL_SKIP" })}
              className="flex items-center gap-1 px-2 py-2 text-[10px] font-semibold text-muted hover:text-ink"
            >
              <Icon name="close" size={12} />
              تخطي
            </button>
          </div>
          <div className="mt-2 text-center text-[9px] text-muted">
            الخطوة {stepIdx + 1} من {TUTORIAL_STEPS.length}
          </div>
        </div>
      </div>
    </>
  );
}
