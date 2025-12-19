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

  // Use stacked horizontal bar: Automated (AI) vs Remaining
  const total = asana.tasks_total ?? asana.tasks_count ?? asana.projects_count ?? 0;
  const automated = asana.tasks_automated_count ?? asana.tasks_automated ?? asana.completed_last_30_days ?? 0;
  const safeAutomated = Math.min(total, automated || 0);
  const remaining = Math.max(total - safeAutomated, 0);

  const labels = ['Tasks'];
  const chartData = {
    labels,
    datasets: [
      { label: 'Automated (AI)', data: [safeAutomated], backgroundColor: '#34D399' },
      { label: 'Remaining', data: [remaining], backgroundColor: '#60A5FA' },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    plugins: { legend: { position: 'bottom' as const } },
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { stacked: true, beginAtZero: true }, y: { stacked: true, grid: { display: false } } },
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-64 flex flex-col overflow-hidden">
      <h4 className="text-sm font-semibold mb-2">Asana Tasks (automated vs remaining)</h4>
      <div className="text-xs text-gray-500 mb-2">Source: Asana — shows tasks automated by AI</div>
      <div className="text-xs text-gray-700 mb-3">AI time saved: {asana.asana_time_saved_hours ?? '—'}h · Automated: {safeAutomated} / {total}</div>
      <div className="flex-1 min-h-0">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
