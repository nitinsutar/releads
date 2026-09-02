"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Heading } from "@/components/ui";
import { LoginSlip } from "@/components/login-slip";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { ProvisionedLogin } from "@/lib/accounts";

export default function CompaniesPage() {
  const { user } = useAuth();
  const { data, provisionBuilder } = useCRMData();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<ProvisionedLogin>();
  if (!user || user.role !== "super_admin") return <p className="card p-8 text-sm text-slate-500">This page is restricted to the platform administrator.</p>;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = new FormData(event.currentTarget);
    const result = provisionBuilder({
      companyName: String(input.get("name")),
      city: String(input.get("city")),
      phone: String(input.get("phone")),
      ownerName: String(input.get("ownerName")),
      ownerEmail: String(input.get("ownerEmail")),
      ownerPhone: String(input.get("ownerPhone"))
    });
    if (result.error) return setError(result.error);
    setError("");
    setIssued({ name: result.user!.name, email: result.user!.email, password: result.password!, role: "builder_admin", companyName: result.companyName });
    setAdding(false);
    event.currentTarget.reset();
  };

  const ownerFor = (companyId: string) => data.users.find((member) => member.companyId === companyId && member.role === "builder_admin");

  return (
    <>
      <Heading title="Builder Companies" description="Create a builder and an owner login in one step. Copy the slip and send it on WhatsApp." action={<button className="btn-primary" onClick={() => setAdding((value) => !value)}><Plus className="h-4 w-4" /> Add builder</button>} />
      {issued && <LoginSlip login={issued} onDismiss={() => setIssued(undefined)} />}
      {adding && (
        <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <p className="sm:col-span-2 lg:col-span-3 text-sm font-semibold text-ink">Company</p>
          <input required name="name" className="field" placeholder="Company name" />
          <input required name="city" className="field" placeholder="City" />
          <input required name="phone" className="field" placeholder="Company phone" />
          <p className="sm:col-span-2 lg:col-span-3 mt-2 text-sm font-semibold text-ink">Owner login</p>
          <input required name="ownerName" className="field" placeholder="Owner full name" />
          <input required type="email" name="ownerEmail" className="field" placeholder="Owner email — this is their login" />
          <input required name="ownerPhone" className="field" placeholder="Owner mobile" />
          {error && <p className="sm:col-span-2 lg:col-span-3 rounded-xl bg-coral-50 px-4 py-3 text-sm text-coral-600">{error}</p>}
          <button className="btn-primary sm:col-span-2 lg:col-span-3">Create company and owner login</button>
        </form>
      )}
      <section className="card overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>{["Company", "Owner login", "Password", "Plan", "Status"].map((label) => <th key={label} className="px-5 py-4">{label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.companies.map((company) => {
              const owner = ownerFor(company.id);
              return (
                <tr key={company.id}>
                  <td className="px-5 py-4"><p className="font-semibold">{company.name}</p><p className="text-xs text-slate-400">{company.city} · {company.phone}</p></td>
                  <td className="px-5 py-4 text-slate-500">{owner ? `${owner.name} · ${owner.email}` : "No owner yet"}</td>
                  <td className="px-5 py-4 font-medium text-ink">{owner?.password ?? "—"}</td>
                  <td className="px-5 py-4">{company.plan}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{company.paymentStatus}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
