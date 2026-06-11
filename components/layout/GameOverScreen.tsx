"use client";

import { fmtCompact, fmtInt } from "@/lib/format";
import { seed } from "@/lib/seed";
import { useGame, useGameDispatch, useGameMode } from "@/lib/state/GameContext";
import { clearState } from "@/lib/state/persistence";
import { Icon } from "../ui/Icon";

export function GameOverScreen() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const { mode } = useGameMode();

  const daysSurvived = Math.max(1, Math.round((Date.now() - game.player.joinedAt) / 86_400_000));
  const peak = game.netWorthHistory.length ? Math.max(...game.netWorthHistory) : 0;

  const restart = () => {
    const m = mode ?? "demo";
    clearState(m);
    dispatch({ type: "RESET", state: seed(m) });
  };

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="card-base w-full max-w-md border-down/40 p-8 text-center" style={{ boxShadow: "0 0 0 1px rgba(248,113,113,0.3), 0 0 40px rgba(248,113,113,0.15)" }}>
        <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border border-down/50 bg-down/10 text-down animate-pulse-glow">
          <Icon name="fire" size={32} />
        </span>
        <h1 className="text-2xl font-extrabold text-down">💥 أُشهر إفلاسك</h1>
        <p className="mt-2 text-xs leading-6 text-muted">
          انتهت مهلة الخمس ساعات وديونك ما زالت أكبر من أصولك. لم يفزع لك أحد هذه المرة —
          السوق درس قاسٍ لمن لا يحسب أقساطه.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-edge bg-card2 p-3">
            <div className="text-lg font-extrabold text-ink">{fmtInt(daysSurvived)}</div>
            <div className="text-[10px] text-muted">أيام البقاء</div>
          </div>
          <div className="rounded-xl border border-edge bg-card2 p-3">
            <div className="text-lg font-extrabold text-gold">{fmtCompact(peak)}</div>
            <div className="text-[10px] text-muted">ذروة الثروة</div>
          </div>
          <div className="rounded-xl border border-edge bg-card2 p-3">
            <div className="text-lg font-extrabold text-teal">{game.player.level}</div>
            <div className="text-[10px] text-muted">المستوى</div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-gold/30 bg-gold/8 p-3 text-[11px] leading-5 text-gold">
          هنا في الطور التجريبي تبدأ من جديد… أما في <b>طور الحقيقة</b> فالإفلاس يعني حظر
          بريدك من اللعبة <b>نهائيًا</b>. اعتبرها بروفة نجاة.
        </div>

        <button onClick={restart} className="btn-gold mt-6 w-full px-5 py-3 text-sm">
          ابدأ من جديد 🔄
        </button>
      </div>
    </div>
  );
}
