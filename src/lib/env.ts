export const demoModeForced = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const liveMode = isSupabaseConfigured && !demoModeForced;
