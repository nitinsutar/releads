"use client";

import { FormEvent, useState } from "react";
import { Heading } from "@/components/ui";
import { AccountRow, LoginSlip } from "@/components/login-slip";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { ProvisionedLogin } from "@/lib/accounts";

export default function SalesTeamPage() {
  return <TeamDirectory role="sales" title="Sales Team" actionLabel="Add salesperson" />;
}

export function TeamDirectory({ role, title, actionLabel }: { role: "sales" | "broker"; title: string; actionLabel: string }) {
  const { user } = useAuth();
  const crm = useCRMData();
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<ProvisionedLogin>();
  if (!user) return null;

  const people = user.role === "super_admin"
    ? crm.data.users.filter((member) => member.role === role)
    : crm.data.users.filter((member) => member.companyId === user.companyId && member.role === role);
  const canCreate = user.role === "builder_admin";
  const companyName = crm.data.companies.find((company) => company.id === user.companyId)?.name;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = new FormData(event.currentTarget);
    const result = crm.addTeamUser(user, { name: String(input.get("name")), email: String(input.get("email")), phone: String(input.get("phone")), role });
    if (result.error) return setError(result.error);
    setError("");
    setIssued({ name: result.user!.name, email: result.user!.email, password: result.password!, role, companyName });
    event.currentTarget.reset();
  };

  return (
    <>
      <Heading title={title} description={`Create a login, copy it, and send it. They sign in at /login and only see ${role === "sales" ? "leads assigned to them" : "leads they submit"}.`} />
      {issued && <LoginSlip login={issued} onDismiss={() => setIssued(undefined)} />}
      {canCreate && (
        <form onSubmit={submit} className="card mb-4 grid gap-4 p-5 lg:grid-cols-4">
          <input required name="name" className="field" placeholder="Full name" />
          <input required name="email" type="email" className="field" placeholder="Work email — this is their login" />
          <input required name="phone" className="field" placeholder="Mobile number" />
          <button className="btn-primary">{actionLabel}</button>
          {error && <p className="lg:col-span-4 rounded-xl bg-coral-50 px-4 py-3 text-sm text-coral-600">{error}</p>}
        </form>
      )}
      <section className="card divide-y divide-slate-100">
        {people.map((member) => (
          <AccountRow key={member.id} name={member.name} email={member.email} phone={member.phone} role={member.role} password={member.password} company={crm.data.companies.find((company) => company.id === member.companyId)?.name} />
        ))}
        {!people.length && <p className="p-6 text-sm text-slate-400">No accounts yet.</p>}
      </section>
    </>
  );
}
