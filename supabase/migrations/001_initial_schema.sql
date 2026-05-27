create extension if not exists pgcrypto;

create table public.roles (
  code text primary key check (code in ('super_admin', 'builder_admin', 'sales', 'broker', 'customer')),
  label text not null
);

insert into public.roles (code, label) values
  ('super_admin', 'Super Admin'),
  ('builder_admin', 'Builder Admin'),
  ('sales', 'Sales Executive'),
  ('broker', 'Channel Partner'),
  ('customer', 'Customer');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  email text not null,
  phone text not null,
  active boolean not null default true,
  plan text not null default 'Trial',
  payment_status text not null default 'Trial' check (payment_status in ('Active', 'Trial', 'Pending')),
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete cascade,
  role text not null references public.roles (code),
  name text not null,
  email text not null unique,
  phone text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint tenant_role_company check (role = 'super_admin' or company_id is not null)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  city text not null,
  location text not null,
  status text not null default 'Active' check (status in ('Planning', 'Active', 'Completed')),
  brochure_url text,
  units integer not null default 0,
  available_units integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  unit_number text not null,
  type text not null,
  price text not null,
  status text not null default 'Available' check (status in ('Available', 'On Hold', 'Booked')),
  unique (project_id, unit_number)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null unique default ('LD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  company_id uuid not null references public.companies (id) on delete cascade,
  customer_id uuid references public.users (id),
  customer_name text not null,
  phone text not null,
  email text not null,
  project_id uuid not null references public.projects (id),
  unit_id uuid references public.units (id),
  source text not null,
  created_by uuid not null references public.users (id),
  assigned_to uuid references public.users (id),
  broker_id uuid references public.users (id),
  priority text not null default 'Warm' check (priority in ('Hot', 'Warm', 'Cold')),
  status text not null default 'New Lead' check (status in ('New Lead', 'Assigned', 'Contacted', 'Interested', 'Site Visit Scheduled', 'Site Visit Done', 'Negotiation', 'Booking Pending', 'Booked / Closed', 'Lost')),
  followup_date date,
  last_contacted_date date,
  site_visit_date date,
  budget_range text,
  requirement text check (requirement in ('1BHK', '2BHK', '3BHK', 'Jodi flat', 'Commercial')),
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid not null references public.users (id),
  note text not null,
  created_at timestamptz not null default now()
);

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  actor_id uuid not null references public.users (id),
  type text not null,
  details text not null,
  created_at timestamptz not null default now()
);

create table public.followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  assigned_to uuid references public.users (id),
  due_date date not null,
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.site_visits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Done', 'Cancelled')),
  notes text
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  unit_id uuid references public.units (id),
  amount numeric(14, 2),
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Cancelled')),
  booked_at timestamptz
);

create table public.broker_commissions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  broker_id uuid not null references public.users (id),
  amount numeric(14, 2),
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Paid'))
);

create table public.customer_documents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  customer_id uuid not null references public.users (id),
  document_type text not null,
  storage_path text not null,
  status text not null default 'Uploaded',
  created_at timestamptz not null default now()
);

create index leads_company_status_idx on public.leads (company_id, status);
create index leads_assignment_idx on public.leads (assigned_to, followup_date);
create index leads_broker_idx on public.leads (broker_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at before update on public.leads
for each row execute function public.set_updated_at();

create or replace function public.current_crm_user()
returns public.users language sql stable security definer set search_path = public as $$
  select * from public.users where auth_id = auth.uid() and active = true limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'super_admin' from public.users where auth_id = auth.uid() and active = true), false);
$$;

create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.users where auth_id = auth.uid() and active = true limit 1;
$$;

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.units enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_activities enable row level security;
alter table public.followups enable row level security;
alter table public.site_visits enable row level security;
alter table public.bookings enable row level security;
alter table public.broker_commissions enable row level security;
alter table public.customer_documents enable row level security;

create policy "super admin manages companies" on public.companies for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "company members view company" on public.companies for select using (id = public.current_company_id());

create policy "super admin manages users" on public.users for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "company admins manage users" on public.users for all
  using (company_id = public.current_company_id() and (public.current_crm_user()).role = 'builder_admin')
  with check (company_id = public.current_company_id() and (public.current_crm_user()).role = 'builder_admin');
create policy "users view self" on public.users for select using (auth_id = auth.uid());
create policy "staff view company contacts" on public.users for select using (
  company_id = public.current_company_id() and (public.current_crm_user()).role in ('builder_admin', 'sales', 'broker')
);
create policy "customer views assigned contacts" on public.users for select using (
  (public.current_crm_user()).role = 'customer'
  and exists (
    select 1 from public.leads
    where leads.customer_id = (public.current_crm_user()).id
      and (leads.assigned_to = users.id or leads.broker_id = users.id)
  )
);

create policy "staff projects visible" on public.projects for select using (
  public.is_super_admin() or (company_id = public.current_company_id() and (public.current_crm_user()).role in ('builder_admin', 'sales', 'broker'))
);
create policy "customer interested projects visible" on public.projects for select using (
  (public.current_crm_user()).role = 'customer'
  and exists (select 1 from public.leads where leads.customer_id = (public.current_crm_user()).id and leads.project_id = projects.id)
);
create policy "builder manages projects" on public.projects for all
  using (company_id = public.current_company_id() and (public.current_crm_user()).role = 'builder_admin')
  with check (company_id = public.current_company_id() and (public.current_crm_user()).role = 'builder_admin');
create policy "staff units visible" on public.units for select using (
  public.is_super_admin() or (company_id = public.current_company_id() and (public.current_crm_user()).role in ('builder_admin', 'sales', 'broker'))
);
create policy "customer interested units visible" on public.units for select using (
  (public.current_crm_user()).role = 'customer'
  and exists (select 1 from public.leads where leads.customer_id = (public.current_crm_user()).id and leads.unit_id = units.id)
);
create policy "builder manages units" on public.units for all
  using (company_id = public.current_company_id() and (public.current_crm_user()).role = 'builder_admin')
  with check (company_id = public.current_company_id() and (public.current_crm_user()).role = 'builder_admin');

create policy "role scoped lead viewing" on public.leads for select using (
  public.is_super_admin()
  or (company_id = public.current_company_id() and (public.current_crm_user()).role = 'builder_admin')
  or (assigned_to = (public.current_crm_user()).id and (public.current_crm_user()).role = 'sales')
  or (created_by = (public.current_crm_user()).id and (public.current_crm_user()).role = 'sales')
  or ((broker_id = (public.current_crm_user()).id or created_by = (public.current_crm_user()).id) and (public.current_crm_user()).role = 'broker')
  or (customer_id = (public.current_crm_user()).id and (public.current_crm_user()).role = 'customer')
);
create policy "staff creates leads" on public.leads for insert with check (
  company_id = public.current_company_id()
  and created_by = (public.current_crm_user()).id
  and (public.current_crm_user()).role in ('builder_admin', 'sales', 'broker')
);
create policy "admins update company leads" on public.leads for update
  using (public.is_super_admin() or (company_id = public.current_company_id() and (public.current_crm_user()).role = 'builder_admin'));
create policy "sales update assigned leads" on public.leads for update
  using ((public.current_crm_user()).role = 'sales' and (assigned_to = (public.current_crm_user()).id or created_by = (public.current_crm_user()).id));

create policy "notes follow visible leads" on public.lead_notes for select using (
  exists (select 1 from public.leads where leads.id = lead_notes.lead_id)
);
create policy "participants add notes" on public.lead_notes for insert with check (
  author_id = (public.current_crm_user()).id and exists (select 1 from public.leads where leads.id = lead_notes.lead_id)
);
create policy "activities follow visible leads" on public.lead_activities for select using (
  exists (select 1 from public.leads where leads.id = lead_activities.lead_id)
);

create policy "followups visible with lead" on public.followups for select using (exists (select 1 from public.leads where leads.id = followups.lead_id));
create policy "visits visible with lead" on public.site_visits for select using (exists (select 1 from public.leads where leads.id = site_visits.lead_id));
create policy "bookings visible with lead" on public.bookings for select using (exists (select 1 from public.leads where leads.id = bookings.lead_id));
create policy "broker sees commission" on public.broker_commissions for select using (public.is_super_admin() or broker_id = (public.current_crm_user()).id or (public.current_crm_user()).role = 'builder_admin');
create policy "customer sees documents" on public.customer_documents for select using (public.is_super_admin() or customer_id = (public.current_crm_user()).id or (public.current_crm_user()).role = 'builder_admin');

create policy "super manages projects" on public.projects for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super manages units" on public.units for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super creates leads" on public.leads for insert with check (public.is_super_admin());
create policy "super manages notes" on public.lead_notes for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super manages activities" on public.lead_activities for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super manages followups" on public.followups for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super manages visits" on public.site_visits for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super manages bookings" on public.bookings for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super manages commissions" on public.broker_commissions for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super manages documents" on public.customer_documents for all using (public.is_super_admin()) with check (public.is_super_admin());
