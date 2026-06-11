"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { TICK_MS } from "../constants";
import { gameReducer } from "../engine/reducer";
import { seed } from "../seed";
import type { Action, GameMode, GameState } from "../types";
import { getStoredMode, setStoredMode } from "./mode";
import { loadState, saveState } from "./persistence";

function rootReducer(state: GameState | null, action: Action): GameState | null {
  if (state === null) {
    if (action.type === "HYDRATE" || action.type === "RESET") {
      return gameReducer(action.state, action);
    }
    return null;
  }
  return gameReducer(state, action);
}

const StateCtx = createContext<GameState | null>(null);
const DispatchCtx = createContext<Dispatch<Action>>(() => {});

interface ModeCtxValue {
  /** undefined = pre-mount, null = not chosen yet */
  mode: GameMode | null | undefined;
  chooseMode: (m: GameMode) => void;
  switchMode: () => void;
}

const ModeCtx = createContext<ModeCtxValue>({
  mode: undefined,
  chooseMode: () => {},
  switchMode: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(rootReducer, null);
  const [mode, setMode] = useState<GameMode | null | undefined>(undefined);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<{ mode: GameMode | null | undefined; state: GameState | null }>({
    mode: undefined,
    state: null,
  });
  latest.current = { mode, state };

  // resolve the stored mode after mount; hydrate only when a mode exists
  useEffect(() => {
    const stored = getStoredMode();
    setMode(stored);
    if (stored) {
      const loaded = loadState(stored) ?? seed(stored);
      dispatch({ type: "HYDRATE", state: loaded, now: Date.now() });
    }
  }, []);

  const chooseMode = useCallback((m: GameMode) => {
    setStoredMode(m);
    setMode(m);
    const loaded = loadState(m) ?? seed(m);
    dispatch({ type: "HYDRATE", state: loaded, now: Date.now() });
  }, []);

  // switching economies = flush save + clean reload (keeps the loop simple)
  const switchMode = useCallback(() => {
    const cur = latest.current;
    if (cur.mode && cur.state) saveState(cur.mode, cur.state);
    setStoredMode(cur.mode === "demo" ? "real" : "demo");
    window.location.reload();
  }, []);

  // single game tick loop
  useEffect(() => {
    if (state === null) return;
    const t = setInterval(() => dispatch({ type: "TICK", now: Date.now() }), TICK_MS);
    return () => clearInterval(t);
    // restart only when transitioning from splash to live
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state === null]);

  // debounced persistence (mode-keyed)
  useEffect(() => {
    if (state === null || !mode) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(mode, state), 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, mode]);

  return (
    <ModeCtx.Provider value={{ mode, chooseMode, switchMode }}>
      <StateCtx.Provider value={state}>
        <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
      </StateCtx.Provider>
    </ModeCtx.Provider>
  );
}

/** game state — only call below the AppShell hydration gate */
export function useGame(): GameState {
  const s = useContext(StateCtx);
  if (s === null) throw new Error("useGame called before hydration");
  return s;
}

export function useMaybeGame(): GameState | null {
  return useContext(StateCtx);
}

export function useGameDispatch(): Dispatch<Action> {
  return useContext(DispatchCtx);
}

export function useGameMode(): ModeCtxValue {
  return useContext(ModeCtx);
}
