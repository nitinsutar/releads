export function projectShareToken(projectId: string, brokerId?: string) {
  const project = projectId.replace(/[^a-z0-9]/gi, "").slice(-10).toLowerCase() || "project";
  const broker = (brokerId ?? "open").replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase();
  return `${project}-${broker}`;
}

export function sharePath(token: string) {
  return `/p/${token}`;
}

export function shareUrl(token: string, origin?: string) {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${sharePath(token)}`;
}

export function shareWhatsAppHref(projectName: string, url: string, sender: string) {
  const text = `Hi, ${sender} here. Sharing ${projectName} — location, inventory and a short enquiry form:\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export const SHARE_INBOX_KEY = "estateflow-share-inbox-v1";
