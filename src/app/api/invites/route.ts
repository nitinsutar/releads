import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { clientFromAuthHeader, currentCrmUser } from "@/lib/supabase-request";
import { siteUrl } from "@/lib/env";

export async function POST(request: Request) {
  const client = clientFromAuthHeader(request);
  if (!client) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const actor = await currentCrmUser(client);
  if (!actor || !["builder_admin", "super_admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only builder admins can invite teammates." }, { status: 403 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server is missing SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });
  const body = await request.json() as { name: string; email: string; phone: string; role: "sales" | "broker" | "builder_admin" | "customer" };
  if (!body.email || !body.name || !body.role) return NextResponse.json({ error: "Name, email and role are required." }, { status: 400 });
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(body.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/invite`,
    data: { name: body.name, role: body.role, phone: body.phone }
  });
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });
  const { error: profileError } = await admin.from("users").upsert({
    auth_id: invited.user?.id ?? null,
    company_id: actor.company_id,
    name: body.name,
    email: body.email,
    phone: body.phone,
    role: body.role,
    active: true
  }, { onConflict: "email" });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
  await admin.from("invites").insert({ company_id: actor.company_id, email: body.email, name: body.name, role: body.role, invited_by: actor.id, status: "sent" });
  return NextResponse.json({ ok: true });
}
