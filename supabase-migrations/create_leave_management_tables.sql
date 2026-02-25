-- =============================================
-- Leave Management Schema with RLS Policies
-- Supports multi-tenant leave requests, approvals, and tracking
-- =============================================

-- DROP old tables if they exist (to avoid constraint issues)
DROP TABLE IF EXISTS employee_leave_balances CASCADE;
DROP TABLE IF EXISTS leave_history CASCADE;
DROP TABLE IF EXISTS leave_approval_chain CASCADE;
DROP TABLE IF EXISTS leave_approvers CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;

-- 1. Leave Types (Company configurable)
CREATE TABLE leave_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color_code TEXT DEFAULT '#3B82F6',
  annual_quota INTEGER DEFAULT 20,
  carry_forward_days INTEGER DEFAULT 0,
  require_approval BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, name)
);

CREATE INDEX idx_leave_types_org ON leave_types(org_id);

-- 2. Leave Requests (Employee submissions)
-- NOTE: user_id is NOT a foreign key - it's just a UUID that the app provides
-- This avoids constraint issues when users are in auth.users but we manage them separately
CREATE TABLE leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  -- Store a human-readable name at insert time to avoid joining the auth.users table
  name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'shifted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_requests_org ON leave_requests(org_id);
CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_name ON leave_requests(name);

-- 3. Leave Approvers (Manager configuration)
CREATE TABLE leave_approvers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  approver_level INTEGER DEFAULT 1,
  can_approve_types JSONB DEFAULT '[]',
  max_approval_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_leave_approvers_org ON leave_approvers(org_id);
CREATE INDEX idx_leave_approvers_user ON leave_approvers(user_id);

-- 4. Leave Approval Chain (Audit trail)
CREATE TABLE leave_approval_chain (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL,
  approval_level INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
  comment TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  UNIQUE(leave_request_id, approver_id)
);

CREATE INDEX idx_leave_approval_chain_org ON leave_approval_chain(org_id);
CREATE INDEX idx_leave_approval_chain_leave ON leave_approval_chain(leave_request_id);
CREATE INDEX idx_leave_approval_chain_approver ON leave_approval_chain(approver_id);

-- 5. Leave History (Audit log)
CREATE TABLE leave_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  leave_request_id UUID REFERENCES leave_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID,
  old_values JSONB,
  new_values JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_history_org ON leave_history(org_id);
CREATE INDEX idx_leave_history_leave ON leave_history(leave_request_id);
CREATE INDEX idx_leave_history_actor ON leave_history(actor_id);

-- 6. Employee Leave Balances (Tracking)
CREATE TABLE employee_leave_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_allocated INTEGER DEFAULT 0,
  used_days NUMERIC DEFAULT 0,
  pending_days NUMERIC DEFAULT 0,
  carry_forward_days INTEGER DEFAULT 0,
  balance NUMERIC GENERATED ALWAYS AS (total_allocated + carry_forward_days - used_days - pending_days) STORED,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id, leave_type_id, year)
);

CREATE INDEX idx_leave_balances_org ON employee_leave_balances(org_id);
CREATE INDEX idx_leave_balances_user ON employee_leave_balances(user_id);
CREATE INDEX idx_leave_balances_year ON employee_leave_balances(year);

-- =============================================
-- Enable RLS on all leave tables
-- =============================================
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_approval_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leave_balances ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies - Full Access (Application-layer enforced)
-- ✅ This allows the frontend to read/write with proper auth
-- =============================================

-- Leave Types Policies
DROP POLICY IF EXISTS "full_access_leave_types" ON leave_types;
CREATE POLICY "full_access_leave_types"
  ON leave_types FOR ALL USING (true) WITH CHECK (true);

-- Leave Requests Policies
DROP POLICY IF EXISTS "full_access_leave_requests" ON leave_requests;
CREATE POLICY "full_access_leave_requests"
  ON leave_requests FOR ALL USING (true) WITH CHECK (true);

-- Leave Approvers Policies
DROP POLICY IF EXISTS "full_access_leave_approvers" ON leave_approvers;
CREATE POLICY "full_access_leave_approvers"
  ON leave_approvers FOR ALL USING (true) WITH CHECK (true);

-- Leave Approval Chain Policies
DROP POLICY IF EXISTS "full_access_leave_approval_chain" ON leave_approval_chain;
CREATE POLICY "full_access_leave_approval_chain"
  ON leave_approval_chain FOR ALL USING (true) WITH CHECK (true);

-- Leave History Policies
DROP POLICY IF EXISTS "full_access_leave_history" ON leave_history;
CREATE POLICY "full_access_leave_history"
  ON leave_history FOR ALL USING (true) WITH CHECK (true);

-- Employee Leave Balances Policies
DROP POLICY IF EXISTS "full_access_employee_leave_balances" ON employee_leave_balances;
CREATE POLICY "full_access_employee_leave_balances"
  ON employee_leave_balances FOR ALL USING (true) WITH CHECK (true);

