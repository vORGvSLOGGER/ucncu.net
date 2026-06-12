"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { companyLevel } from "@/lib/companyPerks";
import { activeCompany } from "@/lib/engine/company";
import { fmtCompact, fmtInt } from "@/lib/format";
import { SECTORS } from "@/lib/seed";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";
import { Icon } from "../ui/Icon";
import { LiveClock } from "../ui/LiveClock";
import { NotificationBell } from "./Header";

function CompanySelector() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const company = activeCompany(game);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (game.companies.length <= 1 || !company) return null;
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost flex items-center gap-1 px-2.5 py-1 text-[10px]"
      >
        تبديل الشركة
        <Icon name="arrow-down" size={11} />
      </button>
      {open && (
        <div className="absolute left-0 top-8 z-40 w-56 card-base glow-teal p-1.5 animate-toast-in">
          {game.companies.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                dispatch({ type: "SET_ACTIVE_COMPANY", companyId: c.id });
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-xs font-bold ${
                c.id === company.id ? "bg-teal/10 text-teal" : "text-ink hover:bg-card"
              }`}
            >
              <Icon name={SECTORS.find((x) => x.id === c.sectorId)?.icon ?? "briefcase"} size={14} />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-[9px] text-muted">{fmtCompact(c.valuation)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** clan-style company banner — replaces the personal header on /company/* */
export function CompanyHeader() {
  const game = useGame();
  const company = activeCompany(game);
  const sector = company ? SECTORS.find((x) => x.id === company.sectorId) : null;
  const lv = company ? companyLevel(company.level) : null;
  const employees = company ? company.members.filter((m) => m.rank === "employee").length : 0;

  return (
    <header className="sticky top-0 z-30 -mx-3 mb-4 border-b border-teal/30 bg-bg/85 px-3 pb-3 pt-2 backdrop-blur-md">
      {/* top bar */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-teal/50 bg-teal/10 text-teal">
            <Icon name="briefcase" size={18} />
          </span>
          <span className="text-base font-extrabold tracking-wide text-teal" dir="ltr">
            UCNCU.NET
          </span>
          <span className="rounded-full border border-teal/40 bg-teal/10 px-2 py-0.5 text-[9px] font-bold text-teal">
            وضع الشركة
          </span>
        </Link>
        <LiveClock />
        <NotificationBell />
      </div>

      {!company ? (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Icon name="briefcase" size={15} />
          لا تملك شركة بعد — أسس واحدة لتدخل عالم الشركات
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* company identity */}
          <div className="flex items-center gap-2.5">
            <span
              className={`grid h-11 w-11 place-items-center rounded-xl border text-teal ${
                company.verification === "verified"
                  ? "border-gold/60 bg-gold/10 glow-gold"
                  : "border-teal/40 bg-teal/10"
              }`}
            >
              <Icon name={sector?.icon ?? "briefcase"} size={22} />
            </span>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
                {company.name}
                {company.verification === "verified" && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-gold text-bg" title="موثقة من الإدارة العليا">
                    <Icon name="check" size={10} strokeWidth={3} />
                  </span>
                )}
                {company.level >= 5 && <span title="إمبراطورية">👑</span>}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted">
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Icon
                      key={n}
                      name="star"
                      size={9}
                      className={n <= company.level ? "text-gold" : "text-edge"}
                      fill={n <= company.level ? "currentColor" : "none"}
                    />
                  ))}
                </span>
                <span>«{lv?.name}»</span>
                <span className="flex items-center gap-0.5">
                  <Icon name="users" size={10} />
                  {company.members.length} أعضاء · {employees} منسوبين
                </span>
                <span className="flex items-center gap-0.5 text-violet">
                  <Icon name="fire" size={10} />
                  شهرة {fmtInt(company.fame)}
                </span>
              </div>
            </div>
          </div>

          {/* chips */}
          <div className="ms-auto flex items-center gap-2 overflow-x-auto">
            <div className="chip border-teal/40">
              <span className="text-teal">◈</span>
              <span>الخزينة</span>
              <b key={Math.round(company.treasury)} className="animate-balance text-teal">
                {fmtInt(company.treasury)}
              </b>
              <span className="text-[9px]">UCN</span>
            </div>
            <div className="chip">
              <span className="text-gold">◆</span>
              <span>التقييم</span>
              <b className="text-gold">{fmtCompact(company.valuation)}</b>
            </div>
            <div className="chip hidden sm:inline-flex">
              <span className="text-up">●</span>
              <span>رصيدك</span>
              <b className="text-ink">{fmtCompact(game.balances.UCN)}</b>
            </div>
            <CompanySelector />
          </div>
        </div>
      )}
    </header>
  );
}
