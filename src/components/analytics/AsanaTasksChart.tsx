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

  const labels = ['Total Tasks', 'Completed (30d)'];
  const values = [asana.tasks_count ?? 0, asana.completed_last_30_days ?? 0];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Count',
        data: values,
        backgroundColor: ['#60A5FA', '#34D399'],
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-56">
      <h4 className="text-sm font-semibold mb-2">Asana Tasks</h4>
      <div className="h-40">
        <Bar data={chartData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
      </div>
    </div>
  );
}
