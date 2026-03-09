-- Create pending_team_members table for team member invitations
CREATE TABLE IF NOT EXISTS public.pending_team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  email text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'member'::text,
  invited_by uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pending_team_members_pkey PRIMARY KEY (id),
  CONSTRAINT pending_team_members_team_email_key UNIQUE (team_id, email),
  CONSTRAINT pending_team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams (id) ON DELETE CASCADE,
  CONSTRAINT pending_team_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT pending_team_members_role_check CHECK (
    (role = ANY (ARRAY['lead'::text, 'member'::text]))
  ),
  CONSTRAINT pending_team_members_status_check CHECK (
    (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text]))
  )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_pending_team_members_team_id ON public.pending_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_pending_team_members_email ON public.pending_team_members(email);
CREATE INDEX IF NOT EXISTS idx_pending_team_members_status ON public.pending_team_members(status);
