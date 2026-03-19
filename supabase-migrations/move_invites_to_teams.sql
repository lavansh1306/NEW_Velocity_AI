-- ============================================================
-- MIGRATION: Move Invite System from Organizations → Teams
-- ============================================================

-- 1. Add invite columns to teams table
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS invite_code    VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_role    VARCHAR(50) DEFAULT 'employee',
  ADD COLUMN IF NOT EXISTS invite_is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS invite_use_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invite_created_by UUID,
  ADD COLUMN IF NOT EXISTS invite_link    TEXT,
  ADD COLUMN IF NOT EXISTS invite_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS description    TEXT,
  ADD COLUMN IF NOT EXISTS is_active      BOOLEAN DEFAULT true;

-- Index for fast invite lookups (only active codes)
CREATE INDEX IF NOT EXISTS idx_teams_invite_code
  ON teams(invite_code)
  WHERE invite_is_active = true;

-- 2. Remove invite columns from organizations
ALTER TABLE organizations
  DROP COLUMN IF EXISTS invite_code,
  DROP COLUMN IF EXISTS invite_role,
  DROP COLUMN IF EXISTS invite_is_active,
  DROP COLUMN IF EXISTS invite_use_count,
  DROP COLUMN IF EXISTS invite_created_by,
  DROP COLUMN IF EXISTS invite_updated_at;

-- Add created_by to organizations if missing
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- 3. Enhance team_members table
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS is_primary       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS joined_via_invite BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS joined_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Unique index: only one primary team per user
-- (wrapped in DO block to handle IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_primary_team'
  ) THEN
    CREATE UNIQUE INDEX idx_user_primary_team
      ON team_members(user_id)
      WHERE is_primary = true;
  END IF;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);

-- 4. Organization name search index (for duplicate prevention)
CREATE INDEX IF NOT EXISTS idx_organizations_name
  ON organizations(name);

-- Trigram index (requires pg_trgm extension — safe to skip if not available)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX IF NOT EXISTS idx_organizations_name_trgm
    ON organizations USING gin(name gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_trgm extension not available, skipping trigram index';
END $$;
