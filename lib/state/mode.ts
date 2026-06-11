import { MODE_KEY } from "../constants";
import type { GameMode } from "../types";

export function getStoredMode(): GameMode | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(MODE_KEY);
    return v === "demo" || v === "real" ? v : null;
  } catch {
    return null;
  }
}

export function setStoredMode(m: GameMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MODE_KEY, m);
  } catch {
    // ignore
  }
}

export function clearStoredMode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(MODE_KEY);
  } catch {
    // ignore
  }
}
