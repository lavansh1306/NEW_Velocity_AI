import React from 'react';
import { Bar } from 'react-chartjs-2';
import type { ProjectAnalyticsWithIntegrations } from './types';

interface Props {
  analytics: ProjectAnalyticsWithIntegrations;
}

export default function AsanaTasksChart({ analytics }: Props) {
  const asana = analytics.asana;
  if (!asana) {
    return (
      <div className="bg-white rounded-lg border p-4 h-56">
        <h4 className="text-sm font-semibold mb-2">Asana Tasks</h4>
        <div className="text-sm text-gray-500">No Asana data available</div>
      </div>
    );
  }

  // Use stacked bar: Completed vs Remaining (based on tasks_count and completed_last_30_days)
  const total = asana.tasks_count ?? 0;
  const completed = Math.min(asana.completed_last_30_days ?? 0, total);
  const remaining = Math.max(total - completed, 0);

  const labels = ['Tasks'];
  const chartData = {
    labels,
    datasets: [
      { label: 'Completed (30d)', data: [completed], backgroundColor: '#34D399' },
      { label: 'Remaining', data: [remaining], backgroundColor: '#60A5FA' },
    ],
  };

  const options = {
    plugins: { legend: { position: 'bottom' as const } },
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-56 overflow-hidden">
      <h4 className="text-sm font-semibold mb-2">Asana Tasks (completed vs remaining)</h4>
      <div className="text-xs text-gray-500 mb-2">Source: Asana — percent complete based on task counts and recent completions</div>
      <div className="h-40 overflow-hidden">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
