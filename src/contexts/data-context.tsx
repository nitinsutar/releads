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

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CRMData>(seedData);

  useEffect(() => {
    const stored = window.localStorage.getItem(dataKey);
    if (stored) setData(JSON.parse(stored) as CRMData);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(dataKey, JSON.stringify(data));
  }, [data]);

  const change = (updater: (current: CRMData) => CRMData) => setData((current) => updater(current));

  const value = useMemo<DataValue>(() => ({
    data,
    leadsFor: (user) => accessibleLeads(data, user),
    projectsFor: (user) => accessibleProjects(data, user),
    addLead: (user, input) => {
      if (!user.companyId) return;
      change((current) => {
        const nextLead: Lead = {
          ...input,
          id: `LD-${1000 + current.leads.length + 1}`,
          companyId: user.companyId!,
          createdBy: user.id,
          brokerId: user.role === "broker" ? user.id : input.brokerId,
          createdAt: today(),
          updatedAt: today()
        };
        return { ...current, leads: [nextLead, ...current.leads] };
      });
    },
    updateLead: (user, leadId, updates) => change((current) => {
      if (!accessibleLeads(current, user).some((lead) => lead.id === leadId)) return current;
      const existing = current.leads.find((lead) => lead.id === leadId);
      if (!existing) return current;
      const changed = Object.entries(updates).filter(([key, val]) => val !== existing[key as keyof Lead]);
      const activities: Activity[] = changed.length ? [{
        id: id("act"), leadId, actorId: user.id, type: "Update",
        details: changed.map(([key]) => key).join(", ") + " updated",
        createdAt: today()
      }, ...current.activities] : current.activities;
      return {
        ...current,
        activities,
        leads: current.leads.map((lead) => lead.id === leadId ? { ...lead, ...updates, updatedAt: today() } : lead)
      };
    }),
    addNote: (user, leadId, text) => change((current) => {
      if (!text.trim() || !accessibleLeads(current, user).some((lead) => lead.id === leadId)) return current;
      const note: LeadNote = { id: id("note"), leadId, authorId: user.id, text: text.trim(), createdAt: today() };
      return { ...current, notes: [note, ...current.notes] };
    }),
    addProject: (user, input) => {
      if (!user.companyId) return;
      change((current) => ({ ...current, projects: [{ ...input, id: id("prj"), companyId: user.companyId! }, ...current.projects] }));
    },
    addUnit: (user, input) => {
      if (!user.companyId) return;
      change((current) => ({ ...current, units: [{ ...input, id: id("unit"), companyId: user.companyId! }, ...current.units] }));
    },
    addTeamUser: (user, input) => {
      if (!user.companyId) return;
      change((current) => ({
        ...current,
        users: [{ ...input, id: id("usr"), companyId: user.companyId!, password: "demo123", active: true }, ...current.users]
      }));
    },
    addCompany: (input) => change((current) => ({ ...current, companies: [{ ...input, id: id("cmp") }, ...current.companies] })),
    resetDemoData: () => setData(seedData)
  }), [data]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useCRMData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useCRMData must be used within DataProvider.");
  return context;
}
