alter table public.media
  add column if not exists width integer not null default 1 check (width > 0),
  add column if not exists height integer not null default 1 check (height > 0),
  add column if not exists caption text not null default '' check (char_length(caption) <= 2000),
  add column if not exists upload_attempts integer not null default 0 check (upload_attempts >= 0),
  add column if not exists last_error text;

create table public.reflections (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null,
  period text not null check (period in ('morning', 'evening')),
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array'),
  current_question integer not null default 0 check (current_question >= 0),
  completed_at timestamptz,
  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  deleted_at timestamptz,
  foreign key (day_id, user_id) references public.days(id, user_id) on delete cascade,
  unique (id, user_id)
);

create unique index reflections_user_day_period_active_idx
  on public.reflections(user_id, day_id, period) where deleted_at is null;
create index reflections_user_updated_idx on public.reflections(user_id, updated_at);

alter table public.reflections enable row level security;
create policy reflections_owner_all on public.reflections for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.reflections from anon;
grant select, insert, update, delete on public.reflections to authenticated;
