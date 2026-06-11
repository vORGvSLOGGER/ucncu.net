"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { rankForLevel } from "@/lib/constants";
import { fmtXp, xpSummary } from "@/lib/engine/xp";
import { fmtCompact, fmtInt, timeAgo } from "@/lib/format";
import { activeFrame } from "@/lib/perks";
import { breakdown, netWorth } from "@/lib/selectors";
import { useGame, useGameDispatch, useGameMode } from "@/lib/state/GameContext";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";
import { LiveClock } from "../ui/LiveClock";

function NotificationBell() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = game.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const kindColor = (k: string) =>
    k === "gold"
      ? "border-gold/40 text-gold"
      : k === "success"
        ? "border-up/40 text-up"
        : k === "warning"
          ? "border-down/40 text-down"
          : "border-teal/40 text-teal";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread > 0) dispatch({ type: "MARK_NOTIFICATIONS_READ" });
        }}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-edge bg-card text-muted transition hover:text-gold"
        aria-label="التنبيهات"
      >
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <span className="absolute -left-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-extrabold text-bg">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-40 max-h-96 w-80 overflow-y-auto card-base glow-teal p-2 animate-toast-in">
          <div className="mb-1 px-2 py-1 text-xs font-bold text-ink">التنبيهات</div>
          {game.notifications.length === 0 && (
            <div className="px-2 py-6 text-center text-xs text-muted">لا توجد تنبيهات بعد</div>
          )}
          {game.notifications.map((n) => (
            <div key={n.id} className={`mb-1.5 rounded-xl border bg-card2 p-2.5 ${kindColor(n.kind)}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">{n.title}</span>
                <span className="shrink-0 text-[10px] text-muted">{timeAgo(n.t)}</span>
              </div>
              {n.body && <p className="mt-1 text-[11px] leading-5 text-muted">{n.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const game = useGame();
  const { mode } = useGameMode();
  const { status: authStatus, email } = useAuth();
  const xp = xpSummary(game);
  const b = breakdown(game);
  const worth = netWorth(game);
  const frame = activeFrame(game.player.level);

  return (
    <header className="sticky top-0 z-30 -mx-3 mb-4 border-b border-edge bg-bg/85 px-3 pb-3 pt-2 backdrop-blur-md">
      {/* top bar */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-gold/50 bg-gold/10 text-gold">
            <Icon name="shield" size={18} />
          </span>
          <span className="text-base font-extrabold tracking-wide text-gold-grad" dir="ltr">
            UCNCU.NET
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
              mode === "real"
                ? "border-up/50 bg-up/10 text-up"
                : "border-teal/40 bg-teal/10 text-teal"
            }`}
          >
            {mode === "real" ? "حقيقي" : "تجريبي"}
          </span>
        </Link>
        <LiveClock />
        <div className="flex items-center gap-2">
          {authStatus === "authed" && email && (
            <Link
              href="/login"
              className="hidden items-center gap-1 rounded-full border border-up/40 bg-up/10 px-2.5 py-1 text-[9px] font-bold text-up lg:inline-flex"
              dir="ltr"
            >
              <Icon name="check" size={10} />
              {email}
            </Link>
          )}
          <NotificationBell />
        </div>
      </div>

      {/* player banner */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/profile" className="flex items-center gap-2.5">
          <div className="relative">
            <Avatar
              name={game.player.name}
              avatarId={game.player.avatarId}
              size={44}
              ring
              ringColor={frame}
            />
            <span className="absolute -bottom-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full border border-gold bg-bg px-0.5 text-[10px] font-extrabold text-gold">
              {game.player.level}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-ink">
              {game.player.name}
              <Icon name="star" size={12} className="text-gold" />
            </div>
            <div className="text-[10px] text-muted">{rankForLevel(game.player.level)}</div>
            <div className="mt-1 flex items-center gap-1.5" data-tour="hdr-xp">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-edge">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-teal to-cyan transition-all duration-700"
                  style={{ width: `${xp.pct}%` }}
                />
              </div>
              <span className="text-[9px] text-muted" dir="ltr">
                {fmtXp(game)}
              </span>
            </div>
          </div>
        </Link>

        {/* wallet chips */}
        <div className="ms-auto flex items-center gap-2 overflow-x-auto">
          <div className="chip">
            <span className="text-gold">●</span>
            <span>النقدية</span>
            <b key={Math.round(game.balances.UCN)} className="animate-balance text-ink">
              {fmtInt(game.balances.UCN)}
            </b>
            <span className="text-[9px]">UCN</span>
          </div>
          <div className="chip hidden sm:inline-flex">
            <span className="text-up">●</span>
            <span>عملات أجنبية</span>
            <b className="text-ink">{fmtCompact(b.fiat)}</b>
            <span className="text-[9px]">UCN</span>
          </div>
          <div className="chip hidden md:inline-flex">
            <span className="text-violet">●</span>
            <span>الرقمية</span>
            <b className="text-ink">{fmtCompact(b.crypto)}</b>
            <span className="text-[9px]">UCN</span>
          </div>
          <div className="chip border-gold/40" data-tour="hdr-worth">
            <span className="text-gold">◆</span>
            <span>الثروة</span>
            <b className="text-gold">{fmtCompact(worth)}</b>
          </div>
          <Link href="/profile" className="btn-gold hidden whitespace-nowrap px-3 py-1.5 text-[11px] lg:block">
            عرض المحفظة ←
          </Link>
        </div>
      </div>
    </header>
  );
}
