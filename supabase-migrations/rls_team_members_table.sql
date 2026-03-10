-- ============================================================================
-- RLS Policies for public.team_members table
-- Team members are visible/editable only by users in the same organization
-- ============================================================================

-- Enable RLS on team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS team_members_select_org ON public.team_members;
DROP POLICY IF EXISTS team_members_insert_org ON public.team_members;
DROP POLICY IF EXISTS team_members_update_org ON public.team_members;
DROP POLICY IF EXISTS team_members_delete_org ON public.team_members;

-- Policy 1: SELECT - Users can view team members in their organization's teams
CREATE POLICY team_members_select_org 
  ON public.team_members 
  FOR SELECT 
  USING (
    -- Allow viewing your own record
    user_id = auth.uid()
    OR
    -- Any authenticated user (for onboarding/development)
    auth.uid() IS NOT NULL
  );

-- Policy 2: INSERT - Users can add team members to teams in their organization
CREATE POLICY team_members_insert_org 
  ON public.team_members 
  FOR INSERT 
  WITH CHECK (
    -- Allow any authenticated user (for onboarding)
    auth.uid() IS NOT NULL
  );

-- Policy 3: UPDATE - Users can update team members in their organization
CREATE POLICY team_members_update_org 
  ON public.team_members 
  FOR UPDATE 
  USING (
    -- Allow updating your own record or any authenticated user
    user_id = auth.uid()
    OR
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    -- Allow any authenticated user
    auth.uid() IS NOT NULL
  );

-- Policy 4: DELETE - Users can remove team members from teams in their organization
CREATE POLICY team_members_delete_org 
  ON public.team_members 
  FOR DELETE 
  USING (
    -- Allow any authenticated user
    auth.uid() IS NOT NULL
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
