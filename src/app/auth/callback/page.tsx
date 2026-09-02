"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  useEffect(() => {
    const run = async () => {
      if (!supabase) { setError("Supabase is not configured."); return; }
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") ?? "/dashboard";
      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) { setError(exchangeError.message); return; }
      }
      router.replace(next);
    };
    void run();
  }, [router]);
  return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">{error || "Signing you in..."}</main>;
}
