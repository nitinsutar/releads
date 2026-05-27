import { CRMData } from "./types";

const today = new Date().toISOString().slice(0, 10);
const dateFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const demoCredentials = [
  ["admin@estateflow.in", "Super Admin"],
  ["owner@arihantrealty.in", "Builder Admin"],
  ["sales@arihantrealty.in", "Sales Executive"],
  ["broker@homelink.in", "Channel Partner"],
  ["customer@example.com", "Customer"]
] as const;

export const seedData: CRMData = {
  companies: [
    { id: "cmp_arihant", name: "Arihant Realty", city: "Mumbai", email: "hello@arihantrealty.in", phone: "+91 22 4500 8800", active: true, plan: "Growth", paymentStatus: "Active" },
    { id: "cmp_nest", name: "UrbanNest Developers", city: "Pune", email: "connect@urbannest.in", phone: "+91 20 4100 2200", active: true, plan: "Trial", paymentStatus: "Trial" }
  ],
  users: [
    { id: "usr_super", name: "Platform Admin", email: "admin@estateflow.in", password: "demo123", phone: "+91 90000 00001", role: "super_admin", active: true },
    { id: "usr_owner", companyId: "cmp_arihant", name: "Rohan Mehta", email: "owner@arihantrealty.in", password: "demo123", phone: "+91 90000 00002", role: "builder_admin", active: true },
    { id: "usr_sales", companyId: "cmp_arihant", name: "Kavya Shah", email: "sales@arihantrealty.in", password: "demo123", phone: "+91 90000 00003", role: "sales", active: true },
    { id: "usr_sales2", companyId: "cmp_arihant", name: "Arjun Rao", email: "arjun@arihantrealty.in", password: "demo123", phone: "+91 90000 00004", role: "sales", active: true },
    { id: "usr_broker", companyId: "cmp_arihant", name: "Nikhil HomeLink", email: "broker@homelink.in", password: "demo123", phone: "+91 90000 00005", role: "broker", active: true },
    { id: "usr_customer", companyId: "cmp_arihant", name: "Ananya Iyer", email: "customer@example.com", password: "demo123", phone: "+91 90000 00006", role: "customer", active: true }
  ],
  projects: [
    { id: "prj_sky", companyId: "cmp_arihant", name: "Arihant Skyline", city: "Mumbai", location: "Powai", status: "Active", brochureUrl: "#", units: 180, availableUnits: 62 },
    { id: "prj_harbor", companyId: "cmp_arihant", name: "Harbor Residences", city: "Navi Mumbai", location: "Seawoods", status: "Active", brochureUrl: "#", units: 120, availableUnits: 28 },
    { id: "prj_palm", companyId: "cmp_nest", name: "Palm Avenue", city: "Pune", location: "Wakad", status: "Planning", brochureUrl: "#", units: 96, availableUnits: 96 }
  ],
  units: [
    { id: "unit_a1204", companyId: "cmp_arihant", projectId: "prj_sky", unitNumber: "A-1204", type: "2BHK", price: "INR 1.85 Cr", status: "Available" },
    { id: "unit_b902", companyId: "cmp_arihant", projectId: "prj_sky", unitNumber: "B-902", type: "3BHK", price: "INR 2.65 Cr", status: "On Hold" },
    { id: "unit_h504", companyId: "cmp_arihant", projectId: "prj_harbor", unitNumber: "H-504", type: "2BHK", price: "INR 1.42 Cr", status: "Available" }
  ],
  leads: [
    { id: "LD-1001", companyId: "cmp_arihant", customerId: "usr_customer", customerName: "Ananya Iyer", phone: "+91 98201 44320", email: "customer@example.com", projectId: "prj_sky", unitId: "unit_a1204", source: "Website", createdBy: "usr_broker", assignedTo: "usr_sales", brokerId: "usr_broker", priority: "Hot", status: "Site Visit Scheduled", followupDate: today, siteVisitDate: dateFromToday(2), lastContactedDate: dateFromToday(-1), budgetRange: "INR 1.5 - 2 Cr", requirement: "2BHK", createdAt: dateFromToday(-8), updatedAt: dateFromToday(-1) },
    { id: "LD-1002", companyId: "cmp_arihant", customerName: "Vikram Singh", phone: "+91 98700 12131", email: "vikram@example.com", projectId: "prj_harbor", source: "Meta Ads", createdBy: "usr_owner", assignedTo: "usr_sales2", priority: "Warm", status: "Interested", followupDate: dateFromToday(-1), lastContactedDate: dateFromToday(-3), budgetRange: "INR 1 - 1.5 Cr", requirement: "2BHK", createdAt: dateFromToday(-13), updatedAt: dateFromToday(-3) }
  ],
  notes: [{ id: "note_1", leadId: "LD-1001", authorId: "usr_sales", text: "Customer confirmed Saturday site visit with family.", createdAt: dateFromToday(-1) }],
  activities: []
};
