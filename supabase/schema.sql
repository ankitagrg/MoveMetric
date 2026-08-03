-- MoveMetric initial schema
-- Trainers are Supabase auth users. Each trainer manages their own clients
-- and logs movement metrics (measurements/assessments) against them over time.

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create index clients_trainer_id_idx on public.clients(trainer_id);

alter table public.clients enable row level security;

create policy "Trainers manage their own clients"
  on public.clients
  for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create table public.metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  trainer_id uuid not null references auth.users(id) on delete cascade,
  metric_name text not null,
  value numeric not null,
  unit text,
  recorded_at timestamptz not null default now(),
  notes text
);

create index metrics_client_id_idx on public.metrics(client_id);
create index metrics_trainer_id_idx on public.metrics(trainer_id);

alter table public.metrics enable row level security;

create policy "Trainers manage metrics for their own clients"
  on public.metrics
  for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);
