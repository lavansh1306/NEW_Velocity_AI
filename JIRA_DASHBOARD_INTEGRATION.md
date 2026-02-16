# Jira-Powered Dashboard Integration

## 🎯 Overview

The new **JiraPoweredDashboard** component has been integrated into your Velocity AI application. It automatically pulls real data from your Jira backend and displays it in a beautiful, modern dashboard interface.

## 📍 Location

- **Component**: `src/components/dashboard/JiraPoweredDashboard.tsx`
- **Integration**: `src/pages/VelocityAI.tsx` (Manager View → Dashboard tab)
- **Exports**: `src/components/dashboard/index.ts`

## 🔗 What It Does

The dashboard automatically connects to your Jira backend data and displays:

### 1. **Real-Time Metrics** (KPI Cards)
- Active Projects count (from Jira projects)
- Team Utilization % (calculated from issue durations)
- Available Capacity (in hours)
- Projects at Risk (overdue/behind schedule)

### 2. **Capacity Overview Chart**
- 8-week visualization
- Utilization trends
- Available hours per week
- Based on actual Jira issue due dates and durations

### 3. **Upcoming Deadlines**
- Shows next 3 issues with due dates
- Days remaining calculation
- Status indicators (Active/Not Started/Completed)
- Pulled directly from Jira issues

### 4. **AI Insights Panel** (Smart Recommendations)
- Detects overutilization (>100%)
- Warns about high utilization (>85%)
- Flags projects at risk
- Identifies available capacity opportunities
- All based on actual Jira metrics

## 🚀 How It's Used

### In the VelocityAI Page

```tsx
{activeTab === 'dashboard' && (
  <JiraPoweredDashboard 
    jiraIssues={jiraIssues}              // Real Jira issues
    jiraProjects={jiraData?.projects || []}  // Real Jira projects
    dashboardMetrics={dashboardMetrics}   // Calculated metrics
    upcomingDeadlines={upcomingDeadlines} // Computed deadlines
  />
)}
```

### Data Flow

```
Jira Backend API
       ↓
useJiraData() hook (in VelocityAI)
       ↓
jiraIssues state
       ↓
JiraPoweredDashboard component
       ↓
Beautiful charts & insights
```

## 📊 Data Transformations

### From Jira Issues to Dashboard

1. **Issues → KPI Metrics**
   ```
   Issues with status 'In_Progress' → Active Projects
   Duration calculations → Utilization %
   Business day calculations → Available Capacity
   Overdue issues → Projects at Risk
   ```

2. **Issues → Capacity Chart**
   ```
   Group issues by due date → 8 weeks
   Count issues per week → Calculate utilization
   Total team hours - utilized hours → Available
   ```

3. **Issues → Recommendations**
   ```
   Analyze utilization % → Generate insights
   Check for overallocation → Red flags
   Identify capacity gaps → Green opportunities
   ```

## 📈 Chart Types

### 1. Bar Chart (Capacity Overview)
- **Showing**: Weekly utilization vs available hours
- **Data Source**: jiraIssues grouped by due date
- **Update**: Real-time as Jira data changes

### 2. Status Badges
- **Ready**: Done, Completed, Approved
- **Active**: In Progress, In_Progress, Active
- **Warning**: Pending, Not Started, To Do
- **Risk**: Delayed, At Risk

## 🔄 Real-Time Updates

The dashboard updates automatically when:
1. New Jira issues are fetched
2. Issues are updated in Jira
3. Team members change
4. Deadlines are adjusted

`useJiraData()` hook provides fresh data, which flows to `JiraPoweredDashboard`

## 📋 Interface Props

```tsx
interface JiraDashboardProps {
  jiraIssues: JiraIssue[];        // Array of Jira issues
  jiraProjects: JiraProject[];    // Array of Jira projects
  dashboardMetrics: {             // Calculated dashboard metrics
    activeProjects: number;
    projectsAtRisk: number;
    teamUtilization: number;
    availableCapacity: number;
    teamMembers: number;
    totalTasks: number;
    totalAllocated: number;
  };
  upcomingDeadlines: JiraIssue[]; // Filtered issues with due dates
}
```

## 🎨 Styling

The dashboard uses:
- **Font**: Light (300) weight for elegance
- **Colors**: Blue primary, with amber/rose/emerald for status
- **Layout**: 8-column main + 4-column sticky sidebar
- **Responsive**: Works on desktop, adapts for mobile
- **Theme**: Light mode with subtle shadows and borders

## 🔧 Customization

### Change Update Frequency
```tsx
// In VelocityAI.tsx
useEffect(() => {
  const interval = setInterval(() => {
    // Refresh Jira data
  }, 30000); // 30 seconds
}, []);
```

### Modify AI Insights Logic
```tsx
// In JiraPoweredDashboard.tsx
const aiRecommendations = useMemo(() => {
  // Customize conditions here
  if (dashboardMetrics.teamUtilization > 90) {
    // Add your custom logic
  }
}, [dashboardMetrics]);
```

### Adjust Chart Data
```tsx
// Change number of weeks shown
for (let i = 0; i < 12; i++) { // was 8, now 12
  // Generate 12 weeks instead of 8
}
```

## 🐛 Troubleshooting

### Charts not showing data
- ✅ Verify `jiraIssues` prop has data
- ✅ Check browser console for errors
- ✅ Ensure Jira connection is established

### Metrics showing zero
- ✅ Confirm Jira issues have due dates
- ✅ Check issue status values match expected ones
- ✅ Verify team members are assigned to issues

### No AI insights appearing
- ✅ Check `dashboardMetrics` has valid numbers
- ✅ Review insight generation logic
- ✅ Ensure conditions are being met

## 📝 Data Sources Reference

| Field | Source | Type |
|-------|--------|------|
| Projects | `jiraProjects` | Array |
| Issues | `jiraIssues` | Array |
| Durations | `issue.duration` or calculated from dates | Number |
| Status | `issue.status` | String |
| Assignee | `issue.assignee` | String |
| Due Date | `issue.due` | Date string |
| Start Date | `issue.start` | Date string |

## 🔐 Permissions Required

User must have Jira access to:
- ✅ View projects
- ✅ View issues
- ✅ View issue details (dates, assignees)
- ✅ OAuth token scopes include project and issue reading

## 📊 Performance Notes

- **Capacity Chart**: Recalculates on each new data fetch
- **AI Insights**: Memoized to prevent unnecessary recalculations
- **Status Badges**: Instant status display
- **Responsive Container**: Charts auto-resize on window resize

## 🚀 Future Enhancements

Potential additions:
- [ ] Export dashboard to PDF/CSV
- [ ] Custom date range selection
- [ ] Advanced filtering (by team member, skill, project)
- [ ] Historical data tracking
- [ ] Predictive analytics
- [ ] Team performance comparisons
- [ ] Resource forecasting
- [ ] Budget impact analysis

## 📚 Related Files

- `src/components/dashboard/index.ts` - Exports
- `src/hooks/useJiraData.ts` - Data fetching hook
- `src/pages/VelocityAI.tsx` - Main integration
- `src/components/demo2/VPDashboard.tsx` - VP Dashboard (alternative view)

## 🎓 Learning Resources

- **Recharts** (Charts): https://recharts.org/
- **Shadcn UI** (Components): https://ui.shadcn.com/
- **Jira API**: https://developer.atlassian.com/cloud/jira/rest/

---

**Status**: ✅ Active and Connected to Jira
**Last Updated**: February 17, 2026
**Component**: JiraPoweredDashboard
