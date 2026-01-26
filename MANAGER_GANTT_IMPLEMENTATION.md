# ManagerGantt Component Implementation

## Overview
A comprehensive, all-projects Gantt chart component that displays tasks from all integrated sources (JIRA, Asana, HubSpot, Microsoft 365) in a unified timeline view, grouped by employee assignees.

## Features Implemented

### 1. **Title & Timeline**
- Displays "All Projects — Employee Timeline"
- Date range display showing earliest task start to 6 months after latest task end
- Formatted as (Month Year) — (Month Year)

### 2. **View Controls**
- **Day/Week/Month** view buttons for different time granularities
- **Zoom Slider** (0.5x - 3x magnification) for flexible timeline viewing
- Real-time view switching with smooth recalculation

### 3. **Project Color Legend**
- Shows all projects with task counts
- Each project gets a distinct gradient color (12 available gradient pairs)
- Color-coded badges displaying project key and task count
- Automatic color assignment to projects

### 4. **Employee Timeline Grid**
- Left column: Employee names (grouped by assignee)
- Timeline area: Gantt bars showing each task
- Date headers: Matching grid with weekday labels (Sun, Mon, Tue, etc.)
- Weekend highlighting: Gray background for weekends (Saturday/Sunday)
- Scrollable horizontal timeline for large date ranges

### 5. **Task Bars**
- **Positioned** by start/end dates with accurate scaling
- **Color-coded** by project with gradient backgrounds
- **Shows task key** (e.g., TSTPRJCT4-11) on the bar
- **Hover reveals** task name via tooltip
- **Click opens** task detail modal

### 6. **Task Detail Modal**
- Task Name, ID, Status (color-coded)
- Assignee, Priority
- Start/Due dates, Duration (in days), Type
- Full description with word wrapping
- Close button and click-outside-to-close functionality

## Technical Implementation

### Data Fetching (Project Pattern)
Uses the project's established API pattern with proper error handling:

```typescript
// JIRA - fetch projects, then issues per project
fetch(apiUrl('/api/jira/projects'))
fetch(apiUrl(`/api/jira/issues?projectKey=${projectKey}`))

// Asana
fetch(apiUrl('/api/asana/tasks'))

// HubSpot
fetch(apiUrl('/api/hubspot/tickets'))

// Microsoft 365
fetch(apiUrl('/api/microsoft365/tasks'))
```

### Key Components

**ManagerGantt.tsx** - Main component with:
- Auto-fetch capability (`autoFetch` prop)
- External task support (pass tasks directly)
- Dual mode: controlled or auto-fetching
- Toast notifications for user feedback
- useToast hook integration

**GlobalGanttDashboard.tsx** - Updated to:
- Import and use ManagerGantt component
- Pass `autoFetch={true}` for automatic data loading
- Simplified to focus on layout
- Maintains back button and header navigation

### Type Support

Extended `Issue` interface to support all project types:
```typescript
interface Issue {
  key: string
  issueType: string
  summary: string
  description: string
  priority: string
  status: string
  assignee: string
  team: string
  start: string | null
  due: string | null
  duration: number | string
  created?: string | null
  project?: string
  projectKey?: string
}
```

### Data Transformation

Automatic mapping from various API sources:
- **JIRA**: Uses `key`, `summary`, `status`, `priority`, `assignee`, `start`, `due`
- **Asana**: Maps `id`→`key`, `name`→`summary`, inherits standard fields
- **HubSpot**: Maps `id`→`key`, `subject`/`name`→`summary`, `stage`→`status`
- **Microsoft 365**: Maps `id`→`key`, `title`→`summary`, uses `startDate`/`dueDate`

## Usage

### In Global Dashboard (with auto-fetch)
```tsx
<ManagerGantt autoFetch={true} />
```

### With external tasks
```tsx
const tasks = [...]; // Your tasks array
<ManagerGantt tasks={tasks} autoFetch={false} />
```

## Visual Design

- **Color Gradients**: 12 distinct project colors with gradient backgrounds
- **Responsive Layout**: Works on mobile and desktop with responsive grid
- **Interactive Elements**: Hover effects, shadow enhancements, smooth transitions
- **Weekend Indicator**: Visual distinction for weekends (gray backgrounds)
- **Modal Overlay**: Semi-transparent backdrop with centered modal

## Styling Classes

- Tailwind CSS for all styling
- Gradient backgrounds: `bg-gradient-to-r`
- Responsive grid: `md:p-6`, `lg:col-span-*`
- Hover states: `hover:ring-2`, `hover:shadow-lg`
- Fixed headers: `sticky`, `z-50`

## Error Handling

- Individual API failures don't block other sources
- Console warnings for debugging
- Toast notifications for user feedback
- Graceful degradation with partial data loading

## Performance Considerations

- Memoized calculations with `useMemo` for timeline and grouping
- Efficient date normalization to UTC midnight
- Lazy task rendering in modal (only shows when selected)
- Optimized grid calculation for different view types

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox support required
- Date API support required
- Fetch API with credentials support

## Future Enhancements

- Task filtering and search within the component
- Drag-to-reschedule task dates
- Team-based color schemes
- Export to PDF/PNG
- Integration with project management webhooks
- Performance optimizations for 1000+ tasks
