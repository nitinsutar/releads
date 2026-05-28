"use client";

import { FormEvent, use } from "react";
import { MessageSquareText } from "lucide-react";
import { Heading, prettyDate } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { Requirement, requirements, Unit } from "@/lib/types";

export default function SupportingPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params);
  const { user } = useAuth();
  const crm = useCRMData();
  if (!user) return null;

  if (section === "team" || section === "brokers") return <People role={section === "team" ? "sales" : "broker"} />;
  if (section === "users") return <People role="all" />;
  if (section === "settings") return <Profile />;
  if (section === "inventory") return <Inventory />;
  if (section === "site-visits") return <SiteVisits />;
  if (section === "bookings") return <Bookings />;
  if (section === "resources") return <Resources />;
  if (section === "documents") return <Documents />;
  if (section === "commissions") return <Commissions />;
  if (section === "subscriptions") return <Subscriptions />;
  if (section === "integrations") return <Integrations />;
  return <Placeholder title="Coming Soon" text="This module is planned for a future product release." />;

  function People({ role }: { role: "sales" | "broker" | "all" }) {
    const isSuper = user!.role === "super_admin";
    const people = isSuper ? crm.data.users : crm.data.users.filter((member) => member.companyId === user!.companyId && (role === "all" || member.role === role));
    const canCreate = user!.role === "builder_admin" && role !== "all";
    const submit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const input = new FormData(event.currentTarget);
      crm.addTeamUser(user!, {
        name: String(input.get("name")),
        email: String(input.get("email")),
        phone: String(input.get("phone")),
        role: role === "broker" ? "broker" : "sales"
      });
      event.currentTarget.reset();
    };
    return (
      <>
        <Heading title={role === "sales" ? "Sales Team" : role === "broker" ? "Channel Partners" : "Platform Users"} description="User creation and role assignment for the active workspace." />
        {canCreate && (
          <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 lg:grid-cols-4">
            <input required name="name" className="field" placeholder="Full name" />
            <input required name="email" type="email" className="field" placeholder="Email" />
            <input required name="phone" className="field" placeholder="Mobile number" />
            <button className="btn-primary">Add user</button>
          </form>
        )}
        <section className="card divide-y divide-slate-100">
          {people.map((member) => (
            <div key={member.id} className="flex flex-wrap justify-between gap-3 p-5 text-sm">
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-slate-500">{member.email} | {member.phone}</p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold capitalize text-brand-700">{member.role.replace("_", " ")}</span>
            </div>
          ))}
        </section>
      </>
    );
  }

  function Inventory() {
    const projects = crm.projectsFor(user!);
    const units = crm.data.units.filter((unit) => user!.role === "super_admin" || unit.companyId === user!.companyId);
    const canCreate = user!.role === "builder_admin";
    const submit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const input = new FormData(event.currentTarget);
      crm.addUnit(user!, {
        projectId: String(input.get("projectId")),
        unitNumber: String(input.get("unitNumber")),
        type: String(input.get("type")) as Requirement,
        price: String(input.get("price")),
        status: String(input.get("status")) as Unit["status"]
      });
      event.currentTarget.reset();
    };
    return (
      <>
        <Heading title="Inventory" description="Unit inventory linking for lead interest and bookings." />
        {canCreate && (
          <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 lg:grid-cols-5">
            <select required name="projectId" className="field"><option value="">Project</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select>
            <input required name="unitNumber" className="field" placeholder="Unit number" />
            <select name="type" className="field">{requirements.map((item) => <option key={item}>{item}</option>)}</select>
            <input required name="price" className="field" placeholder="Price" />
            <select name="status" className="field"><option>Available</option><option>On Hold</option><option>Booked</option></select>
            <button className="btn-primary">Add unit</button>
          </form>
        )}
        <section className="card overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr>{["Unit", "Project", "Type", "Price", "Status"].map((label) => <th className="px-5 py-4 font-semibold" key={label}>{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {units.map((unit) => <tr key={unit.id}><td className="px-5 py-4 font-semibold">{unit.unitNumber}</td><td className="px-5 py-4">{crm.data.projects.find((project) => project.id === unit.projectId)?.name}</td><td className="px-5 py-4">{unit.type}</td><td className="px-5 py-4">{unit.price}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{unit.status}</span></td></tr>)}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function SiteVisits() {
    const leads = crm.leadsFor(user!);
    const visits = crm.data.siteVisits.filter((visit) => leads.some((lead) => lead.id === visit.leadId));
    return <Listing title="Site Visits" description="Scheduled and completed project visits." rows={visits.map((visit) => ({ id: visit.id, title: crm.data.leads.find((lead) => lead.id === visit.leadId)?.customerName ?? visit.leadId, meta: `${crm.data.projects.find((project) => project.id === visit.projectId)?.name ?? "-"} | ${prettyDate(visit.visitDate)}`, badge: visit.status, note: visit.notes }))} />;
  }

  function Bookings() {
    const leads = crm.leadsFor(user!);
    const bookings = crm.data.bookings.filter((booking) => leads.some((lead) => lead.id === booking.leadId));
    return <Listing title="Bookings" description="Booking records generated from marked-closed leads." rows={bookings.map((booking) => ({ id: booking.id, title: crm.data.leads.find((lead) => lead.id === booking.leadId)?.customerName ?? booking.leadId, meta: `${booking.amount} | ${prettyDate(booking.bookingDate)}`, badge: booking.status, note: crm.data.units.find((unit) => unit.id === booking.unitId)?.unitNumber ?? "No unit linked" }))} />;
  }

  function Documents() {
    const leads = crm.leadsFor(user!);
    const documents = crm.data.customerDocuments.filter((document) => leads.some((lead) => lead.id === document.leadId));
    return <Listing title="Customer Documents" description="Document slots for KYC and booking paperwork." rows={documents.map((document) => ({ id: document.id, title: document.name, meta: crm.data.leads.find((lead) => lead.id === document.leadId)?.customerName ?? document.leadId, badge: document.status, note: document.uploadedAt ? `Uploaded ${prettyDate(document.uploadedAt)}` : "Awaiting upload" }))} />;
  }

  function Commissions() {
    const leads = crm.leadsFor(user!);
    const commissions = crm.data.brokerCommissions.filter((commission) => user!.role === "broker" ? commission.brokerId === user!.id : leads.some((lead) => lead.id === commission.leadId));
    return <Listing title="Commission Status" description="Broker commissions linked to broker leads and bookings." rows={commissions.map((commission) => ({ id: commission.id, title: crm.data.users.find((member) => member.id === commission.brokerId)?.name ?? "Broker", meta: `${commission.amount} | ${crm.data.leads.find((lead) => lead.id === commission.leadId)?.customerName ?? commission.leadId}`, badge: commission.status, note: commission.bookingId ? `Booking ${commission.bookingId}` : "Pending booking" }))} />;
  }

  function Subscriptions() {
    return (
      <>
        <Heading title="Subscriptions" description="Plan, billing and payment status controls for the SaaS owner workflow." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {crm.data.companies.map((company) => (
            <article key={company.id} className="card p-6">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{company.paymentStatus}</span>
              <h2 className="mt-5 text-xl font-semibold">{company.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{company.city} | {company.email}</p>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
                <p><span className="text-slate-400">Current plan</span><br /><strong>{company.plan}</strong></p>
                <p className="mt-3"><span className="text-slate-400">Payment gateway</span><br />Razorpay/Stripe connector ready</p>
              </div>
              <button className="btn-secondary mt-5 w-full">Manage billing</button>
            </article>
          ))}
        </div>
      </>
    );
  }

  function Integrations() {
    const cards = [
      { title: "WhatsApp", status: "Ready to connect", text: "Send lead updates, visit reminders and booking confirmations through a WhatsApp Business provider." },
      { title: "Meta Ads Lead Import", status: "Connector planned", text: "Map Facebook and Instagram lead forms into the CRM with source attribution." },
      { title: "Google Sheets Import", status: "Connector planned", text: "Import offline enquiry sheets and channel partner lists into lead records." },
      { title: "Email Reminders", status: "Template ready", text: "Send follow-up reminders, visit confirmations and booking next steps by email." },
      { title: "SMS Reminders", status: "Template ready", text: "Send concise follow-up and site visit alerts to customers and sales users." },
      { title: "Billing Gateway", status: "Setup ready", text: "Connect subscription payments and builder account status to Razorpay or Stripe." }
    ];
    return (
      <>
        <Heading title="Integrations" description="Advanced connectors and automation touchpoints for production rollout." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="card p-6">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{card.status}</span>
              <h2 className="mt-5 text-xl font-semibold">{card.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{card.text}</p>
              <button className="btn-secondary mt-5 w-full">Configure</button>
            </article>
          ))}
        </div>
      </>
    );
  }

  function Resources() {
    const projects = crm.projectsFor(user!);
    return (
      <>
        <Heading title="Project Resources" description="Broker-facing brochure resources and project share links." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => <article key={project.id} className="card p-6"><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{project.status}</span><h2 className="mt-5 text-xl font-semibold">{project.name}</h2><p className="mt-1 text-sm text-slate-500">{project.location}, {project.city}</p><button className="btn-secondary mt-5 w-full">Download/share brochure</button></article>)}
        </div>
      </>
    );
  }

  function Profile() {
    return (
      <>
        <Heading title="Profile & Settings" description="Company and account information for this workspace." />
        <section className="card max-w-2xl p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" value={user!.name} />
            <Field label="Email" value={user!.email} />
            <Field label="Phone" value={user!.phone} />
            <Field label="Account role" value={user!.role.replace("_", " ")} />
          </div>
          <button className="btn-primary mt-7">Save profile</button>
        </section>
      </>
    );
  }
}

function Listing({ title, description, rows }: { title: string; description: string; rows: { id: string; title: string; meta: string; badge: string; note?: string }[] }) {
  return (
    <>
      <Heading title={title} description={description} />
      <section className="card divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
            <div>
              <p className="font-semibold text-slate-950">{row.title}</p>
              <p className="mt-1 text-slate-500">{row.meta}</p>
              {row.note && <p className="mt-1 text-xs text-slate-400">{row.note}</p>}
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{row.badge}</span>
          </div>
        ))}
        {!rows.length && <p className="p-6 text-sm text-slate-400">No records yet.</p>}
      </section>
    </>
  );
}

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <>
      <Heading title={title} description={text} />
      <section className="card flex max-w-2xl gap-4 p-7">
        <MessageSquareText className="h-6 w-6 text-brand-600" />
        <div>
          <h2 className="font-semibold">Planned module</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
        </div>
      </section>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <label><span className="label">{label}</span><input className="field capitalize" defaultValue={value} /></label>;
}
