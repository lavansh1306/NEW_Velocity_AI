-- ============================================================================
-- DIAGNOSTIC & FIX SCRIPT: Ensure user organization context
-- ============================================================================
-- This script helps diagnose and fix issues where users don't have
-- proper organization_id assignments in the users table.
--
-- RUN THIS AFTER applying fix_project_team_allocations_rls.sql
-- ============================================================================

-- ============================================================================
-- 1. DIAGNOSTIC QUERIES - Run these to identify issues
-- ============================================================================

-- Shows users without organization_id
SELECT id, email, name, organization_id 
FROM public.users 
WHERE organization_id IS NULL;

-- Shows projects without organization_id
SELECT id, name, organization_id 
FROM public.projects 
WHERE organization_id IS NULL;

-- Shows allocation attempts that would fail RLS
SELECT pta.id, pta.project_id, pta.user_id, 
       p.organization_id as project_org,
       u.organization_id as user_org,
       u2.organization_id as current_user_org
FROM public.project_team_allocations pta
LEFT JOIN public.projects p ON pta.project_id = p.id
LEFT JOIN public.users u ON pta.user_id = u.id
WHERE p.organization_id IS NULL 
   OR u.organization_id IS NULL;

-- ============================================================================
-- 2. FIX SCRIPT - Apply these to resolve issues
-- ============================================================================

-- Option A: Set organization_id for users based on their projects
-- (If a user has tasks/allocations, set their org to match)
UPDATE public.users u
SET organization_id = (
  SELECT DISTINCT p.organization_id 
  FROM public.projects p
  JOIN public.project_team_allocations pta ON p.id = pta.project_id
  WHERE pta.user_id = u.id
  LIMIT 1
)
WHERE u.organization_id IS NULL
AND EXISTS (
  SELECT 1 FROM public.project_team_allocations pta
  JOIN public.projects p ON pta.project_id = p.id
  WHERE pta.user_id = u.id
);

-- Option B: If you know the user's organization, use this to fix specific users
-- EXAMPLE: Uncomment and modify the WHERE clause with actual user email
-- UPDATE public.users 
-- SET organization_id = 'YOUR_ORG_ID_HERE'
-- WHERE email = 'user@example.com' 
-- AND organization_id IS NULL;

-- ============================================================================
-- 3. VERIFICATION QUERY - Check if fix worked
-- ============================================================================

-- Verify all users now have organization assignments where needed
SELECT 
  u.id,
  u.email,
  u.name,
  u.organization_id,
  COUNT(pta.id) as allocation_count
FROM public.users u
LEFT JOIN public.project_team_allocations pta ON u.id = pta.user_id
GROUP BY u.id, u.email, u.name, u.organization_id
HAVING COUNT(pta.id) > 0 AND u.organization_id IS NULL;

-- This should return 0 rows if fix was successful

-- ============================================================================
-- 4. TEST NEW INSERTS - Verify RLS works correctly
-- ============================================================================

-- After applying fixes, test that new allocations can be inserted
-- by running this in the Supabase SQL editor as an authenticated user:
--
-- INSERT INTO public.project_team_allocations (
--   project_id,
--   user_id,
--   allocation_percentage,
--   start_date,
--   end_date
-- ) VALUES (
--   'PROJECT_UUID_HERE',
--   'USER_UUID_HERE',
--   50,
--   CURRENT_DATE,
--   CURRENT_DATE + INTERVAL '30 days'
-- );
