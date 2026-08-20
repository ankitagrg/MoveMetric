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

-- Points at an object in the capture-videos storage bucket rather than
-- storing a URL directly — the bucket is private, so any usable URL has to
-- be a short-lived signed URL generated on demand (see useMetrics.js's
-- getVideoUrl), not something safe to persist as a permanent link.
alter table public.metrics add column if not exists video_path text;

-- Private bucket: capture videos are per-client movement footage, not
-- public content. `on conflict do nothing` makes this safe to re-run.
insert into storage.buckets (id, name, public)
values ('capture-videos', 'capture-videos', false)
on conflict (id) do nothing;

-- Objects are uploaded to `{trainer_id}/{client_id}/{uuid}.webm` — these
-- three policies key off the first path segment being the uploader's own
-- auth uid, so a trainer can only ever read/write/delete videos under their
-- own folder, the same isolation the clients/metrics RLS policies give.
create policy "Trainers upload their own capture videos"
  on storage.objects for insert
  with check (
    bucket_id = 'capture-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Trainers view their own capture videos"
  on storage.objects for select
  using (
    bucket_id = 'capture-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Trainers delete their own capture videos"
  on storage.objects for delete
  using (
    bucket_id = 'capture-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Without this, PostgREST can keep serving from its cached schema and
-- return "Could not find the table/column in the schema cache" right after
-- this migration runs, even though it succeeded — see the goals-table
-- migration for exactly this happening. Forcing a reload here means the
-- app can be tried immediately after running this script, not after a
-- confusing extra troubleshooting round.
NOTIFY pgrst, 'reload schema';
