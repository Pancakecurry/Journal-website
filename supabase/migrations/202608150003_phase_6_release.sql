-- Phase 6 release support remains additive and preserves every existing record.

alter table public.user_preferences add column if not exists onboarding_complete boolean not null default true;
alter table public.user_preferences alter column onboarding_complete set default false;

create or replace function public.record_private_sync_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.sync_changes(user_id, entity_type, entity_id, action, version)
  values (
    new.user_id,
    tg_argv[0],
    case when tg_argv[0] = 'preferences' then new.user_id else new.id end,
    case when new.deleted_at is null then 'upsert' else 'delete' end,
    new.version
  );
  return new;
end;
$$;

create or replace function public.record_preferences_sync_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.sync_changes(user_id, entity_type, entity_id, action, version)
  values (new.user_id, 'preferences', new.user_id, 'upsert', new.version);
  return new;
end;
$$;

drop trigger if exists days_sync_change on public.days;
create trigger days_sync_change after insert or update on public.days for each row execute function public.record_private_sync_change('day');
drop trigger if exists moments_sync_change on public.moments;
create trigger moments_sync_change after insert or update on public.moments for each row execute function public.record_private_sync_change('moment');
drop trigger if exists journal_entries_sync_change on public.journal_entries;
create trigger journal_entries_sync_change after insert or update on public.journal_entries for each row execute function public.record_private_sync_change('journal_entry');
drop trigger if exists media_sync_change on public.media;
create trigger media_sync_change after insert or update on public.media for each row execute function public.record_private_sync_change('media');
drop trigger if exists reflections_sync_change on public.reflections;
create trigger reflections_sync_change after insert or update on public.reflections for each row execute function public.record_private_sync_change('reflection');
drop trigger if exists preferences_sync_change on public.user_preferences;
create trigger preferences_sync_change after insert or update on public.user_preferences for each row execute function public.record_preferences_sync_change();
drop trigger if exists bookmarks_sync_change on public.bookmarks;
create trigger bookmarks_sync_change after insert or update on public.bookmarks for each row execute function public.record_private_sync_change('bookmark');
drop trigger if exists tracker_definitions_sync_change on public.tracker_definitions;
create trigger tracker_definitions_sync_change after insert or update on public.tracker_definitions for each row execute function public.record_private_sync_change('tracker_definition');
drop trigger if exists tracker_entries_sync_change on public.tracker_entries;
create trigger tracker_entries_sync_change after insert or update on public.tracker_entries for each row execute function public.record_private_sync_change('tracker_entry');
drop trigger if exists monthly_reflections_sync_change on public.monthly_reflections;
create trigger monthly_reflections_sync_change after insert or update on public.monthly_reflections for each row execute function public.record_private_sync_change('monthly_reflection');
drop trigger if exists keepsakes_sync_change on public.keepsakes;
create trigger keepsakes_sync_change after insert or update on public.keepsakes for each row execute function public.record_private_sync_change('keepsake');
drop trigger if exists doodles_sync_change on public.doodles;
create trigger doodles_sync_change after insert or update on public.doodles for each row execute function public.record_private_sync_change('doodle');
drop trigger if exists hidden_memories_sync_change on public.hidden_memories;
create trigger hidden_memories_sync_change after insert or update on public.hidden_memories for each row execute function public.record_private_sync_change('hidden_memory');

comment on function public.record_private_sync_change is
  'Release change-feed trigger. SECURITY DEFINER only inserts the owner and row identity supplied by an RLS-authorized table mutation.';
