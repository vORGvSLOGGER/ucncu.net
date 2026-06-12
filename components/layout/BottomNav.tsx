"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FEATURE_LEVELS } from "@/lib/constants";
import { COMPANY_NAV_ITEMS, NAV_ITEMS, navById, sanitizeNavOrder, type NavDef } from "@/lib/nav";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";

const HOME = NAV_ITEMS.find((n) => n.id === "home")!;
const PROFILE = NAV_ITEMS.find((n) => n.id === "profile")!;

/** how many reorderable items show in the mobile bar (around home + المزيد + التبديل) */
const BAR_SLOTS = 3;

function NavIcon({
  item,
  locked,
  active,
  size = 19,
  badge,
}: {
  item: NavDef;
  locked: boolean;
  active: boolean;
  size?: number;
  badge?: number;
}) {
  return (
    <span className="relative">
      <Icon name={item.icon} size={size} className={active ? "nav-active" : undefined} />
      {locked && (
        <span className="absolute -left-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full border border-gold/60 bg-bg text-gold">
          <Icon name="lock" size={8} strokeWidth={2.4} />
        </span>
      )}
      {!locked && (badge ?? 0) > 0 && (
        <span className="absolute -left-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-down px-0.5 text-[8px] font-extrabold text-bg">
          {badge}
        </span>
      )}
    </span>
  );
}

function CustomizeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const order = sanitizeNavOrder(game.settings.navOrder);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    dispatch({ type: "SET_NAV_ORDER", order: next });
  };

  return (
    <Modal open={open} onClose={onClose} title="تخصيص الشريط السفلي ⚙️">
      <p className="mb-3 text-[11px] leading-5 text-muted">
        رتب الأقسام بالأسهم — أول {BAR_SLOTS} أقسام تظهر في الشريط السفلي حول زر الرئيسية،
        والبقية في قائمة «المزيد».
      </p>
      <div className="space-y-1.5">
        {order.map((id, idx) => {
          const item = navById(id);
          if (!item) return null;
          const gate = item.feature ? FEATURE_LEVELS[item.feature] : null;
          const locked = gate ? game.player.level < gate.level : false;
          return (
            <div key={id}>
              {idx === BAR_SLOTS && (
                <div className="my-2 flex items-center gap-2 text-[9px] font-bold text-gold">
                  <span className="h-px flex-1 bg-gold/30" />
                  ما فوق هذا الخط يظهر في الشريط ↑
                  <span className="h-px flex-1 bg-gold/30" />
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl border border-edge bg-card2 px-3 py-2">
                <Icon name={item.icon} size={16} className={locked ? "text-muted" : "text-teal"} />
                <span className="flex-1 text-xs font-semibold text-ink">
                  {item.label}
                  {locked && gate && (
                    <span className="ms-2 inline-flex items-center gap-0.5 text-[9px] text-gold">
                      <Icon name="lock" size={9} /> م{gate.level}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="btn-ghost grid h-7 w-7 place-items-center disabled:opacity-30"
                  aria-label="تقديم"
                >
                  <Icon name="arrow-up" size={13} />
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === order.length - 1}
                  className="btn-ghost grid h-7 w-7 place-items-center disabled:opacity-30"
                  aria-label="تأخير"
                >
                  <Icon name="arrow-down" size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

/** the context toggle living at the far left of both bars */
function SwitchButton({ inCompany }: { inCompany: boolean }) {
  const game = useGame();
  const router = useRouter();
  const hasCompany = game.companies.length > 0;

  const go = () => {
    if (inCompany) router.push("/");
    else if (hasCompany) router.push("/company");
    else router.push("/companies");
  };

  return (
    <button
      onClick={go}
      data-tour="nav-switch"
      className={`flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-bold transition ${
        inCompany ? "text-teal" : hasCompany ? "text-gold" : "text-muted"
      }`}
      aria-label={inCompany ? "وضع الفرد" : "وضع الشركة"}
    >
      <span
        className={`relative grid h-7 w-7 place-items-center rounded-lg border ${
          inCompany
            ? "border-teal/60 bg-teal/10 glow-teal"
            : hasCompany
              ? "border-gold/60 bg-gold/10 glow-gold"
              : "border-edge bg-card"
        }`}
      >
        <Icon name={inCompany ? "user" : "briefcase"} size={15} />
        {!inCompany && !hasCompany && (
          <span className="absolute -left-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full border border-gold/60 bg-bg text-gold">
            <Icon name="lock" size={8} strokeWidth={2.4} />
          </span>
        )}
      </span>
      {inCompany ? "الفرد" : "شركتي"}
    </button>
  );
}

/* =================== company-context bar =================== */

function CompanyBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-teal/30 bg-bg/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
        {COMPANY_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          if (item.id === "co-home") {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`-mt-5 flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-2xl border ${
                  active
                    ? "border-teal/70 bg-gradient-to-b from-teal/25 to-cyan/10 text-teal glow-teal"
                    : "border-edge bg-card text-muted"
                }`}
              >
                <Icon name={item.icon} size={22} className={active ? "nav-active" : undefined} />
                <span className="text-[8px] font-bold">الشركة</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-semibold transition ${
                active ? "text-teal" : "text-muted hover:text-ink"
              }`}
            >
              <Icon name={item.icon} size={19} className={active ? "nav-active" : undefined} />
              {item.label}
            </Link>
          );
        })}
        <SwitchButton inCompany />
      </div>
    </nav>
  );
}

/* =================== personal bar =================== */

export function BottomNav() {
  const pathname = usePathname();
  const game = useGame();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);

  // "/companies" (personal portfolio) must NOT match the company context
  if (pathname === "/company" || pathname.startsWith("/company/")) return <CompanyBar />;

  const order = sanitizeNavOrder(game.settings.navOrder);
  const barItems = order.slice(0, BAR_SLOTS).map((id) => navById(id)!).filter(Boolean);
  const sheetItems = [...order.slice(BAR_SLOTS).map((id) => navById(id)!).filter(Boolean), PROFILE];
  const unreadChats = Object.values(game.chats).reduce((sum, t) => sum + t.unread, 0);

  const isLocked = (item: NavDef) => {
    if (!item.feature || game.settings.exploreMode) return false;
    const gate = FEATURE_LEVELS[item.feature];
    return gate ? game.player.level < gate.level : false;
  };
  const badgeFor = (item: NavDef) => (item.id === "friends" ? unreadChats : 0);

  const sideLink = (item: NavDef, mobileVisible: boolean) => {
    const active = pathname === item.href;
    const locked = isLocked(item);
    return (
      <Link
        key={item.id}
        href={item.href}
        className={`${mobileVisible ? "flex" : "hidden md:flex"} flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-semibold transition ${
          active ? "text-gold" : locked ? "text-muted/60" : "text-muted hover:text-ink"
        }`}
      >
        <NavIcon item={item} locked={locked} active={active} badge={badgeFor(item)} />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="absolute inset-x-3 bottom-20 card-base glow-teal p-3 animate-toast-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-2">
              {sheetItems.map((item) => {
                const active = pathname === item.href;
                const locked = isLocked(item);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-[11px] font-semibold ${
                      active
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : locked
                          ? "border-edge bg-card2 text-muted/60"
                          : "border-edge bg-card2 text-muted"
                    }`}
                  >
                    <NavIcon item={item} locked={locked} active={active} size={20} badge={badgeFor(item)} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <button
              onClick={() => {
                setSheetOpen(false);
                setCustomizing(true);
              }}
              className="btn-ghost mt-2 flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-xs"
            >
              <Icon name="settings" size={14} />
              تخصيص الشريط
            </button>
          </div>
        </div>
      )}

      <CustomizeModal open={customizing} onClose={() => setCustomizing(false)} />

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-edge bg-bg/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
          {sideLink(barItems[0], true)}
          {sideLink(barItems[1], true)}

          {/* centered home — لوحة التحكم العامة */}
          <Link
            href="/"
            className={`-mt-5 flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-2xl border ${
              pathname === "/"
                ? "border-gold/70 bg-gradient-to-b from-gold/25 to-gold-deep/15 text-gold glow-gold"
                : "border-edge bg-card text-muted"
            }`}
          >
            <Icon name={HOME.icon} size={22} className={pathname === "/" ? "nav-active" : undefined} />
            <span className="text-[8px] font-bold">{HOME.label}</span>
          </Link>

          {sideLink(barItems[2], true)}

          {/* the rest — desktop only */}
          {order.slice(BAR_SLOTS).map((id) => {
            const item = navById(id);
            return item ? sideLink(item, false) : null;
          })}

          <button
            onClick={() => setSheetOpen((o) => !o)}
            className="flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-semibold text-muted md:hidden"
          >
            <Icon name="menu" size={19} />
            المزيد
          </button>
          <Link
            href="/profile"
            className={`hidden flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-semibold transition md:flex ${
              pathname === "/profile" ? "text-gold" : "text-muted hover:text-ink"
            }`}
          >
            <Icon name="user" size={19} className={pathname === "/profile" ? "nav-active" : undefined} />
            البروفايل
          </Link>

          {/* far-left: switch into company mode */}
          <SwitchButton inCompany={false} />
        </div>
      </nav>
    </>
  );
}
