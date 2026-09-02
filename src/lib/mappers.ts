import {
  Activity,
  Booking,
  BrokerCommission,
  Company,
  CRMData,
  CRMUser,
  CustomerDocument,
  Lead,
  LeadNote,
  Project,
  SiteVisit,
  Unit
} from "./types";

export const emptyData: CRMData = {
  companies: [],
  users: [],
  projects: [],
  units: [],
  leads: [],
  notes: [],
  activities: [],
  siteVisits: [],
  bookings: [],
  brokerCommissions: [],
  customerDocuments: []
};

export function dateOnly(value?: string | null) {
  if (!value) return undefined;
  return String(value).slice(0, 10);
}

export function phoneDigits(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-10);
}

export function mapUser(row: Record<string, unknown>): CRMUser {
  return {
    id: String(row.id),
    companyId: row.company_id ? String(row.company_id) : undefined,
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    role: row.role as CRMUser["role"],
    active: Boolean(row.active)
  };
}

export function mapCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    city: String(row.city ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    active: Boolean(row.active),
    plan: String(row.plan ?? "Trial"),
    paymentStatus: (row.payment_status as Company["paymentStatus"]) ?? "Trial"
  };
}

export function mapProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name ?? ""),
    city: String(row.city ?? ""),
    location: String(row.location ?? ""),
    status: row.status as Project["status"],
    brochureUrl: String(row.brochure_url ?? ""),
    units: Number(row.units ?? 0),
    availableUnits: Number(row.available_units ?? 0)
  };
}

export function mapUnit(row: Record<string, unknown>): Unit {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    projectId: String(row.project_id),
    unitNumber: String(row.unit_number ?? ""),
    type: row.type as Unit["type"],
    price: String(row.price ?? ""),
    status: row.status as Unit["status"]
  };
}

export function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    customerId: row.customer_id ? String(row.customer_id) : undefined,
    customerName: String(row.customer_name ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    projectId: String(row.project_id),
    unitId: row.unit_id ? String(row.unit_id) : undefined,
    source: String(row.source ?? ""),
    createdBy: String(row.created_by),
    assignedTo: row.assigned_to ? String(row.assigned_to) : undefined,
    brokerId: row.broker_id ? String(row.broker_id) : undefined,
    priority: row.priority as Lead["priority"],
    status: row.status as Lead["status"],
    followupDate: dateOnly(row.followup_date as string | null),
    lastContactedDate: dateOnly(row.last_contacted_date as string | null),
    siteVisitDate: dateOnly(row.site_visit_date as string | null),
    budgetRange: String(row.budget_range ?? ""),
    requirement: row.requirement as Lead["requirement"],
    lostReason: row.lost_reason ? String(row.lost_reason) : undefined,
    createdAt: dateOnly(row.created_at as string) ?? "",
    updatedAt: dateOnly(row.updated_at as string) ?? ""
  };
}

export function mapNote(row: Record<string, unknown>): LeadNote {
  return {
    id: String(row.id),
    leadId: String(row.lead_id),
    authorId: String(row.author_id),
    text: String(row.note ?? row.text ?? ""),
    createdAt: dateOnly(row.created_at as string) ?? ""
  };
}

export function mapActivity(row: Record<string, unknown>): Activity {
  return {
    id: String(row.id),
    leadId: String(row.lead_id),
    type: String(row.type ?? ""),
    details: String(row.details ?? ""),
    createdAt: dateOnly(row.created_at as string) ?? "",
    actorId: String(row.actor_id)
  };
}

export function mapVisit(row: Record<string, unknown>): SiteVisit {
  return {
    id: String(row.id),
    companyId: String(row.company_id ?? ""),
    leadId: String(row.lead_id),
    projectId: String(row.project_id ?? ""),
    assignedTo: row.assigned_to ? String(row.assigned_to) : undefined,
    visitDate: dateOnly((row.visit_date ?? row.scheduled_at) as string) ?? "",
    status: row.status as SiteVisit["status"],
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: dateOnly((row.created_at ?? row.scheduled_at) as string) ?? ""
  };
}

export function mapBooking(row: Record<string, unknown>): Booking {
  return {
    id: String(row.id),
    companyId: String(row.company_id ?? ""),
    leadId: String(row.lead_id),
    projectId: String(row.project_id ?? ""),
    unitId: row.unit_id ? String(row.unit_id) : undefined,
    bookingDate: dateOnly((row.booking_date ?? row.booked_at) as string) ?? "",
    amount: row.amount == null ? "" : String(row.amount),
    status: row.status as Booking["status"],
    createdAt: dateOnly((row.created_at ?? row.booked_at) as string) ?? ""
  };
}

export function mapCommission(row: Record<string, unknown>): BrokerCommission {
  return {
    id: String(row.id),
    companyId: String(row.company_id ?? ""),
    brokerId: String(row.broker_id),
    leadId: String(row.lead_id),
    bookingId: row.booking_id ? String(row.booking_id) : undefined,
    amount: row.amount == null ? "" : String(row.amount),
    status: row.status as BrokerCommission["status"],
    createdAt: dateOnly(row.created_at as string) ?? ""
  };
}

export function mapDocument(row: Record<string, unknown>): CustomerDocument {
  const rawStatus = String(row.status ?? "Pending");
  const status: CustomerDocument["status"] =
    rawStatus === "Verified" ? "Verified" : rawStatus === "Uploaded" ? "Uploaded" : "Pending";
  return {
    id: String(row.id),
    companyId: String(row.company_id ?? ""),
    customerId: row.customer_id ? String(row.customer_id) : undefined,
    leadId: String(row.lead_id),
    name: String(row.name ?? row.document_type ?? "Document"),
    status,
    uploadedAt: dateOnly((row.uploaded_at ?? (status === "Pending" ? null : row.created_at)) as string | null)
  };
}
