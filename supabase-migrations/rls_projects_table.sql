-- ============================================================================
-- SIMPLIFIED RLS Policies for projects table (NO RECURSION)
-- Avoids infinite recursion by using simple authentication checks
-- Organization-level access should be enforced at application level
-- ============================================================================

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS projects_select_org ON public.projects;
DROP POLICY IF EXISTS projects_insert_org ON public.projects;
DROP POLICY IF EXISTS projects_update_org ON public.projects;
DROP POLICY IF EXISTS projects_delete_org ON public.projects;

-- Simplified Policy: SELECT - Only authenticated users
CREATE POLICY projects_select_org 
  ON public.projects 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Simplified Policy: INSERT - Only authenticated users
CREATE POLICY projects_insert_org 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Simplified Policy: UPDATE - Only authenticated users
CREATE POLICY projects_update_org 
  ON public.projects 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Simplified Policy: DELETE - Only authenticated users
CREATE POLICY projects_delete_org 
  ON public.projects 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- NOTE: This simplified policy allows any authenticated user to perform all
-- operations on projects. Organization-level filtering must be done at the
-- application level. This approach avoids circular dependencies in RLS policies.
-- ============================================================================
DROP POLICY IF EXISTS projects_insert_org ON public.projects;
CREATE POLICY projects_insert_org_simple
  ON public.projects 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND organization_id IS NOT NULL
  );
*/
