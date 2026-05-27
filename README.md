# Real Estate Lead Management CRM

A deployment-ready MVP for Indian real estate builders to manage enquiries from capture to assignment, follow-up and pipeline tracking. It is built with Next.js, React, Tailwind CSS, and a Supabase PostgreSQL/Auth backend schema.

## Phase 1 MVP Included

- Email/password sign-in experience with five seeded demo roles
- Role-specific dashboards and navigation for Super Admin, Builder Admin, Sales Team, Broker, and Customer
- Company-scoped and user-scoped lead visibility rules
- Super Admin builder company setup
- Builder project creation
- Sales user and broker user creation
- Lead creation, listing, assignment, status update, follow-up date and notes
- Dummy seed data so dashboards are usable immediately
- Placeholders for inventory, site visits, bookings, reports, exports, documents, commissions, subscriptions and brochure delivery
- Supabase migration with tables and row-level security policies for production data isolation

## Phase 2 Included

- Lead pipeline Kanban board across the full enquiry-to-booking lifecycle
- Lead search and filters by status, priority, project and source
- Hot/Warm/Cold priority controls on lead creation and updates
- Today, overdue and upcoming follow-up workspace
- Broker-wise and salesperson-wise lead tracking
- Lead source performance snapshot
- Lead activity timeline combining status changes, field updates and notes

## Quick Start

Install packages and run the Next.js application:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With no Supabase configuration, the app starts in demo mode and saves edits in browser local storage.

### Demo Accounts

All demo accounts use password `demo123`.

| Role | Email |
| --- | --- |
| Super Admin | `admin@estateflow.in` |
| Builder Admin | `owner@arihantrealty.in` |
| Sales Executive | `sales@arihantrealty.in` |
| Broker / Channel Partner | `broker@homelink.in` |
| Customer | `customer@example.com` |

## Supabase Setup

1. Create a Supabase project.
2. Run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) in the SQL editor.
3. Create email/password accounts in Supabase Authentication and add matching `public.users` rows with each generated `auth_id`.
4. Optionally use [`supabase/seed.sql`](supabase/seed.sql) as starter company/project data.
5. Copy `.env.example` to `.env.local` and add the Supabase URL and anonymous key.
6. Set `NEXT_PUBLIC_DEMO_MODE=false` to use Supabase email/password sign-in.

The schema applies PostgreSQL row-level security: builder admins are limited to their company, sales users to assigned or self-created leads, brokers to their submissions, and customers to their own enquiry and related sales contacts.

## GitHub, Supabase and Vercel

See [`docs/deployment.md`](docs/deployment.md) for the connection checklist. The project includes:

- `.github/workflows/ci.yml` for GitHub build checks
- `vercel.json` for Vercel project detection and commands
- `supabase/config.toml` plus the initial SQL migration

## Architecture

```text
src/
  app/                  Next.js routes for public pages and dashboard modules
  components/           Shell, tables, badges and dashboard UI
  contexts/             Authentication and MVP data state providers
  lib/                  Domain types, seed data, permissions and Supabase client
supabase/
  migrations/           PostgreSQL schema and RLS policies
  seed.sql              Optional backend starter records
```

## Production Notes

The immediately runnable demo state is deliberately lightweight. The Supabase schema and authentication switch are prepared for backend connection; production CRUD calls should replace the local-state provider with Supabase queries covered by the included RLS policies. Deploy on Vercel by configuring the three variables in `.env.example`.
