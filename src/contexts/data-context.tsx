"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { seedData } from "@/lib/seed-data";
import { accessibleLeads, accessibleProjects } from "@/lib/permissions";
import { Activity, CRMData, CRMUser, Lead, LeadNote, Project, Unit } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase";
import { crmRequest } from "@/lib/api-client";
import { emptyData } from "@/lib/mappers";

interface DataValue {
  data: CRMData;
  loading: boolean;
  live: boolean;
  leadsFor: (user: CRMUser) => Lead[];
  projectsFor: (user: CRMUser) => Project[];
  addLead: (user: CRMUser, input: Omit<Lead, "id" | "companyId" | "createdBy" | "createdAt" | "updatedAt">) => Promise<string | null>;
  updateLead: (user: CRMUser, leadId: string, updates: Partial<Lead>) => Promise<string | null>;
  addNote: (user: CRMUser, leadId: string, text: string) => Promise<string | null>;
  scheduleSiteVisit: (user: CRMUser, leadId: string, visitDate: string, notes?: string) => Promise<string | null>;
  markSiteVisitDone: (user: CRMUser, leadId: string) => Promise<string | null>;
  markBooked: (user: CRMUser, leadId: string, amount: string) => Promise<string | null>;
  markLost: (user: CRMUser, leadId: string, reason: string) => Promise<string | null>;
  addDocumentPlaceholder: (user: CRMUser, leadId: string, name: string) => Promise<string | null>;
  addProject: (user: CRMUser, input: Omit<Project, "id" | "companyId">) => Promise<string | null>;
  addUnit: (user: CRMUser, input: Omit<Unit, "id" | "companyId">) => Promise<string | null>;
  addTeamUser: (user: CRMUser, input: Pick<CRMUser, "name" | "email" | "phone" | "role">) => Promise<string | null>;
  addCompany: (input: Omit<CRMData["companies"][number], "id">) => Promise<string | null>;
  completeFollowup: (user: CRMUser, leadId: string, nextDate?: string) => Promise<string | null>;
  snoozeFollowup: (user: CRMUser, leadId: string, days?: number) => Promise<string | null>;
  refresh: () => Promise<void>;
  resetDemoData: () => void;
}

const DataContext = createContext<DataValue | undefined>(undefined);
const dataKey = "estateflow-crm-data-v1";
const id = (prefix: string) => `${prefix}_${Date.now().toString(36)}`;
const today = () => new Date().toISOString().slice(0, 10);
const shiftDate = (days: number, from?: string) => {
  const date = from ? new Date(`${from}T00:00:00`) : new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const liveMode = isSupabaseConfigured && process.env.NEXT_PUBLIC_DEMO_MODE !== "true";
const normalizeData = (input: CRMData): CRMData => ({
  ...seedData,
  ...input,
  siteVisits: input.siteVisits ?? seedData.siteVisits,
  bookings: input.bookings ?? seedData.bookings,
  brokerCommissions: input.brokerCommissions ?? seedData.brokerCommissions,
  customerDocuments: input.customerDocuments ?? seedData.customerDocuments
});

function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CRMData>(liveMode ? emptyData : seedData);
  const [loading, setLoading] = useState(liveMode);

  const refresh = useCallback(async () => {
    if (!liveMode) return;
    const payload = await crmRequest("/api/crm");
    setData(payload.data as CRMData);
  }, []);

  useEffect(() => {
    if (liveMode) {
      void refresh().finally(() => setLoading(false));
      return;
    }
    const stored = window.localStorage.getItem(dataKey);
    if (stored) setData(normalizeData(JSON.parse(stored) as CRMData));
    setLoading(false);
  }, [refresh]);

  useEffect(() => {
    if (!liveMode) window.localStorage.setItem(dataKey, JSON.stringify(data));
  }, [data]);

  const change = (updater: (current: CRMData) => CRMData) => setData((current) => updater(current));

  const run = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    try {
      const result = await crmRequest("/api/crm", { method: "POST", body: JSON.stringify({ action, ...payload }) });
      if (result.data) setData(result.data as CRMData);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Unable to save.";
    }
  }, []);

  const value = useMemo<DataValue>(() => ({
    data,
    loading,
    live: liveMode,
    leadsFor: (user) => accessibleLeads(data, user),
    projectsFor: (user) => accessibleProjects(data, user),
    addLead: async (user, input) => {
      if (liveMode) return run("addLead", input);
      if (!user.companyId) return "This account is not linked to a company.";
      const digits = phoneDigits(input.phone);
      const duplicate = data.leads.find((lead) =>
        lead.companyId === user.companyId &&
        lead.projectId === input.projectId &&
        lead.status !== "Lost" &&
        phoneDigits(lead.phone) === digits
      );
      if (duplicate) return `Duplicate lead: ${duplicate.customerName} already exists for this project (${duplicate.status}).`;
      change((current) => {
        const nextLead: Lead = { ...input, id: `LD-${1000 + current.leads.length + 1}`, companyId: user.companyId!, createdBy: user.id, brokerId: user.role === "broker" ? user.id : input.brokerId, createdAt: today(), updatedAt: today() };
        const activity: Activity = { id: id("act"), leadId: nextLead.id, actorId: user.id, type: "Lead Created", details: `${nextLead.customerName} was added from ${nextLead.source}.`, createdAt: today() };
        return { ...current, leads: [nextLead, ...current.leads], activities: [activity, ...current.activities] };
      });
      return null;
    },
    updateLead: async (user, leadId, updates) => {
      if (liveMode) return run("updateLead", { leadId, updates });
      change((current) => {
        if (!accessibleLeads(current, user).some((lead) => lead.id === leadId)) return current;
        const existing = current.leads.find((lead) => lead.id === leadId);
        if (!existing) return current;
        const changed = Object.entries(updates).filter(([key, val]) => val !== existing[key as keyof Lead]);
        const activities: Activity[] = changed.length ? [{ id: id("act"), leadId, actorId: user.id, type: "Update", details: changed.map(([key]) => key).join(", ") + " updated", createdAt: today() }, ...current.activities] : current.activities;
        return { ...current, activities, leads: current.leads.map((lead) => lead.id === leadId ? { ...lead, ...updates, updatedAt: today() } : lead) };
      });
      return null;
    },
    addNote: async (user, leadId, text) => {
      if (liveMode) return run("addNote", { leadId, text });
      change((current) => {
        if (!text.trim() || !accessibleLeads(current, user).some((lead) => lead.id === leadId)) return current;
        const note: LeadNote = { id: id("note"), leadId, authorId: user.id, text: text.trim(), createdAt: today() };
        const activity: Activity = { id: id("act"), leadId, actorId: user.id, type: "Note Added", details: "A follow-up note was added.", createdAt: today() };
        return { ...current, notes: [note, ...current.notes], activities: [activity, ...current.activities] };
      });
      return null;
    },
    scheduleSiteVisit: async (user, leadId, visitDate, notes) => {
      if (liveMode) return run("scheduleSiteVisit", { leadId, visitDate, notes });
      change((current) => {
        const lead = accessibleLeads(current, user).find((item) => item.id === leadId);
        if (!lead || !visitDate) return current;
        const visit = { id: id("visit"), companyId: lead.companyId, leadId, projectId: lead.projectId, assignedTo: lead.assignedTo, visitDate, status: "Scheduled" as const, notes, createdAt: today() };
        const activity: Activity = { id: id("act"), leadId, actorId: user.id, type: "Site Visit", details: `Site visit scheduled for ${visitDate}.`, createdAt: today() };
        return { ...current, siteVisits: [visit, ...current.siteVisits], activities: [activity, ...current.activities], leads: current.leads.map((item) => item.id === leadId ? { ...item, siteVisitDate: visitDate, status: "Site Visit Scheduled", updatedAt: today() } : item) };
      });
      return null;
    },
    markSiteVisitDone: async (user, leadId) => {
      if (liveMode) return run("markSiteVisitDone", { leadId });
      change((current) => {
        const lead = accessibleLeads(current, user).find((item) => item.id === leadId);
        if (!lead) return current;
        const activity: Activity = { id: id("act"), leadId, actorId: user.id, type: "Site Visit", details: "Site visit marked done.", createdAt: today() };
        return { ...current, siteVisits: current.siteVisits.map((visit) => visit.leadId === leadId && visit.status === "Scheduled" ? { ...visit, status: "Done" as const } : visit), activities: [activity, ...current.activities], leads: current.leads.map((item) => item.id === leadId ? { ...item, status: "Site Visit Done", updatedAt: today() } : item) };
      });
      return null;
    },
    markBooked: async (user, leadId, amount) => {
      if (liveMode) return run("markBooked", { leadId, amount });
      change((current) => {
        const lead = accessibleLeads(current, user).find((item) => item.id === leadId);
        if (!lead || !amount.trim()) return current;
        const booking = { id: id("book"), companyId: lead.companyId, leadId, projectId: lead.projectId, unitId: lead.unitId, bookingDate: today(), amount: amount.trim(), status: "Confirmed" as const, createdAt: today() };
        const commission = lead.brokerId ? [{ id: id("comm"), companyId: lead.companyId, brokerId: lead.brokerId, leadId, bookingId: booking.id, amount: "To be calculated", status: "Pending" as const, createdAt: today() }] : [];
        const activity: Activity = { id: id("act"), leadId, actorId: user.id, type: "Booking", details: `Booking confirmed for ${amount.trim()}.`, createdAt: today() };
        return { ...current, bookings: [booking, ...current.bookings], brokerCommissions: [...commission, ...current.brokerCommissions], activities: [activity, ...current.activities], units: current.units.map((unit) => unit.id === lead.unitId ? { ...unit, status: "Booked" } : unit), leads: current.leads.map((item) => item.id === leadId ? { ...item, status: "Booked / Closed", updatedAt: today() } : item) };
      });
      return null;
    },
    markLost: async (user, leadId, reason) => {
      if (liveMode) return run("markLost", { leadId, reason });
      change((current) => {
        const lead = accessibleLeads(current, user).find((item) => item.id === leadId);
        if (!lead || !reason.trim()) return current;
        const activity: Activity = { id: id("act"), leadId, actorId: user.id, type: "Lost", details: reason.trim(), createdAt: today() };
        return { ...current, activities: [activity, ...current.activities], leads: current.leads.map((item) => item.id === leadId ? { ...item, status: "Lost", lostReason: reason.trim(), updatedAt: today() } : item) };
      });
      return null;
    },
    addDocumentPlaceholder: async (user, leadId, name) => {
      if (liveMode) return run("addDocumentPlaceholder", { leadId, name });
      change((current) => {
        const lead = accessibleLeads(current, user).find((item) => item.id === leadId);
        if (!lead || !name.trim()) return current;
        const document = { id: id("doc"), companyId: lead.companyId, customerId: lead.customerId, leadId, name: name.trim(), status: "Pending" as const };
        return { ...current, customerDocuments: [document, ...current.customerDocuments] };
      });
      return null;
    },
    addProject: async (user, input) => {
      if (liveMode) return run("addProject", { input });
      if (!user.companyId) return "This account is not linked to a company.";
      change((current) => ({ ...current, projects: [{ ...input, id: id("prj"), companyId: user.companyId! }, ...current.projects] }));
      return null;
    },
    addUnit: async (user, input) => {
      if (liveMode) return run("addUnit", { input });
      if (!user.companyId) return "This account is not linked to a company.";
      change((current) => ({ ...current, units: [{ ...input, id: id("unit"), companyId: user.companyId! }, ...current.units] }));
      return null;
    },
    addTeamUser: async (user, input) => {
      if (liveMode) {
        try {
          await crmRequest("/api/invites", { method: "POST", body: JSON.stringify(input) });
          await refresh();
          return null;
        } catch (error) {
          return error instanceof Error ? error.message : "Invite failed.";
        }
      }
      if (!user.companyId) return "This account is not linked to a company.";
      change((current) => ({ ...current, users: [{ ...input, id: id("usr"), companyId: user.companyId!, password: "demo123", active: true }, ...current.users] }));
      return null;
    },
    addCompany: async (input) => {
      if (liveMode) return run("addCompany", { input });
      change((current) => ({ ...current, companies: [{ ...input, id: id("cmp") }, ...current.companies] }));
      return null;
    },
    completeFollowup: async (user, leadId, nextDate) => {
      if (liveMode) return run("completeFollowup", { leadId, nextDate });
      const next = nextDate || shiftDate(3);
      change((current) => {
        if (!accessibleLeads(current, user).some((lead) => lead.id === leadId)) return current;
        const activity: Activity = { id: id("act"), leadId, actorId: user.id, type: "Follow-up", details: `Follow-up completed. Next date ${next}.`, createdAt: today() };
        return { ...current, activities: [activity, ...current.activities], leads: current.leads.map((lead) => lead.id === leadId ? { ...lead, lastContactedDate: today(), followupDate: next, updatedAt: today() } : lead) };
      });
      return null;
    },
    snoozeFollowup: async (user, leadId, days = 1) => {
      if (liveMode) return run("snoozeFollowup", { leadId, days });
      change((current) => {
        const lead = accessibleLeads(current, user).find((item) => item.id === leadId);
        if (!lead) return current;
        const next = shiftDate(days, lead.followupDate);
        const activity: Activity = { id: id("act"), leadId, actorId: user.id, type: "Follow-up", details: `Follow-up snoozed to ${next}.`, createdAt: today() };
        return { ...current, activities: [activity, ...current.activities], leads: current.leads.map((item) => item.id === leadId ? { ...item, followupDate: next, updatedAt: today() } : item) };
      });
      return null;
    },
    refresh,
    resetDemoData: () => { if (!liveMode) setData(seedData); }
  }), [data, loading, refresh, run]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useCRMData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useCRMData must be used within DataProvider.");
  return context;
}
