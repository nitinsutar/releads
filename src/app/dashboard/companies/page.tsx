"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Heading } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";

export default function CompaniesPage() {
  const { user } = useAuth();
  const { data, addCompany } = useCRMData();
  const [adding, setAdding] = useState(false);
  if (!user || user.role !== "super_admin") return <p className="card p-8 text-sm text-slate-500">This page is restricted to the platform administrator.</p>;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = new FormData(event.currentTarget);
    addCompany({ name: String(input.get("name")), city: String(input.get("city")), email: String(input.get("email")), phone: String(input.get("phone")), plan: "Trial", paymentStatus: "Trial", active: true });
    setAdding(false);
  };
  return (
    <>
      <Heading title="Builder Companies" description="Create and monitor tenant accounts on the CRM platform." action={<button className="btn-primary" onClick={() => setAdding((value) => !value)}><Plus className="h-4 w-4" /> Add builder</button>} />
      {adding && <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 lg:grid-cols-5"><input required name="name" className="field" placeholder="Company name" /><input required name="city" className="field" placeholder="City" /><input required type="email" name="email" className="field" placeholder="Email" /><input required name="phone" className="field" placeholder="Phone" /><button className="btn-primary">Create trial</button></form>}
      <section className="card overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr>{["Company", "City", "Contact", "Plan", "Payment", "Status"].map((label) => <th key={label} className="px-5 py-4">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{data.companies.map((company) => <tr key={company.id}><td className="px-5 py-4 font-semibold">{company.name}</td><td className="px-5 py-4 text-slate-500">{company.city}</td><td className="px-5 py-4 text-slate-500">{company.email}</td><td className="px-5 py-4">{company.plan}</td><td className="px-5 py-4"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{company.paymentStatus}</span></td><td className="px-5 py-4">{company.active ? "Active" : "Inactive"}</td></tr>)}</tbody>
        </table>
      </section>
    </>
  );
}
