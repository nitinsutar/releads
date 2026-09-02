"use client";

import { useState } from "react";
import { Copy, Link2, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { Heading } from "@/components/ui";
import { shareUrl, shareWhatsAppHref } from "@/lib/share";

export function ShareKit() {
  const { user } = useAuth();
  const crm = useCRMData();
  const [copied, setCopied] = useState("");
  if (!user) return null;
  const projects = crm.projectsFor(user);
  const linksFor = (projectId: string) => (crm.data.shareLinks ?? []).filter((link) => link.projectId === projectId && (user.role !== "broker" || link.brokerId === user.id || !link.brokerId));
  const ensureLink = async (projectId: string) => {
    const existing = linksFor(projectId)[0];
    if (existing) return existing.token;
    const result = await crm.createShareLink(user, projectId, user.role === "broker" ? user.id : undefined);
    return typeof result === "string" ? "" : result.token;
  };
  const copy = async (token: string) => {
    await navigator.clipboard.writeText(shareUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(""), 1600);
  };
  return (
    <>
      <Heading title="Project resources" description="A public page per project. Brokers share it on WhatsApp. Enquiries land in the lead file as Broker share." />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const token = linksFor(project.id)[0]?.token ?? project.shareToken;
          return (
            <article key={project.id} className="card overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-brand-800 via-brand-600 to-gold" />
              <div className="p-5">
                <span className="chip bg-brand-50 text-brand-700">{project.status}</span>
                <h2 className="mt-3 text-xl font-semibold text-ink">{project.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{project.location}, {project.city}</p>
                <p className="mt-3 text-sm text-slate-500">{project.availableUnits} units open · {project.units} total</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {token ? (
                    <>
                      <a className="btn-secondary" href={`/p/${token}`} target="_blank" rel="noreferrer"><Link2 className="h-4 w-4" /> Open page</a>
                      <button type="button" className="btn-secondary" onClick={() => copy(token)}><Copy className="h-4 w-4" /> {copied === token ? "Copied" : "Copy link"}</button>
                      <a className="btn-primary" href={shareWhatsAppHref(project.name, shareUrl(token), user.name)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                    </>
                  ) : (
                    <button type="button" className="btn-primary" onClick={() => ensureLink(project.id)}>Create share link</button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
