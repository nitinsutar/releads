import { NextResponse } from "next/server";
import { billingPlans, productIdForPlan, BillingPlan } from "@/lib/billing";
import { createDodoCheckout } from "@/lib/dodo";
import { siteUrl } from "@/lib/env";
import { clientFromAuthHeader, currentCrmUser } from "@/lib/supabase-request";

export async function POST(request: Request) {
  const client = clientFromAuthHeader(request);
  if (!client) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const user = await currentCrmUser(client);
  if (!user || !["builder_admin", "super_admin"].includes(user.role)) {
    return NextResponse.json({ error: "Only company admins can manage billing." }, { status: 403 });
  }

  const body = await request.json() as { plan: BillingPlan; companyId?: string };
  const plan = billingPlans.find((item) => item.id === body.plan);
  if (!plan) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  const productId = productIdForPlan(plan.id);
  if (!productId) return NextResponse.json({ error: `Set ${plan.envKey} in the server environment.` }, { status: 500 });

  const companyId = body.companyId ?? user.company_id;
  if (!companyId) return NextResponse.json({ error: "Choose a company to bill." }, { status: 400 });
  const { data: company } = await client.from("companies").select("*").eq("id", companyId).maybeSingle();
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  try {
    const session = await createDodoCheckout({
      product_cart: [{ product_id: productId, quantity: 1 }],
      allowed_payment_method_types: ["upi_collect", "credit", "debit"],
      billing_currency: "INR",
      customer: {
        email: user.email ?? company.email,
        name: user.name ?? company.name,
        phone_number: user.phone ?? company.phone
      },
      billing_address: { country: "IN", zipcode: "400001" },
      metadata: { company_id: companyId, plan: plan.id, user_id: user.id },
      return_url: `${siteUrl}/billing/return?companyId=${companyId}`
    });
    return NextResponse.json({ checkoutUrl: session.checkout_url, sessionId: session.session_id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start Dodo checkout." }, { status: 400 });
  }
}
