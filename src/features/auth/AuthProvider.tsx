import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  recoveryUserId: string | null;
  finishRecovery: () => void;
  /** True after the persisted session has been restored. */
  ready: boolean;
}

const AuthContext = createContext<AuthContextValue>({ session: null, ready: false, recoveryUserId: null, finishRecovery: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [recoveryUserId, setRecoveryUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "INITIAL_SESSION") setReady(true);
      if (event === "PASSWORD_RECOVERY") setRecoveryUserId(next?.user.id ?? null);
      if (event === "SIGNED_OUT") setRecoveryUserId(null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, ready, recoveryUserId, finishRecovery: () => setRecoveryUserId(null) }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
