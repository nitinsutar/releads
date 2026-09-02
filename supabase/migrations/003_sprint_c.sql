-- Sprint C: invites metadata + broker share links.

alter table public.invites
  add column if not exists name text;

alter table public.projects
  add column if not exists share_token text unique;

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  broker_id uuid references public.users (id),
  token text not null unique,
  created_at timestamptz not null default now()
);

alter table public.share_links enable row level security;

drop policy if exists "company reads share links" on public.share_links;
create policy "company reads share links" on public.share_links for select
  using (
    public.is_super_admin()
    or company_id = public.current_company_id()
  );

drop policy if exists "staff write share links" on public.share_links;
create policy "staff write share links" on public.share_links for all
  using (
    public.is_super_admin()
    or (company_id = public.current_company_id() and (public.current_crm_user()).role in ('builder_admin', 'sales', 'broker'))
  )
  with check (
    public.is_super_admin()
    or (company_id = public.current_company_id() and (public.current_crm_user()).role in ('builder_admin', 'sales', 'broker'))
  );
