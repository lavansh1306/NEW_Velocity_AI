-- Add skills column to organization_members if it doesn't exist
ALTER TABLE organization_members
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_org_members_skills ON organization_members USING GIN(skills);
