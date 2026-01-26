# Employee Timeline & Capacity Map - UI Flow Guide

## Dashboard View Toggle

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back, Manager                    [Download] [+ New]  │
│  Here's what's happening with your teams today.              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ┌────────────────────┬──────────────────┐                   │
│  │ 📊 Employee Timeline│ 👥 Capacity Map  │  ← VIEW TOGGLE   │
│  └────────────────────┴──────────────────┘                   │
│                                                               │
│  (Contents change based on selected view)                    │
└─────────────────────────────────────────────────────────────┘
```

## View 1: Timeline (Gantt Chart)

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 All Projects — Employee Timeline                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Timeline: Jan 2024 — Jul 2024                              │
│  [Day] [Week] [Month]  Zoom: [————●————]                   │
│                                                               │
│  ┌─ Assignee ─────────┬─ Jan ─ Feb ─ Mar ─ Apr ─ May ─ Jun ─┐│
│  │ Aarav Sharma       │ ┌─JIRA-1──┐        ┌──JIRA-5──┐  ││
│  │ Aditya Verma       │     ┌───JIRA-2────┐              ││
│  │ Priya Desai        │                 ┌──JIRA-3──┐      ││
│  │ Rahul Patel        │ ┌──JIRA-4──┐              ┌──JIRA-6│
│  └────────────────────┴──────────────────────────────────────┘│
│                                                               │
│  ✓ COLOR LEGEND                                             │
│  [PROJECT-1] [PROJECT-2] [PROJECT-3] [PROJECT-4]           │
└─────────────────────────────────────────────────────────────┘
```

## View 2: Capacity Map (Card-Based)

```
┌─────────────────────────────────────────────────────────────┐
│ 👥 Real-time Capacity Map                      4 Issues      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐          │
│  │  AS  Aarav Sharma    │  │  AV  Aditya Verma    │          │
│  │      4 assigned      │  │      3 assigned      │          │
│  │  ▶ 2 In Progress     │  │  ✓ 1 Done            │          │
│  │  ✓ 1 Done           │  │  ▶ 2 In Progress     │          │
│  │  ⚠ 1 Blocked        │  │                      │          │
│  │                      │  │  ┌──────────────────┐│          │
│  │  ┌──────────────────┐│  │  │ PROJ-2           ││          │
│  │  │ PROJ-1           ││  │  │ Design mockups   ││          │
│  │  │ Backend API      ││  │  │ [High] [Done]    ││          │
│  │  │ [Medium] [Done]  ││  │  └──────────────────┘│          │
│  │  └──────────────────┘│  │                      │          │
│  │  ┌──────────────────┐│  └──────────────────────┘          │
│  │  │ PROJ-3           ││                                    │
│  │  │ Database schema  ││  ┌──────────────────────┐          │
│  │  │ [High] [In Prog.]││  │  PD  Priya Desai     │          │
│  │  └──────────────────┘│  │      2 assigned      │          │
│  │                      │  │  ▶ 2 In Progress     │          │
│  │                      │  │                      │          │
│  │                      │  │  ┌──────────────────┐│          │
│  │                      │  │  │ PROJ-1           ││          │
│  │                      │  │  │ Testing suite    ││          │
│  │                      │  │  │ [Medium] [In Pr.]││          │
│  │                      │  │  └──────────────────┘│          │
│  │                      │  └──────────────────────┘          │
│  └──────────────────────┘                                    │
│                                                               │
│  ┌─ STATUS LEGEND ────────────────────────────────────────┐  │
│  │ [Done] [In Progress] [To Do] [Blocked]                │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ RECENT UPDATES ──────────────────────────────────────┐  │
│  │ • Deployment Success (2 hours ago)                    │  │
│  │   Velocity AI v2.0 deployed to prod                   │  │
│  │                                                         │  │
│  │ • New Alert (4 hours ago)                             │  │
│  │   High capacity usage in Design Team                  │  │
│  │                                                         │  │
│  │ • Jira Sync (5 hours ago)                             │  │
│  │   Automatic synchronization complete                  │  │
│  │                  [View All Activity]                  │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Mapping: Jira → Components

### Jira API Response
```json
{
  "projects": [
    { "key": "PROJ-1", "name": "Backend Services" }
  ],
  "issues": [
    {
      "key": "PROJ-1-234",
      "summary": "Implement authentication",
      "assignee": "Aarav Sharma",
      "status": "In Progress",
      "priority": "High",
      "project": "PROJ-1"
    }
  ]
}
```

### Timeline View
- **X-axis**: Dates (grouped by Day/Week/Month)
- **Y-axis**: Assignees (Aarav Sharma, Aditya Verma, etc.)
- **Bar**: Task with:
  - Key (PROJ-1-234)
  - Color based on project
  - Width based on duration
  - Hover shows full summary

### Capacity View
- **Cards**: Grouped by assignee
- **Card Header**: Avatar, name, total assigned count
- **Status Summary**: Visual count of issues by status
- **Issue List**: Individual issue cards showing:
  - Key (PROJ-1-234)
  - Summary (first line)
  - Project name
  - Priority badge
  - Status color

## State Management

```tsx
// VelocityAI (Parent)
const { issues: jiraIssues, loading: jiraLoading } = useJiraData()
const [viewMode, setViewMode] = useState<'timeline' | 'capacity'>('timeline')

// Passes same data to both views:
<ManagerGantt jiraIssues={jiraIssues} />
<JiraCapacityMap jiraIssues={jiraIssues} loading={jiraLoading} />
```

## Responsive Design

### Desktop (≥1024px)
- Timeline: Full width
- Capacity: 2/3 width + 1/3 Recent Activity sidebar
- Cards: 3 columns

### Tablet (768px - 1023px)
- Timeline: Full width
- Capacity: Stacked 2 columns
- Cards: 2 columns

### Mobile (<768px)
- Timeline: Horizontal scroll
- Capacity: Stacked cards
- Cards: 1 column

## Performance Notes

✅ **Optimized:**
- Jira data fetched once at parent level
- Memoized grouping in JiraCapacityMap
- Conditional rendering prevents unnecessary re-renders
- Smooth animations with CSS (no performance impact)

📊 **Typical Load Times:**
- Jira data fetch: 1-2 seconds (depends on Jira instance)
- Component render: <100ms
- Total: 1-2 seconds to see data

## Accessibility Features

♿ **Implemented:**
- Semantic HTML (buttons, labels)
- Color contrast meets WCAG AA
- Keyboard navigation on toggle buttons
- Status legends for color-blind users
- ARIA labels on interactive elements
- Smooth focus states

---
**Last Updated**: January 26, 2026
