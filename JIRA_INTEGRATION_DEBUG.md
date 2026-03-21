# Jira Integration Fixes - Debugging Guide

## Issues Fixed

1. **Integration Module Using Wrong DB Functions**
   - The integration.ts was creating standalone Supabase clients instead of using existing db.ts functions
   - Now uses `db.upsertProjects()` and `db.upsertIssues()` which properly handle org_id

2. **Missing org_id Handling**
   - The integration now properly passes org_id to all Supabase operations
   - Tables use org_id for multi-tenant data isolation

3. **Better Error Logging**
   - Added detailed logging at each step ofhe sync process
   - Logs now show: step number, progress, success/failure counts

4. **Corrected Callback Parameters**
   - Updated jira/auth.ts callback to pass correct parameters to syncAllJiraData
   - Removed unused `req` parameter from integration functions

## How to Test & Debug

### Check Server Logs During OAuth Flow

1. Open browser DevTools → Console
2. Connect Jira account in Settings → Integrations → Jira
3. Watch server logs for messages like:
   ```
   [JiraIntegration] ===== STARTING FULL SYNC =====
   [JiraIntegration] Org: [org-id]
   [JiraIntegration] Cloud ID: [cloud-id]
   [JiraIntegration] Step 1: Fetching projects...
   [JiraIntegration] ✓ Got X projects
   [JiraIntegration] Step 2: Storing projects to DB...
   [JiraIntegration] ✓ Projects stored successfully
   [JiraIntegration] Step 3: Fetching and storing issues...
   ```

### Check Data Status Endpoint

After connecting Jira, visit this URL to verify data was saved:

```
GET /api/jira/debug/data-status
```

This will return:
```json
{
  "orgId": "org-uuid",
  "connections": {
    "count": 1,
    "data": [{"id": "...", "cloudId": "...", "siteName": "..."}]
  },
  "projects": {
    "count": 5
  },
  "issues": {
    "count": 42
  }
}
```

### Common Issues & Solutions

**Issue: Data not appearing in DB**
- Check if org_id is null in session (logs should show it)
- Verify SUPABASE_SERVICE_ROLE_KEY env var is set
- Check Supabase RLS policies (should allow full access for service role)

**Issue: Jira API fetch failing**
- Check if accessToken is valid (expiring too soon?)
- Verify Jira OAuth scopes are correct in auth.ts
- Check if cloudId is being retrieved properly

**Issue: Sync starts but stops mid-way**
- Check individual project issues (logs show which projects succeed/fail)
- Verify database has no constraint violations
- Check if rate limits hit (Jira has API limits)

## Files Modified

- `src/api/jira/integration.ts` - Rewrote to use existing db functions
- `src/api/jira/auth.ts` - Updated callback to pass correct parameters
- `src/api/jira/routes.ts` - Added debug endpoint
- `src/hooks/useJiraConnection.ts` - Created custom hook for connection state
- `src/components/Settings.tsx` - Added Jira connect/disconnect UI

## Expected Flow

1. User clicks "Connect" button in Settings → Integrations
2. OAuth flow redirects to Jira
3. User approves & gets redirected back to `/api/jira/auth/callback`
4. Callback stores connection in `jira_connections` table
5. Callback triggers async sync (fire-and-forget)
6. Sync:
   - Fetches all projects from Jira API
   - Stores in `jira_projects` table
   - For each project:
     - Fetches issues from Jira API
     - Stores in `jira_issues` table
7. Frontend updates to show "Active" status

## Environment Variables Required

Make sure these are set in your Vercel/local environment:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyy...
JIRA_OAUTH_CLIENT_ID=...
JIRA_OAUTH_CLIENT_SECRET=...
```
