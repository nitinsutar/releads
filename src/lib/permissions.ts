import { CRMData, CRMUser, Lead, Project } from "./types";

export function accessibleLeads(data: CRMData, user: CRMUser): Lead[] {
  if (user.role === "super_admin") return data.leads;
  if (user.role === "builder_admin") return data.leads.filter((lead) => lead.companyId === user.companyId);
  if (user.role === "sales") return data.leads.filter((lead) => lead.companyId === user.companyId && (lead.assignedTo === user.id || lead.createdBy === user.id));
  if (user.role === "broker") return data.leads.filter((lead) => lead.brokerId === user.id || lead.createdBy === user.id);
  return data.leads.filter((lead) => lead.customerId === user.id || lead.email === user.email);
}

export function accessibleProjects(data: CRMData, user: CRMUser): Project[] {
  if (user.role === "super_admin") return data.projects;
  if (user.role === "customer") {
    const projectIds = new Set(accessibleLeads(data, user).map((lead) => lead.projectId));
    return data.projects.filter((project) => projectIds.has(project.id));
  }
  return data.projects.filter((project) => project.companyId === user.companyId);
}

export const canManageLeads = (user: CRMUser) => user.role === "super_admin" || user.role === "builder_admin" || user.role === "sales" || user.role === "broker";
export const canAssignLeads = (user: CRMUser) => user.role === "super_admin" || user.role === "builder_admin";
export const canManageProjects = (user: CRMUser) => user.role === "super_admin" || user.role === "builder_admin";
