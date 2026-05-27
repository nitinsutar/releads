"use client";

import Link from "next/link";
import { CalendarClock, Home, TrendingUp, UserRoundCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { Heading, StatCard, StatusBadge, prettyDate } from "@/components/ui";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, leadsFor, projectsFor } = useCRMData();
  if (!user) return null;
  const leads = leadsFor(user);
  const projects = projectsFor(user);
  const today = new Date().toISOString().slice(0, 10);
  const metrics = {
    leads: leads.length,
    new: leads.filter((lead) => lead.status === "New Lead").length,
    assigned: leads.filter((lead) => Boolean(lead.assignedTo)).length,
    followups: leads.filter((lead) => lead.followupDate && lead.followupDate >= today).length
  };
  const title = user.role === "super_admin" ? "Platform Dashboard" : user.role === "builder_admin" ? "Company Dashboard" : user.role === "sales" ? "My Sales Dashboard" : user.role === "broker" ? "Channel Partner Dashboard" : "My Home Journey";
  const description = user.role === "customer" ? "View your enquiry and assigned contact details." : "Phase 1 overview for lead capture, assignment and follow-up tracking.";

  if (user.role === "super_admin") {
    return (
      <>
        <Heading title={title} description="Monitor builder accounts and platform adoption." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Builder Companies" value={data.companies.length} hint="1 currently on trial" icon={<Home className="h-5 w-5" />} />
          <StatCard label="Platform Users" value={data.users.length} hint="Across all account roles" icon={<UserRoundCheck className="h-5 w-5" />} />
          <StatCard label="Total Leads" value={data.leads.length} hint="All registered companies" icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard label="Active Projects" value={data.projects.filter((project) => project.status === "Active").length} hint="Created by builders" icon={<Home className="h-5 w-5" />} />
        </div>
        <CompanyPreview />
      </>
    );
  }

  return (
    <>
      <Heading title={title} description={description} action={user.role !== "customer" ? <Link href="/dashboard/leads" className="btn-primary">Manage leads</Link> : undefined} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Leads" value={metrics.leads} hint="Visible in your workspace" icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label="New Leads" value={metrics.new} hint="Require first contact" />
        <StatCard label="Assigned Leads" value={metrics.assigned} hint="Owned by a sales user" />
        <StatCard label="Scheduled Follow-ups" value={metrics.followups} hint="Date captured on lead" icon={<CalendarClock className="h-5 w-5" />} />
        <StatCard label="Active Projects" value={projects.filter((project) => project.status === "Active").length} />
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="card overflow-hidden">
          <div className="flex justify-between border-b border-slate-100 p-5"><h2 className="font-semibold">Recent leads</h2><Link className="text-sm font-semibold text-brand-600" href="/dashboard/leads">View all</Link></div>
          <div className="divide-y divide-slate-100">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div><p className="font-semibold">{lead.customerName}</p><p className="mt-1 text-xs text-slate-400">{data.projects.find((project) => project.id === lead.projectId)?.name} | Follow-up {prettyDate(lead.followupDate)}</p></div>
                <StatusBadge status={lead.status} />
              </div>
            ))}
          </div>
        </section>
        <section className="card p-5">
          <p className="text-sm font-semibold text-brand-600">Future phase placeholder</p>
          <h2 className="mt-2 font-semibold">Pipeline and reports</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">Kanban, priority scoring, overdue follow-ups, source analytics, booking reports and exports are intentionally held for later phases.</p>
        </section>
      </div>
    </>
  );
}

function CompanyPreview() {
  const { data } = useCRMData();
  return (
    <section className="card mt-7 overflow-hidden">
      <h2 className="border-b border-slate-100 p-5 font-semibold">Builder accounts</h2>
      <div className="divide-y divide-slate-100">
        {data.companies.map((company) => (
          <div className="flex flex-wrap items-center justify-between gap-3 p-5" key={company.id}>
            <div><p className="font-semibold">{company.name}</p><p className="text-sm text-slate-500">{company.city} | {company.email}</p></div>
            <div className="flex items-center gap-3"><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{company.paymentStatus}</span><span className="text-sm text-slate-500">{company.plan}</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}
