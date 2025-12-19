import React from 'react';
import { Bar } from 'react-chartjs-2';
import type { ProjectAnalytics } from './types';

interface Props {
  data: ProjectAnalytics;
}

export default function AIUsageChart({ data }: Props) {
  const usage = data.ai_tool_usage ?? data.ai_usage ?? [];
  const labels = usage.map((a) => a.tool);
  const values = usage.map((a) => a.hours);
  const totalAiHours = data.ai_hours_used ?? values.reduce((s, v) => s + v, 0);
  const timeSaved = data.ai_time_saved_hours ?? null;

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
    scales: {
      x: { beginAtZero: true },
      y: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 0, align: 'start' as const } },
    },
    layout: { padding: { left: 8, right: 8, top: 4, bottom: 4 } },
    datasets: { bar: { maxBarThickness: 18, borderRadius: 6 } },
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-48 flex flex-col overflow-hidden">
      <h4 className="text-sm font-semibold mb-2">AI Tool Usage (hours)</h4>
      <div className="text-xs text-gray-500 mb-2">Source: Internal AI telemetry · shows hours spent using AI tools</div>
      <div className="text-xs text-gray-700 mb-3">Total AI hours: {totalAiHours}{timeSaved ? ` · Time saved: ${timeSaved}h (${Math.round((timeSaved / Math.max(1, totalAiHours)) * 100)}%)` : ''}</div>
      <div className="flex-1 min-h-0">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
