"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isAdminEmail } from "../constants";
import { isBanned } from "../cloud/client";
import { getSupabase, isAuthConfigured } from "./supabaseClient";

export type AuthStatus = "disabled" | "loading" | "guest" | "authed" | "banned";

interface AuthCtxValue {
  status: AuthStatus;
  email: string | null;
  userId: string | null;
  isAdmin: boolean;
  sendOtp: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, code: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** access token for any future server-authoritative calls */
  getAccessToken: () => Promise<string | null>;
}

const AuthCtx = createContext<AuthCtxValue>({
  status: "disabled",
  email: null,
  userId: null,
  isAdmin: false,
  sendOtp: async () => ({ error: "غير مفعّل" }),
  verifyOtp: async () => ({ error: "غير مفعّل" }),
  signOut: async () => {},
  getAccessToken: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthConfigured()) {
      setStatus("disabled");
      return;
    }
    const supabase = getSupabase()!;
    // permanent bankruptcy ban: authenticate but block + sign out if banned
    const apply = async (sessionEmail: string | null, sessionUid: string | null) => {
      if (sessionEmail) {
        if (await isBanned(sessionEmail)) {
          setEmail(sessionEmail);
          setStatus("banned");
          await supabase.auth.signOut();
          return;
        }
        setEmail(sessionEmail);
        setUserId(sessionUid);
        setStatus("authed");
      } else {
        setEmail(null);
        setUserId(null);
        setStatus("guest");
      }
    };
    supabase.auth.getSession().then(({ data }) => {
      apply(data.session?.user?.email ?? null, data.session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session?.user?.email ?? null, session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const sendOtp = useCallback(async (addr: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "تسجيل الدخول غير مفعّل بعد" };
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { shouldCreateUser: true },
    });
    return { error: error ? error.message : null };
  }, []);

  const verifyOtp = useCallback(async (addr: string, code: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "تسجيل الدخول غير مفعّل بعد" };
    const { error } = await supabase.auth.verifyOtp({
      email: addr,
      token: code,
      type: "email",
    });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase()?.auth.signOut();
  }, []);

  const getAccessToken = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        status,
        email,
        userId,
        isAdmin: status === "authed" && isAdminEmail(email),
        sendOtp,
        verifyOtp,
        signOut,
        getAccessToken,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthCtxValue {
  return useContext(AuthCtx);
}
