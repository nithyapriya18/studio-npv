-- Studio admin (/admin) tables. Run once in the Supabase SQL editor
-- (Project → SQL Editor → New query → paste → Run). Safe to run again.
--
-- Every table has row level security ON and NO policies, and the anon and
-- authenticated roles get no grants. So the publishable key that the public
-- site uses can't read or change anything here; only the server, holding the
-- secret key (SUPABASE_SECRET_KEY), can.

create table if not exists public.admin_clients (
  id bigint generated always as identity primary key,
  name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  city text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_leads (
  id bigint generated always as identity primary key,
  name text not null,
  company text,
  email text,
  phone text,
  source text not null default 'Other',
  stage text not null default 'New',
  value numeric,
  next_step text,
  follow_up_on date,
  notes text,
  client_id bigint references public.admin_clients (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_projects (
  id bigint generated always as identity primary key,
  client_id bigint references public.admin_clients (id) on delete set null,
  name text not null,
  kind text not null default 'Website',
  status text not null default 'Planning',
  price numeric,
  start_on date,
  due_on date,
  live_url text,
  repo_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_invoices (
  id bigint generated always as identity primary key,
  number text not null unique,
  -- An invoice can't lose its client: delete the invoice first.
  client_id bigint not null references public.admin_clients (id) on delete restrict,
  project_id bigint references public.admin_projects (id) on delete set null,
  issue_date date not null default current_date,
  due_date date,
  status text not null default 'Draft',
  items jsonb not null default '[]'::jsonb,
  tax_label text,
  tax_percent numeric not null default 0,
  notes text,
  paid_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_documents (
  id bigint generated always as identity primary key,
  title text not null,
  kind text not null default 'Deck',
  url text not null,
  client_id bigint references public.admin_clients (id) on delete set null,
  lead_id bigint references public.admin_leads (id) on delete set null,
  project_id bigint references public.admin_projects (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_tasks (
  id bigint generated always as identity primary key,
  title text not null,
  project_id bigint references public.admin_projects (id) on delete set null,
  status text not null default 'To do',
  due_on date,
  hours numeric not null default 0,
  notes text,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_notes (
  id bigint generated always as identity primary key,
  lead_id bigint references public.admin_leads (id) on delete cascade,
  client_id bigint references public.admin_clients (id) on delete cascade,
  project_id bigint references public.admin_projects (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  key text primary key,
  value text
);

create index if not exists admin_leads_stage_idx on public.admin_leads (stage);
create index if not exists admin_projects_client_idx on public.admin_projects (client_id);
create index if not exists admin_invoices_client_idx on public.admin_invoices (client_id);
create index if not exists admin_tasks_project_idx on public.admin_tasks (project_id);
create index if not exists admin_documents_client_idx on public.admin_documents (client_id);

-- Lock everything down.
do $$
declare t text;
begin
  foreach t in array array[
    'admin_clients', 'admin_leads', 'admin_projects', 'admin_invoices',
    'admin_documents', 'admin_tasks', 'admin_notes', 'admin_settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
