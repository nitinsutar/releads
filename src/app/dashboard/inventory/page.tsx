"use client";

import { FormEvent } from "react";
import { Heading } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { Requirement, requirements, Unit } from "@/lib/types";

export default function InventoryPage() {
  const { user } = useAuth();
  const crm = useCRMData();
  if (!user) return null;

  const projects = crm.projectsFor(user);
  const units = crm.data.units.filter((unit) => user.role === "super_admin" || unit.companyId === user.companyId);
  const canCreate = user.role === "builder_admin";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = new FormData(event.currentTarget);
    const area = Number(input.get("areaSqft"));
    crm.addUnit(user, {
      projectId: String(input.get("projectId")),
      unitNumber: String(input.get("unitNumber")),
      type: String(input.get("type")) as Requirement,
      areaSqft: Number.isFinite(area) && area > 0 ? area : undefined,
      price: String(input.get("price")),
      status: String(input.get("status")) as Unit["status"]
    });
    event.currentTarget.reset();
  };

  return (
    <>
      <Heading title="Inventory" description="Same configuration can exist twice if the carpet area is different — 1BHK 440 sqft and 1BHK 401 sqft are separate units." />
      {canCreate && (
        <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <select required name="projectId" className="field">
            <option value="">Project</option>
            {projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}
          </select>
          <input required name="unitNumber" className="field" placeholder="Unit number — A-1204" />
          <select name="type" className="field">{requirements.map((item) => <option key={item}>{item}</option>)}</select>
          <input required name="areaSqft" type="number" min="1" className="field" placeholder="Area in sqft — 440, 863" />
          <input required name="price" className="field" placeholder="Price" />
          <select name="status" className="field">
            <option>Available</option>
            <option>On Hold</option>
            <option>Booked</option>
          </select>
          <button className="btn-primary sm:col-span-2 lg:col-span-3">Add unit</button>
        </form>
      )}
      <section className="card overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>{["Unit", "Project", "Type", "Area", "Price", "Status"].map((label) => <th className="px-5 py-4 font-semibold" key={label}>{label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {units.map((unit) => (
              <tr key={unit.id}>
                <td className="px-5 py-4 font-semibold">{unit.unitNumber}</td>
                <td className="px-5 py-4">{crm.data.projects.find((project) => project.id === unit.projectId)?.name}</td>
                <td className="px-5 py-4">{unit.type}</td>
                <td className="px-5 py-4">{unit.areaSqft ? `${unit.areaSqft} sqft` : "—"}</td>
                <td className="px-5 py-4">{unit.price}</td>
                <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{unit.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
