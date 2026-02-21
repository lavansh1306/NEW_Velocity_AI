# Jira Data Deduplication Fix

## Problem
When reconnecting a Jira account, duplicate issues were appearing in the `jira_issues` table because:
1. The UNIQUE constraint uses `(org_id, cloud_id, issue_key)`
2. When reconnecting, sometimes a different `org_id` could be used for the same cloud/issue combination
3. This broke the uniqueness guarantee, causing duplicates

## Solution
Implemented a comprehensive deduplication system with multiple layers:

### 1. Database Migration (`dedup_jira_issues.sql`)
- Created `dedup_jira_issues()` function: Global deduplication across all organizations
  - Finds duplicates by `(cloud_id, issue_key)` regardless of `org_id`
  - Keeps the most recently updated record
  - Deletes older duplicates

- Created `dedup_jira_issues_for_org()` function: Targeted deduplication for a specific org/cloud
  - Called during reconnect to clean up duplicates
  - Prioritizes keeping issues in the correct org
  - Returns count of deleted duplicates

- Added index on `(cloud_id, issue_key)` for faster lookups

### 2. Database Layer (`src/api/jira/db.ts`)
- Added `deduplicateIssuesForOrgCloud()` function:
  - Calls the RPC function `dedup_jira_issues_for_org`
  - Falls back to manual deduplication if RPC fails
  
- Added `manualDeduplicateIssues()` function:
  - Groups issues by `(cloud_id, issue_key)`
  - Deletes older duplicates, keeps most recently updated
  - Works in batches to handle large datasets
  
- Added validation to `upsertIssues()` and `upsertProjects()`:
  - Throws error if `org_id` or `cloud_id` are missing
  - Prevents silent failures due to missing parameters

### 3. Auth Layer (`src/api/jira/auth.ts`)
- Modified OAuth callback to trigger deduplication on reconnect:
  - Calls `deduplicateIssuesForOrgCloud()` after storing connection
  - Runs in background (fire-and-forget) to not block redirect
  - Logs dedup results for monitoring
  - Deduplicates for all accessible Jira resources/sites

## How It Works

### On Initial Connection
1. User connects Jira account → OAuth callback triggered
2. Jira access token stored in `jira_connections` table
3. Issues fetched from Jira and stored in `jira_issues` using UPSERT
4. No duplicates (first time connecting)

### On Reconnection
1. User clicks "Reconnect account"
2. OAuth callback triggered again with same `cloud_id` and `org_id`
3. UPSERT logic detects duplicates using `(org_id, cloud_id, issue_key)` and updates existing records
4. **NEW:** Deduplication runs in background:
   - Checks for older duplicates in other org contexts
   - Removes them, keeping the most recent version
   - Logs count of duplicates removed

## Files Changed
1. **supabase-migrations/dedup_jira_issues.sql** (NEW)
   - Database functions for deduplication
   
2. **src/api/jira/db.ts**
   - `deduplicateIssuesForOrgCloud()` - RPC wrapper
   - `manualDeduplicateIssues()` - Fallback dedup logic
   - Updated `upsertIssues()` - Added org_id/cloud_id validation
   - Updated `upsertProjects()` - Added org_id/cloud_id validation

3. **src/api/jira/auth.ts**
   - Added deduplication calls after storing connections
   - Non-blocking, fire-and-forget approach

## Testing the Fix

### Test 1: Initial Connection
```
1. Go to app, click "Connect Jira"
2. Complete OAuth flow
3. Check Supabase: issues from your Jira project should appear
4. Count issues in jira_issues table
```

### Test 2: Reconnection (No Duplication)
```
1. Disconnect Jira account
2. Click "Connect Jira" again
3. Complete OAuth flow
4. Check server logs:
   - Should see "[JiraDB] Deduplicating issues for org:" messages
   - May see "Deduplication complete: deleted 0" (no old duplicates)
5. Verify the issue count didn't increase
```

### Test 3: Verify Deduplication Actually Works
```
1. Connect account to Jira
2. Manually check jira_issues table - count = X
3. Insert duplicate records in another org context:
   INSERT INTO jira_issues (org_id, cloud_id, issue_key, ...) 
   VALUES ('different-org', 'same-cloud', 'SAME-123', ...);
4. Reconnect Jira account
5. Check logs - should see "Deduplication complete: deleted 1"
6. Verify table count is back to X (not X+1)
```

### Test 4: Multiple Sites
```
1. In Jira, create multiple sites if testing multi-tenant
2. Connect account - should see "Deduplicating issues for" for each site
3. Verify no cross-site duplicates appear
```

## Monitoring

### Recommended Log Patterns to Monitor
```
[Jira OAuth Callback] Starting deduplication for org:
[JiraDB] Deduplicating issues for org:
[Jira OAuth Callback] ✓ Deduplication complete, removed X duplicate(s)
[JiraDB] Deduplication complete:
```

### Error Patterns (if something goes wrong)
```
[JiraDB] upsertIssues FAILED: Missing required parameters!
[JiraDB] Deduplication RPC error:
[JiraDB] manualDeduplicateIssues exception:
```

## Performance Notes
- Deduplication is called asynchronously (doesn't block redirect)
- Database functions use indexes for fast lookups
- Batch deletion (100 at a time) for large datasets
- Most reconnections will have 0 duplicates to clean up

## Future Improvements
1. Add scheduled background job to periodically check for duplicates
2. Add admin dashboard to see deduplication statistics
3. Consider archiving old data instead of deleting
4. Add metrics/monitoring to track duplicate occurrences
