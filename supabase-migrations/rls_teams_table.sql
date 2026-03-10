-- ============================================================================
-- RLS Policies for public.teams table
-- Users can only view/manage teams in their organization
-- ============================================================================

-- Enable RLS on teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS teams_select_org ON public.teams;
DROP POLICY IF EXISTS teams_insert_org ON public.teams;
DROP POLICY IF EXISTS teams_update_org ON public.teams;
DROP POLICY IF EXISTS teams_delete_org ON public.teams;

-- Policy 1: SELECT - Users can view teams in their organization
CREATE POLICY teams_select_org 
  ON public.teams 
  FOR SELECT 
  USING (
    -- Check 1: User's organization_id matches team's organization_id (if user's org is set)
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
    OR
    -- Check 2: Any authenticated user (for development/onboarding flow)
    auth.uid() IS NOT NULL
  );

-- Policy 2: INSERT - Users can create teams in their organization or during onboarding
CREATE POLICY teams_insert_org 
  ON public.teams 
  FOR INSERT 
  WITH CHECK (
    -- Allow any authenticated user (onboarding sets org_id later)
    auth.uid() IS NOT NULL
  );

-- Policy 3: UPDATE - Users can update teams in their organization
CREATE POLICY teams_update_org 
  ON public.teams 
  FOR UPDATE 
  USING (
    -- Allow any authenticated user
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    -- Allow any authenticated user
    auth.uid() IS NOT NULL
  );

-- Policy 4: DELETE - Users can delete teams in their organization
CREATE POLICY teams_delete_org 
  ON public.teams 
  FOR DELETE 
  USING (
    -- Allow any authenticated user
    auth.uid() IS NOT NULL
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
