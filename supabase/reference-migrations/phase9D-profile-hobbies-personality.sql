-- SyncTrA Phase 9D: optional member profile interests and temperament
-- Run once in Supabase SQL Editor before deploying the updated frontend.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS personality_type text,
  ADD COLUMN IF NOT EXISTS hobbies text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_personality_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_personality_type_check
  CHECK (personality_type IS NULL OR personality_type IN
    ('Sanguine', 'Choleric', 'Melancholic', 'Phlegmatic', 'Mixed'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_hobbies_length_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_hobbies_length_check
  CHECK (hobbies IS NULL OR char_length(hobbies) <= 180);
