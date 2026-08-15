begin;
select plan(5);
select has_function('public', 'record_private_sync_change', 'release sync change function exists');
select has_trigger('public', 'days', 'days_sync_change', 'Day changes enter the pull feed');
select has_trigger('public', 'doodles', 'doodles_sync_change', 'Doodle changes enter the pull feed');
select policies_are('public', 'sync_changes', array['sync_changes_owner_select'], 'change feed remains owner-readable only');
select policies_are('public', 'user_preferences', array['preferences_owner_all'], 'release preferences remain owner isolated');
select * from finish();
rollback;
