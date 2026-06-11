"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "../ui/Icon";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  center?: boolean;
  mobileHidden?: boolean;
}

const ITEMS: NavItem[] = [
  { href: "/currencies", label: "العملات", icon: "coins" },
  { href: "/crypto", label: "الرقمية", icon: "coin", mobileHidden: true },
  { href: "/trading", label: "التداول", icon: "chart", mobileHidden: true },
  { href: "/bank", label: "البنك", icon: "bank" },
  { href: "/", label: "الرئيسية", icon: "home", center: true },
  { href: "/market", label: "السوق", icon: "cart" },
  { href: "/auction", label: "المزاد", icon: "gavel", mobileHidden: true },
  { href: "/companies", label: "الشركات", icon: "briefcase", mobileHidden: true },
  { href: "/realestate", label: "العقارات", icon: "building", mobileHidden: true },
];

const SHEET_ITEMS: NavItem[] = [
  ...ITEMS.filter((i) => i.mobileHidden),
  { href: "/profile", label: "البروفايل", icon: "user" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const linkClass = (item: NavItem, active: boolean) => {
    if (item.center) {
      return `-mt-5 flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-2xl border ${
        active
          ? "border-gold/70 bg-gradient-to-b from-gold/25 to-gold-deep/15 text-gold glow-gold"
          : "border-edge bg-card text-muted"
      }`;
    }
    return `flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-semibold transition ${
      active ? "text-gold" : "text-muted hover:text-ink"
    }`;
  };

  return (
    <>
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="absolute inset-x-3 bottom-20 card-base glow-teal grid grid-cols-3 gap-2 p-3 animate-toast-in"
            onClick={(e) => e.stopPropagation()}
          >
            {SHEET_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-[11px] font-semibold ${
                    active
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-edge bg-card2 text-muted"
                  }`}
                >
                  <Icon name={item.icon} size={20} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-edge bg-bg/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${item.mobileHidden ? "hidden md:flex" : "flex"} ${
                  item.center ? "" : "flex-col"
                } ${linkClass(item, active)}`}
              >
                <Icon name={item.icon} size={item.center ? 22 : 19} />
                {item.center ? (
                  <span className="text-[8px] font-bold">{item.label}</span>
                ) : (
                  item.label
                )}
              </Link>
            );
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
            <Icon name="user" size={19} />
            البروفايل
          </Link>
        </div>
      </nav>
    </>
  );
}
