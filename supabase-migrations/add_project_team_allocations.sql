-- =============================================
-- CLEANUP: Drop existing objects if they exist
-- =============================================

DROP VIEW IF EXISTS public.vw_project_team_members CASCADE;
DROP TRIGGER IF EXISTS tr_update_project_allocated_members ON public.project_team_allocations;
DROP FUNCTION IF EXISTS public.update_project_allocated_members();
DROP TABLE IF EXISTS public.project_team_allocations CASCADE;

-- =============================================
-- PROJECT TABLE ENHANCEMENT QUERIES
-- =============================================

-- 1. Add allocated_team_members column to projects table (if not exists)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS allocated_team_members uuid[] DEFAULT ARRAY[]::uuid[],
ADD COLUMN IF NOT EXISTS allocated_members_data JSONB DEFAULT '[]'::jsonb;

-- =============================================
-- 2. Create project_team_allocations table
-- =============================================

CREATE TABLE public.project_team_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  allocated_hours numeric DEFAULT 0,
  start_date date,
  end_date date,
  allocation_percentage integer DEFAULT 100,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT project_team_allocations_pkey PRIMARY KEY (id),
  CONSTRAINT project_team_allocations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT project_team_allocations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_project_user UNIQUE(project_id, user_id)
);

-- Create indexes
CREATE INDEX idx_project_team_allocations_project_id 
  ON public.project_team_allocations(project_id);
CREATE INDEX idx_project_team_allocations_user_id 
  ON public.project_team_allocations(user_id);

-- =============================================
-- 3. Create VIEW for project team members
-- =============================================

CREATE OR REPLACE VIEW public.vw_project_team_members AS
SELECT 
  pta.id,
  pta.project_id,
  pta.user_id,
  u.name,
  u.email,
  pta.allocated_hours,
  pta.start_date,
  pta.end_date,
  pta.allocation_percentage,
  pta.created_at
FROM public.project_team_allocations pta
JOIN public.users u ON pta.user_id = u.id;

-- =============================================
-- 4. Create function to update allocated members array
-- =============================================

CREATE OR REPLACE FUNCTION public.update_project_allocated_members()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects
    SET allocated_team_members = array_append(
      COALESCE(allocated_team_members, ARRAY[]::uuid[]),
      NEW.user_id
    )
    WHERE id = NEW.project_id
    AND NOT (allocated_team_members @> ARRAY[NEW.user_id]);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects
    SET allocated_team_members = array_remove(allocated_team_members, OLD.user_id)
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS tr_update_project_allocated_members ON public.project_team_allocations;

CREATE TRIGGER tr_update_project_allocated_members
AFTER INSERT OR DELETE ON public.project_team_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_project_allocated_members();

-- =============================================
-- 5. Enable RLS and create policies
-- =============================================

ALTER TABLE public.project_team_allocations ENABLE ROW LEVEL SECURITY;

-- SELECT policy
DROP POLICY IF EXISTS project_team_allocations_select_policy ON public.project_team_allocations;

CREATE POLICY project_team_allocations_select_policy
ON public.project_team_allocations
FOR SELECT
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE organization_id = (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid()
    )
  )
);

-- INSERT policy
DROP POLICY IF EXISTS project_team_allocations_insert_policy ON public.project_team_allocations;

CREATE POLICY project_team_allocations_insert_policy
ON public.project_team_allocations
FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM public.projects p
    WHERE p.organization_id = (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid()
    )
  )
);
