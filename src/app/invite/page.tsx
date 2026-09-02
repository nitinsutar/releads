"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function InvitePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return setError("Supabase is not configured.");
    if (password.length < 8) return setError("Use at least 8 characters.");
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) return setError(updateError.message);
    router.replace("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <p className="text-sm font-semibold text-brand-600">Team invite</p>
        <h1 className="mt-2 text-2xl font-semibold">Set your password</h1>
        <p className="mt-3 text-sm text-slate-500">Accept the invite and choose a password for your EstateFlow workspace.</p>
        <input className="field mt-7" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" required />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button className="btn-primary mt-5 w-full" disabled={busy}>{busy ? "Saving..." : "Activate account"}</button>
      </form>
    </main>
  );
}
