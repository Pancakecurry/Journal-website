begin;
select plan(5);

insert into auth.users (id, role, email, encrypted_password)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'one@example.test', ''),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'two@example.test', '');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

insert into public.days (id, user_id, local_date, timezone, client_created_at, client_updated_at)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  '2026-08-12',
  'Asia/Kolkata',
  now(),
  now()
);

select is((select count(*)::integer from public.days), 1, 'owner can read own Day');
select throws_ok(
  $$insert into public.days (id, user_id, local_date, timezone, client_created_at, client_updated_at)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', '2026-08-12', 'UTC', now(), now())$$,
  '42501', null, 'owner cannot insert a Day for another user'
);

set local "request.jwt.claims" = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is((select count(*)::integer from public.days), 0, 'other user cannot read owner Day');
update public.days set timezone = 'UTC';
select is((select count(*)::integer from public.days where timezone = 'UTC'), 0, 'other user cannot update owner Day');
delete from public.days;
select is((select count(*)::integer from public.days), 0, 'other user cannot delete owner Day');

select * from finish();
rollback;
