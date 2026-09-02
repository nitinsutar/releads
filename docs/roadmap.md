# Build order

## Now — Sprint A (live CRM)

1. Wire Supabase persistence for leads, notes, visits, bookings, projects, units, users and companies.
2. Invite flow for sales and brokers.
3. Demo vs production host split.
4. Duplicate lead check, follow-up done/snooze, file uploads.
5. Align SQL schema with the UI.

Do **not** block this work on billing.

## Last — Dodo Payments

Payment gateway is decided: **Dodo Payments** (INR, UPI + Indian cards, subscriptions).

Leave it until the live CRM is usable by a real builder team.

Already sketched, finish later:
- `/api/billing/checkout`
- `/api/billing/webhook`
- `src/lib/billing.ts` plans (Trial / Growth / Pro)
- Company fields `dodo_customer_id`, `dodo_subscription_id`

Needed only at that step:
- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_WEBHOOK_KEY`
- `DODO_PAYMENTS_ENVIRONMENT=test_mode|live_mode`
- `DODO_PRODUCT_GROWTH` and `DODO_PRODUCT_PRO`
- Webhook URL: `https://<domain>/api/billing/webhook`
