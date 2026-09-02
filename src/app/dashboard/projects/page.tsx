"use client";

import { FormEvent, useState } from "react";
import { FileUp, Plus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { canManageProjects } from "@/lib/permissions";
import { Heading } from "@/components/ui";

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read the brochure."));
    reader.readAsDataURL(file);
  });
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const { projectsFor, addProject } = useCRMData();
  const [adding, setAdding] = useState(false);
  const [brochureName, setBrochureName] = useState("");
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const projects = projectsFor(user);
  const manage = canManageProjects(user) && user.role !== "super_admin";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = new FormData(form);
    const file = (form.elements.namedItem("brochure") as HTMLInputElement | null)?.files?.[0];
    setBusy(true);
    const brochureUrl = file ? await fileToDataUrl(file) : String(input.get("brochureUrl") || "").trim() || "#";
    addProject(user, {
      name: String(input.get("name")),
      city: String(input.get("city")),
      location: String(input.get("location")),
      status: "Active",
      brochureUrl,
      units: Number(input.get("units")),
      availableUnits: Number(input.get("units"))
    });
    setBusy(false);
    setBrochureName("");
    setAdding(false);
  };

  return (
    <>
      <Heading title="Projects" description="Residential and commercial inventory offered to your prospects." action={manage && <button className="btn-primary" onClick={() => setAdding((value) => !value)}><Plus className="h-4 w-4" /> Add project</button>} />
      {adding && (
        <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="label">Project name</span>
            <input required name="name" className="field" placeholder="Arihant Skyline" />
          </label>
          <label className="block">
            <span className="label">City</span>
            <input required name="city" className="field" placeholder="Mumbai" />
          </label>
          <label className="block">
            <span className="label">Location</span>
            <input required name="location" className="field" placeholder="Powai" />
          </label>
          <label className="block">
            <span className="label">Total units</span>
            <input required min="1" type="number" name="units" className="field" placeholder="180" />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Brochure</span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="btn-secondary cursor-pointer">
                <FileUp className="h-4 w-4" />
                {brochureName || "Upload PDF or image"}
                <input
                  type="file"
                  name="brochure"
                  accept=".pdf,application/pdf,image/*"
                  className="hidden"
                  onChange={(event) => setBrochureName(event.target.files?.[0]?.name ?? "")}
                />
              </label>
              <input name="brochureUrl" className="field min-w-[12rem] flex-1" placeholder="Or paste a brochure link" />
            </div>
            <p className="mt-2 text-xs text-slate-400">PDF, JPG or PNG. Brokers can open this from Project resources.</p>
          </label>
          <div className="flex items-end">
            <button className="btn-primary" disabled={busy}>{busy ? "Saving..." : "Save project"}</button>
          </div>
        </form>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const hasBrochure = Boolean(project.brochureUrl && project.brochureUrl !== "#");
          return (
            <article key={project.id} className="card p-6">
              <div className="flex justify-between">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{project.status}</span>
                <span className="text-xs text-slate-400">{project.city}</span>
              </div>
              <h2 className="mt-5 text-xl font-semibold">{project.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{project.location}, {project.city}</p>
              <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                <p><strong className="block text-xl">{project.units}</strong><span className="text-slate-500">Total units</span></p>
                <p><strong className="block text-xl text-brand-700">{project.availableUnits}</strong><span className="text-slate-500">Available</span></p>
              </div>
              {hasBrochure ? (
                <a href={project.brochureUrl} target="_blank" rel="noreferrer" className="btn-secondary mt-5 w-full">View brochure</a>
              ) : (
                <p className="mt-5 text-center text-xs text-slate-400">No brochure uploaded yet</p>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
