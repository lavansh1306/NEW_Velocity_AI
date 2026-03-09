-- Create team_members table for team membership
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid,
  email text,
  display_name text,
  role text NULL DEFAULT 'member'::text,
  status text DEFAULT 'active'::text CHECK (status IN ('active', 'pending', 'invited')),
  CONSTRAINT team_members_pkey PRIMARY KEY (id),
  CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id),
  CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams (id) ON DELETE CASCADE,
  CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT team_members_role_check CHECK (
    role IN ('lead', 'member', 'Engineer', 'Designer', 'Product Manager', 'Engineering Manager', 'QA Engineer', 'Data Scientist', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer')
  )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
