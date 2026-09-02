"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { Lead } from "@/lib/types";
import { LeadActions } from "./lead-actions";
import { PriorityBadge, prettyDate, StatusBadge } from "./ui";

export function HuddleBoard({ onOpen }: { onOpen?: (leadId: string) => void }) {
  const { user } = useAuth();
  const { data, leadsFor, updateLead, addNote } = useCRMData();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const active = leadsFor(user).filter((lead) => lead.status !== "Lost" && lead.status !== "Booked / Closed" && lead.followupDate);
  const overdue = active.filter((lead) => lead.followupDate! < today);
  const due = active.filter((lead) => lead.followupDate === today);

  const touch = (lead: Lead, nextDate: string, kind: "done" | "snooze") => {
    updateLead(user, lead.id, { followupDate: nextDate, lastContactedDate: today });
    addNote(user, lead.id, kind === "done" ? `Follow-up marked done. Next call ${nextDate}.` : `Follow-up snoozed to ${nextDate}.`);
  };

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Morning huddle</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Who needs a call right now</h2>
        </div>
        <Link href="/dashboard/followups" className="text-sm font-semibold text-brand-600">Open workspace</Link>
      </div>
      <div className="grid divide-y divide-mist lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <HuddleList title="Overdue" accent="text-coral-600" leads={overdue} data={data} sender={user.name} empty="No overdue calls. Nice." onOpen={onOpen} onFollowup={touch} />
        <HuddleList title="Due today" accent="text-sun-600" leads={due} data={data} sender={user.name} empty="Nothing queued for today." onOpen={onOpen} onFollowup={touch} />
      </div>
    </section>
  );
}

function HuddleList({
  title,
  accent,
  leads,
  data,
  sender,
  empty,
  onOpen,
  onFollowup
}: {
  title: string;
  accent: string;
  leads: Lead[];
  data: ReturnType<typeof useCRMData>["data"];
  sender: string;
  empty: string;
  onOpen?: (leadId: string) => void;
  onFollowup: (lead: Lead, nextDate: string, kind: "done" | "snooze") => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${accent}`}>{title}</h3>
        <span className="chip bg-mist text-slate-600">{leads.length}</span>
      </div>
      <div className="space-y-3">
        {leads.slice(0, 6).map((lead) => {
          const projectName = data.projects.find((project) => project.id === lead.projectId)?.name ?? "Project";
          return (
            <article key={lead.id} className="rounded-2xl border border-mist bg-paper/60 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => onOpen?.(lead.id)} className="text-left">
                  <p className="font-semibold text-ink">{lead.customerName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{projectName} · {prettyDate(lead.followupDate)}</p>
                </button>
                <PriorityBadge priority={lead.priority} />
              </div>
              <div className="mt-2"><StatusBadge status={lead.status} /></div>
              <div className="mt-3">
                <LeadActions lead={lead} projectName={projectName} sender={sender} compact onFollowup={(next, kind) => onFollowup(lead, next, kind)} />
              </div>
            </article>
          );
        })}
        {!leads.length && <p className="rounded-xl border border-dashed border-mist bg-white px-4 py-6 text-center text-sm text-slate-400">{empty}</p>}
      </div>
    </div>
  );
}
