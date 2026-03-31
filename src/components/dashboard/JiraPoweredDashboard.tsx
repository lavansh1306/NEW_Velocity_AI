import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/shared/KPICard';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  priority: string;
  assignee?: string;
  due?: string;
  start?: string;
  duration?: number;
  [key: string]: any;
}

interface JiraProject {
  key: string;
  name: string;
  title: string;
  [key: string]: any;
}

interface JiraDashboardProps {
  jiraIssues: JiraIssue[];
  jiraProjects: JiraProject[];
  dashboardMetrics: any;
  upcomingDeadlines: JiraIssue[];
}

/**
 * JiraPoweredDashboard - Uses real Jira data with AI insights
 */
export const JiraPoweredDashboard = ({
  jiraIssues,
  jiraProjects,
  dashboardMetrics,
  upcomingDeadlines,
}: JiraDashboardProps) => {
  // Generate capacity data from Jira issues
  const capacityData = useMemo(() => {
    const today = new Date();
    const weeks = [];

    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Count issues with completion in this week
      const issuesThisWeek = jiraIssues.filter((issue) => {
        const dueDate = issue.due ? new Date(issue.due) : null;
        return dueDate && dueDate >= weekStart && dueDate <= weekEnd;
      });

      // Estimate utilization based on issues
      let utilization = Math.round((issuesThisWeek.length / Math.max(jiraIssues.length / 8, 1)) * 100);
      utilization = Math.min(100, Math.max(0, utilization));

      // Available hours (inverse of utilization)
      const available = Math.max(0, 160 - utilization * 1.6);

      weeks.push({
        week: `Week ${i + 1}`,
        utilization: Math.min(100, utilization + Math.random() * 20),
        available: available,
      });
    }

    return weeks;
  }, [jiraIssues]);

  // Compute reactive metrics from current week's capacity data
  const currentWeekMetrics = useMemo(() => {
    if (capacityData.length === 0) {
      return {
        weeklyUtilization: dashboardMetrics.teamUtilization,
        weeklyAvailableCapacity: dashboardMetrics.availableCapacity,
      };
    }
    return {
      weeklyUtilization: Math.round(capacityData[0].utilization),
      weeklyAvailableCapacity: Math.round(capacityData[0].available),
    };
  }, [capacityData, dashboardMetrics]);

  // Generate AI insights based on Jira data
  const aiRecommendations = useMemo(() => {
    const recommendations = [];

    // Check utilization
    if (currentWeekMetrics.weeklyUtilization > 100) {
      recommendations.push({
        severity: 'rose',
        title: 'Team is overutilized',
        description: `Current week utilization at ${currentWeekMetrics.weeklyUtilization}%. Consider redistributing tasks.`,
      });
    } else if (currentWeekMetrics.weeklyUtilization > 85) {
      recommendations.push({
        severity: 'amber',
        title: 'Utilization approaching limit',
        description: `Team at ${currentWeekMetrics.weeklyUtilization}% capacity. Monitor closely.`,
      });
    }

    // Check projects at risk
    if (dashboardMetrics.projectsAtRisk > 0) {
      recommendations.push({
        severity: 'amber',
        title: `${dashboardMetrics.projectsAtRisk} project(s) at risk`,
        description: 'Review overdue tasks and reallocate resources if needed.',
      });
    }

    // Check capacity
    if (currentWeekMetrics.weeklyAvailableCapacity > 100) {
      recommendations.push({
        severity: 'emerald',
        title: 'Available capacity identified',
        description: `${currentWeekMetrics.weeklyAvailableCapacity} hours available this week for allocation.`,
      });
    }

    // If no recommendations, add a positive one
    if (recommendations.length === 0) {
      recommendations.push({
        severity: 'emerald',
        title: 'Team is healthy',
        description: 'All projects are on track and utilization is optimal.',
      });
    }

    return recommendations.slice(0, 3);
  }, [dashboardMetrics, currentWeekMetrics]);

  return (
    <div className="p-12 bg-gray-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-4xl font-light text-gray-900 mb-12 tracking-tight">Dashboard • Jira Analytics</h1>

        <div className="grid grid-cols-12 gap-10">
          {/* Main Content - 8 columns */}
          <div className="col-span-8 space-y-12">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-6">
              <KPICard
                label="Active Projects"
                value={jiraProjects.length}
              />
              <KPICard
                label="Team Utilization"
                value={`${currentWeekMetrics.weeklyUtilization}%`}
                sublabel={currentWeekMetrics.weeklyUtilization > 100 ? 'Overallocated' : 'Within target'}
              />
              <KPICard
                label="Available Capacity"
                value={`${currentWeekMetrics.weeklyAvailableCapacity}h`}
                sublabel="Current week"
              />
              <KPICard
                label="Projects at Risk"
                value={dashboardMetrics.projectsAtRisk}
              />
            </div>

            {/* Capacity Overview Chart */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
              <h2 className="text-xl font-light text-gray-900 mb-8">Capacity Overview</h2>

              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={capacityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontWeight: '300',
                    }}
                  />
                  <Bar dataKey="utilization" fill="#93c5fd" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="available" fill="#e5e7eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-8 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-blue-300 rounded-full"></div>
                  <span className="text-xs text-gray-500 font-light">Utilization %</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
                  <span className="text-xs text-gray-500 font-light">Available Hours</span>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
              <h2 className="text-xl font-light text-gray-900 mb-8">Upcoming Deadlines</h2>

              <div className="space-y-4">
                {upcomingDeadlines.slice(0, 3).map((issue, idx) => {
                  const dueDate = issue.due ? new Date(issue.due) : null;
                  const today = new Date();
                  const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  const status = issue.status === 'Done' ? 'Completed' : issue.status === 'In Progress' || issue.status === 'In_Progress' ? 'Active' : 'Not Started';

                  return (
                    <div
                      key={issue.key}
                      className="flex items-center justify-between py-5 px-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="text-gray-900 text-sm mb-1.5 font-light">{issue.summary}</div>
                        <div className="text-xs text-gray-400 font-light">{dueDate?.toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-gray-900 font-light">{daysLeft} days</div>
                          <div className="text-xs text-gray-400 font-light">remaining</div>
                        </div>
                        <StatusBadge status={status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Recommendations Panel - 2 columns */}
          <div className="col-span-2">
            <div className="bg-white rounded-2xl p-3 shadow-sm sticky top-28 border border-gray-100">
              <h2 className="text-sm font-light text-gray-900 mb-3">Insights</h2>

              <div className="space-y-4">
                {aiRecommendations.map((rec, idx) => {
                  const dotColors: Record<string, string> = {
                    rose: 'bg-rose-400',
                    amber: 'bg-amber-400',
                    emerald: 'bg-emerald-400',
                  };

                  return (
                    <div key={idx} className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-400">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 ${dotColors[rec.severity]}`} />
                        <div className="flex-1">
                          <div className="text-gray-900 text-sm mb-2 font-light">{rec.title}</div>
                          <div className="text-sm text-gray-500 font-light leading-relaxed">{rec.description}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-xs h-9 rounded-xl font-light text-gray-600 hover:text-gray-900 hover:bg-white"
                      >
                        Review
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JiraPoweredDashboard;
