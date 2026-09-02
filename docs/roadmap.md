# Build order

## Now — Sprint A (live CRM)

1. Wire Supabase persistence for leads, notes, visits, bookings, projects, units, users and companies.
2. Invite flow for sales and brokers.
3. Demo vs production host split.
4. Duplicate lead check, follow-up done/snooze, file uploads.
5. Align SQL schema with the UI.

Domain connection and Dodo Payments stay last. Do not block this work on billing or custom domain.

### Persistence shipped on this branch
- `/api/crm` loads and mutates tenant data through Supabase RLS
- DataProvider uses the API when `NEXT_PUBLIC_DEMO_MODE=false`
- Duplicate check: same company + project + last 10 phone digits, excluding Lost
- Follow-up Done / Snooze 1 day
- Team add invites via `/api/invites` in live mode
- Run `supabase/migrations/002_sprint_a.sql` after `001_initial_schema.sql`

## Last — custom domain, then Dodo Payments

Payment gateway is decided: **Dodo Payments** (INR, UPI + Indian cards, subscriptions).

Needed only at that step:
- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_WEBHOOK_KEY`
- `DODO_PAYMENTS_ENVIRONMENT=test_mode|live_mode`
- `DODO_PRODUCT_GROWTH` and `DODO_PRODUCT_PRO`
- Webhook URL: `https://<domain>/api/billing/webhook`
