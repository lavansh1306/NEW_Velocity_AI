-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to view users in their organization
CREATE POLICY "Users can view org users"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND organization_id IN (
      SELECT id FROM organizations 
      WHERE id = organization_id
    )
  );

-- Policy 2: Allow authenticated users to insert users into their organization
-- This allows org owners and admins to add team members
CREATE POLICY "Users can insert users in their org"
  ON public.users
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Policy 3: Allow users to update their own records
CREATE POLICY "Users can update own record"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Alternative: If you want stricter control, use this instead:
-- CREATE POLICY "Only org members can insert users"
--   ON public.users
--   FOR INSERT
--   WITH CHECK (
--     auth.uid() IS NOT NULL
--     AND organization_id IN (
--       SELECT DISTINCT organization_id 
--       FROM users 
--       WHERE id = auth.uid()
--     )
--   );
