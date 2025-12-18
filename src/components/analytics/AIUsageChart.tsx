import React from 'react';
import { Bar } from 'react-chartjs-2';
import type { ProjectAnalytics } from './types';

interface Props {
  data: ProjectAnalytics;
}

export default function AIUsageChart({ data }: Props) {
  const labels = data.ai_usage.map((a) => a.tool);
  const values = data.ai_usage.map((a) => a.hours);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'AI hours',
        data: values,
        backgroundColor: '#34D399',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { beginAtZero: true }, y: { grid: { display: false } } },
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-48">
      <h4 className="text-sm font-semibold mb-2">AI Tool Usage (hours)</h4>
      <div className="text-xs text-gray-500 mb-2">Source: Internal AI telemetry · shows hours spent using AI tools</div>
      <div className="h-36">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
