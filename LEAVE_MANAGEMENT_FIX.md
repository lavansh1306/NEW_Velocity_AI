# Leave Management System - Fix Documentation

## Problem Summary
Your leave management system couldn't write to Supabase because:

1. **Missing RLS Policies**: The `leave_requests` table had no Row Level Security policies defined, making it inaccessible
2. **No Migration File**: The leave tables weren't properly created with constraints
3. **Poor Error Handling**: Errors weren't being logged, making debugging impossible
4. **Date Format Issues**: Timezone handling could cause date validation failures

## What Was Fixed

### 1. Created Migration File: `create_leave_management_tables.sql`
- ✅ Creates all leave-related tables with proper constraints
- ✅ Adds 6 new tables for complete leave management:
  - `leave_types` - Company configurable leave types
  - `leave_requests` - Employee leave submissions
  - `leave_approvers` - Manager configuration
  - `leave_approval_chain` - Approval audit trail
  - `leave_history` - Complete audit log
  - `employee_leave_balances` - Leave balance tracking
- ✅ Enables RLS with permissive policies (application-layer enforcement)
- ✅ Adds proper indexes for performance
- ✅ Defines foreign key constraints for data integrity

### 2. Enhanced Error Handling in `index.tsx`
Updated `handleApplyLeave` function with:
- ✅ Detailed console logging at each step
- ✅ Proper date validation (format check, end > start)
- ✅ Timezone-safe date formatting (no ISO string conversions)
- ✅ User existence validation
- ✅ Org ID matching verification
- ✅ Specific error messages for each failure point
- ✅ Better user-facing toast messages

### 3. Improved Data Fetching
Enhanced `fetchSupabaseLeaves`:
- ✅ Added console logging for debugging
- ✅ Proper status normalization (lowercase → Title Case)
- ✅ Better error handling without crashing
- ✅ Returns all required fields including `user_id` and `org_id`

### 4. Better Approval/Rejection
Enhanced `handleApproveLeave` and `handleRejectLeave`:
- ✅ Comprehensive error logging
- ✅ Proper error messages displayed to user
- ✅ Automatic data refresh on error

## How to Apply the Changes

### Step 1: Run the Migration
Run this SQL in your Supabase dashboard (SQL Editor):

```sql
-- Copy the entire contents of:
-- supabase-migrations/create_leave_management_tables.sql
-- and paste it into the Supabase SQL editor, then Execute
```

Or via Supabase CLI:
```bash
supabase db push
```

### Step 2: Verify Tables Are Created
In Supabase dashboard, go to `Database` → check these tables exist:
- [ ] leave_types
- [ ] leave_requests
- [ ] leave_approvers
- [ ] leave_approval_chain
- [ ] leave_history
- [ ] employee_leave_balances

### Step 3: Restart Your Application
Clear browser cache and restart to load the new code:
```bash
npm run dev
```

## Testing the Fix

### Test 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for logs starting with `[LeaveManagement]`
4. Try to submit a leave request
5. Should see detailed logs of each step

### Test 2: Submit A Leave Request (Employee View)
1. Click "Employee" tab in Leave Management
2. Select dates on calendar
3. Enter a reason
4. Click "Submit"
5. Check for success toast message
6. Verify in Supabase Dashboard:
   ```sql
   SELECT * FROM leave_requests 
   WHERE org_id = '<your-org-id>' 
   ORDER BY created_at DESC
   LIMIT 1;
   ```

### Test 3: Check Manager View
1. Click "Manager" tab
2. Should see new leave request appear in "Active Leave Requests"
3. Click "Approve" or "Reject"
4. Check console for logs
5. Verify status changed in database

## Troubleshooting

### Error: "Table 'leave_requests' not found"
**Solution**: The migration wasn't run. Go to Supabase SQL Editor and run the migration file.

### Error: "Your user profile was not found"
**Solution**: Check that your user exists in `public.users` table:
```sql
SELECT id, email, name, organization_id 
FROM public.users 
WHERE email = '<your-email>';
```

### Error: "Operation not permitted" or RLS-related
**Solution**: RLS policies were created. If you still get errors, verify policies exist:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'leave_requests';
```

### Dates showing incorrectly
**Solution**: The new date handling uses local timezone conversion. Check browser console logs for the normalized dates.

## Console Logs to Expect

When you submit a leave request, you should see:
```
[LeaveManagement] handleApplyLeave called with: {...}
[LeaveManagement] Normalized dates: {normalizedStartDate: "2026-02-21", ...}
[LeaveManagement] Fetching user by email: user@company.com
[LeaveManagement] Found user: {userId: "...", userName: "...", orgId: "..."}
[LeaveManagement] Inserting leave request: {...}
[LeaveManagement] Leave request created successfully: [...]
[LeaveManagement] Fetching leaves for org: ...
[LeaveManagement] Fetched leaves: 5
```

## Database Schema Overview

```
organizations (1)
├── leave_types (Many)
├── leave_requests (Many)
│   ├── user_id → users(id)
│   └── leave_approval_chain (Many)
│       ├── approver_id → users(id)
│       └── leave_history (audit records)
├── leave_approvers (Many)
│   └── user_id → users(id)
└── employee_leave_balances (Many)
    ├── user_id → users(id)
    └── leave_type_id → leave_types(id)
```

## Performance Notes

- Indexes on `org_id`, `user_id`, `status`, and dates for fast queries
- Compound indexes for common filter combinations
- `balance` field auto-calculated using GENERATED columns
- Audit tables designed for compliance logging

## Next Steps (Optional Enhancements)

1. Row-level security (user-specific access):
   - Policy: Users can only see/edit their own leaves
   - Policy: Managers can see team leaves
   
2. Audit triggers:
   - Auto-log all changes to `leave_history`
   - Track who made changes and when

3. Notifications:
   - Send email when leave is approved/rejected
   - Remind manager of pending approvals

4. Compliance:
   - Add leave approval levels (1st manager, HR, executive)
   - Implement blackout dates
   - Calculate annual leave balance automatically

---

**Migration Date**: February 21, 2026  
**Status**: ✅ Complete and Ready to Test
