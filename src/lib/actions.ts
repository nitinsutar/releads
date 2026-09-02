import { Lead } from "./types";

export function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

export function callHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:+${digits.startsWith("91") ? digits : `91${digits}`}` : "#";
}

export function whatsappHref(lead: Pick<Lead, "customerName" | "phone" | "requirement">, projectName: string, sender: string) {
  const digits = phoneDigits(lead.phone);
  if (!digits) return "#";
  const text = `Hi ${lead.customerName}, this is ${sender} from EstateFlow regarding ${projectName}${lead.requirement ? ` (${lead.requirement})` : ""}. When is a good time to talk?`;
  return `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`;
}

export function shiftDate(days: number, from?: string | null) {
  const date = from ? new Date(`${from}T00:00:00`) : new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function isDuplicateLead(existing: { phone: string; projectId: string }[], phone: string, projectId: string) {
  const digits = phoneDigits(phone);
  if (!digits) return false;
  return existing.some((lead) => lead.projectId === projectId && phoneDigits(lead.phone) === digits);
}
