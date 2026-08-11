create extension if not exists pgcrypto with schema extensions;

create table public.days (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  timezone text not null,
  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  deleted_at timestamptz,
  unique (id, user_id)
);
create unique index days_user_local_date_active_idx
  on public.days(user_id, local_date) where deleted_at is null;
create index days_user_updated_idx on public.days(user_id, updated_at);

create table public.moments (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null,
  occurred_at timestamptz not null,
  content jsonb not null check (content ? 'kind'),
  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  deleted_at timestamptz,
  foreign key (day_id, user_id) references public.days(id, user_id) on delete cascade,
  unique (id, user_id)
);
create index moments_user_day_idx on public.moments(user_id, day_id, occurred_at);
create index moments_user_updated_idx on public.moments(user_id, updated_at);

create table public.journal_entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null,
  title text check (char_length(title) <= 240),
  body text not null default '',
  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  deleted_at timestamptz,
  foreign key (day_id, user_id) references public.days(id, user_id) on delete cascade,
  unique (id, user_id)
);
create index journal_entries_user_day_idx on public.journal_entries(user_id, day_id);

create table public.media (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null,
  moment_id uuid,
  object_key text,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  status text not null check (status in ('pending_upload', 'uploaded', 'failed', 'pending_delete')),
  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  deleted_at timestamptz,
  foreign key (day_id, user_id) references public.days(id, user_id) on delete cascade,
  foreign key (moment_id, user_id) references public.moments(id, user_id) on delete set null,
  unique (id, user_id)
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  accent text not null default 'powder',
  reflection_enabled boolean not null default true,
  reduced_motion_override text not null default 'system',
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0)
);

create table public.sync_operations (
  operation_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('upsert', 'delete')),
  result_version bigint,
  created_at timestamptz not null default now(),
  unique (user_id, operation_id)
);
create index sync_operations_user_created_idx on public.sync_operations(user_id, created_at);

create table public.sync_changes (
  change_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('upsert', 'delete')),
  version bigint not null,
  changed_at timestamptz not null default now()
);
create index sync_changes_user_cursor_idx on public.sync_changes(user_id, change_id);

alter table public.days enable row level security;
alter table public.moments enable row level security;
alter table public.journal_entries enable row level security;
alter table public.media enable row level security;
alter table public.user_preferences enable row level security;
alter table public.sync_operations enable row level security;
alter table public.sync_changes enable row level security;

create policy days_owner_all on public.days for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy moments_owner_all on public.moments for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy journals_owner_all on public.journal_entries for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy media_owner_all on public.media for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy preferences_owner_all on public.user_preferences for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sync_operations_owner_all on public.sync_operations for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sync_changes_owner_select on public.sync_changes for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.days, public.moments, public.journal_entries, public.media,
  public.user_preferences, public.sync_operations, public.sync_changes from anon;
grant select, insert, update, delete on public.days, public.moments,
  public.journal_entries, public.media, public.user_preferences, public.sync_operations to authenticated;
grant select on public.sync_changes to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('journal-media', 'journal-media', false, 26214400, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update set public = false;

create policy journal_media_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'journal-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy journal_media_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'journal-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy journal_media_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'journal-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'journal-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy journal_media_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'journal-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
