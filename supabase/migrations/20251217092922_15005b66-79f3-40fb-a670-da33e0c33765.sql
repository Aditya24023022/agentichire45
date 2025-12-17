-- Add extended profile fields for personalized AI context
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS experience text,
ADD COLUMN IF NOT EXISTS career_goals text,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;