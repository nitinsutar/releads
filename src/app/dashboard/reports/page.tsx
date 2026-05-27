"use client";

import { Download } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { Heading, PriorityBadge, StatCard, StatusBadge } from "@/components/ui";
import { CRMUser, Lead, leadStatuses } from "@/lib/types";

export default function ReportsPage() {
  const { user } = useAuth();
  const { data, leadsFor } = useCRMData();
  if (!user) return null;

  const leads = leadsFor(user);
  const companyUsers = data.users.filter((member) => !user.companyId || member.companyId === user.companyId);
  const salesUsers = companyUsers.filter((member) => member.role === "sales");
  const brokers = companyUsers.filter((member) => member.role === "broker");
  const booked = leads.filter((lead) => lead.status === "Booked / Closed");
  const lost = leads.filter((lead) => lead.status === "Lost");
  const active = leads.filter((lead) => lead.status !== "Lost" && lead.status !== "Booked / Closed");
  const conversionRate = leads.length ? Math.round((booked.length / leads.length) * 100) : 0;
  const lossRate = leads.length ? Math.round((lost.length / leads.length) * 100) : 0;

  return (
    <>
      <Heading title="Phase 4 Reports" description="Lead totals, status/source performance, broker and sales tracking, conversion rate and CSV export." action={<button className="btn-primary" onClick={() => exportLeadsCsv(leads, data)}><Download className="h-4 w-4" /> Export CSV</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Leads" value={leads.length} hint="Visible within your role" />
        <StatCard label="Booked Leads" value={booked.length} hint={`${conversionRate}% conversion rate`} />
        <StatCard label="Lost Leads" value={lost.length} hint={`${lossRate}% loss rate`} />
        <StatCard label="Open Pipeline" value={active.length} hint="Active sales opportunities" />
        <StatCard label="Hot Leads" value={leads.filter((lead) => lead.priority === "Hot").length} hint="High priority pipeline" />
        <StatCard label="Site Visits" value={leads.filter((lead) => lead.status.includes("Site Visit")).length} hint="Scheduled or completed" />
        <StatCard label="Broker Leads" value={leads.filter((lead) => Boolean(lead.brokerId)).length} hint="Channel partner sourced" />
        <StatCard label="Bookings Value" value={sumBookingAmounts(data.bookings.filter((booking) => leads.some((lead) => lead.id === booking.leadId)))} hint="Demo booking collection" />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <Breakdown title="Leads by status" rows={leadStatuses.map((status) => ({ label: status, count: leads.filter((lead) => lead.status === status).length, accent: status }))} />
        <Breakdown title="Leads by source" rows={groupByLabel(leads, (lead) => lead.source).map((item) => ({ label: item.label, count: item.leads.length }))} />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <PerformanceTable title="Salesperson-wise report" people={salesUsers} leads={leads} getOwnerId={(lead) => lead.assignedTo} empty="No sales users found." />
        <PerformanceTable title="Broker-wise report" people={brokers} leads={leads} getOwnerId={(lead) => lead.brokerId} empty="No brokers found." />
      </div>

      <section className="card mt-7 overflow-hidden">
        <div className="border-b border-slate-100 p-5"><h2 className="font-semibold">Booked and lost leads</h2><p className="mt-1 text-sm text-slate-500">Quick closure view for weekly sales review meetings.</p></div>
        <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr>{["Customer", "Project", "Owner", "Broker", "Status", "Lost Reason"].map((label) => <th className="px-5 py-4 font-semibold" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{[...booked, ...lost].map((lead) => <tr key={lead.id}><td className="px-5 py-4"><p className="font-semibold">{lead.customerName}</p><p className="text-xs text-slate-400">{lead.phone}</p></td><td className="px-5 py-4">{data.projects.find((project) => project.id === lead.projectId)?.name ?? "-"}</td><td className="px-5 py-4">{data.users.find((member) => member.id === lead.assignedTo)?.name ?? "Unassigned"}</td><td className="px-5 py-4">{data.users.find((member) => member.id === lead.brokerId)?.name ?? "-"}</td><td className="px-5 py-4"><StatusBadge status={lead.status} /></td><td className="px-5 py-4 text-slate-500">{lead.lostReason ?? "-"}</td></tr>)}</tbody></table>{!booked.length && !lost.length && <p className="p-6 text-sm text-slate-400">No closed or lost leads yet.</p>}</div>
      </section>
    </>
  );
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; count: number; accent?: string }[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return <section className="card overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-semibold">{title}</h2></div><div className="divide-y divide-slate-100">{rows.map((row) => { const percent = total ? Math.round((row.count / total) * 100) : 0; return <div key={row.label} className="p-5"><div className="flex items-center justify-between gap-3 text-sm"><div>{row.accent && leadStatuses.includes(row.accent as Lead["status"]) ? <StatusBadge status={row.accent as Lead["status"]} /> : <p className="font-semibold text-slate-900">{row.label}</p>}</div><p className="font-semibold">{row.count} <span className="text-xs text-slate-400">({percent}%)</span></p></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${percent}%` }} /></div></div>; })}</div></section>;
}

function PerformanceTable({ title, people, leads, getOwnerId, empty }: { title: string; people: CRMUser[]; leads: Lead[]; getOwnerId: (lead: Lead) => string | undefined; empty: string }) {
  return <section className="card overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-semibold">{title}</h2></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr>{["Name", "Total", "Hot", "Site Visits", "Booked", "Lost", "Conversion"].map((label) => <th key={label} className="px-5 py-4 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{people.map((person) => { const owned = leads.filter((lead) => getOwnerId(lead) === person.id); const booked = owned.filter((lead) => lead.status === "Booked / Closed").length; const conversion = owned.length ? Math.round((booked / owned.length) * 100) : 0; return <tr key={person.id}><td className="px-5 py-4"><p className="font-semibold text-slate-950">{person.name}</p><p className="text-xs text-slate-400">{person.phone}</p></td><td className="px-5 py-4">{owned.length}</td><td className="px-5 py-4"><PriorityBadge priority="Hot" /> <span className="ml-1">{owned.filter((lead) => lead.priority === "Hot").length}</span></td><td className="px-5 py-4">{owned.filter((lead) => lead.status.includes("Site Visit")).length}</td><td className="px-5 py-4">{booked}</td><td className="px-5 py-4">{owned.filter((lead) => lead.status === "Lost").length}</td><td className="px-5 py-4">{conversion}%</td></tr>; })}</tbody></table>{!people.length && <p className="p-6 text-sm text-slate-400">{empty}</p>}</div></section>;
}

function groupByLabel(leads: Lead[], getLabel: (lead: Lead) => string) {
  return Array.from(leads.reduce((map, lead) => { const label = getLabel(lead) || "Unknown"; map.set(label, [...(map.get(label) ?? []), lead]); return map; }, new Map<string, Lead[]>())).map(([label, groupedLeads]) => ({ label, leads: groupedLeads })).sort((a, b) => b.leads.length - a.leads.length);
}

function exportLeadsCsv(leads: Lead[], data: ReturnType<typeof useCRMData>["data"]) {
  const headers = ["Lead ID", "Customer Name", "Phone", "Email", "Project", "Source", "Assigned To", "Broker", "Priority", "Status", "Follow-up Date", "Budget", "Requirement", "Lost Reason", "Created Date", "Updated Date"];
  const rows = leads.map((lead) => [lead.id, lead.customerName, lead.phone, lead.email, data.projects.find((project) => project.id === lead.projectId)?.name ?? "", lead.source, data.users.find((member) => member.id === lead.assignedTo)?.name ?? "", data.users.find((member) => member.id === lead.brokerId)?.name ?? "", lead.priority, lead.status, lead.followupDate ?? "", lead.budgetRange, lead.requirement, lead.lostReason ?? "", lead.createdAt, lead.updatedAt]);
  const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `releads-export-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function sumBookingAmounts(bookings: ReturnType<typeof useCRMData>["data"]["bookings"]) {
  const total = bookings.reduce((sum, booking) => { const numeric = Number(booking.amount.replace(/[^\d]/g, "")); return sum + (Number.isFinite(numeric) ? numeric : 0); }, 0);
  return total ? `INR ${total.toLocaleString("en-IN")}` : "INR 0";
}
