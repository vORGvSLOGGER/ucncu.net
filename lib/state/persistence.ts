import { STORAGE_KEY } from "../constants";
import type { GameState } from "../types";

export function loadState(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || parsed.version !== 1 || !parsed.player || !parsed.prices) return null;
    parsed.toasts = [];
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(s: GameState): void {
  if (typeof window === "undefined") return;
  try {
    const copy = { ...s, toasts: [] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
  } catch {
    // storage full or unavailable — non-fatal
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
