import { LEGACY_STORAGE_KEY, storageKeyFor } from "../constants";
import type { GameMode, GameState } from "../types";
import { migrate } from "./migrate";

/**
 * Mode-aware persistence. Demo and real economies live under separate keys
 * (ucncu:demo:v2 / ucncu:real:v2) so they can never mix. A legacy ucncu:v1
 * save is adopted once as the demo save, then the old key is removed.
 */
export function loadState(mode: GameMode): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKeyFor(mode));
    if (raw) {
      const migrated = migrate(JSON.parse(raw));
      if (migrated) return migrated;
    }
    if (mode === "demo") {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const migrated = migrate(JSON.parse(legacy));
        if (migrated) {
          window.localStorage.setItem(storageKeyFor("demo"), JSON.stringify(migrated));
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
          return migrated;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function saveState(mode: GameMode, s: GameState): void {
  if (typeof window === "undefined") return;
  try {
    const copy = { ...s, toasts: [] };
    window.localStorage.setItem(storageKeyFor(mode), JSON.stringify(copy));
  } catch {
    // storage full or unavailable — non-fatal
  }
}

export function clearState(mode: GameMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKeyFor(mode));
  } catch {
    // ignore
  }
}
