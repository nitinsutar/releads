import { seedData } from "./seed-data";
import { CRMData, CRMUser, Role } from "./types";

export const CRM_DATA_KEY = "estateflow-crm-data-v1";

export type ProvisionedLogin = {
  name: string;
  email: string;
  password: string;
  role: Role;
  companyName?: string;
};

export function generatePassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const a = letters[Math.floor(Math.random() * letters.length)];
  const b = letters[Math.floor(Math.random() * letters.length)];
  return `EF-${a}${b}${String(Math.floor(1000 + Math.random() * 9000))}`;
}

export function loadWorkspaceData(): CRMData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CRM_DATA_KEY);
    return raw ? (JSON.parse(raw) as CRMData) : null;
  } catch {
    return null;
  }
}

export function workspaceUsers(): CRMUser[] {
  const stored = loadWorkspaceData();
  return stored?.users?.length ? stored.users : seedData.users;
}

export function loginUrl() {
  if (typeof window === "undefined") return "/login";
  return `${window.location.origin}/login`;
}

export function loginMessage(login: ProvisionedLogin) {
  const url = loginUrl();
  return [
    `EstateFlow login for ${login.name}`,
    login.companyName ? `Company: ${login.companyName}` : "",
    `Role: ${login.role.replace("_", " ")}`,
    `URL: ${url}`,
    `Email: ${login.email}`,
    `Password: ${login.password}`
  ].filter(Boolean).join("\n");
}
