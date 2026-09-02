"use client";

import { FormEvent, useState } from "react";
import { Heading } from "@/components/ui";
import { AccountRow, LoginSlip } from "@/components/login-slip";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { ProvisionedLogin } from "@/lib/accounts";
import { Role } from "@/lib/types";

export default function UsersPage() {
  const { user } = useAuth();
  const crm = useCRMData();
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<ProvisionedLogin>();
  if (!user || user.role !== "super_admin") return <p className="card p-8 text-sm text-slate-500">Platform users are managed by Super Admin.</p>;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = new FormData(event.currentTarget);
    const companyId = String(input.get("companyId"));
    const role = String(input.get("role")) as Role;
    const result = crm.provisionUser(user, { companyId, name: String(input.get("name")), email: String(input.get("email")), phone: String(input.get("phone")), role });
    if (result.error) return setError(result.error);
    setError("");
    setIssued({ name: result.user!.name, email: result.user!.email, password: result.password!, role, companyName: crm.data.companies.find((company) => company.id === companyId)?.name });
    event.currentTarget.reset();
  };

  return (
    <>
      <Heading title="All logins" description="Every owner, salesperson and broker on the platform. Create a login here if you are setting up a tenant yourself." />
      {issued && <LoginSlip login={issued} onDismiss={() => setIssued(undefined)} />}
      <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <select required name="companyId" className="field">
          <option value="">Builder company</option>
          {crm.data.companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </select>
        <select required name="role" className="field">
          <option value="builder_admin">Builder owner</option>
          <option value="sales">Sales</option>
          <option value="broker">Broker</option>
        </select>
        <input required name="name" className="field" placeholder="Full name" />
        <input required type="email" name="email" className="field" placeholder="Login email" />
        <input required name="phone" className="field" placeholder="Mobile" />
        <button className="btn-primary">Create login</button>
        {error && <p className="sm:col-span-2 lg:col-span-3 rounded-xl bg-coral-50 px-4 py-3 text-sm text-coral-600">{error}</p>}
      </form>
      <section className="card divide-y divide-slate-100">
        {crm.data.users.filter((member) => member.role !== "super_admin").map((member) => (
          <AccountRow key={member.id} name={member.name} email={member.email} phone={member.phone} role={member.role} password={member.password} company={crm.data.companies.find((company) => company.id === member.companyId)?.name} />
        ))}
      </section>
    </>
  );
}
