# Global Gantt Dashboard - Quick Start Guide

## Accessing the Dashboard

### Method 1: From Projects Page
1. Navigate to `/projects`
2. Click the **"📊 Global Gantt Chart"** button in the top-right corner

### Method 2: Direct URL
```
http://localhost:5173/projects/global-gantt
```

## Dashboard Layout

### Top Section - Statistics Overview
Shows 4 key metrics:
- **Total Tasks**: Combined count from all sources (Jira, Asana, HubSpot)
- **Total Projects**: Number of unique projects
- **Team Members**: Number of unique assignees
- **Total Hours**: Sum of all estimated hours

### Control Panel
Located below statistics:

**Search Box**
- Search by task name, task key, or assignee name
- Real-time filtering as you type

**Project Dropdown**
- Select specific project to focus on
- Shows all projects from all sources
- "All Projects" shows everything

**Assignee Dropdown**
- Select team member to see their tasks
- Shows all assignees across all sources
- "All Team Members" shows everyone's tasks

**Status Dropdown**
- Filter by task status
- Options: All, Open, In Progress, Done, Closed, Pending
- Combines with other filters

**View Type Selector**
- **Day View**: Shows tasks by individual day (most granular)
- **Week View**: Recommended for most use cases
- **Month View**: Best for long-term planning

**Zoom Slider**
- Adjust timeline magnification: 0.5x to 3.0x
- 1.0x = normal width
- Increase to see more detail, decrease to see more weeks

### Gantt Chart Section
Shows all filtered tasks with:
- **Left Panel** (3 columns wide):
  - Priority badge (color-coded)
  - Task key (e.g., PROJ-123)
  - Task title
  - Project tag
  - Assignee name
  - Status badge

- **Right Panel** (scrollable):
  - Timeline with date markers
  - Task bars colored by status
  - Hours estimation on the bar
  - Hover for full task details

### Team Members Overview Section
Shows individual statistics for each team member:
- **Total Tasks**: How many tasks assigned
- **Completed**: Green count
- **In Progress**: Purple count
- **Total Hours**: Sum of estimated hours for their tasks
- **Projects**: List of projects they're assigned to

## Examples

### Example 1: View One Team Member's Tasks
1. Go to Global Gantt Dashboard
2. In the **Assignee** dropdown, select "John Smith"
3. Dashboard now shows only John's 8 tasks
4. Team Overview section highlights John's statistics

### Example 2: Focus on Specific Project
1. In the **Project** dropdown, select "Mobile App Redesign"
2. Dashboard filters to show 23 tasks from that project
3. Assignee list now shows only team members on that project
4. Status filter still works

### Example 3: Find High-Priority Items
1. In the **Search** box, type task keywords or leave empty
2. In the **Status** dropdown, select "In Progress"
3. Look for tasks with **Red** priority badges
4. Sort by due date by scanning the timeline

### Example 4: Capacity Planning
1. Open dashboard with "All Projects" and "All Team Members"
2. Adjust zoom to 0.5x to see 6-month overview
3. Look at Team Members section for workload distribution
4. Check "Total Hours" per person for capacity planning

### Example 5: Sprint Planning
1. Change view to "Week View"
2. Filter by specific project
3. Zoom to 1.5x for comfortable viewing
4. Drag timeline slider to see weeks ahead
5. Use status filter to see only "In Progress" or "Open" items

## Tips & Tricks

### Filtering Combinations
You can combine multiple filters (AND logic):
- Project: "Backend API" + Assignee: "Dev Team 1" + Status: "In Progress"
- Shows only In Progress tasks for Dev Team 1 on Backend API

### Timeline Navigation
- Use timeline slider in week/month view to jump through time
- Zoom in to see specific days
- Zoom out to see 6-12 month overview

### Finding Tasks
- **By Key**: Search "PROJ-" to find specific task
- **By Title**: Search keywords from task name
- **By Assignee**: Select from dropdown OR search their name

### Color Meanings
- **Priority**: Red=High, Yellow=Medium, Green=Low
- **Status Bars**: Blue=Open, Purple=In Progress, Green=Done

## Data Sources

The dashboard pulls from:

### Jira
- Endpoint: `/api/jira/issues`
- Fields: Key, Summary, Status, Assignee, Due Date, Priority
- Updates: Real-time from Jira instance

### Asana
- Endpoint: `/api/asana/tasks`
- Fields: ID, Name, Status, Assignee, Due Date, Estimated Time
- Updates: Real-time from Asana workspace

### HubSpot
- Integrated with unified view
- Shows tickets alongside other tasks

## Troubleshooting

### No tasks loading?
- Check API connection to Jira/Asana
- Verify authentication tokens
- Check browser console for errors
- Refresh page with Ctrl+F5

### Timeline not showing?
- Ensure tasks have start or due dates
- Try changing view type
- Check if filters are too restrictive

### Can't find a task?
- Verify filters aren't hiding it
- Check status - might be in a different status
- Search by task key instead of title

### Numbers don't add up?
- Tasks may appear in multiple filters
- Total in stats = all tasks (unfiltered)
- Filtered count updates when you apply filters

## Keyboard Shortcuts

- **Ctrl+F**: Search within page
- **Escape**: Clear filters/reset view
- **Scroll**: Navigate timeline horizontally

## Performance Notes

- Dashboard loads all tasks on startup (may take 2-5 seconds)
- Smooth scrolling on most devices at 0.5x zoom
- Large projects (1000+ tasks) may need zoom adjustment
- Timeline slider is responsive to touch on mobile

## Contact & Support

For issues or feature requests:
1. Check browser console for error messages
2. Verify API endpoints are accessible
3. Contact team lead for data integration help
