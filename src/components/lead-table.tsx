"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Plus, Search, Upload } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCRMData } from "@/contexts/data-context";
import { csvTemplate, parseLeadCsv } from "@/lib/csv";
import { canAssignLeads, canManageLeads } from "@/lib/permissions";
import { Lead, leadStatuses, priorities, requirements } from "@/lib/types";
import { LeadActions } from "./lead-actions";
import { Heading, prettyDate, PriorityBadge, StatusBadge } from "./ui";

export function LeadTablePage() {
  const { user } = useAuth();
  const { data, leadsFor, projectsFor, addLead, importLeads, updateLead, addNote, scheduleSiteVisit, markSiteVisitDone, markBooked, markLost, addDocumentPlaceholder } = useCRMData();
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [note, setNote] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [bookingAmount, setBookingAmount] = useState("INR 5,00,000");
  const [lostReason, setLostReason] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const [source, setSource] = useState("all");
  const [formError, setFormError] = useState("");
  const [importMessage, setImportMessage] = useState("");

  const leads = user ? leadsFor(user) : [];
  const projects = user ? projectsFor(user) : [];
  const filteredLeads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const customerMatch = [lead.customerName, lead.phone, lead.email, lead.source, lead.id].some((value) => value.toLowerCase().includes(normalized));
      return (!normalized || customerMatch) && (status === "all" || lead.status === status) && (priority === "all" || lead.priority === priority) && (projectId === "all" || lead.projectId === projectId) && (source === "all" || lead.source === source);
    });
  }, [leads, priority, projectId, query, source, status]);

  if (!user) return null;

  const current = leads.find((lead) => lead.id === selected);
  const team = data.users.filter((member) => member.companyId === user.companyId && member.role === "sales");
  const brokers = data.users.filter((member) => member.companyId === user.companyId && member.role === "broker");
  const sources = Array.from(new Set(leads.map((lead) => lead.source))).sort();
  const allowCreate = canManageLeads(user) && user.role !== "super_admin";
  const allowWorkflow = user.role === "builder_admin" || user.role === "sales";
  const projectName = (lead: Lead) => data.projects.find((project) => project.id === lead.projectId)?.name ?? "Project";
  const touchFollowup = (lead: Lead, nextDate: string, kind: "done" | "snooze") => {
    updateLead(user, lead.id, { followupDate: nextDate, lastContactedDate: new Date().toISOString().slice(0, 10) });
    addNote(user, lead.id, kind === "done" ? `Follow-up marked done. Next call ${nextDate}.` : `Follow-up snoozed to ${nextDate}.`);
  };

  return (
    <>
      <Heading
        title={user.role === "broker" ? "My Submitted Leads" : user.role === "customer" ? "My Enquiry" : "Lead file"}
        description="Search, call, WhatsApp and keep every enquiry moving. Duplicate mobiles are blocked on the same project."
        action={allowCreate && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowImport((open) => !open)} className="btn-secondary"><Upload className="h-4 w-4" /> Import CSV</button>
            <button onClick={() => setShowCreate((open) => !open)} className="btn-primary"><Plus className="h-4 w-4" /> New lead</button>
          </div>
        )}
      />
      {showCreate && (
        <LeadForm error={formError} projects={projects} team={team} brokers={brokers} canAssign={canAssignLeads(user)} onSubmit={(lead) => { const result = addLead(user, lead); if (result) { setFormError(result); return; } setFormError(""); setShowCreate(false); }} />
      )}
      {showImport && allowCreate && (
        <CsvImport message={importMessage} onClose={() => setShowImport(false)} onFile={async (file) => { const text = await file.text(); const rows = parseLeadCsv(text); if (!rows.length) { setImportMessage("Could not read that file. Use the template headers: name, phone, email, project, source, priority, requirement, budget."); return; } const result = importLeads(user, rows); setImportMessage(`Imported ${result.imported} lead${result.imported === 1 ? "" : "s"}. Skipped ${result.skipped} duplicate or incomplete row${result.skipped === 1 ? "" : "s"}.`); }} />
      )}
      <section className="card mb-5 p-4">
        <div className="grid gap-3 md:grid-cols-[1.3fr_repeat(4,minmax(0,1fr))]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className="field pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, email, source or lead ID" />
          </label>
          <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{leadStatuses.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="field" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">All priorities</option>{priorities.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="field" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="all">All projects</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select>
          <select className="field" value={source} onChange={(event) => setSource(event.target.value)}><option value="all">All sources</option>{sources.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
      </section>
      <div className="space-y-3 lg:hidden">
        {filteredLeads.map((lead) => (
          <article key={lead.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{lead.customerName}</p>
                <p className="mt-1 text-xs text-slate-500">{lead.phone} · {projectName(lead)}</p>
              </div>
              <PriorityBadge priority={lead.priority} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={lead.status} />
              <span className="chip bg-mist text-slate-600">{prettyDate(lead.followupDate)}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <LeadActions lead={lead} projectName={projectName(lead)} sender={user.name} compact onFollowup={allowWorkflow ? (next, kind) => touchFollowup(lead, next, kind) : undefined} />
              <button onClick={() => setSelected(lead.id)} className="btn-ghost bg-brand-50 text-brand-700"><Eye className="h-3.5 w-3.5" /> File</button>
            </div>
          </article>
        ))}
        {!filteredLeads.length && <p className="card p-8 text-center text-sm text-slate-500">No leads match the current filters.</p>}
      </div>
      <section className="card hidden overflow-hidden lg:block">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>{["Customer", "Project", "Source", "Owner", "Priority", "Status", "Follow-up", "Actions"].map((label) => <th key={label} className="whitespace-nowrap px-5 py-4 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-paper/50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink">{lead.customerName}</p>
                    <p className="mt-1 text-xs text-slate-400">{lead.phone}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">{projectName(lead)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{lead.source}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{data.users.find((member) => member.id === lead.assignedTo)?.name ?? "Unassigned"}</td>
                  <td className="px-5 py-4"><PriorityBadge priority={lead.priority} /></td>
                  <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{prettyDate(lead.followupDate)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <LeadActions lead={lead} projectName={projectName(lead)} sender={user.name} compact onFollowup={allowWorkflow ? (next, kind) => touchFollowup(lead, next, kind) : undefined} />
                      <button onClick={() => setSelected(lead.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600"><Eye className="h-4 w-4" /> Open file</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredLeads.length && <p className="p-10 text-center text-sm text-slate-500">No leads match the current filters.</p>}
        </div>
      </section>
      {current && (
        <LeadDetails lead={current} allowWorkflow={allowWorkflow} allowAssign={canAssignLeads(user)} sender={user.name} team={team} data={data} note={note} setNote={setNote} visitDate={visitDate} setVisitDate={setVisitDate} visitNotes={visitNotes} setVisitNotes={setVisitNotes} bookingAmount={bookingAmount} setBookingAmount={setBookingAmount} lostReason={lostReason} setLostReason={setLostReason} documentName={documentName} setDocumentName={setDocumentName} onClose={() => { setSelected(undefined); setNote(""); }} onUpdate={(updates) => updateLead(user, current.id, updates)} onFollowup={(next, kind) => touchFollowup(current, next, kind)} onNote={() => { addNote(user, current.id, note); setNote(""); }} onScheduleVisit={() => { scheduleSiteVisit(user, current.id, visitDate, visitNotes); setVisitDate(""); setVisitNotes(""); }} onVisitDone={() => markSiteVisitDone(user, current.id)} onBooked={() => { markBooked(user, current.id, bookingAmount); setBookingAmount("INR 5,00,000"); }} onLost={() => { markLost(user, current.id, lostReason); setLostReason(""); }} onDocument={() => { addDocumentPlaceholder(user, current.id, documentName); setDocumentName(""); }} />
      )}
    </>
  );
}

function CsvImport({ message, onFile, onClose }: { message: string; onFile: (file: File) => void; onClose: () => void }) {
  return (
    <section className="card mb-6 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Import leads from CSV</h2>
          <p className="mt-1 text-sm text-slate-500">Duplicates on the same project (last 10 digits) are skipped automatically.</p>
        </div>
        <div className="flex gap-2">
          <a className="btn-secondary" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvTemplate)}`} download="estateflow-leads.csv"><Download className="h-4 w-4" /> Template</a>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-8 text-center">
        <Upload className="h-5 w-5 text-brand-600" />
        <p className="mt-2 text-sm font-medium text-ink">Drop a CSV or tap to choose</p>
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => event.target.files?.[0] && onFile(event.target.files[0])} />
      </label>
      {message && <p className="mt-3 rounded-xl bg-paper px-4 py-3 text-sm text-slate-600">{message}</p>}
    </section>
  );
}

function LeadForm({ projects, team, brokers, canAssign, onSubmit, error }: { projects: ReturnType<typeof useCRMData>["data"]["projects"]; team: ReturnType<typeof useCRMData>["data"]["users"]; brokers: ReturnType<typeof useCRMData>["data"]["users"]; canAssign: boolean; onSubmit: (lead: Omit<Lead, "id" | "companyId" | "createdBy" | "createdAt" | "updatedAt">) => void; error?: string }) {
  return (
    <form className="card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); const value = new FormData(event.currentTarget); onSubmit({ customerName: String(value.get("customerName")), phone: String(value.get("phone")), email: String(value.get("email")), projectId: String(value.get("projectId")), source: String(value.get("source")), assignedTo: String(value.get("assignedTo") || "") || undefined, brokerId: String(value.get("brokerId") || "") || undefined, priority: String(value.get("priority")) as Lead["priority"], status: "New Lead", followupDate: String(value.get("followupDate") || "") || undefined, budgetRange: String(value.get("budgetRange")), requirement: String(value.get("requirement")) as Lead["requirement"] }); }}>
      <input required name="customerName" className="field" placeholder="Customer name" />
      <input required name="phone" className="field" placeholder="Phone number" />
      <input required type="email" name="email" className="field" placeholder="Email address" />
      <select required name="projectId" className="field"><option value="">Project interested in</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select>
      <input required name="source" className="field" placeholder="Lead source" />
      <select name="priority" className="field">{priorities.map((item) => <option key={item}>{item}</option>)}</select>
      <select name="requirement" className="field">{requirements.map((item) => <option key={item}>{item}</option>)}</select>
      <input name="budgetRange" className="field" placeholder="Budget range" />
      <input type="date" name="followupDate" className="field" />
      {canAssign && <select name="assignedTo" className="field"><option value="">Assign salesperson</option>{team.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select>}
      {canAssign && <select name="brokerId" className="field"><option value="">Select broker (optional)</option>{brokers.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select>}
      <button className="btn-primary">Create lead</button>
      {error && <p className="sm:col-span-2 lg:col-span-4 rounded-xl bg-coral-50 px-4 py-3 text-sm text-coral-600">{error}</p>}
    </form>
  );
}

function LeadDetails({ lead, allowWorkflow, allowAssign, sender, team, data, note, setNote, visitDate, setVisitDate, visitNotes, setVisitNotes, bookingAmount, setBookingAmount, lostReason, setLostReason, documentName, setDocumentName, onClose, onUpdate, onFollowup, onNote, onScheduleVisit, onVisitDone, onBooked, onLost, onDocument }: { lead: Lead; allowWorkflow: boolean; allowAssign: boolean; sender: string; team: ReturnType<typeof useCRMData>["data"]["users"]; data: ReturnType<typeof useCRMData>["data"]; note: string; setNote: (value: string) => void; visitDate: string; setVisitDate: (value: string) => void; visitNotes: string; setVisitNotes: (value: string) => void; bookingAmount: string; setBookingAmount: (value: string) => void; lostReason: string; setLostReason: (value: string) => void; documentName: string; setDocumentName: (value: string) => void; onClose: () => void; onUpdate: (updates: Partial<Lead>) => void; onFollowup: (nextDate: string, kind: "done" | "snooze") => void; onNote: () => void; onScheduleVisit: () => void; onVisitDone: () => void; onBooked: () => void; onLost: () => void; onDocument: () => void }) {
  const notes = useMemo(() => data.notes.filter((item) => item.leadId === lead.id), [data.notes, lead.id]);
  const visits = useMemo(() => data.siteVisits.filter((item) => item.leadId === lead.id), [data.siteVisits, lead.id]);
  const bookings = useMemo(() => data.bookings.filter((item) => item.leadId === lead.id), [data.bookings, lead.id]);
  const documents = useMemo(() => data.customerDocuments.filter((item) => item.leadId === lead.id), [data.customerDocuments, lead.id]);
  const units = useMemo(() => data.units.filter((unit) => unit.projectId === lead.projectId), [data.units, lead.projectId]);
  const timeline = useMemo(() => [...data.activities.filter((item) => item.leadId === lead.id).map((item) => ({ id: item.id, type: item.type, details: item.details, actorId: item.actorId, createdAt: item.createdAt })), ...notes.map((item) => ({ id: item.id, type: "Note", details: item.text, actorId: item.authorId, createdAt: item.createdAt }))].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data.activities, lead.id, notes]);
  const projectName = data.projects.find((item) => item.id === lead.projectId)?.name ?? "Project";
  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-ink/30" onClick={onClose}>
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-lift" onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-brand-600">{lead.id}</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">{lead.customerName}</h2>
            <p className="text-sm text-slate-500">{lead.phone} · {lead.email}</p>
          </div>
          <button className="btn-secondary h-fit" onClick={onClose}>Close</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><PriorityBadge priority={lead.priority} /><StatusBadge status={lead.status} /></div>
        <div className="mt-4"><LeadActions lead={lead} projectName={projectName} sender={sender} onFollowup={allowWorkflow ? onFollowup : undefined} /></div>
        <div className="mt-6 grid gap-3 rounded-2xl bg-paper p-4 text-sm sm:grid-cols-2">
          <p><span className="text-slate-400">Project</span><br />{projectName}</p>
          <p><span className="text-slate-400">Requirement</span><br />{lead.requirement}</p>
          <p><span className="text-slate-400">Budget</span><br />{lead.budgetRange || "-"}</p>
          <p><span className="text-slate-400">Follow-up</span><br />{prettyDate(lead.followupDate)}</p>
          <p><span className="text-slate-400">Unit interest</span><br />{data.units.find((item) => item.id === lead.unitId)?.unitNumber ?? "-"}</p>
          <p><span className="text-slate-400">Lost reason</span><br />{lead.lostReason ?? "-"}</p>
        </div>
        {allowWorkflow && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label><span className="label">Status</span><select className="field" value={lead.status} onChange={(event) => onUpdate({ status: event.target.value as Lead["status"] })}>{leadStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className="label">Priority</span><select className="field" value={lead.priority} onChange={(event) => onUpdate({ priority: event.target.value as Lead["priority"] })}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className="label">Unit interested in</span><select className="field" value={lead.unitId ?? ""} onChange={(event) => onUpdate({ unitId: event.target.value || undefined })}><option value="">No unit linked</option>{units.map((unit) => <option value={unit.id} key={unit.id}>{unit.unitNumber} | {unit.type} | {unit.status}</option>)}</select></label>
            <label><span className="label">Next follow-up</span><input type="date" className="field" value={lead.followupDate ?? ""} onChange={(event) => onUpdate({ followupDate: event.target.value })} /></label>
            {allowAssign && <label><span className="label">Assign to</span><select className="field" value={lead.assignedTo ?? ""} onChange={(event) => onUpdate({ assignedTo: event.target.value || undefined, status: "Assigned" })}><option value="">Unassigned</option>{team.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>}
          </div>
        )}
        {allowWorkflow && (
          <section className="mt-8 rounded-2xl border border-mist p-4">
            <h3 className="font-semibold">Sales workflow</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label><span className="label">Site visit date</span><input type="date" className="field" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} /></label>
              <label><span className="label">Visit note</span><input className="field" value={visitNotes} onChange={(event) => setVisitNotes(event.target.value)} placeholder="Sample flat, family visit..." /></label>
              <button className="btn-secondary" onClick={onScheduleVisit}>Schedule site visit</button>
              <button className="btn-secondary" onClick={onVisitDone}>Mark site visit done</button>
              <label><span className="label">Booking amount</span><input className="field" value={bookingAmount} onChange={(event) => setBookingAmount(event.target.value)} /></label>
              <button className="btn-primary self-end" onClick={onBooked}>Mark booked</button>
              <label><span className="label">Lost reason</span><input className="field" value={lostReason} onChange={(event) => setLostReason(event.target.value)} placeholder="Budget mismatch, location..." /></label>
              <button className="btn-secondary self-end" onClick={onLost}>Mark lost</button>
            </div>
          </section>
        )}
        <section className="mt-8"><h3 className="font-semibold">Site visits</h3><div className="mt-3 space-y-3">{visits.map((visit) => <div key={visit.id} className="rounded-xl bg-lilac-50 p-3 text-sm"><p className="font-semibold">{prettyDate(visit.visitDate)} · {visit.status}</p><p className="mt-1 text-slate-500">{visit.notes || "No notes"}</p></div>)}{!visits.length && <p className="text-sm text-slate-400">No site visits scheduled yet.</p>}</div></section>
        <section className="mt-8"><h3 className="font-semibold">Booking status</h3><div className="mt-3 space-y-3">{bookings.map((booking) => <div key={booking.id} className="rounded-xl bg-brand-50 p-3 text-sm text-brand-800"><p className="font-semibold">{booking.status} · {booking.amount}</p><p className="mt-1">Booked on {prettyDate(booking.bookingDate)}</p></div>)}{!bookings.length && <p className="text-sm text-slate-400">No booking recorded yet.</p>}</div></section>
        <section className="mt-8"><h3 className="font-semibold">Customer documents</h3>{allowWorkflow && <div className="mt-3 flex gap-2"><input className="field" value={documentName} onChange={(event) => setDocumentName(event.target.value)} placeholder="PAN Card, Aadhaar, Booking Form..." /><button className="btn-secondary" onClick={onDocument}>Add slot</button></div>}<div className="mt-3 space-y-3">{documents.map((document) => <div key={document.id} className="flex items-center justify-between rounded-xl border border-mist p-3 text-sm"><span>{document.name}</span><span className="chip bg-mist text-slate-600">{document.status}</span></div>)}{!documents.length && <p className="text-sm text-slate-400">No document slots yet.</p>}</div></section>
        <section className="mt-8"><h3 className="font-semibold">Notes and follow-ups</h3>{lead.status !== "Booked / Closed" && <div className="mt-3 flex gap-2"><input className="field" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add call or follow-up note" /><button onClick={onNote} className="btn-primary">Add</button></div>}<div className="mt-4 space-y-3">{notes.map((item) => <div key={item.id} className="rounded-xl border border-mist p-3 text-sm"><p>{item.text}</p><p className="mt-1 text-xs text-slate-400">{prettyDate(item.createdAt)} by {data.users.find((member) => member.id === item.authorId)?.name}</p></div>)}{!notes.length && <p className="text-sm text-slate-400">No notes recorded yet.</p>}</div></section>
        <section className="mt-8"><h3 className="font-semibold">Activity timeline</h3><div className="mt-4 space-y-3">{timeline.map((item) => <div key={item.id} className="rounded-xl bg-paper p-3 text-sm"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-ink">{item.type}</p><p className="text-xs text-slate-400">{prettyDate(item.createdAt)}</p></div><p className="mt-1 text-slate-600">{item.details}</p><p className="mt-1 text-xs text-slate-400">by {data.users.find((member) => member.id === item.actorId)?.name ?? "System"}</p></div>)}{!timeline.length && <p className="text-sm text-slate-400">No lead activity yet.</p>}</div></section>
      </aside>
    </div>
  );
}
