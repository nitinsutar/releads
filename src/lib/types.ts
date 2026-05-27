export type Role = "super_admin" | "builder_admin" | "sales" | "broker" | "customer";

export type LeadStatus =
  | "New Lead"
  | "Assigned"
  | "Contacted"
  | "Interested"
  | "Site Visit Scheduled"
  | "Site Visit Done"
  | "Negotiation"
  | "Booking Pending"
  | "Booked / Closed"
  | "Lost";

export type Priority = "Hot" | "Warm" | "Cold";
export type Requirement = "1BHK" | "2BHK" | "3BHK" | "Jodi flat" | "Commercial";

export interface Company {
  id: string;
  name: string;
  city: string;
  email: string;
  phone: string;
  active: boolean;
  plan: string;
  paymentStatus: "Active" | "Trial" | "Pending";
}

export interface CRMUser {
  id: string;
  companyId?: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: Role;
  active: boolean;
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  city: string;
  location: string;
  status: "Planning" | "Active" | "Completed";
  brochureUrl: string;
  units: number;
  availableUnits: number;
}

export interface Unit {
  id: string;
  companyId: string;
  projectId: string;
  unitNumber: string;
  type: Requirement;
  price: string;
  status: "Available" | "On Hold" | "Booked";
}

export interface Lead {
  id: string;
  companyId: string;
  customerId?: string;
  customerName: string;
  phone: string;
  email: string;
  projectId: string;
  unitId?: string;
  source: string;
  createdBy: string;
  assignedTo?: string;
  brokerId?: string;
  priority: Priority;
  status: LeadStatus;
  followupDate?: string;
  lastContactedDate?: string;
  siteVisitDate?: string;
  budgetRange: string;
  requirement: Requirement;
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: string;
  details: string;
  createdAt: string;
  actorId: string;
}

export interface CRMData {
  companies: Company[];
  users: CRMUser[];
  projects: Project[];
  units: Unit[];
  leads: Lead[];
  notes: LeadNote[];
  activities: Activity[];
}

export const leadStatuses: LeadStatus[] = [
  "New Lead",
  "Assigned",
  "Contacted",
  "Interested",
  "Site Visit Scheduled",
  "Site Visit Done",
  "Negotiation",
  "Booking Pending",
  "Booked / Closed",
  "Lost"
];

export const priorities: Priority[] = ["Hot", "Warm", "Cold"];
export const requirements: Requirement[] = ["1BHK", "2BHK", "3BHK", "Jodi flat", "Commercial"];

export const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",
  builder_admin: "Builder Admin",
  sales: "Sales Executive",
  broker: "Channel Partner",
  customer: "Customer"
};
