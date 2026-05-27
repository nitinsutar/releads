"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import { demoCredentials } from "@/lib/seed-data";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const { user, signIn, backendMode } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("owner@arihantrealty.in");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [router, user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn(email, password);
    setBusy(false);
    if (result) return setError(result);
    router.push("/dashboard");
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-[#092f2a] px-14 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <span className="rounded-xl bg-white/10 p-2.5"><Building2 className="h-6 w-6 text-[#dbb873]" /></span>
          EstateFlow CRM
        </div>
        <div className="max-w-xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#dbb873]">Real Estate Lead Management CRM</p>
          <h1 className="text-5xl font-semibold leading-tight">Turn every enquiry into a guided sale.</h1>
          <p className="mt-6 text-lg leading-relaxed text-emerald-50/75">A premium workspace for Indian builders, sales teams and channel partners to track every prospect from first call to booking.</p>
          <div className="mt-10 grid gap-4 text-sm text-emerald-50/90 sm:grid-cols-2">
            {["Role-based workspaces", "Lead pipeline tracking", "Follow-up discipline", "Broker performance"].map((item) => (
              <div key={item} className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#dbb873]" />{item}</div>
            ))}
          </div>
        </div>
        <p className="text-sm text-emerald-50/55">Built for builders who value predictable sales operations.</p>
      </section>
      <section className="flex items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 text-lg font-semibold lg:hidden">
            <Building2 className="text-brand-600" /> EstateFlow CRM
          </div>
          <p className="text-sm font-semibold text-brand-600">Welcome back</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">Sign in to your workspace</h2>
          <p className="mt-3 text-sm text-slate-500">{backendMode === "demo" ? "Demo mode is active. Pick an account below to explore each dashboard." : "Sign in with your company account."}</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label>
              <span className="label">Email address</span>
              <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              <span className="label">Password</span>
              <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500"><input type="checkbox" className="accent-brand-600" /> Remember me</label>
              <Link href="/forgot-password" className="font-medium text-brand-600">Forgot password?</Link>
            </div>
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "Signing in..." : "Sign in"} <ArrowRight className="h-4 w-4" /></button>
          </form>
          {backendMode === "demo" && (
            <div className="mt-8 rounded-2xl bg-slate-50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Demo logins / password: demo123</p>
              <div className="space-y-2 text-xs">
                {demoCredentials.map(([account, role]) => (
                  <button key={account} onClick={() => setEmail(account)} className="flex w-full justify-between rounded-lg px-2 py-1.5 text-left hover:bg-white">
                    <span className="text-slate-600">{account}</span><span className="font-semibold text-brand-600">{role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="mt-8 text-center text-sm text-slate-500">Need a company account? <Link href="/request-demo" className="font-semibold text-brand-600">Request a demo</Link></p>
        </div>
      </section>
    </main>
  );
}
