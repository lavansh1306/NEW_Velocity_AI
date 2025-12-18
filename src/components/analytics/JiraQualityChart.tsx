import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { ProjectAnalytics } from './types';

interface Props {
  data: ProjectAnalytics;
}

export default function JiraQualityChart({ data }: Props) {
  const bugCount = data.jira_tickets.filter((t) => t.type === 'bug').length;
  const nonBug = data.jira_tickets.length - bugCount;

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
    <div className="bg-white rounded-lg border p-4 h-56">
      <h4 className="text-sm font-semibold mb-2">Jira Quality (bug vs non-bug)</h4>
      <div className="h-36">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
