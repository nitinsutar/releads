import { Lead, Priority, Requirement, priorities, requirements } from "./types";

export type CsvDraft = {
  customerName: string;
  phone: string;
  email: string;
  projectName: string;
  source: string;
  priority: Priority;
  requirement: Requirement;
  budgetRange: string;
};

function splitCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function asPriority(value: string): Priority {
  const match = priorities.find((item) => item.toLowerCase() === value.toLowerCase());
  return match ?? "Warm";
}

function asRequirement(value: string): Requirement {
  const match = requirements.find((item) => item.toLowerCase() === value.toLowerCase());
  return match ?? "2BHK";
}

export function parseLeadCsv(text: string): CsvDraft[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const idx = (names: string[]) => names.reduce((found, name) => (found >= 0 ? found : header.indexOf(name)), -1);
  const nameI = idx(["name", "customer", "customer name", "customer_name"]);
  const phoneI = idx(["phone", "mobile", "mobile number"]);
  const emailI = idx(["email"]);
  const projectI = idx(["project", "project name", "project_name"]);
  const sourceI = idx(["source"]);
  const priorityI = idx(["priority"]);
  const reqI = idx(["requirement", "config", "bhk"]);
  const budgetI = idx(["budget", "budget range", "budget_range"]);
  if (nameI < 0 || phoneI < 0) return [];
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return {
      customerName: cells[nameI] ?? "",
      phone: cells[phoneI] ?? "",
      email: emailI >= 0 ? cells[emailI] ?? "" : "",
      projectName: projectI >= 0 ? cells[projectI] ?? "" : "",
      source: sourceI >= 0 && cells[sourceI] ? cells[sourceI] : "CSV Import",
      priority: asPriority(priorityI >= 0 ? cells[priorityI] ?? "" : "Warm"),
      requirement: asRequirement(reqI >= 0 ? cells[reqI] ?? "" : "2BHK"),
      budgetRange: budgetI >= 0 ? cells[budgetI] ?? "" : "",
    };
  }).filter((row) => row.customerName && row.phone);
}

export const csvTemplate = "name,phone,email,project,source,priority,requirement,budget\nPriya Shah,9876500001,priya@example.com,Arihant Skyline,99acres,Hot,3BHK,1.8-2.2 Cr\n";

export type ImportableLead = Omit<Lead, "id" | "companyId" | "createdBy" | "createdAt" | "updatedAt">;
