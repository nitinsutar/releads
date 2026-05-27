"use client";

import { FormEvent, use } from "react";
import { MessageSquareText } from "lucide-react";
import { Heading } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";

export default function SupportingPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params);
  const { user } = useAuth();
  const crm = useCRMData();
  if (!user) return null;

  if (section === "team" || section === "brokers") return <People role={section === "team" ? "sales" : "broker"} />;
  if (section === "users") return <People role="all" />;
  if (section === "settings") return <Profile />;
  if (section === "inventory") return <Placeholder title="Inventory" text="Inventory unit linking is reserved for Phase 3. Phase 1 keeps project creation and lead project interest only." />;
  if (section === "site-visits") return <Placeholder title="Site Visits" text="Site visit scheduling and visit status are placeholders for Phase 3." />;
  if (section === "bookings") return <Placeholder title="Booking Status" text="Booking workflow is reserved for Phase 3. Phase 1 stops at lead capture, assignment, follow-up date and notes." />;
  if (section === "resources") return <Placeholder title="Project Resources" text="Brochure links and shareable broker resources are placeholders for a later broker workflow." />;
  if (section === "documents") return <Placeholder title="Customer Documents" text="Document upload is reserved for Phase 3. KYC and booking document slots will appear here later." />;
  if (section === "commissions") return <Placeholder title="Commission Status" text="Broker commission tracking is reserved for Phase 3." />;
  if (section === "subscriptions") return <Placeholder title="Subscriptions" text="Subscription and payment status integration is reserved for the later SaaS billing phase." />;
  return <Placeholder title="Coming Soon" text="This module is planned for a later product phase." />;

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
        <Heading title={role === "sales" ? "Sales Team" : role === "broker" ? "Channel Partners" : "Platform Users"} description="Phase 1 user creation and role assignment." />
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

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <>
      <Heading title={title} description={text} />
      <section className="card flex max-w-2xl gap-4 p-7">
        <MessageSquareText className="h-6 w-6 text-brand-600" />
        <div>
          <h2 className="font-semibold">Future phase placeholder</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
        </div>
      </section>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <label><span className="label">{label}</span><input className="field capitalize" defaultValue={value} /></label>;
}
