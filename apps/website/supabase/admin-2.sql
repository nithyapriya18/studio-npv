-- Studio admin, part 2: milestones, a time log and project health.
-- Run once in the Supabase SQL editor after admin.sql. Safe to run again.

alter table public.admin_projects add column if not exists summary text;
alter table public.admin_projects add column if not exists health text not null default 'On track';
alter table public.admin_projects add column if not exists budget_hours numeric;

-- Milestones on a project, each optionally carrying a payment.
create table if not exists public.admin_milestones (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.admin_projects (id) on delete cascade,
  title text not null,
  due_on date,
  amount numeric,
  invoice_id bigint references public.admin_invoices (id) on delete set null,
  done_on date,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Time worked, one row per sitting or per day.
create table if not exists public.admin_time_entries (
  id bigint generated always as identity primary key,
  project_id bigint references public.admin_projects (id) on delete set null,
  task_id bigint references public.admin_tasks (id) on delete set null,
  on_date date not null default current_date,
  hours numeric not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists admin_milestones_project_idx on public.admin_milestones (project_id);
create index if not exists admin_time_entries_date_idx on public.admin_time_entries (on_date);

do $$
declare t text;
begin
  foreach t in array array['admin_milestones', 'admin_time_entries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
