-- Add name column to profiles
ALTER TABLE public.profiles
ADD COLUMN name TEXT;

-- Make username nullable since we'll use name as primary
ALTER TABLE public.profiles
ALTER COLUMN username DROP NOT NULL;