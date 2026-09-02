"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { seedData } from "@/lib/seed-data";
import { CRMUser } from "@/lib/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mapUser } from "@/lib/mappers";

interface AuthValue {
  user: CRMUser | null;
  loading: boolean;
  backendMode: "demo" | "supabase";
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);
const sessionKey = "estateflow-session";
const useSupabase = isSupabaseConfigured && process.env.NEXT_PUBLIC_DEMO_MODE !== "true";

async function profileFromSession(userId: string) {
  if (!supabase) return null;
  const { data } = await supabase.from("users").select("*").eq("auth_id", userId).eq("active", true).maybeSingle();
  return data ? mapUser(data as Record<string, unknown>) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CRMUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      if (useSupabase && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) setUser(await profileFromSession(data.session.user.id));
      } else {
        const id = window.localStorage.getItem(sessionKey);
        setUser(seedData.users.find((candidate) => candidate.id === id) ?? null);
      }
      setLoading(false);
    };
    void restore();
  }, []);

  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    backendMode: useSupabase ? "supabase" : "demo",
    signIn: async (email, password) => {
      if (useSupabase && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) return error?.message ?? "Unable to sign in.";
        const profile = await profileFromSession(data.user.id);
        if (!profile) return "No CRM profile is connected to this account.";
        setUser(profile);
        return null;
      }
      const found = seedData.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.password === password && candidate.active);
      if (!found) return "Invalid email or password.";
      window.localStorage.setItem(sessionKey, found.id);
      setUser(found);
      return null;
    },
    signOut: async () => {
      if (useSupabase && supabase) await supabase.auth.signOut();
      window.localStorage.removeItem(sessionKey);
      setUser(null);
    }
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
