# Deployment Setup

This project is ready for GitHub, Supabase and Vercel. The local environment does not currently expose `git`, `gh`, `supabase`, or `vercel` CLIs, so account linking must be completed through the web dashboards or from a machine with those CLIs installed.

## GitHub

1. Create a new GitHub repository, for example `real-estate-lead-management-crm`.
2. Push this workspace to that repository.
3. The included workflow at `.github/workflows/ci.yml` runs `npm install` and `npm run build` on pushes to `main` and pull requests.

Suggested commands on a machine with Git installed:

```bash
git init
git add .
git commit -m "Initial Phase 1 CRM MVP"
git branch -M main
git remote add origin https://github.com/<owner>/real-estate-lead-management-crm.git
git push -u origin main
```

## Supabase

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/migrations/001_initial_schema.sql`.
4. Create the demo auth users in Authentication using the emails in `README.md`.
5. Insert matching rows in `public.users` with each Supabase `auth.users.id` as `auth_id`.
6. Copy the project URL and anon key into Vercel environment variables.

For local Supabase CLI usage:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## Vercel

1. Import the GitHub repository in Vercel.
2. Vercel should auto-detect Next.js. `vercel.json` pins the expected commands.
3. Add these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_DEMO_MODE=false
```

For a demo-only Vercel deployment without Supabase:

```bash
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Current Phase 1 Scope

The deployed MVP should expose authentication, role dashboards, company setup, project creation, lead creation/listing, lead assignment, follow-up dates and notes. Later phase modules remain placeholders by design.
