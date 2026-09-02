import { NextResponse } from "next/server";
import { clientFromAuthHeader, currentCrmUser } from "@/lib/supabase-request";
import { CrmAction, loadSnapshot, performAction } from "@/lib/live-crm";

export async function GET(request: Request) {
  const client = clientFromAuthHeader(request);
  if (!client) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const actor = await currentCrmUser(client);
  if (!actor) return NextResponse.json({ error: "No CRM profile is connected to this account." }, { status: 403 });
  try {
    const data = await loadSnapshot(client);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load CRM data." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const client = clientFromAuthHeader(request);
  if (!client) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const actor = await currentCrmUser(client);
  if (!actor) return NextResponse.json({ error: "No CRM profile is connected to this account." }, { status: 403 });

  const body = await request.json() as { action?: CrmAction } & Record<string, unknown>;
  if (!body.action) return NextResponse.json({ error: "Action is required." }, { status: 400 });

  try {
    await performAction(client, {
      id: String(actor.id),
      role: actor.role,
      company_id: actor.company_id ?? null,
      name: actor.name
    }, body.action, body);
    const data = await loadSnapshot(client);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save." }, { status: 400 });
  }
}
