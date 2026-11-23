-- SyncTrA Phase 13: add three Open Minds rooms without changing existing room data or functions.
-- Idempotent: safe to apply more than once.
insert into public.community_rooms(slug,room_name,description,icon,soundscape,is_default) values
('hinduism','Hinduism','Explore Hindu philosophy, scriptures, culture, traditions and spiritual perspectives with respect.','🕉️','hinduism',false),
('judaism','Judaism','Discuss Jewish faith, history, teachings, culture and traditions with respect.','✡️','judaism',false),
('activists','Activists','A space for social awareness, human rights, equality, environmental protection and positive action.','✊','activists',false)
on conflict(slug) do update set room_name=excluded.room_name,description=excluded.description,icon=excluded.icon,soundscape=excluded.soundscape,is_default=false,is_active=true;
