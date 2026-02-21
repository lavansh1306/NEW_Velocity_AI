# Debugging "Auth Error" - Step by Step Guide

## The Error You're Seeing
"Your session has expired. Please log in again." OR "Organization not found"

This means `currentOrgId` is **not being set** when the component loads.

---

## Step 1: Check Browser Console (F12)

1. **Open DevTools**: Press `F12`
2. **Go to Console tab**
3. **Refresh the page** and immediately look for `[LeaveManagement]` logs
4. **Screenshot or note what you see** - it will tell us exactly where it fails

**Expected logs should show:**
```
[LeaveManagement] Starting fetchAllData, user: your-email@company.com
[LeaveManagement] Fetching user record for: your-email@company.com
[LeaveManagement] User fetch result: { userData: {...}, userError: null }
[LeaveManagement] Got orgId from user table: uuid-here
[LeaveManagement] Setting currentOrgId to: uuid-here
```

---

## Step 2: Verify Data in Supabase

Go to **Supabase Dashboard** → **SQL Editor** and run these queries:

### Query 1: Check if your user exists
```sql
SELECT id, email, name, organization_id 
FROM public.users 
WHERE email = '<your-email-here>';
```

**If this returns nothing**: Your user doesn't exist in the system!  
→ See "Solution A" below

**If this returns a row but organization_id is NULL**: Your user is not linked to an org!  
→ See "Solution B" below

**If this returns a row with organization_id**: Good! Move to Step 3

---

### Query 2: Check if your organization exists
```sql
SELECT id, name, slug 
FROM public.organizations 
LIMIT 5;
```

**Note the organization ID** - you'll need it for the next step.

---

### Query 3: Check if jira_issues exist for your org
```sql
SELECT DISTINCT org_id 
FROM public.jira_issues 
LIMIT 5;
```

If this returns no results, there's no data for any org.

---

## Step 3: Check leave_requests table

```sql
SELECT * FROM public.leave_requests LIMIT 5;
```

This should show any existing leave requests (if any).

```sql
-- Check RLS policies are enabled
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'leave_requests';
```

Should show policies like `full_access_leave_requests`.

---

## Solutions

### Solution A: User doesn't exist
Your user is not in the `public.users` table. You need to add them.

**Option 1: Add via SQL (if you know your user UUID)**
```sql
INSERT INTO public.users (
  id, 
  organization_id, 
  email, 
  name, 
  role
)
VALUES (
  'your-uuid-here',  -- Get from auth.users table
  'org-uuid-here',   -- From organizations table
  'your-email@company.com',
  'Your Name',
  'employee'
);
```

**Option 2: Check if user is in auth.users but not public.users**
```sql
SELECT id, email FROM auth.users LIMIT 5;
```

If your user is here but not in public.users, you need to sync them.

---

### Solution B: User's organization_id is NULL
Update the user record to point to an organization:

```sql
UPDATE public.users 
SET organization_id = 'org-uuid-from-step-2'
WHERE email = 'your-email@company.com';
```

---

### Solution C: No data exists
If you have no users, orgs, or JIRA issues, the system can't determine your org.

**Quick fix:**
```sql
-- Check what organizations exist
SELECT id, name FROM public.organizations;

-- If none exist, create one
INSERT INTO public.organizations (name, slug) 
VALUES ('My Organization', 'my-org');

-- Insert your user
INSERT INTO public.users (id, organization_id, email, name, role)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM organizations LIMIT 1),
  'your-email@company.com',
  'Your Name',
  'employee'
);
```

---

## Step 4: Test Again

1. **Close and reopen** the Leave Management page
2. **Open Console (F12)** and watch for the logs
3. You should now see it sets currentOrgId successfully
4. Try submitting a leave request

---

## Console Logs to Copy

**If you get an error, copy the console logs and provide them:**
- Search for `[LeaveManagement]` in console
- Right-click → Copy all logs
- Send them to your admin/support

---

## Troubleshooting Checklist

- [ ] User exists in `public.users` table
- [ ] User has a valid `organization_id` that exists in `organizations` table
- [ ] `leave_requests` table exists and has RLS enabled
- [ ] `leave_requests` has the policy `full_access_leave_requests`
- [ ] Console shows `[LeaveManagement]` logs without errors
- [ ] `currentOrgId` is being set (not null)

---

## Quick Fix Summary

**Most likely fix:**
1. Go to Supabase SQL Editor
2. Run: `SELECT id, email, organization_id FROM public.users WHERE email = 'your-email';`
3. If `organization_id` is NULL, run:
   ```sql
   UPDATE public.users 
   SET organization_id = (SELECT id FROM organizations LIMIT 1)
   WHERE email = 'your-email';
   ```
4. Refresh your browser
5. Try again

---

## Still Not Working?

Please provide:
1. Screenshot of browser console (F12)
2. Results from: `SELECT * FROM public.users WHERE email = 'your-email';`
3. Results from: `SELECT id, name FROM public.organizations LIMIT 3;`
