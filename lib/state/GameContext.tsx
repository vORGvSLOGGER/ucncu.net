"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import { TICK_MS } from "../constants";
import { gameReducer } from "../engine/reducer";
import { seed } from "../seed";
import type { Action, GameState } from "../types";
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

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(rootReducer, null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hydrate from localStorage (or fresh seed) after mount
  useEffect(() => {
    const loaded = loadState() ?? seed();
    dispatch({ type: "HYDRATE", state: loaded, now: Date.now() });
  }, []);

  // single game tick loop
  useEffect(() => {
    if (state === null) return;
    const t = setInterval(() => dispatch({ type: "TICK", now: Date.now() }), TICK_MS);
    return () => clearInterval(t);
    // restart only when transitioning from splash to live
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state === null]);

  // debounced persistence
  useEffect(() => {
    if (state === null) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(state), 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state]);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
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
