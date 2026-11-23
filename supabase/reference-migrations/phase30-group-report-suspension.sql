-- SyncTrA Phase 30 — unique group reports and automatic 60-day room suspension.
-- Apply this migration in the Supabase SQL Editor after the existing Phase 19 migration.
-- Ten distinct eligible members reporting the same room triggers a temporary suspension.
-- One account can contribute only one report per room. Accepted appeals restore access.

alter table public.community_rooms
  add column if not exists suspended_until timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text;

-- Ensure the report target type permits community rooms while retaining the existing targets.
do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.content_reports'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%target_type%'
  loop
    execute format('alter table public.content_reports drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.content_reports
  add constraint content_reports_target_type_check
  check (target_type in ('post','profile','community_message','community_room'));

-- A member may report a given room only once; retries cannot inflate the threshold.
create unique index if not exists content_reports_one_room_report_per_member
  on public.content_reports(reporter_id, target_id)
  where target_type = 'community_room';

drop policy if exists reporter_create_report on public.content_reports;
create policy reporter_create_report on public.content_reports
for insert to authenticated
with check (
  reporter_id = (select auth.uid())
  and synctra_private.is_active_member()
  and char_length(reason) between 3 and 1000
  and (
    (target_type = 'post' and exists (
      select 1 from public.posts p
      where p.id = target_id and p.status = 'published' and p.group_id is null
    ))
    or (target_type = 'profile' and exists (
      select 1 from public.profiles p where p.user_id = target_id
    ))
    or (target_type = 'community_message' and exists (
      select 1 from public.community_messages m
      where m.id = target_id and m.moderation_status = 'published'
    ))
    or (target_type = 'community_room' and exists (
      select 1 from public.community_rooms r
      join public.community_room_members m on m.room_id = r.id
      where r.id = target_id and r.is_active
        and (r.suspended_until is null or r.suspended_until <= now())
        and m.user_id = (select auth.uid())
    ))
  )
);

-- Keep suspended rooms out of room discovery and prevent joining during the suspension.
drop policy if exists community_rooms_member_read on public.community_rooms;
create policy community_rooms_member_read on public.community_rooms
for select to authenticated
using (
  is_active = true
  and (suspended_until is null or suspended_until <= now())
  and synctra_private.is_active_member()
);

create or replace function synctra_private.join_community_room(p_room_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not synctra_private.is_paid_member(auth.uid()) then
    raise exception 'An active verified SyncTrA membership is required.';
  end if;
  if not exists (
    select 1 from public.community_rooms
    where id = p_room_id and is_active
      and (suspended_until is null or suspended_until <= now())
  ) then
    raise exception 'This room is unavailable or temporarily suspended.';
  end if;
  insert into public.community_room_members(room_id,user_id)
  values(p_room_id,auth.uid()) on conflict(room_id,user_id) do nothing;
  return 'joined';
end;
$$;
revoke all on function synctra_private.join_community_room(uuid) from public, anon;
grant execute on function synctra_private.join_community_room(uuid) to authenticated;

-- Block sending even for existing members while the room is suspended.
create or replace function synctra_private.guard_suspended_room_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.community_rooms
    where id = new.room_id and suspended_until > now()
  ) then
    raise exception 'This room is temporarily suspended and cannot receive messages.';
  end if;
  return new;
end;
$$;
drop trigger if exists community_messages_suspension_guard on public.community_messages;
create trigger community_messages_suspension_guard
before insert on public.community_messages
for each row execute function synctra_private.guard_suspended_room_message();

-- Ten distinct non-dismissed reporters suspend the room for 60 days.
create or replace function synctra_private.apply_room_report_threshold()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reporter_count integer;
begin
  if new.target_type <> 'community_room' then return new; end if;

  select count(distinct reporter_id)
    into v_reporter_count
  from public.content_reports
  where target_type = 'community_room'
    and target_id = new.target_id
    and report_status <> 'dismissed';

  if v_reporter_count >= 10 then
    update public.community_rooms
       set suspended_until = now() + interval '60 days',
           suspended_at = now(),
           suspension_reason = 'Automatic temporary suspension after reports from 10 distinct members'
     where id = new.target_id
       and is_active = true
       and (suspended_until is null or suspended_until <= now());
  end if;
  return new;
end;
$$;
drop trigger if exists content_reports_room_threshold on public.content_reports;
create trigger content_reports_room_threshold
after insert on public.content_reports
for each row execute function synctra_private.apply_room_report_threshold();

-- Accepted appeals reinstate a suspended room immediately.
create or replace function synctra_private.restore_room_after_accepted_appeal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target_type text;
  v_target_id uuid;
begin
  if new.appeal_status = 'accepted'
     and old.appeal_status is distinct from new.appeal_status then
    select target_type, target_id into v_target_type, v_target_id
    from public.content_reports where id = new.report_id;

    if v_target_type = 'community_room' then
      update public.community_rooms
         set suspended_until = null,
             suspended_at = null,
             suspension_reason = null
       where id = v_target_id;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists accepted_room_appeal_restore on public.moderation_appeals;
create trigger accepted_room_appeal_restore
after update of appeal_status on public.moderation_appeals
for each row execute function synctra_private.restore_room_after_accepted_appeal();

-- Ensure a suspended room's messages are no longer visible to members.
drop policy if exists community_messages_read on public.community_messages;
create policy community_messages_read on public.community_messages
for select to authenticated
using (
  moderation_status = 'published'
  and synctra_private.is_active_member()
  and exists (
    select 1 from public.community_room_members m
    join public.community_rooms r on r.id = m.room_id
    where m.room_id = community_messages.room_id
      and m.user_id = (select auth.uid())
      and r.is_active
      and (r.suspended_until is null or r.suspended_until <= now())
  )
);

comment on column public.community_rooms.suspended_until is
  'Temporary room suspension expiry; ten distinct eligible member reports triggers a 60-day suspension. Accepted appeals clear it.';


-- Submit a room report through a validated RPC and return the resulting threshold state.
create or replace function public.synctra_submit_room_report(p_room_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public, synctra_private, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
  v_until timestamptz;
begin
  if v_uid is null or not synctra_private.is_active_member() then
    raise exception 'An active SyncTrA member account is required.';
  end if;
  if char_length(btrim(coalesce(p_reason,''))) not between 3 and 500 then
    raise exception 'Please provide a report reason between 3 and 500 characters.';
  end if;
  if not exists (
    select 1 from public.community_room_members m
    join public.community_rooms r on r.id=m.room_id
    where m.room_id=p_room_id and m.user_id=v_uid and r.is_active
      and (r.suspended_until is null or r.suspended_until <= now())
  ) then
    raise exception 'Join an active room before reporting it.';
  end if;

  begin
    insert into public.content_reports(reporter_id,target_type,target_id,reason)
    values(v_uid,'community_room',p_room_id,btrim(p_reason));
  exception when unique_violation then
    raise exception 'You have already reported this group.';
  end;

  select count(distinct reporter_id) into v_count
  from public.content_reports
  where target_type='community_room' and target_id=p_room_id
    and report_status <> 'dismissed';

  select suspended_until into v_until
  from public.community_rooms where id=p_room_id;

  return jsonb_build_object(
    'report_count',v_count,
    'suspended_until',v_until,
    'suspended',(v_until is not null and v_until > now())
  );
end;
$$;
revoke all on function public.synctra_submit_room_report(uuid,text) from public,anon;
grant execute on function public.synctra_submit_room_report(uuid,text) to authenticated;
