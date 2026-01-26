# Global Gantt Dashboard - Debugging Guide

## Quick Diagnostics

### Step 1: Open Browser Console
1. Press `F12` (or right-click → Inspect)
2. Click the **Console** tab
3. Go to `/projects/global-gantt`
4. Look for messages starting with `[GlobalGantt]`

### Step 2: Check Loading Logs
You should see:
```
[GlobalGantt] Fetching Jira data...
[GlobalGantt] Jira issues: 42
[GlobalGantt] Fetching Asana data...
[GlobalGantt] Asana tasks: 18
[GlobalGantt] Fetching HubSpot data...
[GlobalGantt] HubSpot tickets: 15
[GlobalGantt] Total tasks collected: 75
```

If you see:
```
[GlobalGantt] Jira fetch failed: Error: Failed to fetch
```
Then Jira API is not responding. This might be:
- Authentication expired
- Network connectivity issue
- API rate limit exceeded

### Step 3: Check Network Requests
1. Stay in DevTools
2. Click the **Network** tab
3. Look for requests to:
   - `/api/jira/issues`
   - `/api/asana/tasks`
   - `/api/hubspot/tickets`

For each request:
- **Status** should be `200` (green)
- If `401` (red): Authentication needed
- If `403` (red): Access denied
- If `500` (red): Server error

### Step 4: Check Response Data
1. Click on one of the API requests
2. Click the **Response** tab
3. Verify you see JSON with `issues`, `tasks`, or `tickets`

Example Jira response:
```json
{
  "issues": [
    {
      "key": "PROJ-123",
      "fields": {
        "summary": "Fix login bug",
        "status": { "name": "In Progress" },
        ...
      }
    },
    ...
  ]
}
```

## Common Issues & Fixes

### Issue 1: Dashboard shows 0 tasks
```
Symptom: Total Tasks = 0, Gantt chart empty
Cause: API calls not returning data
Fix:
1. Check console logs for [GlobalGantt] messages
2. Verify APIs are responding in Network tab
3. Check authentication status in /velocity-ai
4. Refresh page
```

### Issue 2: Only some sources loading
```
Symptom: Jira works, but Asana shows 0
Cause: That specific API is failing
Fix:
1. Check Network tab for that API's status code
2. If 401: Re-authenticate that integration
3. If 403: Check permissions
4. If timeout: Check network/firewall
```

### Issue 3: Filters not working
```
Symptom: Can't select projects or assignees
Cause: Usually means no data loaded yet
Fix:
1. Wait for loading spinner to finish
2. Check console for errors
3. Reload page (Ctrl+Shift+R)
4. Clear browser cache if needed
```

### Issue 4: Gantt bars not showing
```
Symptom: Data loads but no timeline bars
Cause: Tasks missing start/due dates
Fix:
1. Check task cards for dates
2. Some tasks may not have dates (won't show bars)
3. Use search/filter to find tasks with dates
4. Check data source - missing dates come from API
```

## Checking Each Integration

### Test Jira Connection
```javascript
// In browser console:
fetch('/api/jira/issues', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Jira data:', d))
  .catch(e => console.error('Jira error:', e))
```

Expected output:
```
Jira data: { issues: [...] }
```

### Test Asana Connection
```javascript
// In browser console:
fetch('/api/asana/tasks', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Asana data:', d))
  .catch(e => console.error('Asana error:', e))
```

### Test HubSpot Connection
```javascript
// In browser console:
fetch('/api/hubspot/tickets', { 
  credentials: 'include',
  headers: { 'x-hubspot-storekey': localStorage.getItem('hubspot_storeKey') }
})
  .then(r => r.json())
  .then(d => console.log('HubSpot data:', d))
  .catch(e => console.error('HubSpot error:', e))
```

## Check Authentication Status

### Jira Tokens
```javascript
// Check if Jira cookies exist
const cookies = document.cookie;
console.log('Jira token exists:', cookies.includes('jira_access_token'));
console.log('Cloud ID exists:', cookies.includes('jira_cloud_id'));
```

### HubSpot StoreKey
```javascript
// Check if HubSpot storeKey is set
const storeKey = localStorage.getItem('hubspot_storeKey');
console.log('HubSpot storeKey:', storeKey ? 'Present' : 'Missing');
```

### Integration Status
Visit `/velocity-ai` and check the "Security Audit" panel for connection status.

## Performance Tips

### Dashboard is slow?
1. Reduce zoom (0.5x to 1.0x)
2. Apply filters to reduce visible tasks
3. Use Week or Month view instead of Day
4. Close browser developer tools (they slow rendering)

### Lots of tasks loading?
1. Use Project filter to focus on one project
2. Use Status filter to show only important ones
3. Search for specific tasks
4. These filters don't reload data, just hide/show

## Export/Share Data

### Download filtered data
```javascript
// In browser console:
// This gives you the filtered tasks as JSON you can copy
const data = {
  totalTasks: document.querySelector('h1').parentElement.parentElement
    .querySelector('p').textContent,
  tasks: [] // (would need to extract from DOM)
};
console.log(JSON.stringify(data, null, 2));
```

## Enable Debug Mode

Add to browser console:
```javascript
// Show all data being processed
window.debugGantt = true;

// Then check console after page reload
```

## Contact Support

If still having issues:
1. Screenshot the console errors
2. Note which integrations are failing
3. Check if issue happens in incognito mode
4. Provide browser version and OS
