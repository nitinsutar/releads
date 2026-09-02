"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { loginMessage, loginUrl, ProvisionedLogin } from "@/lib/accounts";
import { roleLabels } from "@/lib/types";

export function LoginSlip({ login, onDismiss }: { login: ProvisionedLogin; onDismiss?: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(loginMessage(login));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <section className="card mb-6 border-brand-200 bg-brand-50/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Login created</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">{login.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{roleLabels[login.role]}{login.companyName ? ` · ${login.companyName}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-primary" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy login"}
          </button>
          {onDismiss && <button type="button" className="btn-secondary" onClick={onDismiss}>Done</button>}
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-xs uppercase tracking-wide text-slate-400">URL</dt><dd className="font-medium text-ink">{loginUrl()}</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt><dd className="font-medium text-ink">{login.email}</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-slate-400">Password</dt><dd className="font-semibold text-ink">{login.password}</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-slate-400">WhatsApp this</dt><dd className="text-slate-500">Copy and send. They sign in and land on their own dashboard.</dd></div>
      </dl>
    </section>
  );
}

export function AccountRow({
  name, email, phone, role, password, company
}: {
  name: string; email: string; phone: string; role: string; password?: string; company?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(loginMessage({ name, email, password, role: role as ProvisionedLogin["role"], companyName: company }));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
      <div>
        <p className="font-semibold text-ink">{name}</p>
        <p className="text-slate-500">{email} · {phone}</p>
        {company && <p className="mt-1 text-xs text-slate-400">{company}</p>}
        {password && <p className="mt-1 text-xs text-slate-500">Password: <span className="font-semibold text-ink">{password}</span></p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold capitalize text-brand-700">{role.replace("_", " ")}</span>
        {password && <button type="button" className="btn-secondary" onClick={copy}>{copied ? "Copied" : "Copy login"}</button>}
      </div>
    </div>
  );
}
