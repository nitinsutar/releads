-- Sprint A: align schema with the CRM UI and allow staff writes.

alter table public.leads
  add column if not exists phone_digits text generated always as (
    right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10)
  ) stored;

create unique index if not exists leads_company_project_phone_active_idx
  on public.leads (company_id, project_id, phone_digits)
  where status <> 'Lost';

alter table public.followups
  add column if not exists company_id uuid references public.companies (id) on delete cascade,
  add column if not exists completed_at timestamptz;

alter table public.site_visits
  add column if not exists company_id uuid references public.companies (id) on delete cascade,
  add column if not exists project_id uuid references public.projects (id),
  add column if not exists assigned_to uuid references public.users (id),
  add column if not exists visit_date date,
  add column if not exists created_at timestamptz not null default now();

update public.site_visits
set visit_date = scheduled_at::date
where visit_date is null and scheduled_at is not null;

alter table public.bookings
  add column if not exists company_id uuid references public.companies (id) on delete cascade,
  add column if not exists project_id uuid references public.projects (id),
  add column if not exists booking_date date,
  add column if not exists created_at timestamptz not null default now();

alter table public.bookings
  alter column amount type text using amount::text;

update public.bookings
set booking_date = booked_at::date
where booking_date is null and booked_at is not null;

alter table public.broker_commissions
  add column if not exists company_id uuid references public.companies (id) on delete cascade,
  add column if not exists booking_id uuid references public.bookings (id),
  add column if not exists created_at timestamptz not null default now();

alter table public.broker_commissions
  alter column amount type text using amount::text;

alter table public.customer_documents
  alter column customer_id drop not null,
  alter column storage_path drop not null,
  add column if not exists company_id uuid references public.companies (id) on delete cascade,
  add column if not exists name text,
  add column if not exists uploaded_at timestamptz;

update public.customer_documents
set name = document_type
where name is null;

alter table public.customer_documents
  drop constraint if exists customer_documents_status_check;

alter table public.customer_documents
  add constraint customer_documents_status_check
  check (status in ('Pending', 'Uploaded', 'Verified'));

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete cascade,
  email text not null,
  role text not null,
  invited_by uuid references public.users (id),
  status text not null default 'sent',
  created_at timestamptz not null default now()
);

alter table public.invites enable row level security;

drop policy if exists "admins manage invites" on public.invites;
create policy "admins manage invites" on public.invites for all
  using (
    public.is_super_admin()
    or (company_id = public.current_company_id() and (public.current_crm_user()).role = 'builder_admin')
  )
  with check (
    public.is_super_admin()
    or (company_id = public.current_company_id() and (public.current_crm_user()).role = 'builder_admin')
  );

drop policy if exists "staff insert activities" on public.lead_activities;
create policy "staff insert activities" on public.lead_activities for insert
  with check (
    actor_id = (public.current_crm_user()).id
    and exists (select 1 from public.leads where leads.id = lead_activities.lead_id)
  );

drop policy if exists "staff insert visits" on public.site_visits;
create policy "staff insert visits" on public.site_visits for insert
  with check (exists (select 1 from public.leads where leads.id = site_visits.lead_id));

drop policy if exists "staff update visits" on public.site_visits;
create policy "staff update visits" on public.site_visits for update
  using (exists (select 1 from public.leads where leads.id = site_visits.lead_id));

drop policy if exists "staff insert bookings" on public.bookings;
create policy "staff insert bookings" on public.bookings for insert
  with check (exists (select 1 from public.leads where leads.id = bookings.lead_id));

drop policy if exists "staff update bookings" on public.bookings;
create policy "staff update bookings" on public.bookings for update
  using (exists (select 1 from public.leads where leads.id = bookings.lead_id));

drop policy if exists "staff write followups" on public.followups;
create policy "staff write followups" on public.followups for all
  using (exists (select 1 from public.leads where leads.id = followups.lead_id))
  with check (exists (select 1 from public.leads where leads.id = followups.lead_id));

drop policy if exists "staff insert commissions" on public.broker_commissions;
create policy "staff insert commissions" on public.broker_commissions for insert
  with check (
    public.is_super_admin()
    or (public.current_crm_user()).role in ('builder_admin', 'sales')
  );

drop policy if exists "staff write documents" on public.customer_documents;
create policy "staff write documents" on public.customer_documents for all
  using (exists (select 1 from public.leads where leads.id = customer_documents.lead_id))
  with check (exists (select 1 from public.leads where leads.id = customer_documents.lead_id));

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('brochures', 'brochures', true)
on conflict (id) do nothing;

drop policy if exists "authenticated upload documents" on storage.objects;
create policy "authenticated upload documents" on storage.objects for insert
  to authenticated
  with check (bucket_id in ('documents', 'brochures'));

drop policy if exists "authenticated update documents" on storage.objects;
create policy "authenticated update documents" on storage.objects for update
  to authenticated
  using (bucket_id in ('documents', 'brochures'));

drop policy if exists "public read marketing files" on storage.objects;
create policy "public read marketing files" on storage.objects for select
  using (bucket_id in ('documents', 'brochures'));
