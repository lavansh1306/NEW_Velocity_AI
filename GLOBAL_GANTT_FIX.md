# Global Gantt Dashboard - Data Fetching Fix

## Problem
The initial implementation was fetching data incorrectly, resulting in 0 tasks being loaded.

## Root Cause Analysis
The issue was related to:
1. **Missing proper cookie/authentication handling** - The API calls weren't using the correct credential-based authentication that your system uses
2. **No HubSpot token headers** - HubSpot requires special `x-hubspot-storekey` header that comes from localStorage
3. **Incomplete error handling** - Failures were silent and not logged properly

## Solution Implemented

### 1. Proper Cookie-Based Authentication
Updated all API calls to use:
```typescript
fetch(apiUrl(endpoint), {
  credentials: 'include',  // This sends cookies with cross-origin requests
})
```

### 2. HubSpot Special Token Handling
Added the `hubspotFetch` helper utility that automatically includes the storeKey:
```typescript
import { hubspotFetch } from '@/lib/hubspot-fetch'

// This automatically adds the x-hubspot-storekey header from localStorage
const hubspotResp = await hubspotFetch(apiUrl('/api/hubspot/tickets'), {
  credentials: 'include',
})
```

### 3. Comprehensive Error Logging
Each data source now logs:
- When fetching starts: `[GlobalGantt] Fetching Jira data...`
- Success count: `[GlobalGantt] Jira issues: 42`
- Failures with warnings: `[GlobalGantt] Jira fetch failed: [error details]`
- Total collected: `[GlobalGantt] Total tasks collected: 150`

This allows you to open the browser console (F12 → Console tab) to see exactly what's happening.

### 4. Data Normalization
All three sources (Jira, Asana, HubSpot) are normalized to the same `GlobalTask` structure:

```typescript
interface GlobalTask {
  key: string              // Unique ID (JIRA-123, gid, ticketId, etc)
  title: string            // Task name/summary
  project: string          // Project name
  assignee: string         // Person assigned
  team: string             // Department/team
  status: string           // Open, In Progress, Done, Closed, Pending
  priority: string         // High, Medium, Low
  startDate: string | null // ISO date or null
  dueDate: string | null   // ISO date or null
  estimatedHours: number   // Hours estimate
  source: string           // jira | asana | hubspot
}
```

## Data Mapping Details

### Jira
- **Key**: `iss.key`
- **Title**: `iss.fields?.summary`
- **Project**: `iss.fields?.project?.key`
- **Assignee**: `iss.fields?.assignee?.displayName`
- **Status**: `iss.fields?.status?.name`
- **Priority**: `iss.fields?.priority?.name`
- **Due Date**: `iss.fields?.duedate`
- **Estimated Hours**: `iss.fields?.timeestimate / 3600` (converted from seconds)

### Asana
- **Key**: `task.gid`
- **Title**: `task.name`
- **Project**: `task.projects?.[0]?.name`
- **Assignee**: `task.assignee?.name`
- **Status**: `task.completed ? 'Done' : 'In Progress'`
- **Due Date**: `task.due_on`
- **Estimated Hours**: `task.estimated_minutes / 60`

### HubSpot
- **Key**: `ticket.ticketId`
- **Title**: `ticket.subject`
- **Project**: `ticket.pipeline`
- **Assignee**: `ticket.assignee`
- **Status**: `ticket.stage`
- **Due Date**: `ticket.closedAt` (fallback to createdAt for timeline)
- **Estimated Hours**: Default 8 hours

## Features

### Data Aggregation
- ✅ Fetches from all three sources simultaneously
- ✅ Graceful fallback if one source fails
- ✅ Combines and normalizes all data
- ✅ Groups by project and assignee

### Visualization
- ✅ Gantt timeline with draggable zoom (0.5x - 3.0x)
- ✅ Three view modes: Day, Week, Month
- ✅ Color-coded by status and priority
- ✅ Responsive scrollable timeline

### Filtering
- ✅ Search by task name, key, or assignee
- ✅ Filter by project
- ✅ Filter by assignee
- ✅ Filter by status
- ✅ All filters work together (AND logic)

### Statistics
- ✅ Total tasks, projects, team members, hours
- ✅ Per-person stats (total, completed, in-progress, hours, projects)
- ✅ Real-time count updates as filters change

## Testing the Fix

### 1. Check Browser Console (F12)
Look for:
```
[GlobalGantt] Fetching Jira data...
[GlobalGantt] Jira issues: 42
[GlobalGantt] Fetching Asana data...
[GlobalGantt] Asana tasks: 18
[GlobalGantt] Fetching HubSpot data...
[GlobalGantt] HubSpot tickets: 15
[GlobalGantt] Total tasks collected: 75
```

### 2. Check Network Tab (DevTools)
All requests should have:
- Status: `200` (success)
- Headers: Include `Cookie` header (for Jira/Asana)
- Headers: Include `x-hubspot-storekey` (for HubSpot)

### 3. Verify Data Loads
- Dashboard stats should show > 0 for at least one metric
- Gantt chart should display task bars
- Filters should populate with options
- Team Members section should show assignees

### 4. If Still Getting 0 Tasks
Check:
1. Are Jira/Asana/HubSpot connected? (Check in Settings/Integration Status)
2. Do you have access to those APIs? (Check /api/diagnose)
3. Browser console for error messages
4. Network tab for failed requests

## Files Modified
- `src/pages/GlobalGanttDashboard.tsx` - Complete rewrite with proper data fetching

## API Endpoints Used
- `GET /api/jira/issues` - Jira issues (requires cookies)
- `GET /api/asana/tasks` - Asana tasks (requires cookies)
- `GET /api/hubspot/tickets` - HubSpot tickets (requires cookies + x-hubspot-storekey header)

## Troubleshooting

### No data showing?
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `[GlobalGantt]` log messages
4. Check if any say "fetch failed"
5. Go to Network tab and check API response status codes

### Some sources working, others not?
1. Only the failing source is blocked
2. Others will still load data
3. Check authentication for that specific service
4. Go to /velocity-ai to verify integration status

### Tasks not filtering properly?
1. Ensure at least one filter is applied
2. Check console for any errors
3. Reload page if filters seem stuck

## Future Improvements
- Export filtered data to CSV/PDF
- Real-time data sync (WebSocket)
- Dependency visualization
- Resource leveling
- Team capacity warnings
- Custom filters saving
