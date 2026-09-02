import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

export function clientFromAuthHeader(request: Request): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function currentCrmUser(client: SupabaseClient) {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;
  const { data } = await client.from("users").select("*").eq("auth_id", auth.user.id).eq("active", true).maybeSingle();
  return data;
}
