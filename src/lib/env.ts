export const demoModeRequested = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const demoHosts = (process.env.NEXT_PUBLIC_DEMO_HOSTS ?? "localhost,127.0.0.1")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function hostAllowsDemoLogins(hostname?: string) {
  if (!hostname) return demoModeRequested;
  return demoHosts.includes(hostname.toLowerCase());
}
