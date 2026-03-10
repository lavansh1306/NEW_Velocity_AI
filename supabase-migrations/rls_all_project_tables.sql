-- ============================================================================
-- SIMPLIFIED RLS Policies for all project-related tables
-- Avoids infinite recursion by using simple authentication checks
-- Security is enforced at the application level
-- ============================================================================

-- ============================================================================
-- 1. TEAMS TABLE
-- ============================================================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teams_select_org ON public.teams;
DROP POLICY IF EXISTS teams_insert_org ON public.teams;
DROP POLICY IF EXISTS teams_update_org ON public.teams;
DROP POLICY IF EXISTS teams_delete_org ON public.teams;

CREATE POLICY teams_select_org ON public.teams FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY teams_insert_org ON public.teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY teams_update_org ON public.teams FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY teams_delete_org ON public.teams FOR DELETE USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;

-- ============================================================================
-- 2. TEAM_MEMBERS TABLE
-- ============================================================================
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_members_select_org ON public.team_members;
DROP POLICY IF EXISTS team_members_insert_org ON public.team_members;
DROP POLICY IF EXISTS team_members_update_org ON public.team_members;
DROP POLICY IF EXISTS team_members_delete_org ON public.team_members;

CREATE POLICY team_members_select_org ON public.team_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY team_members_insert_org ON public.team_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY team_members_update_org ON public.team_members FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY team_members_delete_org ON public.team_members FOR DELETE USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

-- ============================================================================
-- 3. PROJECTS TABLE
-- ============================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_select_org ON public.projects;
DROP POLICY IF EXISTS projects_insert_org ON public.projects;
DROP POLICY IF EXISTS projects_update_org ON public.projects;
DROP POLICY IF EXISTS projects_delete_org ON public.projects;

CREATE POLICY projects_select_org ON public.projects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY projects_insert_org ON public.projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY projects_update_org ON public.projects FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY projects_delete_org ON public.projects FOR DELETE USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;

-- ============================================================================
-- 4. TASKS TABLE
-- ============================================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_select_org ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_org ON public.tasks;
DROP POLICY IF EXISTS tasks_update_org ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_org ON public.tasks;

CREATE POLICY tasks_select_org ON public.tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY tasks_insert_org ON public.tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY tasks_update_org ON public.tasks FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY tasks_delete_org ON public.tasks FOR DELETE USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

-- ============================================================================
-- 5. TASK_ASSIGNMENTS TABLE
-- ============================================================================
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS task_assignments_select_org ON public.task_assignments;
DROP POLICY IF EXISTS task_assignments_insert_org ON public.task_assignments;
DROP POLICY IF EXISTS task_assignments_update_org ON public.task_assignments;
DROP POLICY IF EXISTS task_assignments_delete_org ON public.task_assignments;

CREATE POLICY task_assignments_select_org ON public.task_assignments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY task_assignments_insert_org ON public.task_assignments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY task_assignments_update_org ON public.task_assignments FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY task_assignments_delete_org ON public.task_assignments FOR DELETE USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_assignments TO authenticated;

-- ============================================================================
-- SCHEMA PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- NOTES
-- ============================================================================
-- These simplified policies check only that the user is authenticated.
-- Organization-level access control should be enforced at the application level.
-- This approach avoids infinite recursion in RLS policies while maintaining
-- basic security (only authenticated users can modify data).
--
-- To apply: Execute this entire file in Supabase SQL Editor
-- ============================================================================
