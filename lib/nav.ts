import { FEATURE_LEVELS } from "./constants";

export interface NavDef {
  id: string;
  href: string;
  label: string;
  icon: string;
  /** key into FEATURE_LEVELS when the section is level-gated */
  feature?: keyof typeof FEATURE_LEVELS;
}

/** single source of truth for navigation (BottomNav + customization sheet) */
export const NAV_ITEMS: NavDef[] = [
  { id: "home", href: "/", label: "الرئيسية", icon: "home" },
  { id: "market", href: "/market", label: "السوق", icon: "cart", feature: "market" },
  { id: "explore", href: "/explore", label: "إكسبلور", icon: "globe" },
  { id: "friends", href: "/friends", label: "الأصدقاء", icon: "users" },
  { id: "auction", href: "/auction", label: "المزاد", icon: "gavel" },
  { id: "trading", href: "/trading", label: "التداول", icon: "chart", feature: "trading" },
  { id: "currencies", href: "/currencies", label: "العملات", icon: "coins", feature: "currencies" },
  { id: "crypto", href: "/crypto", label: "الرقمية", icon: "coin", feature: "crypto" },
  { id: "bank", href: "/bank", label: "البنك", icon: "bank", feature: "bank" },
  { id: "realestate", href: "/realestate", label: "العقارات", icon: "building", feature: "realestate" },
  { id: "companies", href: "/companies", label: "الشركات", icon: "briefcase", feature: "companies" },
  { id: "profile", href: "/profile", label: "البروفايل", icon: "user" },
];

/**
 * Reorderable ids (everything except home/profile). The first 4 occupy the
 * mobile bottom bar around the centered home button; the rest live in المزيد.
 */
export const DEFAULT_NAV_ORDER: string[] = [
  "market",
  "explore",
  "currencies",
  "bank",
  "friends",
  "trading",
  "crypto",
  "auction",
  "companies",
  "realestate",
];

export function navById(id: string): NavDef | undefined {
  return NAV_ITEMS.find((n) => n.id === id);
}

/** repair a stored order: keep known ids, append anything new from defaults */
export function sanitizeNavOrder(order: unknown): string[] {
  const known = new Set(DEFAULT_NAV_ORDER);
  const incoming = Array.isArray(order)
    ? order.filter((id): id is string => typeof id === "string" && known.has(id))
    : [];
  const seen = new Set(incoming);
  return [...incoming, ...DEFAULT_NAV_ORDER.filter((id) => !seen.has(id))];
}
