import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import type { MetricsResponse } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// This component uses automationTrend from MetricsResponse
// Each point has { weekStart, automations }

export default function TotalAutomationsStacked({ metrics }: { metrics: MetricsResponse | null }) {
  const trend = metrics?.automationTrend ?? [];

  const labels = trend.map((t) => t.weekStart);
  // We don't have per-app breakdown in MetricsResponse, so show total as single series
  const totals = trend.map((t) => t.automations);

  const data = {
    labels,
    datasets: [
      { label: 'Automations', data: totals, backgroundColor: '#60A5FA' },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { title: { display: true, text: 'Automations' } } },
  };

  return (
    <div className="card h-56 flex flex-col">
      <div className="p-4">
        <h3 className="text-sm font-medium">Total Automations Executed</h3>
        <p className="text-xs text-muted-foreground">By week</p>
      </div>
      <div className="flex-1 min-h-0 p-4">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
