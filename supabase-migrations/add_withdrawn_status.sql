-- Add 'withdrawn' to the leave_requests status CHECK constraint
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_status_check;
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_status_check
  CHECK (status = ANY (ARRAY['pending', 'approved', 'rejected', 'withdrawn']));
