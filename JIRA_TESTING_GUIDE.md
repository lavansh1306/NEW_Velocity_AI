# Quick Testing Guide for Jira Integration

## Pre-Deployment Checklist

### Environment Variables (Vercel)
Make sure these are configured:
```
JIRA_OAUTH_CLIENT_ID=your_client_id_here
JIRA_OAUTH_CLIENT_SECRET=your_secret_here
JIRA_OAUTH_REDIRECT_URI=https://joinvelocity.co/api/jira/auth/callback
```

## Testing Steps

### 1. Test Authentication Flow

1. **Clear cookies** (Important!)
   - Open DevTools > Application > Cookies
   - Clear all cookies for joinvelocity.co

2. **Go to VelocityAI page**
   - Navigate to: `https://joinvelocity.co/velocity-ai`
   - Go to "Integrations" tab
   - Jira should show as "Disconnected"

3. **Connect Jira**
   - Click "Connect" button on Jira card
   - Should redirect to Atlassian login
   - Log in with Jira account
   - Authorize the app
   - Should redirect back to `/velocity-ai`

4. **Verify Connection**
   - Go to Integrations tab again
   - Jira should now show as "Connected" with green checkmark
   - Should show "Last sync: 1 minute ago"

### 2. Test Jira Dashboard

1. **Navigate to Projects page**
   - Go to: `https://joinvelocity.co/projects`

2. **Open Jira Dashboard**
   - Click on "Jira Dashboard" link
   - Or navigate to: `https://joinvelocity.co/projects/jira-dashboard`

3. **Verify Site Selector**
   - Should see "Select Jira Site" dropdown
   - Should show your Jira instance(s)
   - Select your site

4. **Verify Project Selector**
   - After selecting site, "Select Project" dropdown should appear
   - Should show list of projects from your Jira
   - Select a project (e.g., "SAM1")

5. **Verify Data Loading**
   - Issues table should populate with real Jira issues
   - Check for:
     - Issue keys (e.g., SAM1-1, SAM1-2)
     - Summary text
     - Status
     - Assignees
     - Due dates

6. **Verify Gantt Chart**
   - Gantt chart should display below the table
   - Should show tasks with start/end dates
   - Color-coded by assignee

7. **Test Manager View**
   - Click "Manager Summary" tab
   - Should show:
     - Total assignees count
     - Total tasks count
     - Average duration
   - Click "Calculate Block Time"
   - Should calculate and display workload heatmap

### 3. Test Multi-Site Switching

If you have multiple Jira instances:

1. **Go to Jira Dashboard**
2. **Switch Site**
   - Use the "Select Jira Site" dropdown
   - Choose a different site
   - Projects should reload for new site
3. **Verify Data**
   - Projects list should update
   - Select a project from new site
   - Issues should load from new site

### 4. Test API Endpoints Directly

Open browser console and test:

```javascript
// Check status
fetch('/api/jira/auth/status', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
// Should return: { connected: true/false, site: {...}, availableSites: [...] }

// Fetch projects (requires authentication)
fetch('/api/jira/projects', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
// Should return: { projects: [...] }

// Fetch issues (requires authentication)
fetch('/api/jira/issues?projectKey=SAM1', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
// Should return: { issues: [...] }
```

### 5. Test Disconnect

1. **Go to VelocityAI > Integrations**
2. **Click "Disconnect" on Jira**
3. **Verify Disconnection**
   - Jira card should show "Disconnected"
   - Go to Jira Dashboard
   - Should show "No Jira sites loaded" message
   - Should show "Re-connect to Jira" button

## Expected Behavior by User ID

### Working IDs
If authentication works:
- ✅ Status API returns `connected: true`
- ✅ Projects API returns list of projects
- ✅ Issues API returns issues for project
- ✅ Dashboard displays data
- ✅ Gantt charts render

### Not Working IDs  
If authentication doesn't work:
- ❌ Status API returns `connected: false`
- ❌ Projects API returns 401 or empty list
- ❌ Issues API returns 401
- ❌ Dashboard shows "No Jira sites loaded"
- ❌ Button to re-connect appears

**Fix**: Click "Re-connect to Jira" to re-authenticate

## Common Issues & Solutions

### Issue: "No Jira token found"
**Cause**: Cookies expired or cleared
**Solution**: Re-authenticate via "Connect to Jira" button

### Issue: "Failed to fetch Jira resources"
**Cause**: Invalid or expired access token
**Solution**: Disconnect and reconnect Jira

### Issue: "No projects found"
**Cause**: User has no accessible projects in selected Jira instance
**Solution**: 
- Check Jira permissions
- Try switching to different site if multiple available
- Grant project access in Jira admin

### Issue: "Formatted issues: 0"
**Cause**: Project has no issues OR wrong project key
**Solution**:
- Verify project key is correct (uppercase, e.g., "SAM1")
- Check that project has issues in Jira
- Try a different project

### Issue: Stuck on authentication redirect
**Cause**: Callback URL not matching Vercel environment
**Solution**: Check `JIRA_OAUTH_REDIRECT_URI` matches your domain

## Debugging in Console

Check cookies:
```javascript
document.cookie
```

Should see:
- `jira_access_token=...` (if connected)
- `jira_cloud_id=...` (if connected)

Check network tab:
- Look for calls to `/api/jira/*`
- Check response status codes
- Check response bodies for errors

## Success Criteria

✅ All API endpoints return proper data
✅ Authentication flow completes without errors
✅ Dashboard displays real Jira issues
✅ Gantt charts render with actual data
✅ Manager views calculate real metrics
✅ Multi-site switching works
✅ Disconnect/reconnect works
✅ No console errors related to Jira
✅ Status correctly reflects connection state

## Deployment Notes

After deploying to Vercel:
1. Verify environment variables are set
2. Check Vercel function logs for any errors
3. Test full authentication flow in production
4. Verify callback URL works correctly
5. Test with multiple users/accounts
