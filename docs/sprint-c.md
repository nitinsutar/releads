# Sprint C — Pilot tenant

Pilot loop for one builder: live leads, invite sales, confirm site visits, broker share pages.

## Shipped

- Dual-mode data layer: demo localStorage stays default; live mode uses `/api/crm` when Supabase env is set and `NEXT_PUBLIC_DEMO_MODE` is not `true`.
- Invite sales / brokers from Team and Brokers.
- Site visit board: schedule, WhatsApp confirmation, mark done, cancel / no-show.
- Broker share kit and public page at `/p/[token]`.
- UI: Fraunces headings, greeting bar, live/demo pill, share landing.

## Still last

- Dodo Payments
- Custom domain
