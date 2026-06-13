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
import { LEADERBOARD_SYNC_TICKS, TICK_MS } from "../constants";
import { useAuth } from "../auth/AuthContext";
import { cloudConfigured, loadCloudSave, saveCloudSave, upsertLeaderboard } from "../cloud/client";
import { gameReducer } from "../engine/reducer";
import { seed } from "../seed";
import { netWorth } from "../selectors";
import type { Action, GameMode, GameState } from "../types";
import { migrate } from "./migrate";
import { clearStoredMode, getStoredMode, setStoredMode } from "./mode";
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
  /** real mode is waiting on auth/cloud load */
  realLoading: boolean;
}

const ModeCtx = createContext<ModeCtxValue>({
  mode: undefined,
  chooseMode: () => {},
  switchMode: () => {},
  realLoading: false,
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(rootReducer, null);
  const [mode, setMode] = useState<GameMode | null | undefined>(undefined);
  const [realLoading, setRealLoading] = useState(false);
  const auth = useAuth();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);
  const latest = useRef<{ mode: GameMode | null | undefined; state: GameState | null }>({
    mode: undefined,
    state: null,
  });
  latest.current = { mode, state };

  // resolve the stored mode after mount
  useEffect(() => {
    setMode(getStoredMode());
  }, []);

  // hydrate once mode (and, for real mode, auth + cloud) are ready
  useEffect(() => {
    if (mode === undefined || mode === null || hydrated.current) return;

    if (mode === "demo" || !cloudConfigured()) {
      hydrated.current = true;
      dispatch({ type: "HYDRATE", state: loadState(mode) ?? seed(mode), now: Date.now() });
      return;
    }

    // real mode (configured): needs an authenticated, non-banned account
    if (auth.status === "loading") return;
    if (auth.status === "banned") {
      clearStoredMode();
      setMode(null);
      return;
    }
    if (auth.status !== "authed" || !auth.userId) {
      // not logged in → bounce back to mode select
      clearStoredMode();
      setMode(null);
      return;
    }

    let cancelled = false;
    setRealLoading(true);
    (async () => {
      const cloud = await loadCloudSave(auth.userId!);
      if (cancelled) return;
      const chosen = (cloud ? migrate(cloud) : null) ?? loadState("real") ?? seed("real");
      hydrated.current = true;
      setRealLoading(false);
      dispatch({ type: "HYDRATE", state: chosen, now: Date.now() });
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, auth.status, auth.userId]);

  const chooseMode = useCallback((m: GameMode) => {
    setStoredMode(m);
    setMode(m); // the hydration effect performs the actual load
  }, []);

  // switching economies = flush save + clean reload (keeps the loop simple)
  const switchMode = useCallback(() => {
    const cur = latest.current;
    if (cur.mode && cur.state) saveState(cur.mode, cur.state);
    if (cur.mode === "real" && auth.userId && cur.state) {
      saveCloudSave(auth.userId, auth.email ?? "", cur.state, netWorth(cur.state));
    }
    setStoredMode(cur.mode === "demo" ? "real" : "demo");
    window.location.reload();
  }, [auth.userId, auth.email]);

  // single game tick loop
  useEffect(() => {
    if (state === null) return;
    const t = setInterval(() => dispatch({ type: "TICK", now: Date.now() }), TICK_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state === null]);

  // debounced persistence — localStorage mirror always; cloud + leaderboard in real mode
  useEffect(() => {
    if (state === null || !mode) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState(mode, state);
      if (mode === "real" && auth.status === "authed" && auth.userId) {
        const nw = netWorth(state);
        saveCloudSave(auth.userId, auth.email ?? "", state, nw);
        if (state.tickCount % LEADERBOARD_SYNC_TICKS === 0) {
          const fame = state.companies.reduce((sum, c) => sum + c.fame, 0);
          upsertLeaderboard({
            user_id: auth.userId,
            name: state.player.name,
            net_worth: nw,
            level: state.player.level,
            fame,
          });
        }
      }
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, mode, auth.status, auth.userId, auth.email]);

  return (
    <ModeCtx.Provider value={{ mode, chooseMode, switchMode, realLoading }}>
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
