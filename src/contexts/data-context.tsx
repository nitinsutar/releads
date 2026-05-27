"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { seedData } from "@/lib/seed-data";
import { accessibleLeads, accessibleProjects } from "@/lib/permissions";
import { Activity, CRMData, CRMUser, Lead, LeadNote, Project, Unit } from "@/lib/types";

interface DataValue {
  data: CRMData;
  leadsFor: (user: CRMUser) => Lead[];
  projectsFor: (user: CRMUser) => Project[];
  addLead: (user: CRMUser, input: Omit<Lead, "id" | "companyId" | "createdBy" | "createdAt" | "updatedAt">) => void;
  updateLead: (user: CRMUser, leadId: string, updates: Partial<Lead>) => void;
  addNote: (user: CRMUser, leadId: string, text: string) => void;
  scheduleSiteVisit: (user: CRMUser, leadId: string, visitDate: string, notes?: string) => void;
  markSiteVisitDone: (user: CRMUser, leadId: string) => void;
  markBooked: (user: CRMUser, leadId: string, amount: string) => void;
  markLost: (user: CRMUser, leadId: string, reason: string) => void;
  addDocumentPlaceholder: (user: CRMUser, leadId: string, name: string) => void;
  addProject: (user: CRMUser, input: Omit<Project, "id" | "companyId">) => void;
  addUnit: (user: CRMUser, input: Omit<Unit, "id" | "companyId">) => void;
  addTeamUser: (user: CRMUser, input: Pick<CRMUser, "name" | "email" | "phone" | "role">) => void;
  addCompany: (input: Omit<CRMData["companies"][number], "id">) => void;
  resetDemoData: () => void;
}

const DataContext = createContext<DataValue | undefined>(undefined);
const dataKey = "estateflow-crm-data-v1";
const id = (prefix: string) => `${prefix}_${Date.now().toString(36)}`;
const today = () => new Date().toISOString().slice(0, 10);
const normalizeData = (input: CRMData): CRMData => ({ ...seedData, ...input, siteVisits: input.siteVisits ?? seedData.siteVisits, bookings: input.bookings ?? seedData.bookings, brokerCommissions: input.brokerCommissions ?? seedData.brokerCommissions, customerDocuments: input.customerDocuments ?? seedData.customerDocuments });

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CRMData>(seedData);
  useEffect(() => { const stored = window.localStorage.getItem(dataKey); if (stored) setData(normalizeData(JSON.parse(stored) as CRMData)); }, []);
  useEffect(() => { window.localStorage.setItem(dataKey, JSON.stringify(data)); }, [data]);
  const change = (updater: (current: CRMData) => CRMData) => setData((current) => updater(current));

  const value = useMemo<DataValue>(() => ({
    data,
    leadsFor: (user) => accessibleLeads(data, user),
    projectsFor: (user) => accessibleProjects(data, user),
    addLead: (user, input) => {
      if (!user.companyId) return;
      change((current) => {
        const nextLead: Lead = { ...input, id: `LD-${1000 + current.leads.length + 1}`, companyId: user.companyId!, createdBy: user.id, brokerId: user.role === "broker" ? user.id : input.brokerId, createdAt: today(), updatedAt: today() };
        const activity: Activity = { id: id("act"), leadId: nextLead.id, actorId: user.id, type: "Lead Created", details: `${nextLead.customerName} was added from ${nextLead.source}.`, createdAt: today() };
        return { ...current, leads: [nextLead, ...current.leads], activities: [activity, ...current.activities] };
      });
    },
    updateLead: (user, leadId, updates) => change((current) => {
      if (!accessibleLeads(current, user).some((lead) => lead.id === leadId)) return current;
      const existing = current.leads.find((lead) => lead.id === leadId);
      if (!existing) return current;
      const changed = Object.entries(updates).filter(([key, val]) => val !== existing[key as keyof Lead]);
      const activities: Activity[] = changed.length ? [{ id: id("act"), leadId, actorId: user.id, type: "Update", details: changed.map(([key]) => key).join(", ") + " updated", createdAt: today() }, ...current.activities] : current.activities;
      return { ...current, activities, leads: current.leads.map((lead) => lead.id === leadId ? { ...lead, ...updates, updatedAt: today() } : lead) };
    }),
    addNote: (user, leadId, text) => change((current) => {
      if (!text.trim() || !accessibleLeads(current, user).some((lead) => lead.id === leadId)) return current;
      const note: LeadNote = { id: id("note"), leadId, authorId: user.id, text: text.trim(), createdAt: today() };
      const activity: Activity = { id: id("act"), leadId, actorId: user.id, type: "Note Added", details: "A follow-up note was added.", createdAt: today() };
      return { ...current, notes: [note, ...current.notes], activities: [activity, ...current.activities] };
    }),
    scheduleSiteVisit: (user, leadId, visitDate, notes) => change((current) => {
      const lead = accessibleLeads(current, user).find((item) => item.id === leadId);
      if (!lead || !visitDate) return current;
      const visit = { id: id("visit"), companyId: lead.companyId, leadId, projectId: lead.projectId, assignedTo: lead.assignedTo, visitDate, status: "Scheduled" as const, notes, createdAt: today() };
      const activity: Activity = { id: id("act"), leadId, actorId: user.id, type: "Site Visit", details: `Site visit scheduled for ${visitDate}.`, createdAt: today() };
      return { ...current, siteVisits: [visit, ...current.siteVisits], activities: [activity, ...current.activities], leads: current.leads.map((item) => item.id === leadId ? { ...item, siteVisitDate: visitDate, status: "Site Visit Scheduled", updatedAt: today() } : item) };
    }),
    markSiteVisitDone: (user, leadId) => change((current) => {
      const lead = accessibleLeads(current, user).find((item) => item.id === leadId);
      if (!lead) return current;
      const activity: Activity = { id: id("act"), leadId, actorId: user.id, type: "Site Visit", details: "Site visit marked done.", createdAt: today() };
      return { ...current, siteVisits: current.siteVisits.map((visit) => visit.leadId === leadId && visit.status === "Scheduled" ? { ...visit, status: "Done" as const } : visit), activities: [activity, ...current.activities], leads: current.leads.map((item) => item.id === leadId ? { ...item, status: "Site Visit Done", updatedAt: today() } : item) };
    }),
    markBooked: (user, leadId, amount) => change((current) => {
      const lead = accessibleLeads(current, user).find((item) => item.id === leadId);
      if (!lead || !amount.trim()) return current;
      const booking = { id: id("book"), companyId: lead.companyId, leadId, projectId: lead.projectId, unitId: lead.unitId, bookingDate: today(), amount: amount.trim(), status: "Confirmed" as const, createdAt: today() };
      const commission = lead.brokerId ? [{ id: id("comm"), companyId: lead.companyId, brokerId: lead.brokerId, leadId, bookingId: booking.id, amount: "To be calculated", status: "Pending" as const, createdAt: today() }] : [];
      const activity: Activity = { id: id("act"), leadId, actorId: user.id, type: "Booking", details: `Booking confirmed for ${amount.trim()}.`, createdAt: today() };
      return { ...current, bookings: [booking, ...current.bookings], brokerCommissions: [...commission, ...current.brokerCommissions], activities: [activity, ...current.activities], units: current.units.map((unit) => unit.id === lead.unitId ? { ...unit, status: "Booked" } : unit), leads: current.leads.map((item) => item.id === leadId ? { ...item, status: "Booked / Closed", updatedAt: today() } : item) };
    }),
    markLost: (user, leadId, reason) => change((current) => {
      const lead = accessibleLeads(current, user).find((item) => item.id === leadId);
      if (!lead || !reason.trim()) return current;
      const activity: Activity = { id: id("act"), leadId, actorId: user.id, type: "Lost", details: reason.trim(), createdAt: today() };
      return { ...current, activities: [activity, ...current.activities], leads: current.leads.map((item) => item.id === leadId ? { ...item, status: "Lost", lostReason: reason.trim(), updatedAt: today() } : item) };
    }),
    addDocumentPlaceholder: (user, leadId, name) => change((current) => {
      const lead = accessibleLeads(current, user).find((item) => item.id === leadId);
      if (!lead || !name.trim()) return current;
      const document = { id: id("doc"), companyId: lead.companyId, customerId: lead.customerId, leadId, name: name.trim(), status: "Pending" as const };
      return { ...current, customerDocuments: [document, ...current.customerDocuments] };
    }),
    addProject: (user, input) => { if (!user.companyId) return; change((current) => ({ ...current, projects: [{ ...input, id: id("prj"), companyId: user.companyId! }, ...current.projects] })); },
    addUnit: (user, input) => { if (!user.companyId) return; change((current) => ({ ...current, units: [{ ...input, id: id("unit"), companyId: user.companyId! }, ...current.units] })); },
    addTeamUser: (user, input) => { if (!user.companyId) return; change((current) => ({ ...current, users: [{ ...input, id: id("usr"), companyId: user.companyId!, password: "demo123", active: true }, ...current.users] })); },
    addCompany: (input) => change((current) => ({ ...current, companies: [{ ...input, id: id("cmp") }, ...current.companies] })),
    resetDemoData: () => setData(seedData)
  }), [data]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useCRMData() { const context = useContext(DataContext); if (!context) throw new Error("useCRMData must be used within DataProvider."); return context; }
