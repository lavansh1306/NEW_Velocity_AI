-- Migration: Ensure leave_history table exists and leave_requests has `name`
-- Safe, idempotent statements for running in Supabase SQL editor

BEGIN;

-- Create leave_history if it does not exist
CREATE TABLE IF NOT EXISTS public.leave_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id uuid NULL,
  leave_request_id bigint NULL,
  event_type text NULL,
  actor_id uuid NULL,
  old_values jsonb NULL,
  new_values jsonb NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure an index exists on leave_request_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_leave_history_leave_request_id ON public.leave_history(leave_request_id);

-- Ensure `name` column exists on leave_requests (non-destructive)
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS name text;

-- Add index to speed lookups by name
CREATE INDEX IF NOT EXISTS idx_leave_requests_name ON public.leave_requests(name);

COMMIT;

-- Notes:
-- 1) This script is safe to run repeatedly in Supabase SQL editor.
-- 2) Columns are nullable to avoid backfill/compatibility issues.
-- 3) After running, re-run any failing inserts that depended on `name`.
