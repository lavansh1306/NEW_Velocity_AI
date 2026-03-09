-- Migration: Update team_members table schema to add missing columns
-- This adds support for email, display_name, and status fields
-- and makes user_id nullable to support pending invitations

-- First, drop the existing UNIQUE constraint that requires user_id
ALTER TABLE public.team_members
DROP CONSTRAINT IF EXISTS team_members_team_id_fkey CASCADE;

-- Add the new columns if they don't exist
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'::text;

-- Drop the old user_id NOT NULL constraint by altering the column
ALTER TABLE public.team_members
ALTER COLUMN user_id DROP NOT NULL;

-- Drop the old foreign key constraint if it exists
ALTER TABLE public.team_members
DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;

-- Create a partial unique index on (team_id, user_id) for when user_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_team_id_user_id 
ON public.team_members(team_id, user_id) 
WHERE user_id IS NOT NULL;

-- Add back the foreign key constraint
ALTER TABLE public.team_members
ADD CONSTRAINT team_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add the status CHECK constraint
ALTER TABLE public.team_members
DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('lead', 'member', 'Engineer', 'Designer', 'Product Manager', 'Engineering Manager', 'QA Engineer', 'Data Scientist', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer'));

-- Add the status CHECK constraint
ALTER TABLE public.team_members
DROP CONSTRAINT IF EXISTS team_members_status_check;

ALTER TABLE public.team_members
ADD CONSTRAINT team_members_status_check 
CHECK (status IN ('active', 'pending', 'invited'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
