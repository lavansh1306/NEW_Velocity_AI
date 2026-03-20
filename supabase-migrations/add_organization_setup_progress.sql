-- ============================================================================
-- Setup Progress Tracking for Organizations
-- Tracks which onboarding/setup steps have been completed per org
-- ============================================================================

-- Create the table
CREATE TABLE IF NOT EXISTS organization_setup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  completed_steps TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by org
CREATE INDEX IF NOT EXISTS idx_setup_progress_org
  ON organization_setup_progress(organization_id);

-- Enable RLS
ALTER TABLE organization_setup_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS setup_progress_select ON organization_setup_progress;
DROP POLICY IF EXISTS setup_progress_insert ON organization_setup_progress;
DROP POLICY IF EXISTS setup_progress_update ON organization_setup_progress;
DROP POLICY IF EXISTS setup_progress_delete ON organization_setup_progress;

-- SELECT: any authenticated user
CREATE POLICY setup_progress_select
  ON organization_setup_progress
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: any authenticated user
CREATE POLICY setup_progress_insert
  ON organization_setup_progress
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: any authenticated user
CREATE POLICY setup_progress_update
  ON organization_setup_progress
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: any authenticated user
CREATE POLICY setup_progress_delete
  ON organization_setup_progress
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_setup_progress TO authenticated;

-- Auto-create a setup progress row when a new organization is created
CREATE OR REPLACE FUNCTION create_setup_progress_for_org()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_setup_progress (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_organization_insert_setup_progress ON organizations;

CREATE TRIGGER after_organization_insert_setup_progress
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_setup_progress_for_org();
