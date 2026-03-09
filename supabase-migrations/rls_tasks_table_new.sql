-- ============================================================================
-- SIMPLIFIED RLS Policies for public.tasks table (NO RECURSION)
-- Avoids infinite recursion by using simple authentication checks
-- ============================================================================

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS tasks_select_org ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_org ON public.tasks;
DROP POLICY IF EXISTS tasks_update_org ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_org ON public.tasks;

-- Simplified Policy: SELECT - Only authenticated users
CREATE POLICY tasks_select_org 
  ON public.tasks 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Simplified Policy: INSERT - Only authenticated users
CREATE POLICY tasks_insert_org 
  ON public.tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Simplified Policy: UPDATE - Only authenticated users
CREATE POLICY tasks_update_org 
  ON public.tasks 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Simplified Policy: DELETE - Only authenticated users
CREATE POLICY tasks_delete_org 
  ON public.tasks 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- NOTE: This simplified policy allows any authenticated user to perform all
-- operations on tasks. Organization-level filtering must be done at the
-- application level. This approach avoids circular dependencies in RLS policies.
-- ============================================================================
