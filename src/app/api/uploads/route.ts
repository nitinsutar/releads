import { NextResponse } from "next/server";
import { clientFromAuthHeader, currentCrmUser } from "@/lib/supabase-request";

export async function POST(request: Request) {
  const client = clientFromAuthHeader(request);
  if (!client) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const user = await currentCrmUser(client);
  if (!user) return NextResponse.json({ error: "No CRM profile is connected to this account." }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  const bucket = String(form.get("bucket") ?? "documents");
  const folder = String(form.get("folder") ?? user.company_id ?? "platform");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  if (!["documents", "brochures"].includes(bucket)) return NextResponse.json({ error: "Invalid upload bucket." }, { status: 400 });

  const safeName = file.name.replace(/[^\w.\-]+/g, "-");
  const path = `${folder}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await client.storage.from(bucket).upload(path, buffer, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ path, publicUrl: data.publicUrl });
}
