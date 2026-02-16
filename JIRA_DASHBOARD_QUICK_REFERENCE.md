# 🔌 Jira Dashboard Integration - Quick Reference

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Velocity AI Application                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Jira Backend (OAuth Connected)                      │
│         • /api/jira/projects                                     │
│         • /api/jira/issues                                       │
│         • /api/jira/auth/status                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  useJiraData() Hook                              │
│         Location: src/hooks/useJiraData.ts                       │
│         Returns: { issues, loading, error }                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            VelocityAI.tsx (Manager View)                        │
│         Dashboard Tab → Renders JiraPoweredDashboard             │
│         State:                                                   │
│         • jiraIssues (from hook)                                 │
│         • dashboardMetrics (calculated)                          │
│         • upcomingDeadlines (calculated)                         │
│         • jiraData.projects (from API)                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          JiraPoweredDashboard Component                          │
│         Location: src/components/dashboard/                      │
│                   JiraPoweredDashboard.tsx                       │
│                                                                  │
│         Props:                                                   │
│         • jiraIssues: JiraIssue[]                                │
│         • jiraProjects: JiraProject[]                            │
│         • dashboardMetrics: object                               │
│         • upcomingDeadlines: JiraIssue[]                         │
│                                                                  │
│         Output:                                                  │
│         ┌──────────────────────────────────────────┐             │
│         │  KPI Cards (4 columns)                   │             │
│         │  • Active Projects                       │             │
│         │  • Team Utilization                      │             │
│         │  • Available Capacity                    │             │
│         │  • Projects at Risk                      │             │
│         └──────────────────────────────────────────┘             │
│         ┌──────────────────┬──────────────────┐                 │
│         │ Main Content (8) │  AI Insights (4) │                 │
│         ├──────────────────┤                  │                 │
│         │ Capacity Chart   │  • Alert 1       │                 │
│         │ (8-week bars)    │  • Alert 2       │                 │
│         │                  │  • Alert 3       │                 │
│         ├──────────────────┤                  │                 │
│         │ Upcoming         │  [Sticky]        │                 │
│         │ Deadlines (3)    │                  │                 │
│         └──────────────────┴──────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Beautiful UI + Real Data!
```

---

## Data Transformation Flow

```
RAW JIRA DATA                    PROCESSED                    DISPLAYED
─────────────────                ──────────                   ─────────

Issue[] →  Group by         →  { week: "Week 1",     →  Bar Chart
           due date             utilization: 85,          (8 weeks)
                                available: 120 }

Issues[] → Count status     →  activeProjects: 12    →  KPI Card
          'In_Progress'                                 "Active Projects"

Issues[] → Calculate        →  teamUtilization:      →  KPI Card
          business days         87%                      "87% Utilized"

Issues[] → due > today      →  projectsAtRisk: 3     →  KPI Card
          & status≠Done                                  "3 at Risk"

Issues[] → Filter for       →  upcomingDeadlines[]   →  Upcoming
          next 14 days         (3 most urgent)          Deadlines List

Metrics → Analyze           →  aiRecommendations[]   →  AI Insights
          utilization           (severity + title)       Panel
```

---

## Files Involved

### 📂 Directory Structure

```
src/
├── pages/
│   └── VelocityAI.tsx                    ← Integrates dashboard
│       │
│       ├─ imports useJiraData hook
│       ├─ imports JiraPoweredDashboard
│       ├─ calculates dashboardMetrics
│       ├─ calculates upcomingDeadlines
│       └─ passes data to JiraPoweredDashboard
│
├── hooks/
│   └── useJiraData.ts                    ← Fetches Jira data
│       └─ returns: { issues, loading, error }
│
├── components/
│   └── dashboard/
│       ├── JiraPoweredDashboard.tsx      ← Main component (NEW!)
│       ├── AIInsightsDashboard.tsx       ← Demo version
│       ├── ProjectDashboardWithInsights.tsx
│       ├── index.ts                      ← Exports
│       ├── EXAMPLES.tsx
│       └── (old component files...)
│
└── api/
    └── (Jira endpoints)
        ├─ /api/jira/projects
        ├─ /api/jira/issues
        └─ /api/jira/auth/status
```

---

## Props Passing Chain

```
VelocityAI.tsx
    │
    ├─ const jiraIssues = useJiraData()  [state from hook]
    ├─ const dashboardMetrics = { ... }  [useMemo calculation]
    ├─ const upcomingDeadlines = { ... } [useMemo calculation]
    └─ const jiraData = { projects }     [state from fetchJiraData]
    
         ↓
    
    <JiraPoweredDashboard
      jiraIssues={jiraIssues}
      jiraProjects={jiraData?.projects}
      dashboardMetrics={dashboardMetrics}
      upcomingDeadlines={upcomingDeadlines}
    />
    
         ↓
    
    JiraPoweredDashboard.tsx
    └─ Uses props to render:
       • KPI Cards
       • Capacity Chart
       • Upcoming Deadlines
       • AI Insights
```

---

## State Variables Used

In VelocityAI.tsx:

```tsx
// From useJiraData hook
const { issues: jiraIssues, loading: jiraLoading } = useJiraData();

// From API
const [jiraData, setJiraData] = useState(null);

// Calculated metrics (useMemo)
const dashboardMetrics = useMemo(() => ({
  activeProjects: number,
  projectsAtRisk: number,
  teamUtilization: number,
  availableCapacity: number,
  teamMembers: number,
  totalTasks: number,
  totalAllocated: number
}), [jiraIssues, dateFrom, dateTo]);

// Upcoming deadlines (useMemo)
const upcomingDeadlines = useMemo(() => {
  return jiraIssues.filter(/* deadline logic */);
}, [jiraIssues]);
```

---

## Component Props Type

```typescript
interface JiraDashboardProps {
  jiraIssues: JiraIssue[];
  jiraProjects: JiraProject[];
  dashboardMetrics: {
    activeProjects: number;
    projectsAtRisk: number;
    teamUtilization: number;
    availableCapacity: number;
    teamMembers: number;
    totalTasks: number;
    totalAllocated: number;
  };
  upcomingDeadlines: JiraIssue[];
}
```

---

## How Data Transforms

### Example: "Active Projects" KPI

```
Step 1: Fetch from Jira
  jiraIssues = [
    { status: "In_Progress", key: "PROJ-1" },
    { status: "Done", key: "PROJ-2" },
    { status: "In_Progress", key: "PROJ-3" }
  ]

Step 2: Calculate in VelocityAI
  dashboardMetrics.activeProjects = 
    Filter issues with status = "In_Progress"
    → 2 active projects

Step 3: Pass to JiraPoweredDashboard
  <JiraPoweredDashboard
    dashboardMetrics={{ activeProjects: 2 }}
  />

Step 4: Render in Component
  <KPICard
    label="Active Projects"
    value={dashboardMetrics.activeProjects}  // Shows "2"
  />

Result: KPI Card displays "2"
```

---

## Update Cycle

```
1. Page Loads
   └─ useJiraData hook fetches issues
   
2. Issues Loaded
   └─ dashboardMetrics calculated
   └─ upcomingDeadlines calculated
   
3. Data Passes to Component
   └─ JiraPoweredDashboard renders with data
   
4. Charts Render
   └─ Bar chart uses capacityData
   └─ Status badges use issue data
   └─ AI insights analyze metrics
   
5. User Sees
   └─ Beautiful dashboard with real data!
   
6. Data Changes (Jira updated)
   └─ useJiraData refetches
   └─ Loop repeats → Charts update
```

---

## Key Integration Points

| Point | Location | Purpose |
|-------|----------|---------|
| Import | VelocityAI.tsx line ~15 | Bring component in |
| Render | VelocityAI.tsx line ~1043 | Replace ModernDashboard |
| Props | VelocityAI.tsx line ~1044-1047 | Pass real data |
| Calculation | VelocityAI.tsx line ~550+ | Generate metrics |
| Hook | VelocityAI.tsx line ~180 | Get Jira data |

---

## Testing Points

✓ **Is data flowing?**
  - Open DevTools Console
  - Check jiraIssues array has data
  - Check dashboardMetrics has values
  
✓ **Is component rendering?**
  - Dashboard tab visible
  - KPI cards show numbers
  - Charts display data

✓ **Are calculations correct?**
  - Compare displayed numbers
  - Check Jira issue counts
  - Verify date calculations

---

## Quick Troubleshooting

**Component not showing?**
```
Check VelocityAI.tsx line 1041-1050
{activeTab === 'dashboard' && (
  <JiraPoweredDashboard ... />  // Should render here
)}
```

**Data empty?**
```
Check useJiraData hook
const { issues: jiraIssues } = useJiraData()
console.log('jiraIssues:', jiraIssues); // Debug here
```

**Props undefined?**
```
Verify in JiraPoweredDashboard.tsx
console.log('props:', { jiraIssues, dashboardMetrics });
```

---

## Summary

The JiraPoweredDashboard is now:
- ✅ **Integrated** into VelocityAI page
- ✅ **Connected** to real Jira data
- ✅ **Displaying** live metrics and charts
- ✅ **Responsive** and interactive
- ✅ **Updating** automatically

All your Jira data flows through a clean pipeline to create beautiful, actionable insights! 🚀
