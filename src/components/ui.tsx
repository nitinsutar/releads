import { ReactNode } from "react";
import { LeadStatus, Priority } from "@/lib/types";

export function Heading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-1.5 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, icon }: { label: string; value: string | number; hint?: string; icon?: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <span className="rounded-lg bg-brand-50 p-2 text-brand-600">{icon}</span>}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const style =
    status === "Booked / Closed" ? "bg-emerald-50 text-emerald-700" :
    status === "Lost" ? "bg-red-50 text-red-700" :
    status.includes("Site Visit") ? "bg-purple-50 text-purple-700" :
    status === "Negotiation" || status === "Booking Pending" ? "bg-amber-50 text-amber-700" :
    "bg-sky-50 text-sky-700";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const style = priority === "Hot" ? "bg-red-50 text-red-700" : priority === "Warm" ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{priority}</span>;
}

export const prettyDate = (date?: string) => date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";
