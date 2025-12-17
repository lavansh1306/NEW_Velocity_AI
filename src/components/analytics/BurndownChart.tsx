import React from 'react';
import { Line } from 'react-chartjs-2';
import type { ProjectAnalytics } from './types';

interface Props {
  data: ProjectAnalytics;
}

export default function BurndownChart({ data }: Props) {
  // time_logs is assumed to be ordered by date
  const labels = data.time_logs.map((t) => t.date);
  // total remaining work: planned_hours minus cumulative logged hours
  let cumulative = 0;
  const remaining = data.time_logs.map((t) => {
    cumulative += t.hours_logged;
    return Math.max(data.planned_hours - cumulative, 0);
  });

  // ideal line: linear interpolation from planned_hours to 0
  const ideal = labels.map((_, i) => data.planned_hours * (1 - i / (labels.length - 1 || 1)));

  const chartData = {
    labels,
    datasets: [
      { label: 'Remaining', data: remaining, borderColor: '#F97316', backgroundColor: 'rgba(249,115,22,0.08)', fill: true },
      { label: 'Ideal', data: ideal, borderColor: '#60A5FA', borderDash: [6, 4], fill: false },
    ],
  };

  const options = {
    plugins: { legend: { position: 'bottom' as const } },
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-64">
      <h4 className="text-sm font-semibold mb-2">Burndown</h4>
      <div className="h-44">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
