-- ============================================================================
-- SIMPLIFIED RLS Policies for public.leave_requests table (NO RECURSION)
-- ============================================================================

-- Enable RLS on leave_requests table
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS leave_requests_select_all ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_insert_all ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_update_all ON public.leave_requests;

-- Simplified Policy: SELECT - Only authenticated users
CREATE POLICY leave_requests_select_all 
  ON public.leave_requests 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Simplified Policy: INSERT - Only authenticated users
CREATE POLICY leave_requests_insert_all 
  ON public.leave_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Simplified Policy: UPDATE - Only authenticated users (for Approval/Rejection)
CREATE POLICY leave_requests_update_all 
  ON public.leave_requests 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.leave_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
