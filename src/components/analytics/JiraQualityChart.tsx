import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { ProjectAnalytics } from './types';

interface Props {
  data: ProjectAnalytics;
}

export default function JiraQualityChart({ data }: Props) {
  if ((data as any).jira_available === false) {
    return (
      <div className="bg-white rounded-lg border p-4 h-64 flex items-center justify-center">
        <div className="text-sm text-gray-500">No Jira data available</div>
      </div>
    );
  }
  const bugCount = data.jira_tickets.filter((t) => t.type === 'bug').length;
  const nonBug = data.jira_tickets.length - bugCount;
  const total = Math.max(1, bugCount + nonBug);
  const bugPct = Math.round((bugCount / total) * 100);
  const nonBugPct = 100 - bugPct;

  const chartData = {
    labels: ['Bugs', 'Non-bug'],
    datasets: [
      {
        data: [bugCount, nonBug],
        backgroundColor: ['#EF4444', '#60A5FA'],
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    plugins: { legend: { position: 'bottom' as const } },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-48 flex flex-col overflow-hidden">
      <h4 className="text-sm font-semibold mb-2">Jira Quality (bug vs non-bug)</h4>
      <div className="text-xs text-gray-500 mb-2">Bugs: {bugCount} ({bugPct}%) · Non-bug: {nonBug} ({nonBugPct}%) · Source: JIRA issues</div>
      <div className="flex-1 min-h-0">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
