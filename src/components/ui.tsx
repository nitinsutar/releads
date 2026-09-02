import { ReactNode } from "react";
import { LeadStatus, Priority } from "@/lib/types";

export function Heading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.65rem] font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

const tints = ["bg-brand-50 text-brand-700", "bg-sun-50 text-sun-600", "bg-coral-50 text-coral-600", "bg-lilac-50 text-lilac-600", "bg-sky-50 text-sky-600"];

export function StatCard({ label, value, hint, icon, tint = 0 }: { label: string; value: string | number; hint?: string; icon?: ReactNode; tint?: number }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <span className={`rounded-xl p-2 ${tints[tint % tints.length]}`}>{icon}</span>}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const style =
    status === "Booked / Closed" ? "bg-brand-50 text-brand-700" :
    status === "Lost" ? "bg-coral-50 text-coral-600" :
    status.includes("Site Visit") ? "bg-lilac-50 text-lilac-600" :
    status === "Negotiation" || status === "Booking Pending" ? "bg-sun-50 text-sun-600" :
    status === "Interested" ? "bg-coral-50 text-coral-600" :
    "bg-sky-50 text-sky-600";
  return <span className={`chip whitespace-nowrap ${style}`}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const style = priority === "Hot" ? "bg-coral-50 text-coral-600" : priority === "Warm" ? "bg-sun-50 text-sun-600" : "bg-mist text-slate-600";
  return <span className={`chip ${style}`}>{priority}</span>;
}

export const prettyDate = (date?: string) => {
  if (!date) return "-";
  const iso = date.length >= 10 ? date.slice(0, 10) : date;
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
