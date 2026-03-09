-- ============================================================================
-- SIMPLIFIED RLS Policies for public.task_assignments table (NO RECURSION)
-- Avoids infinite recursion by using simple authentication checks
-- ============================================================================

-- Enable RLS on task_assignments table
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS task_assignments_select_org ON public.task_assignments;
DROP POLICY IF EXISTS task_assignments_insert_org ON public.task_assignments;
DROP POLICY IF EXISTS task_assignments_update_org ON public.task_assignments;
DROP POLICY IF EXISTS task_assignments_delete_org ON public.task_assignments;

-- Simplified Policy: SELECT - Only authenticated users
CREATE POLICY task_assignments_select_org 
  ON public.task_assignments 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Simplified Policy: INSERT - Only authenticated users
CREATE POLICY task_assignments_insert_org 
  ON public.task_assignments 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Simplified Policy: UPDATE - Only authenticated users
CREATE POLICY task_assignments_update_org 
  ON public.task_assignments 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Simplified Policy: DELETE - Only authenticated users
CREATE POLICY task_assignments_delete_org 
  ON public.task_assignments 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_assignments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- NOTE: This simplified policy allows any authenticated user to perform all
-- operations on task_assignments. Organization-level filtering must be done at the
-- application level. This approach avoids circular dependencies in RLS policies.
-- ============================================================================
