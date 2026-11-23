-- SyncTrA Phase 11 — OPEN MINDS
-- Applied to Supabase project pbhuxeuwyhmdemvtsshy during this build.
-- Audit/reference snapshot only. Do not re-run on the live project unless intentionally rebuilding.

create table if not exists public.community_rooms (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  room_name text not null, description text not null default '', icon text not null default '✦',
  soundscape text not null default 'ambient', is_default boolean not null default false,
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.community_room_members (
  room_id uuid not null references public.community_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(), last_message_at timestamptz,
  member_role text not null default 'member' check(member_role in ('member','moderator')),
  primary key(room_id,user_id)
);
create index if not exists community_room_members_user_idx on public.community_room_members(user_id,joined_at desc);
create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(), room_id uuid not null references public.community_rooms(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 1000),
  moderation_status text not null default 'published' check(moderation_status in ('published','held','removed')),
  created_at timestamptz not null default now()
);
create index if not exists community_messages_room_created_idx on public.community_messages(room_id,created_at);
create index if not exists community_messages_sender_idx on public.community_messages(sender_id,created_at desc);

alter table public.community_rooms enable row level security;
alter table public.community_room_members enable row level security;
alter table public.community_messages enable row level security;
revoke all on public.community_rooms,public.community_room_members,public.community_messages from anon;
grant select on public.community_rooms,public.community_room_members,public.community_messages to authenticated;

drop policy if exists community_rooms_member_read on public.community_rooms;
create policy community_rooms_member_read on public.community_rooms for select to authenticated
using(is_active=true and synctra_private.is_active_member());
drop policy if exists community_room_members_read on public.community_room_members;
create policy community_room_members_read on public.community_room_members for select to authenticated
using(synctra_private.is_active_member() and user_id=(select auth.uid()));
drop policy if exists community_messages_read on public.community_messages;
create policy community_messages_read on public.community_messages for select to authenticated
using(moderation_status='published' and synctra_private.is_active_member() and exists(
 select 1 from public.community_room_members m where m.room_id=community_messages.room_id and m.user_id=(select auth.uid())
));

insert into public.community_rooms(slug,room_name,description,icon,soundscape,is_default) values
('open-discussion','Open Discussion','A shared room for curious minds and respectful disagreement.','🌍','open',true),
('islam','Islam','Discuss Islamic beliefs, culture, history and perspectives respectfully.','☪️','islam',false),
('christianity','Christianity','Discuss Christian beliefs, scripture, culture and perspectives respectfully.','✝️','christianity',false),
('buddhism','Buddhism','Explore Buddhist philosophy, meditation, traditions and practice.','☸️','buddhism',false),
('taoism','Taoism','Explore Taoist philosophy, balance, nature and the Tao.','☯️','taoism',false),
('science','Science','Share evidence, discoveries, questions and scientific perspectives.','🔬','science',false),
('atheism','Atheism','Discuss non-belief, secular philosophy, reason and ethics.','🧠','atheism',false),
('satanism','Satanism','Discuss Satanist traditions, philosophy and perspectives without targeting others.','🔱','satanism',false),
('hacker-community','Hacker Community','Discuss ethical cybersecurity, programming, privacy and technology.','💻','tech',false)
on conflict(slug) do update set room_name=excluded.room_name,description=excluded.description,icon=excluded.icon,soundscape=excluded.soundscape,is_default=excluded.is_default,is_active=true;

create or replace function synctra_private.join_community_room(p_room_id uuid) returns text
language plpgsql security definer set search_path=''
as $$ begin
 if auth.uid() is null or not synctra_private.is_paid_member(auth.uid()) then raise exception 'An active verified SyncTrA membership is required.'; end if;
 if not exists(select 1 from public.community_rooms where id=p_room_id and is_active) then raise exception 'Community room not found.'; end if;
 insert into public.community_room_members(room_id,user_id) values(p_room_id,auth.uid()) on conflict(room_id,user_id) do nothing;
 return 'joined'; end $$;
create or replace function synctra_private.leave_community_room(p_room_id uuid) returns text
language plpgsql security definer set search_path=''
as $$ begin
 if auth.uid() is null or not synctra_private.is_paid_member(auth.uid()) then raise exception 'An active verified SyncTrA membership is required.'; end if;
 delete from public.community_room_members where room_id=p_room_id and user_id=auth.uid(); return 'left'; end $$;
create or replace function synctra_private.send_community_message(p_room_id uuid,p_body text) returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_body text:=btrim(coalesce(p_body,'')); v_last timestamptz; v_id uuid; v_tokens text[];
begin
 if v_uid is null or not synctra_private.is_paid_member(v_uid) then raise exception 'An active verified SyncTrA membership is required.'; end if;
 if char_length(v_body)<1 or char_length(v_body)>1000 then raise exception 'Messages must contain 1 to 1000 characters.'; end if;
 v_tokens:=regexp_split_to_array(lower(v_body),'[^a-z0-9]+');
 if v_tokens && array['fuck','shit','bitch','asshole','motherfucker','cunt']::text[] then raise exception 'Please remove profanity and keep the discussion respectful.'; end if;
 select last_message_at into v_last from public.community_room_members where room_id=p_room_id and user_id=v_uid for update;
 if not found then raise exception 'Join this room before sending a message.'; end if;
 if v_last is not null and v_last>now()-interval '15 seconds' then
  raise exception 'Slow mode: wait % seconds before sending another message.',greatest(1,ceil(extract(epoch from(v_last+interval '15 seconds'-now())))::integer);
 end if;
 insert into public.community_messages(room_id,sender_id,body) values(p_room_id,v_uid,v_body) returning id into v_id;
 update public.community_room_members set last_message_at=now() where room_id=p_room_id and user_id=v_uid; return v_id;
end $$;

revoke all on function synctra_private.join_community_room(uuid) from public,anon;
revoke all on function synctra_private.leave_community_room(uuid) from public,anon;
revoke all on function synctra_private.send_community_message(uuid,text) from public,anon;
grant usage on schema synctra_private to authenticated;
grant execute on function synctra_private.join_community_room(uuid) to authenticated;
grant execute on function synctra_private.leave_community_room(uuid) to authenticated;
grant execute on function synctra_private.send_community_message(uuid,text) to authenticated;

create or replace function public.join_community_room(p_room_id uuid) returns text language sql security invoker set search_path=''
as $$ select synctra_private.join_community_room(p_room_id); $$;
create or replace function public.leave_community_room(p_room_id uuid) returns text language sql security invoker set search_path=''
as $$ select synctra_private.leave_community_room(p_room_id); $$;
create or replace function public.send_community_message(p_room_id uuid,p_body text) returns uuid language sql security invoker set search_path=''
as $$ select synctra_private.send_community_message(p_room_id,p_body); $$;
revoke all on function public.join_community_room(uuid) from public,anon;
revoke all on function public.leave_community_room(uuid) from public,anon;
revoke all on function public.send_community_message(uuid,text) from public,anon;
grant execute on function public.join_community_room(uuid) to authenticated;
grant execute on function public.leave_community_room(uuid) to authenticated;
grant execute on function public.send_community_message(uuid,text) to authenticated;

do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_messages') then
  execute 'alter publication supabase_realtime add table public.community_messages';
 end if;
end $$;

drop policy if exists reporter_create_report on public.content_reports;
create policy reporter_create_report on public.content_reports for insert to authenticated
with check(reporter_id=(select auth.uid()) and synctra_private.is_active_member() and char_length(reason) between 3 and 1000 and (
 (target_type='post' and exists(select 1 from public.posts p where p.id=target_id and p.status='published' and p.group_id is null)) or
 (target_type='profile' and exists(select 1 from public.profiles p where p.user_id=target_id)) or
 (target_type='community_message' and exists(select 1 from public.community_messages m where m.id=target_id and m.moderation_status='published'))
));
