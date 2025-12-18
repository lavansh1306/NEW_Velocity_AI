import React from 'react';
import { Bar } from 'react-chartjs-2';
import ChartJS from './chartSetup';
import type { ProjectAnalytics } from './types';

interface Props {
  data: ProjectAnalytics;
}

export default function PlannedVsActualChart({ data }: Props) {
  const labels = ['Planned', 'Actual'];
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Hours',
        data: [data.planned_hours, data.actual_hours],
        backgroundColor: ['#60A5FA', '#F97316'],
      },
    ],
  };

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  } as const;

  return (
    <div className="bg-white rounded-lg border p-4 h-64">
      <h4 className="text-sm font-semibold mb-2">Planned vs Actual (hours)</h4>
      <div className="text-xs text-gray-500 mb-3">Source: JIRA estimates & worklogs · shows total planned vs logged effort</div>
      <div className="h-44">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
