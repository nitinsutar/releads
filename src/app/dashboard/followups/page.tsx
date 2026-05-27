"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { Heading, prettyDate, PriorityBadge, StatCard, StatusBadge } from "@/components/ui";
import { Lead } from "@/lib/types";

export default function FollowupsPage() {
  const { user } = useAuth();
  const { data, leadsFor } = useCRMData();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const activeLeads = leadsFor(user).filter((lead) => lead.status !== "Lost" && lead.status !== "Booked / Closed" && lead.followupDate);
  const overdue = activeLeads.filter((lead) => lead.followupDate! < today);
  const todays = activeLeads.filter((lead) => lead.followupDate === today);
  const upcoming = activeLeads.filter((lead) => lead.followupDate! > today).sort((a, b) => a.followupDate!.localeCompare(b.followupDate!));

  return (
    <>
      <Heading title="Follow-up Workspace" description="Today, overdue and upcoming lead follow-ups based on the next follow-up date." action={<Link href="/dashboard/leads" className="btn-primary">Open leads</Link>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Due Today" value={todays.length} hint="Call or update today" icon={<CalendarClock className="h-5 w-5" />} />
        <StatCard label="Overdue" value={overdue.length} hint="Needs immediate attention" />
        <StatCard label="Upcoming" value={upcoming.length} hint="Scheduled after today" />
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-3">
        <FollowupColumn title="Due today" leads={todays} data={data} empty="Nothing due today." />
        <FollowupColumn title="Overdue" leads={overdue} data={data} empty="No overdue follow-ups." danger />
        <FollowupColumn title="Upcoming" leads={upcoming.slice(0, 8)} data={data} empty="No upcoming follow-ups." />
      </div>
    </>
  );
}

function FollowupColumn({ title, leads, data, empty, danger }: { title: string; leads: Lead[]; data: ReturnType<typeof useCRMData>["data"]; empty: string; danger?: boolean }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <h2 className={`font-semibold ${danger ? "text-red-700" : "text-slate-950"}`}>{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {leads.map((lead) => (
          <article key={lead.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{lead.customerName}</p>
                <p className="mt-1 text-xs text-slate-400">{data.projects.find((project) => project.id === lead.projectId)?.name ?? "-"} | {lead.phone}</p>
              </div>
              <PriorityBadge priority={lead.priority} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={lead.status} />
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{prettyDate(lead.followupDate)}</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">Owner: {data.users.find((member) => member.id === lead.assignedTo)?.name ?? "Unassigned"}</p>
          </article>
        ))}
        {!leads.length && <p className="p-6 text-sm text-slate-400">{empty}</p>}
      </div>
    </section>
  );
}
