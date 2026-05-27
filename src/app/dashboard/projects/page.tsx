"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { canManageProjects } from "@/lib/permissions";
import { Heading } from "@/components/ui";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { projectsFor, addProject } = useCRMData();
  const [adding, setAdding] = useState(false);
  if (!user) return null;
  const projects = projectsFor(user);
  const manage = canManageProjects(user) && user.role !== "super_admin";
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = new FormData(event.currentTarget);
    addProject(user, {
      name: String(input.get("name")), city: String(input.get("city")), location: String(input.get("location")),
      status: "Active", brochureUrl: "#", units: Number(input.get("units")), availableUnits: Number(input.get("units"))
    });
    setAdding(false);
  };
  return (
    <>
      <Heading title="Projects" description="Residential and commercial inventory offered to your prospects." action={manage && <button className="btn-primary" onClick={() => setAdding((value) => !value)}><Plus className="h-4 w-4" /> Add project</button>} />
      {adding && <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5"><input required name="name" className="field" placeholder="Project name" /><input required name="city" className="field" placeholder="City" /><input required name="location" className="field" placeholder="Location" /><input required min="1" type="number" name="units" className="field" placeholder="Total units" /><button className="btn-primary">Save project</button></form>}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => <article key={project.id} className="card p-6"><div className="flex justify-between"><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{project.status}</span><span className="text-xs text-slate-400">{project.city}</span></div><h2 className="mt-5 text-xl font-semibold">{project.name}</h2><p className="mt-1 text-sm text-slate-500">{project.location}, {project.city}</p><div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm"><p><strong className="block text-xl">{project.units}</strong><span className="text-slate-500">Total units</span></p><p><strong className="block text-xl text-brand-700">{project.availableUnits}</strong><span className="text-slate-500">Available</span></p></div><button className="btn-secondary mt-5 w-full">View brochure</button></article>)}
      </div>
    </>
  );
}
