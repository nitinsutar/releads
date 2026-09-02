"use client";

import { FormEvent } from "react";
import { Heading } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";

export default function SalesTeamPage() {
  const { user } = useAuth();
  const crm = useCRMData();
  if (!user) return null;

  const people = user.role === "super_admin"
    ? crm.data.users.filter((member) => member.role === "sales")
    : crm.data.users.filter((member) => member.companyId === user.companyId && member.role === "sales");
  const canCreate = user.role === "builder_admin";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = new FormData(event.currentTarget);
    crm.addTeamUser(user, {
      name: String(input.get("name")),
      email: String(input.get("email")),
      phone: String(input.get("phone")),
      role: "sales"
    });
    event.currentTarget.reset();
  };

  return (
    <>
      <Heading title="Sales Team" description="Add an executive. They sign in with this email and password demo123, then only see leads assigned to them." />
      {canCreate && (
        <form onSubmit={submit} className="card mb-4 grid gap-4 p-5 lg:grid-cols-4">
          <input required name="name" className="field" placeholder="Full name" />
          <input required name="email" type="email" className="field" placeholder="Work email — this is their login" />
          <input required name="phone" className="field" placeholder="Mobile number" />
          <button className="btn-primary">Add salesperson</button>
        </form>
      )}
      {canCreate && (
        <p className="mb-6 rounded-2xl border border-mist bg-white/70 px-4 py-3 text-sm text-slate-500">
          They appear in this list immediately. Share the email plus password <strong className="text-ink">demo123</strong>. Open a lead file and use Assign to so their dashboard fills up.
        </p>
      )}
      <section className="card divide-y divide-slate-100">
        {people.map((member) => (
          <div key={member.id} className="flex flex-wrap justify-between gap-3 p-5 text-sm">
            <div>
              <p className="font-semibold">{member.name}</p>
              <p className="text-slate-500">{member.email} | {member.phone}</p>
              <p className="mt-1 text-xs text-slate-400">Login: {member.email} · password demo123</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold capitalize text-brand-700">{member.role.replace("_", " ")}</span>
          </div>
        ))}
      </section>
    </>
  );
}
