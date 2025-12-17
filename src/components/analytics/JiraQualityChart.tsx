import React from 'react';
import { Bar } from 'react-chartjs-2';
import type { ProjectAnalytics } from './types';

interface Props {
  data: ProjectAnalytics;
}

export default function JiraQualityChart({ data }: Props) {
  const bugCount = data.jira_tickets.filter((t) => t.type === 'bug').length;
  const nonBug = data.jira_tickets.length - bugCount;

  const chartData = {
    labels: ['Tickets'],
    datasets: [
      { label: 'Bugs', data: [bugCount], backgroundColor: '#EF4444' },
      { label: 'Non-bug', data: [nonBug], backgroundColor: '#60A5FA' },
    ],
  };

  const options = {
    plugins: { legend: { position: 'bottom' as const } },
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-56">
      <h4 className="text-sm font-semibold mb-2">Jira Quality (bug vs non-bug)</h4>
      <div className="h-36">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
