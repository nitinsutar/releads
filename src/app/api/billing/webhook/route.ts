import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

function verifySignature(raw: string, request: Request) {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  const id = request.headers.get("webhook-id") ?? "";
  const timestamp = request.headers.get("webhook-timestamp") ?? "";
  const signature = request.headers.get("webhook-signature") ?? "";
  if (!secret || !id || !timestamp || !signature) return false;
  const signed = `${id}.${timestamp}.${raw}`;
  const digest = createHmac("sha256", secret).update(signed).digest("base64");
  const candidates = signature.split(" ").map((part) => part.includes(",") ? part.split(",")[1] : part);
  return candidates.some((candidate) => {
    const left = Buffer.from(candidate);
    const right = Buffer.from(digest);
    return left.length === right.length && timingSafeEqual(left, right);
  });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifySignature(raw, request)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = JSON.parse(raw) as { type?: string; data?: Record<string, unknown> };
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Missing service role." }, { status: 500 });

  const metadata = (event.data?.metadata ?? {}) as Record<string, string>;
  const companyId = metadata.company_id;
  const plan = metadata.plan;
  const subscriptionId = String(event.data?.subscription_id ?? event.data?.id ?? "");
  const customerId = String((event.data?.customer as { customer_id?: string } | undefined)?.customer_id ?? event.data?.customer_id ?? "");

  if (companyId && ["payment.succeeded", "subscription.active", "subscription.renewed"].includes(String(event.type))) {
    await admin.from("companies").update({
      plan: plan || undefined,
      payment_status: "Active",
      dodo_customer_id: customerId || undefined,
      dodo_subscription_id: subscriptionId || undefined
    }).eq("id", companyId);
  }

  if (companyId && ["payment.failed", "subscription.cancelled", "subscription.expired", "subscription.on_hold"].includes(String(event.type))) {
    await admin.from("companies").update({ payment_status: "Pending" }).eq("id", companyId);
  }

  return NextResponse.json({ received: true });
}
