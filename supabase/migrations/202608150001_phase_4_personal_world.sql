-- Phase 4 remains additive. Existing Days and prior journal material are preserved.
alter table public.user_preferences
  add column paper text not null default 'clean' check (paper in ('clean','ruled','dot','grid')),
  add column notebook_cover text not null default 'canvas' check (notebook_cover in ('canvas','navy','sage','lavender','ochre')),
  add column environment_density text not null default 'standard' check (environment_density in ('minimal','standard','expressive')),
  add column memory_resurfacing_enabled boolean not null default true,
  add column memory_range_years smallint not null default 5 check (memory_range_years between 1 and 10);

create table public.keepsakes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('moment','photo','journal','day','monthly_recap','monthly_reflection','doodle')),
  source_id text not null,
  day_id uuid,
  local_date date,
  month date check (month is null or date_trunc('month', month)::date = month),
  title text not null default '' check (char_length(title) <= 160),
  preview text not null default '' check (char_length(preview) <= 280),
  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  version bigint not null default 1 check (version > 0),
  deleted_at timestamptz,
  foreign key (day_id, user_id) references public.days(id, user_id) on delete cascade,
  unique (id, user_id)
);
create unique index keepsakes_active_source_idx on public.keepsakes(user_id, source_type, source_id) where deleted_at is null;
create index keepsakes_recent_idx on public.keepsakes(user_id, client_created_at desc) where deleted_at is null;

create table public.doodles (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null,
  local_date date not null,
  title text not null default '' check (char_length(title) <= 120),
  description text not null default '' check (char_length(description) <= 500),
  canvas_width integer not null check (canvas_width between 1 and 4096),
  canvas_height integer not null check (canvas_height between 1 and 4096),
  strokes jsonb not null default '[]'::jsonb check (jsonb_typeof(strokes) = 'array'),
  preview_data_url text not null default '' check (char_length(preview_data_url) <= 800000),
  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  version bigint not null default 1 check (version > 0),
  deleted_at timestamptz,
  foreign key (day_id, user_id) references public.days(id, user_id) on delete cascade,
  unique (id, user_id)
);
create index doodles_day_idx on public.doodles(user_id, local_date) where deleted_at is null;

create table public.hidden_memories (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('item','day')),
  entity_type text not null check (entity_type in ('moment','photo','journal','day','doodle')),
  entity_id text not null,
  day_id uuid not null,
  client_created_at timestamptz not null,
  version bigint not null default 1 check (version > 0),
  deleted_at timestamptz,
  foreign key (day_id, user_id) references public.days(id, user_id) on delete cascade,
  unique (id, user_id)
);
create index hidden_memories_day_idx on public.hidden_memories(user_id, day_id) where deleted_at is null;
create unique index hidden_memories_item_idx on public.hidden_memories(user_id, scope, entity_type, entity_id) where deleted_at is null;

alter table public.keepsakes enable row level security;
alter table public.doodles enable row level security;
alter table public.hidden_memories enable row level security;

create policy keepsakes_owner_all on public.keepsakes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy doodles_owner_all on public.doodles for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy hidden_memories_owner_all on public.hidden_memories for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.keepsakes, public.doodles, public.hidden_memories from anon;
grant select, insert, update, delete on public.keepsakes, public.doodles, public.hidden_memories to authenticated;
