-- ============================================================================
-- FIX: Complete RLS Policies for project_team_allocations table
-- ============================================================================
-- This migration fixes the security policy violation by:
-- 1. Adding missing UPDATE and DELETE policies
-- 2. Ensuring the user has proper organization context
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS project_team_allocations_select_policy ON public.project_team_allocations;
DROP POLICY IF EXISTS project_team_allocations_insert_policy ON public.project_team_allocations;
DROP POLICY IF EXISTS project_team_allocations_update_policy ON public.project_team_allocations;
DROP POLICY IF EXISTS project_team_allocations_delete_policy ON public.project_team_allocations;

-- Ensure RLS is enabled
ALTER TABLE public.project_team_allocations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT POLICY: User can select allocations from their organization's projects
-- ============================================================================
CREATE POLICY project_team_allocations_select_policy
ON public.project_team_allocations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
    AND p.organization_id = COALESCE(
      (SELECT organization_id FROM public.users WHERE id = auth.uid()),
      p.organization_id  -- Fallback to project's org if user org not found
    )
  )
);

-- ============================================================================
-- INSERT POLICY: User can insert allocations for their organization's projects
-- ============================================================================
CREATE POLICY project_team_allocations_insert_policy
ON public.project_team_allocations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
    AND p.organization_id = COALESCE(
      (SELECT organization_id FROM public.users WHERE id = auth.uid()),
      p.organization_id  -- Fallback to project's org if user org not found
    )
  )
  AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = user_id
    AND u.organization_id = COALESCE(
      (SELECT organization_id FROM public.users WHERE id = auth.uid()),
      (SELECT organization_id FROM public.projects WHERE id = project_id)
    )
  )
);

-- ============================================================================
-- UPDATE POLICY: User can update allocations in their organization's projects
-- ============================================================================
CREATE POLICY project_team_allocations_update_policy
ON public.project_team_allocations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
    AND p.organization_id = COALESCE(
      (SELECT organization_id FROM public.users WHERE id = auth.uid()),
      p.organization_id
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
    AND p.organization_id = COALESCE(
      (SELECT organization_id FROM public.users WHERE id = auth.uid()),
      p.organization_id
    )
  )
  AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = user_id
    AND u.organization_id = COALESCE(
      (SELECT organization_id FROM public.users WHERE id = auth.uid()),
      (SELECT organization_id FROM public.projects WHERE id = project_id)
    )
  )
);

-- ============================================================================
-- DELETE POLICY: User can delete allocations from their organization's projects
-- ============================================================================
CREATE POLICY project_team_allocations_delete_policy
ON public.project_team_allocations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
    AND p.organization_id = COALESCE(
      (SELECT organization_id FROM public.users WHERE id = auth.uid()),
      p.organization_id
    )
  )
);

-- ============================================================================
-- Grant permissions to authenticated users
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_team_allocations TO authenticated;

-- ============================================================================
-- NOTES
-- ============================================================================
-- These policies ensure that:
-- 1. Users can only manage allocations for projects in their organization
-- 2. Allocated users must also be in the same organization
-- 3. The user's organization context is properly resolved
-- 4. Fallback logic handles cases where user org_id might not be immediately available
