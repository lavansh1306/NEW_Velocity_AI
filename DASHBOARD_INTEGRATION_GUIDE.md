# AI Insights Dashboard Integration Guide

This document explains the new dashboard components that have been created based on the new-ui design system.

## 📋 Overview

Two main dashboard components have been created:

### 1. **AIInsightsDashboard** 
A comprehensive dashboard overview showing:
- **KPI Cards**: Active projects, team utilization, available capacity, projects at risk
- **Capacity Overview Chart**: Weekly utilization and available hours visualization
- **Upcoming Deadlines**: Project deadlines with status indicators
- **AI Insights Panel**: AI-powered recommendations with severity indicators

Location: `src/components/dashboard/AIInsightsDashboard.tsx`

### 2. **ProjectDashboardWithInsights**
Detailed project-level dashboard featuring:
- **Project Health & Progress**: Visual health score and completion percentage
- **Timeline Chart**: Planned vs Actual vs Forecast view
- **Skill Distribution**: Pie chart showing resource allocation
- **Task Breakdown**: Detailed task list with estimates vs actual hours
- **AI Insights**: Task-specific recommendations with confirmation workflow

Location: `src/components/dashboard/ProjectDashboardWithInsights.tsx`

## 🚀 Quick Start

### Basic Usage

```tsx
import { AIInsightsDashboard, ProjectDashboardWithInsights } from '@/components/dashboard';

// Use in your app
function MyPage() {
  return (
    <>
      {/* Show overview dashboard */}
      <AIInsightsDashboard />
      
      {/* Or show project-specific dashboard */}
      <ProjectDashboardWithInsights 
        projectId="1" 
        projectName="My Project" 
      />
    </>
  );
}
```

### Accessing the Dashboard

The dashboard is available at:
- Main Dashboard: `/dashboard` (Overview tab)
- Project Details: `/dashboard` (Project Details tab)

## 🎨 Design Features

### Styling & Theme
- **Color Scheme**: Blue primary, with amber, rose, and emerald for status indicators
- **Typography**: Light font weights (300) for elegance
- **Spacing**: Generous padding and gaps for visual breathing room
- **Rounded Elements**: 2xl radius for all containers

### Components Used
- Recharts for data visualization (BarChart, LineChart, PieChart)
- Shadcn UI components (Button, Badge, Progress, Avatar)
- Lucide icons for visual indicators
- Tailwind CSS for styling

## 📊 Data Visualization

### Charts Available

1. **Bar Chart** (Capacity Overview)
   - Shows utilization vs available hours
   - Stacked bars for comparison
   - Custom tooltip styling

2. **Line Chart** (Project Timeline)
   - Shows planned, actual, and forecast lines
   - Dashed lines for planned/forecast
   - Hover tooltips with values

3. **Pie Chart** (Skill Distribution)
   - Inner radius for donut-style visualization
   - Color-coded skills
   - Padding between slices

## 🔄 State Management

### AI Insights States
- **Unconfirmed**: Shown with severity indicator dot, has "View Impact" and "Confirm" buttons
- **Confirmed**: Shown with checkmark, faded appearance
- Click "Confirm" to mark an insight as reviewed

### Customization
```tsx
// AI recommendations can be customized:
const customRecommendations = [
  {
    severity: 'rose', // 'rose', 'amber', or 'emerald'
    title: 'Custom insight title',
    description: 'Detailed description...'
  }
];
```

## 🎯 Key Features

### 1. AI Insights Panel (Sticky)
- Remains visible while scrolling through main content
- Color-coded severity levels:
  - 🔴 **Rose**: Critical/High severity
  - 🟡 **Amber**: Medium severity/Warnings
  - 🟢 **Emerald**: Positive/Opportunities

### 2. KPI Cards
- Large, readable numbers
- Sublabels for additional context
- Hover effects for interactivity

### 3. Status Badges
- Multiple status types supported
- Color-coded based on status
- Consistent styling across components

### 4. Utilization Indicators
- Visual bars showing resource usage
- Color changes based on thresholds:
  - Blue: Normal (< 90%)
  - Amber: High (90-110%)
  - Rose: Critical (> 110%)

## 📱 Responsive Design

The dashboard uses a 12-column grid layout:
- Main content: 8 columns
- AI Insights panel: 4 columns (sticky)
- KPI cards: 4 equal columns
- Stacks responsively on smaller screens

## 🔌 Integration with Real Data

To connect with real data, modify these components:

```tsx
// Replace hardcoded data with API calls
useEffect(() => {
  fetchCapacityData().then(setCapacityData);
  fetchAIInsights().then(setInsights);
  fetchProjectMetrics().then(setProjectMetrics);
}, []);
```

## 🛠️ Customization Examples

### Customize Colors
```tsx
// Modify the severity colors in AI insights
const dotColors: Record<string, string> = {
  rose: 'bg-rose-400',      // Change these
  amber: 'bg-amber-400',
  emerald: 'bg-emerald-400',
};
```

### Add New KPI Cards
```tsx
<KPICard 
  label="Your Metric"
  value="42"
  sublabel="Additional info"
  icon={<YourIcon />}
  trend="+12%"
/>
```

### Customize Chart Data
```tsx
const customData = [
  { week: 'Week 1', utilization: 85, available: 120 },
  // Add more data points...
];

<BarChart data={customData}>
  {/* Chart components */}
</BarChart>
```

## 📈 Performance Considerations

- Charts are wrapped in `ResponsiveContainer` for optimal rendering
- Use memo() for components if they receive heavy prop updates
- Consider virtualizing long task lists for large projects

## 🎓 Learning Resources

- **Recharts**: https://recharts.org/
- **Shadcn UI**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Lucide Icons**: https://lucide.dev/

## 📝 File Structure

```
src/
├── components/
│   └── dashboard/
│       ├── AIInsightsDashboard.tsx      # Main overview dashboard
│       ├── ProjectDashboardWithInsights.tsx  # Project detail dashboard
│       └── index.ts                     # Exports
└── pages/
    └── Dashboard.tsx                    # Dashboard page with tabs
```

## ✅ Checklist for Integration

- [ ] Install dependencies: Recharts is already included
- [ ] Import components from `@/components/dashboard`
- [ ] Add routes to your router if not using the provided Dashboard.tsx
- [ ] Customize data sources for your specific needs
- [ ] Test responsive behavior on different screen sizes
- [ ] Update color schemes to match your brand if needed
- [ ] Connect to real APIs for live data
- [ ] Add loading states for data fetching

## 🐛 Troubleshooting

### Charts not rendering?
- Ensure ResponsiveContainer has a parent with defined height
- Check that chart data is properly formatted

### Styling issues?
- Verify Tailwind CSS is properly configured
- Check that you're using the correct color class names

### Icons not showing?
- Ensure lucide-react is installed
- Check icon names against lucide documentation

---

**Created**: February 2026
**Inspired by**: new-ui design system
**Components**: React, Recharts, Shadcn UI, Tailwind CSS
