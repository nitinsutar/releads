"use client";

import { useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { canAssignLeads, canManageLeads } from "@/lib/permissions";
import { Lead, leadStatuses, requirements } from "@/lib/types";
import { Heading, prettyDate, StatusBadge } from "./ui";

export function LeadTablePage() {
  const { user } = useAuth();
  const { data, leadsFor, projectsFor, addLead, updateLead, addNote } = useCRMData();
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [note, setNote] = useState("");
  if (!user) return null;

  const leads = leadsFor(user);
  const projects = projectsFor(user);
  const current = leads.find((lead) => lead.id === selected);
  const team = data.users.filter((member) => member.companyId === user.companyId && member.role === "sales");
  const brokers = data.users.filter((member) => member.companyId === user.companyId && member.role === "broker");
  const allowCreate = canManageLeads(user) && user.role !== "super_admin";
  const allowWorkflow = user.role === "builder_admin" || user.role === "sales";

  return (
    <>
      <Heading
        title={user.role === "broker" ? "My Submitted Leads" : user.role === "customer" ? "My Enquiry" : "Lead Management"}
        description="Phase 1 lead capture, listing, assignment, follow-up date and notes."
        action={allowCreate && <button onClick={() => setShowCreate((open) => !open)} className="btn-primary"><Plus className="h-4 w-4" /> New lead</button>}
      />
      {showCreate && <LeadForm projects={projects} team={team} brokers={brokers} canAssign={canAssignLeads(user)} onSubmit={(lead) => { addLead(user, lead); setShowCreate(false); }} />}
      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>{["Customer Name", "Project", "Source", "Assigned To", "Broker", "Status", "Follow-up Date", "Last Updated", "Actions"].map((label) => <th key={label} className="whitespace-nowrap px-5 py-4 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4"><p className="font-semibold text-slate-900">{lead.customerName}</p><p className="mt-1 text-xs text-slate-400">{lead.phone}</p></td>
                  <td className="whitespace-nowrap px-5 py-4">{data.projects.find((project) => project.id === lead.projectId)?.name ?? "-"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{lead.source}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{data.users.find((member) => member.id === lead.assignedTo)?.name ?? "Unassigned"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{data.users.find((member) => member.id === lead.brokerId)?.name ?? "-"}</td>
                  <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{prettyDate(lead.followupDate)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{prettyDate(lead.updatedAt)}</td>
                  <td className="px-5 py-4"><button onClick={() => setSelected(lead.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600"><Eye className="h-4 w-4" /> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!leads.length && <p className="p-10 text-center text-sm text-slate-500">No leads yet. Create the first enquiry to begin.</p>}
        </div>
      </section>
      {current && (
        <LeadDetails
          lead={current}
          allowWorkflow={allowWorkflow}
          allowAssign={canAssignLeads(user)}
          team={team}
          data={data}
          note={note}
          setNote={setNote}
          onClose={() => { setSelected(undefined); setNote(""); }}
          onUpdate={(updates) => updateLead(user, current.id, updates)}
          onNote={() => { addNote(user, current.id, note); setNote(""); }}
        />
      )}
    </>
  );
}

function LeadForm({ projects, team, brokers, canAssign, onSubmit }: { projects: ReturnType<typeof useCRMData>["data"]["projects"]; team: ReturnType<typeof useCRMData>["data"]["users"]; brokers: ReturnType<typeof useCRMData>["data"]["users"]; canAssign: boolean; onSubmit: (lead: Omit<Lead, "id" | "companyId" | "createdBy" | "createdAt" | "updatedAt">) => void }) {
  return (
    <form className="card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => {
      event.preventDefault();
      const value = new FormData(event.currentTarget);
      onSubmit({
        customerName: String(value.get("customerName")), phone: String(value.get("phone")), email: String(value.get("email")),
        projectId: String(value.get("projectId")), source: String(value.get("source")), assignedTo: String(value.get("assignedTo") || "") || undefined,
        brokerId: String(value.get("brokerId") || "") || undefined, priority: "Warm", status: "New Lead",
        followupDate: String(value.get("followupDate") || "") || undefined, budgetRange: String(value.get("budgetRange")), requirement: String(value.get("requirement")) as Lead["requirement"]
      });
    }}>
      <input required name="customerName" className="field" placeholder="Customer name" />
      <input required name="phone" className="field" placeholder="Phone number" />
      <input required type="email" name="email" className="field" placeholder="Email address" />
      <select required name="projectId" className="field"><option value="">Project interested in</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select>
      <input required name="source" className="field" placeholder="Lead source" />
      <select name="requirement" className="field">{requirements.map((item) => <option key={item}>{item}</option>)}</select>
      <input name="budgetRange" className="field" placeholder="Budget range" />
      <input type="date" name="followupDate" className="field" />
      {canAssign && <select name="assignedTo" className="field"><option value="">Assign salesperson</option>{team.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select>}
      {canAssign && <select name="brokerId" className="field"><option value="">Select broker (optional)</option>{brokers.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select>}
      <button className="btn-primary">Create lead</button>
    </form>
  );
}

function LeadDetails({ lead, allowWorkflow, allowAssign, team, data, note, setNote, onClose, onUpdate, onNote }: { lead: Lead; allowWorkflow: boolean; allowAssign: boolean; team: ReturnType<typeof useCRMData>["data"]["users"]; data: ReturnType<typeof useCRMData>["data"]; note: string; setNote: (value: string) => void; onClose: () => void; onUpdate: (updates: Partial<Lead>) => void; onNote: () => void }) {
  const notes = useMemo(() => data.notes.filter((item) => item.leadId === lead.id), [data.notes, lead.id]);
  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-slate-950/25" onClick={onClose}>
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-between gap-3">
          <div><p className="text-xs font-semibold text-brand-600">{lead.id}</p><h2 className="mt-1 text-2xl font-semibold">{lead.customerName}</h2><p className="text-sm text-slate-500">{lead.phone} | {lead.email}</p></div>
          <button className="btn-secondary h-fit" onClick={onClose}>Close</button>
        </div>
        <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <p><span className="text-slate-400">Project</span><br />{data.projects.find((item) => item.id === lead.projectId)?.name}</p>
          <p><span className="text-slate-400">Requirement</span><br />{lead.requirement}</p>
          <p><span className="text-slate-400">Budget</span><br />{lead.budgetRange || "-"}</p>
          <p><span className="text-slate-400">Follow-up</span><br />{prettyDate(lead.followupDate)}</p>
        </div>
        {allowWorkflow && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label><span className="label">Status</span><select className="field" value={lead.status} onChange={(event) => onUpdate({ status: event.target.value as Lead["status"] })}>{leadStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className="label">Next follow-up</span><input type="date" className="field" value={lead.followupDate ?? ""} onChange={(event) => onUpdate({ followupDate: event.target.value })} /></label>
            {allowAssign && <label><span className="label">Assign to</span><select className="field" value={lead.assignedTo ?? ""} onChange={(event) => onUpdate({ assignedTo: event.target.value || undefined, status: "Assigned" })}><option value="">Unassigned</option>{team.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>}
          </div>
        )}
        <section className="mt-8">
          <h3 className="font-semibold">Notes and follow-ups</h3>
          {lead.status !== "Booked / Closed" && (
            <div className="mt-3 flex gap-2"><input className="field" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add call or follow-up note" /><button onClick={onNote} className="btn-primary">Add</button></div>
          )}
          <div className="mt-4 space-y-3">
            {notes.map((item) => <div key={item.id} className="rounded-xl border border-slate-100 p-3 text-sm"><p>{item.text}</p><p className="mt-1 text-xs text-slate-400">{prettyDate(item.createdAt)} by {data.users.find((member) => member.id === item.authorId)?.name}</p></div>)}
            {!notes.length && <p className="text-sm text-slate-400">No notes recorded yet.</p>}
          </div>
        </section>
      </aside>
    </div>
  );
}
