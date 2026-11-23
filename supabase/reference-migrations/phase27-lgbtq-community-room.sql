-- Phase 27: LGBTQ+ Open Minds room.
-- Run once in the Supabase SQL editor. Adds the room only if no room with this slug exists.
-- Check the column list against your community_rooms table before running.
insert into public.community_rooms (slug, room_name, description, icon, soundscape, is_default, is_active)
select 'lgbtq', 'LGBTQ+', 'Identity, equality, respect and self-acceptance. Share experiences and perspectives safely.', '🏳️‍🌈', 'forest', false, true
where not exists (select 1 from public.community_rooms where slug = 'lgbtq');
