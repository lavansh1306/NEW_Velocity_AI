# Fix for project_team_allocations RLS Policy Violation

## Issue
When adding a team member to a project, users see the error:
```
new row violates row-level security policy for table "project_team_allocations"
```

## Root Cause
The RLS (Row Level Security) policy for the `project_team_allocations` table was:
1. Missing UPDATE and DELETE policies
2. Not properly validating user organization context
3. Not checking that allocated users belong to the same organization

## Solution Applied

### 1. New Migration File: `fix_project_team_allocations_rls.sql`
This migration:
- ✅ Adds missing UPDATE and DELETE policies
- ✅ Improves organization context validation
- ✅ Verifies both project and user organization membership
- ✅ Uses fallback logic for organization resolution

### 2. Diagnostic Script: `validate_user_organization_context.sql`
Use this to:
- Identify users/projects without organization assignments
- Fix user organization assignments
- Verify the fix works correctly

## Implementation Steps

### Step 1: Run the RLS Fix Migration
```bash
# In your Supabase project, run:
supabase db push
# or manually execute fix_project_team_allocations_rls.sql
```

### Step 2: Verify User Organization Context
Run the diagnostic queries in `validate_user_organization_context.sql`:

```sql
-- Check for issues
SELECT id, email, name, organization_id 
FROM public.users 
WHERE organization_id IS NULL;

SELECT id, name, organization_id 
FROM public.projects 
WHERE organization_id IS NULL;
```

If there are null values, run the fix:
```sql
-- Fix user organization assignments
UPDATE public.users u
SET organization_id = (
  SELECT DISTINCT p.organization_id 
  FROM public.projects p
  JOIN public.project_team_allocations pta ON p.id = pta.project_id
  WHERE pta.user_id = u.id
  LIMIT 1
)
WHERE u.organization_id IS NULL
AND EXISTS (
  SELECT 1 FROM public.project_team_allocations pta
  JOIN public.projects p ON pta.project_id = p.id
  WHERE pta.user_id = u.id
);
```

### Step 3: Test in Your Application
1. Open a project page
2. Click "Add Team Member"
3. Select a team member and allocation details
4. Click "Add Member"
5. Verify it succeeds without the RLS error

## Security Model Explained

The new RLS policies ensure:
- Users can only manage allocations for projects in **their organization**
- Only users from the **same organization** can be allocated to projects
- Organization membership is properly verified before any DML operation
- Fallback logic handles edge cases in organization context resolution

## Technical Details

### RLS Policy Logic
```
For INSERT:
  ✓ Project must belong to user's organization
  ✓ Allocated user must belong to same organization
  ✓ User organization is resolved from auth context

For SELECT/UPDATE/DELETE:
  ✓ Project must belong to user's organization
  ✓ Same fallback logic for organization resolution
```

## Troubleshooting

If you still see the error after applying fixes:

1. **Check organization_id in users table:**
   - Ensure authenticated user has organization_id set
   - Ensure project has organization_id set
   - They must match

2. **Verify the migration was applied:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'project_team_allocations';
   ```
   Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)

3. **Check project organization:**
   ```sql
   SELECT id, name, organization_id FROM projects WHERE id = 'YOUR_PROJECT_ID';
   ```

4. **Run diagnostics script:**
   Use `validate_user_organization_context.sql` queries to identify exact issues

## Files Changed
- ✅ `supabase-migrations/fix_project_team_allocations_rls.sql` - New RLS policies
- ✅ `supabase-migrations/validate_user_organization_context.sql` - Diagnostic script
