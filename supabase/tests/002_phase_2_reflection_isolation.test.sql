begin;
select plan(3);

insert into auth.users (id, role, email, encrypted_password)
values
  ('33333333-3333-4333-8333-333333333333', 'authenticated', 'phase2-one@example.test', ''),
  ('44444444-4444-4444-8444-444444444444', 'authenticated', 'phase2-two@example.test', '');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
insert into public.days (id, user_id, local_date, timezone, client_created_at, client_updated_at)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','33333333-3333-4333-8333-333333333333','2026-08-12','UTC',now(),now());
insert into public.reflections (id,user_id,day_id,period,answers,client_created_at,client_updated_at)
values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','33333333-3333-4333-8333-333333333333','cccccccc-cccc-4ccc-8ccc-cccccccccccc','morning','[]',now(),now());
select is((select count(*)::integer from public.reflections),1,'owner reads own reflection');

set local "request.jwt.claims" = '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}';
select is((select count(*)::integer from public.reflections),0,'other user cannot read reflection');
update public.reflections set answers='[{"questionId":"x","answer":"stolen","skipped":false}]'
where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
select is((select count(*)::integer from public.reflections where answers <> '[]'::jsonb),0,'other user cannot update reflection');

select * from finish();
rollback;
