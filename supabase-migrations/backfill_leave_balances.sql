-- Backfill leave types and balances for existing organizations and employees.
-- Safe to run multiple times (idempotent).
-- Run this once after deploying the auto-provisioning code.

-- Step 1: Insert default leave types for orgs that don't have any yet
INSERT INTO leave_types (organization_id, name, annual_quota)
SELECT o.id, lt.name, lt.annual_quota
FROM organizations o
CROSS JOIN (
  VALUES
    ('Annual Leave', 20),
    ('Sick Leave', 10),
    ('Personal Leave', 5)
) AS lt(name, annual_quota)
WHERE NOT EXISTS (
  SELECT 1 FROM leave_types
  WHERE leave_types.organization_id = o.id
    AND leave_types.name = lt.name
);

-- Step 2: Insert leave balances for all employees who don't have them for this year
INSERT INTO employee_leave_balances (organization_id, user_id, leave_type_id, year, total_allocated, used_days, pending_days)
SELECT
  u.organization_id,
  u.id,
  lt.id,
  EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  lt.annual_quota,
  0,
  0
FROM users u
JOIN leave_types lt ON lt.organization_id = u.organization_id
WHERE u.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM employee_leave_balances elb
    WHERE elb.user_id = u.id
      AND elb.leave_type_id = lt.id
      AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)::integer
  );
