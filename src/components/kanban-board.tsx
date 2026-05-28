"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { Lead, leadStatuses } from "@/lib/types";
import { Heading, prettyDate, PriorityBadge, StatusBadge } from "./ui";

export function KanbanBoard() {
  const { user } = useAuth();
  const { data, leadsFor, updateLead } = useCRMData();
  if (!user) return null;
  const leads = leadsFor(user);
  const canMove = user.role === "builder_admin" || user.role === "sales";
  const grouped = useMemo(() => leadStatuses.map((status) => ({ status, leads: leads.filter((lead) => lead.status === status) })), [leads]);
  return <><Heading title="Lead Pipeline" description="Kanban view for enquiry-to-booking lead movement." /><div className="overflow-x-auto pb-3"><div className="grid min-w-[1280px] grid-cols-10 gap-4">{grouped.map((column) => <section key={column.status} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><div className="mb-3 flex items-center justify-between gap-2"><StatusBadge status={column.status} /><span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">{column.leads.length}</span></div><div className="space-y-3">{column.leads.map((lead) => <LeadCard key={lead.id} lead={lead} data={data} canMove={canMove} onMove={(status) => updateLead(user, lead.id, { status })} />)}{!column.leads.length && <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-400">No leads</p>}</div></section>)}</div></div></>;
}

function LeadCard({ lead, data, canMove, onMove }: { lead: Lead; data: ReturnType<typeof useCRMData>["data"]; canMove: boolean; onMove: (status: Lead["status"]) => void }) {
  return <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-950">{lead.customerName}</p><p className="mt-1 text-xs text-slate-400">{data.projects.find((project) => project.id === lead.projectId)?.name ?? "Project not set"}</p></div><PriorityBadge priority={lead.priority} /></div><div className="mt-3 space-y-1 text-xs text-slate-500"><p>Source: {lead.source}</p><p>Assigned: {data.users.find((member) => member.id === lead.assignedTo)?.name ?? "Unassigned"}</p><p>Follow-up: {prettyDate(lead.followupDate)}</p></div>{canMove && <select className="field mt-3 text-xs" value={lead.status} onChange={(event) => onMove(event.target.value as Lead["status"])}>{leadStatuses.map((status) => <option key={status}>{status}</option>)}</select>}</article>;
}
