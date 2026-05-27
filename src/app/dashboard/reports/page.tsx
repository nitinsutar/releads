"use client";

import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { Heading, PriorityBadge, StatCard } from "@/components/ui";
import { CRMUser, Lead } from "@/lib/types";

export default function ReportsPage() {
  const { user } = useAuth();
  const { data, leadsFor } = useCRMData();
  if (!user) return null;

  const leads = leadsFor(user);
  const companyUsers = data.users.filter((member) => !user.companyId || member.companyId === user.companyId);
  const salesUsers = companyUsers.filter((member) => member.role === "sales");
  const brokers = companyUsers.filter((member) => member.role === "broker");
  const sources = groupByLabel(leads, (lead) => lead.source);

  return (
    <>
      <Heading title="Phase 2 Reports" description="Broker-wise, salesperson-wise and source tracking for the active lead pipeline." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Visible Leads" value={leads.length} hint="Within your role permissions" />
        <StatCard label="Hot Leads" value={leads.filter((lead) => lead.priority === "Hot").length} hint="High intent prospects" />
        <StatCard label="Booked / Closed" value={leads.filter((lead) => lead.status === "Booked / Closed").length} hint="Conversion placeholder" />
        <StatCard label="Lost Leads" value={leads.filter((lead) => lead.status === "Lost").length} hint="Loss analysis later" />
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <PerformanceTable title="Salesperson-wise tracking" people={salesUsers} leads={leads} getOwnerId={(lead) => lead.assignedTo} empty="No sales users found." />
        <PerformanceTable title="Broker-wise tracking" people={brokers} leads={leads} getOwnerId={(lead) => lead.brokerId} empty="No brokers found." />
      </div>
      <section className="card mt-7 overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-semibold">Lead source performance</h2>
          <p className="mt-1 text-sm text-slate-500">Useful for spotting which enquiry channels are bringing qualified leads.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {sources.map((item) => (
            <div key={item.label} className="grid gap-3 p-5 text-sm sm:grid-cols-5">
              <p className="font-semibold text-slate-950">{item.label}</p>
              <p>Total: {item.leads.length}</p>
              <p>Hot: {item.leads.filter((lead) => lead.priority === "Hot").length}</p>
              <p>Booked: {item.leads.filter((lead) => lead.status === "Booked / Closed").length}</p>
              <p>Lost: {item.leads.filter((lead) => lead.status === "Lost").length}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function PerformanceTable({ title, people, leads, getOwnerId, empty }: { title: string; people: CRMUser[]; leads: Lead[]; getOwnerId: (lead: Lead) => string | undefined; empty: string }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>{["Name", "Total", "Hot", "Open", "Booked", "Lost"].map((label) => <th key={label} className="px-5 py-4 font-semibold">{label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {people.map((person) => {
              const owned = leads.filter((lead) => getOwnerId(lead) === person.id);
              return (
                <tr key={person.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-950">{person.name}</p>
                    <p className="text-xs text-slate-400">{person.phone}</p>
                  </td>
                  <td className="px-5 py-4">{owned.length}</td>
                  <td className="px-5 py-4"><PriorityBadge priority="Hot" /> <span className="ml-1">{owned.filter((lead) => lead.priority === "Hot").length}</span></td>
                  <td className="px-5 py-4">{owned.filter((lead) => lead.status !== "Lost" && lead.status !== "Booked / Closed").length}</td>
                  <td className="px-5 py-4">{owned.filter((lead) => lead.status === "Booked / Closed").length}</td>
                  <td className="px-5 py-4">{owned.filter((lead) => lead.status === "Lost").length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!people.length && <p className="p-6 text-sm text-slate-400">{empty}</p>}
      </div>
    </section>
  );
}

function groupByLabel(leads: Lead[], getLabel: (lead: Lead) => string) {
  return Array.from(leads.reduce((map, lead) => {
    const label = getLabel(lead);
    map.set(label, [...(map.get(label) ?? []), lead]);
    return map;
  }, new Map<string, Lead[]>())).map(([label, groupedLeads]) => ({ label, leads: groupedLeads }));
}
