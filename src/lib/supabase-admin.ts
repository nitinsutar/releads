import { createClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "./env";

export function createAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
