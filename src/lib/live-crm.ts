import { SupabaseClient } from "@supabase/supabase-js";
import {
  emptyData,
  mapActivity,
  mapBooking,
  mapCommission,
  mapCompany,
  mapDocument,
  mapLead,
  mapNote,
  mapProject,
  mapUnit,
  mapUser,
  mapVisit,
  phoneDigits
} from "./mappers";
import { CRMData, CRMUser, Lead, Project, Unit } from "./types";

type Actor = {
  id: string;
  role: CRMUser["role"];
  company_id: string | null;
  name: string;
};

export type CrmAction =
  | "addLead"
  | "updateLead"
  | "addNote"
  | "scheduleSiteVisit"
  | "markSiteVisitDone"
  | "markBooked"
  | "markLost"
  | "addDocumentPlaceholder"
  | "addProject"
  | "addUnit"
  | "addCompany"
  | "completeFollowup"
  | "snoozeFollowup";

function shiftDate(days: number, from?: string) {
  const date = from ? new Date(`${from}T00:00:00`) : new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function requireCompany(actor: Actor) {
  if (!actor.company_id) throw new Error("This account is not linked to a builder company.");
  return actor.company_id;
}

async function addActivity(client: SupabaseClient, leadId: string, actorId: string, type: string, details: string) {
  await client.from("lead_activities").insert({ lead_id: leadId, actor_id: actorId, type, details });
}

export async function loadSnapshot(client: SupabaseClient): Promise<CRMData> {
  const [
    companies,
    users,
    projects,
    units,
    leads,
    notes,
    activities,
    visits,
    bookings,
    commissions,
    documents
  ] = await Promise.all([
    client.from("companies").select("*").order("created_at", { ascending: false }),
    client.from("users").select("*").order("created_at", { ascending: false }),
    client.from("projects").select("*").order("created_at", { ascending: false }),
    client.from("units").select("*"),
    client.from("leads").select("*").order("updated_at", { ascending: false }),
    client.from("lead_notes").select("*").order("created_at", { ascending: false }),
    client.from("lead_activities").select("*").order("created_at", { ascending: false }),
    client.from("site_visits").select("*").order("created_at", { ascending: false }),
    client.from("bookings").select("*").order("created_at", { ascending: false }),
    client.from("broker_commissions").select("*").order("created_at", { ascending: false }),
    client.from("customer_documents").select("*").order("created_at", { ascending: false })
  ]);

  const firstError = [
    companies, users, projects, units, leads, notes, activities, visits, bookings, commissions, documents
  ].find((result) => result.error);
  if (firstError?.error) throw new Error(firstError.error.message);

  return {
    ...emptyData,
    companies: (companies.data ?? []).map((row) => mapCompany(row as Record<string, unknown>)),
    users: (users.data ?? []).map((row) => mapUser(row as Record<string, unknown>)),
    projects: (projects.data ?? []).map((row) => mapProject(row as Record<string, unknown>)),
    units: (units.data ?? []).map((row) => mapUnit(row as Record<string, unknown>)),
    leads: (leads.data ?? []).map((row) => mapLead(row as Record<string, unknown>)),
    notes: (notes.data ?? []).map((row) => mapNote(row as Record<string, unknown>)),
    activities: (activities.data ?? []).map((row) => mapActivity(row as Record<string, unknown>)),
    siteVisits: (visits.data ?? []).map((row) => mapVisit(row as Record<string, unknown>)),
    bookings: (bookings.data ?? []).map((row) => mapBooking(row as Record<string, unknown>)),
    brokerCommissions: (commissions.data ?? []).map((row) => mapCommission(row as Record<string, unknown>)),
    customerDocuments: (documents.data ?? []).map((row) => mapDocument(row as Record<string, unknown>))
  };
}

async function visibleLead(client: SupabaseClient, leadId: string) {
  const { data, error } = await client.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Lead not found or not visible to this account.");
  return data;
}

async function addLead(client: SupabaseClient, actor: Actor, input: Partial<Lead>) {
  const companyId = requireCompany(actor);
  if (!input.customerName || !input.phone || !input.projectId) {
    throw new Error("Customer name, phone and project are required.");
  }

  const digits = phoneDigits(input.phone);
  const { data: existing, error: existingError } = await client
    .from("leads")
    .select("id, customer_name, phone, status, project_id")
    .eq("company_id", companyId)
    .eq("project_id", input.projectId)
    .neq("status", "Lost");
  if (existingError) throw new Error(existingError.message);
  const duplicate = (existing ?? []).find((row) => phoneDigits(String(row.phone)) === digits);
  if (duplicate) {
    throw new Error(`Duplicate lead: ${duplicate.customer_name} already exists for this project (${duplicate.status}).`);
  }

  const payload = {
    company_id: companyId,
    customer_name: input.customerName,
    phone: input.phone,
    email: input.email ?? "",
    project_id: input.projectId,
    unit_id: input.unitId ?? null,
    source: input.source ?? "Manual",
    created_by: actor.id,
    assigned_to: input.assignedTo ?? (actor.role === "sales" ? actor.id : null),
    broker_id: actor.role === "broker" ? actor.id : input.brokerId ?? null,
    priority: input.priority ?? "Warm",
    status: input.assignedTo || actor.role === "sales" ? "Assigned" : input.status ?? "New Lead",
    followup_date: input.followupDate || null,
    budget_range: input.budgetRange ?? "",
    requirement: input.requirement ?? null
  };

  const { data, error } = await client.from("leads").insert(payload).select("*").single();
  if (error) throw new Error(error.message);

  if (input.followupDate) {
    await client.from("followups").insert({
      company_id: companyId,
      lead_id: data.id,
      assigned_to: data.assigned_to,
      due_date: input.followupDate,
      notes: "Initial follow-up"
    });
  }

  await addActivity(client, data.id, actor.id, "Lead Created", `${data.customer_name} was added from ${data.source}.`);
}

async function updateLead(client: SupabaseClient, actor: Actor, leadId: string, updates: Partial<Lead>) {
  await visibleLead(client, leadId);
  const payload: Record<string, unknown> = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo || null;
  if (updates.brokerId !== undefined) payload.broker_id = updates.brokerId || null;
  if (updates.unitId !== undefined) payload.unit_id = updates.unitId || null;
  if (updates.followupDate !== undefined) payload.followup_date = updates.followupDate || null;
  if (updates.lastContactedDate !== undefined) payload.last_contacted_date = updates.lastContactedDate || null;
  if (updates.siteVisitDate !== undefined) payload.site_visit_date = updates.siteVisitDate || null;
  if (updates.lostReason !== undefined) payload.lost_reason = updates.lostReason || null;
  if (updates.budgetRange !== undefined) payload.budget_range = updates.budgetRange;
  if (!Object.keys(payload).length) return;

  const { error } = await client.from("leads").update(payload).eq("id", leadId);
  if (error) throw new Error(error.message);

  if (updates.followupDate) {
    await client.from("followups").insert({
      company_id: actor.company_id,
      lead_id: leadId,
      assigned_to: updates.assignedTo ?? null,
      due_date: updates.followupDate,
      notes: "Follow-up date updated"
    });
  }

  await addActivity(client, leadId, actor.id, "Update", Object.keys(updates).join(", ") + " updated");
}

async function addNote(client: SupabaseClient, actor: Actor, leadId: string, text: string) {
  await visibleLead(client, leadId);
  if (!text.trim()) throw new Error("Note text is required.");
  const { error } = await client.from("lead_notes").insert({ lead_id: leadId, author_id: actor.id, note: text.trim() });
  if (error) throw new Error(error.message);
  await client.from("leads").update({ last_contacted_date: today() }).eq("id", leadId);
  await addActivity(client, leadId, actor.id, "Note Added", "A follow-up note was added.");
}

async function scheduleSiteVisit(client: SupabaseClient, actor: Actor, leadId: string, visitDate: string, notes?: string) {
  const lead = await visibleLead(client, leadId);
  if (!visitDate) throw new Error("Choose a site visit date.");
  const { error } = await client.from("site_visits").insert({
    company_id: lead.company_id,
    lead_id: leadId,
    project_id: lead.project_id,
    assigned_to: lead.assigned_to,
    visit_date: visitDate,
    scheduled_at: `${visitDate}T10:00:00`,
    status: "Scheduled",
    notes: notes || null
  });
  if (error) throw new Error(error.message);
  await client.from("leads").update({ site_visit_date: visitDate, status: "Site Visit Scheduled" }).eq("id", leadId);
  await addActivity(client, leadId, actor.id, "Site Visit", `Site visit scheduled for ${visitDate}.`);
}

async function markSiteVisitDone(client: SupabaseClient, actor: Actor, leadId: string) {
  await visibleLead(client, leadId);
  const { error } = await client.from("site_visits").update({ status: "Done" }).eq("lead_id", leadId).eq("status", "Scheduled");
  if (error) throw new Error(error.message);
  await client.from("leads").update({ status: "Site Visit Done", last_contacted_date: today() }).eq("id", leadId);
  await addActivity(client, leadId, actor.id, "Site Visit", "Site visit marked done.");
}

async function markBooked(client: SupabaseClient, actor: Actor, leadId: string, amount: string) {
  const lead = await visibleLead(client, leadId);
  if (!amount.trim()) throw new Error("Enter a booking amount.");
  const { data: booking, error } = await client.from("bookings").insert({
    company_id: lead.company_id,
    lead_id: leadId,
    project_id: lead.project_id,
    unit_id: lead.unit_id,
    booking_date: today(),
    booked_at: new Date().toISOString(),
    amount: amount.trim(),
    status: "Confirmed"
  }).select("*").single();
  if (error) throw new Error(error.message);

  if (lead.unit_id) {
    await client.from("units").update({ status: "Booked" }).eq("id", lead.unit_id);
  }
  if (lead.broker_id) {
    await client.from("broker_commissions").insert({
      company_id: lead.company_id,
      broker_id: lead.broker_id,
      lead_id: leadId,
      booking_id: booking.id,
      amount: "To be calculated",
      status: "Pending"
    });
  }
  await client.from("leads").update({ status: "Booked / Closed" }).eq("id", leadId);
  await addActivity(client, leadId, actor.id, "Booking", `Booking confirmed for ${amount.trim()}.`);
}

async function markLost(client: SupabaseClient, actor: Actor, leadId: string, reason: string) {
  await visibleLead(client, leadId);
  if (!reason.trim()) throw new Error("Enter a lost reason.");
  const { error } = await client.from("leads").update({ status: "Lost", lost_reason: reason.trim() }).eq("id", leadId);
  if (error) throw new Error(error.message);
  await addActivity(client, leadId, actor.id, "Lost", reason.trim());
}

async function addDocumentPlaceholder(client: SupabaseClient, actor: Actor, leadId: string, name: string) {
  const lead = await visibleLead(client, leadId);
  if (!name.trim()) throw new Error("Enter a document name.");
  const { error } = await client.from("customer_documents").insert({
    company_id: lead.company_id,
    lead_id: leadId,
    customer_id: lead.customer_id,
    name: name.trim(),
    document_type: name.trim(),
    storage_path: "",
    status: "Pending"
  });
  if (error) throw new Error(error.message);
}

async function addProject(client: SupabaseClient, actor: Actor, input: Omit<Project, "id" | "companyId">) {
  const companyId = requireCompany(actor);
  const { error } = await client.from("projects").insert({
    company_id: companyId,
    name: input.name,
    city: input.city,
    location: input.location,
    status: input.status,
    brochure_url: input.brochureUrl || null,
    units: input.units,
    available_units: input.availableUnits
  });
  if (error) throw new Error(error.message);
}

async function addUnit(client: SupabaseClient, actor: Actor, input: Omit<Unit, "id" | "companyId">) {
  const companyId = requireCompany(actor);
  const { error } = await client.from("units").insert({
    company_id: companyId,
    project_id: input.projectId,
    unit_number: input.unitNumber,
    type: input.type,
    price: input.price,
    status: input.status
  });
  if (error) throw new Error(error.message);
}

async function addCompany(client: SupabaseClient, actor: Actor, input: { name: string; city: string; email: string; phone: string; active: boolean; plan: string; paymentStatus: string }) {
  if (actor.role !== "super_admin") throw new Error("Only the platform owner can add companies.");
  const { error } = await client.from("companies").insert({
    name: input.name,
    city: input.city,
    email: input.email,
    phone: input.phone,
    active: input.active,
    plan: input.plan,
    payment_status: input.paymentStatus
  });
  if (error) throw new Error(error.message);
}

async function completeFollowup(client: SupabaseClient, actor: Actor, leadId: string, nextDate?: string) {
  const lead = await visibleLead(client, leadId);
  const next = nextDate || shiftDate(3);
  await client.from("followups").update({ completed: true, completed_at: new Date().toISOString() }).eq("lead_id", leadId).eq("completed", false);
  await client.from("leads").update({ last_contacted_date: today(), followup_date: next }).eq("id", leadId);
  await client.from("followups").insert({
    company_id: lead.company_id,
    lead_id: leadId,
    assigned_to: lead.assigned_to,
    due_date: next,
    notes: "Next follow-up after completion"
  });
  await addActivity(client, leadId, actor.id, "Follow-up", `Follow-up completed. Next date ${next}.`);
}

async function snoozeFollowup(client: SupabaseClient, actor: Actor, leadId: string, days = 1) {
  const lead = await visibleLead(client, leadId);
  const next = shiftDate(days, lead.followup_date ?? today());
  await client.from("leads").update({ followup_date: next }).eq("id", leadId);
  await client.from("followups").update({ due_date: next }).eq("lead_id", leadId).eq("completed", false);
  await addActivity(client, leadId, actor.id, "Follow-up", `Follow-up snoozed to ${next}.`);
}

export async function performAction(client: SupabaseClient, actor: Actor, action: CrmAction, payload: Record<string, unknown>) {
  switch (action) {
    case "addLead":
      return addLead(client, actor, payload as Partial<Lead>);
    case "updateLead":
      return updateLead(client, actor, String(payload.leadId), (payload.updates ?? {}) as Partial<Lead>);
    case "addNote":
      return addNote(client, actor, String(payload.leadId), String(payload.text ?? ""));
    case "scheduleSiteVisit":
      return scheduleSiteVisit(client, actor, String(payload.leadId), String(payload.visitDate ?? ""), payload.notes ? String(payload.notes) : undefined);
    case "markSiteVisitDone":
      return markSiteVisitDone(client, actor, String(payload.leadId));
    case "markBooked":
      return markBooked(client, actor, String(payload.leadId), String(payload.amount ?? ""));
    case "markLost":
      return markLost(client, actor, String(payload.leadId), String(payload.reason ?? ""));
    case "addDocumentPlaceholder":
      return addDocumentPlaceholder(client, actor, String(payload.leadId), String(payload.name ?? ""));
    case "addProject":
      return addProject(client, actor, payload.input as Omit<Project, "id" | "companyId">);
    case "addUnit":
      return addUnit(client, actor, payload.input as Omit<Unit, "id" | "companyId">);
    case "addCompany":
      return addCompany(client, actor, payload.input as { name: string; city: string; email: string; phone: string; active: boolean; plan: string; paymentStatus: string });
    case "completeFollowup":
      return completeFollowup(client, actor, String(payload.leadId), payload.nextDate ? String(payload.nextDate) : undefined);
    case "snoozeFollowup":
      return snoozeFollowup(client, actor, String(payload.leadId), Number(payload.days ?? 1));
    default:
      throw new Error("Unknown CRM action.");
  }
}
