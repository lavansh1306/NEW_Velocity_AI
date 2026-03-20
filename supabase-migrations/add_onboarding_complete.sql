-- Track whether the org owner has completed (or intentionally skipped) onboarding.
-- false = still in onboarding flow, true = has reached the complete screen.
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false;
