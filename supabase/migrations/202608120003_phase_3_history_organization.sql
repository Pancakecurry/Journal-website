-- Phase 3 is additive: existing Days and daily records are untouched.
create table public.bookmarks (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  journal_entry_id uuid not null, client_created_at timestamptz not null,
  version bigint not null default 1 check (version > 0), deleted_at timestamptz,
  foreign key (journal_entry_id, user_id) references public.journal_entries(id, user_id) on delete cascade,
  unique (id, user_id)
);
create unique index bookmarks_active_entry_idx on public.bookmarks(user_id, journal_entry_id) where deleted_at is null;

create table public.tracker_definitions (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120), description text not null default '',
  tracker_type text not null check (tracker_type in ('yes_no','count','number','scale','duration','short_text','single_select')),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'), unit text not null default '',
  pinned boolean not null default false, archived_at timestamptz, client_created_at timestamptz not null,
  client_updated_at timestamptz not null, version bigint not null default 1 check (version > 0), deleted_at timestamptz,
  unique (id, user_id)
);
create index tracker_definitions_user_active_idx on public.tracker_definitions(user_id, archived_at) where deleted_at is null;

create table public.tracker_entries (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  tracker_id uuid not null, day_id uuid not null, local_date date not null,
  value jsonb not null, note text not null default '' check (char_length(note) <= 2000), occurred_at timestamptz not null,
  client_created_at timestamptz not null, client_updated_at timestamptz not null,
  version bigint not null default 1 check (version > 0), deleted_at timestamptz,
  foreign key (tracker_id, user_id) references public.tracker_definitions(id, user_id) on delete cascade,
  foreign key (day_id, user_id) references public.days(id, user_id) on delete cascade,
  unique (id, user_id)
);
create unique index tracker_entries_day_active_idx on public.tracker_entries(user_id, tracker_id, local_date) where deleted_at is null;
create index tracker_entries_visible_range_idx on public.tracker_entries(user_id, tracker_id, local_date);

create table public.monthly_reflections (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  month date not null check (date_trunc('month', month)::date = month), body text not null default '',
  client_created_at timestamptz not null, client_updated_at timestamptz not null,
  version bigint not null default 1 check (version > 0), deleted_at timestamptz,
  unique (id, user_id)
);
create unique index monthly_reflections_active_month_idx on public.monthly_reflections(user_id, month) where deleted_at is null;

alter table public.bookmarks enable row level security;
alter table public.tracker_definitions enable row level security;
alter table public.tracker_entries enable row level security;
alter table public.monthly_reflections enable row level security;

create policy bookmarks_owner_all on public.bookmarks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy tracker_definitions_owner_all on public.tracker_definitions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy tracker_entries_owner_all on public.tracker_entries for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy monthly_reflections_owner_all on public.monthly_reflections for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.bookmarks, public.tracker_definitions, public.tracker_entries, public.monthly_reflections from anon;
grant select, insert, update, delete on public.bookmarks, public.tracker_definitions, public.tracker_entries, public.monthly_reflections to authenticated;
