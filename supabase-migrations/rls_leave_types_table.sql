-- ============================================================================
-- SIMPLIFIED RLS Policies for public.leave_types table (NO RECURSION)
-- ============================================================================

-- Enable RLS on leave_types table
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS leave_types_select_org ON public.leave_types;
DROP POLICY IF EXISTS leave_types_insert_org ON public.leave_types;

-- Simplified Policy: SELECT - Only authenticated users
CREATE POLICY leave_types_select_org 
  ON public.leave_types 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Simplified Policy: INSERT - Only authenticated users
CREATE POLICY leave_types_insert_org 
  ON public.leave_types 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON public.leave_types TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
