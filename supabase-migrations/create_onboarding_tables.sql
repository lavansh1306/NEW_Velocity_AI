-- =============================================
-- Onboarding Tables for Velocity AI
-- Adds: organization_settings, organization_holidays, org_invites
-- =============================================

-- 1. Organization Settings — work schedule & capacity config per org
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  work_hours_per_week INTEGER NOT NULL DEFAULT 40,
  work_days_per_week INTEGER NOT NULL DEFAULT 5,
  week_start_day TEXT NOT NULL DEFAULT 'monday' CHECK (week_start_day IN ('sunday', 'monday')),
  fiscal_year_start TEXT NOT NULL DEFAULT 'January' CHECK (fiscal_year_start IN ('January', 'April', 'July', 'October')),
  target_utilization INTEGER NOT NULL DEFAULT 85,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id)
);

CREATE INDEX IF NOT EXISTS idx_org_settings_org ON organization_settings(org_id);

-- 2. Organization Holidays — company-wide holidays per org
CREATE TABLE IF NOT EXISTS organization_holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  country_template TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, date)
);

CREATE INDEX IF NOT EXISTS idx_org_holidays_org ON organization_holidays(org_id);

-- 3. Org Invites — invite codes for joining an org
CREATE TABLE IF NOT EXISTS org_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID,                        -- auth.users(id) who created the invite
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('manager', 'employee')),
  max_uses INTEGER DEFAULT NULL,          -- NULL = unlimited
  use_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT NULL,    -- NULL = never expires
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_code ON org_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_org_invites_org ON org_invites(org_id);

-- 4. Pending team member invites (added during onboarding before users join)
CREATE TABLE IF NOT EXISTS pending_member_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'employee',
  invited_by UUID,                        -- auth.users(id) who invited
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, email)
);

CREATE INDEX IF NOT EXISTS idx_pending_invites_org ON pending_member_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON pending_member_invites(email);
