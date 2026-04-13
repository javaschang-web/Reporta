-- Reporta AI Analysis Queue + Insights

-- 1) analysis_requests: user-triggered queue for Javas/OpenClaw to process
create table if not exists public.analysis_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  dataset_id uuid not null,
  from_date date not null,
  to_date date not null,
  status text not null default 'pending' check (status in ('pending','processing','done','error')),
  params jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists analysis_requests_user_id_idx on public.analysis_requests(user_id);
create index if not exists analysis_requests_status_created_at_idx on public.analysis_requests(status, created_at);

alter table public.analysis_requests enable row level security;

create policy if not exists "analysis_requests_select_own" on public.analysis_requests
for select to authenticated
using (auth.uid() = user_id);

create policy if not exists "analysis_requests_insert_own" on public.analysis_requests
for insert to authenticated
with check (auth.uid() = user_id);

-- Disallow client-side update/delete by default (processed by service role)


-- 2) dataset_insights: stored AI summaries
create table if not exists public.dataset_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  dataset_id uuid not null,
  from_date date not null,
  to_date date not null,
  model text not null,
  summary text not null,
  bullets jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dataset_insights_user_id_idx on public.dataset_insights(user_id);
create index if not exists dataset_insights_dataset_id_created_at_idx on public.dataset_insights(dataset_id, created_at desc);

alter table public.dataset_insights enable row level security;

create policy if not exists "dataset_insights_select_own" on public.dataset_insights
for select to authenticated
using (auth.uid() = user_id);

-- Disallow client-side insert/update/delete by default (written by service role)

