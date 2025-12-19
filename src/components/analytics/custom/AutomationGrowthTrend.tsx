import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';
import type { MetricsResponse } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

export default function AutomationGrowthTrend({ metrics }: { metrics: MetricsResponse | null }) {
  const trend = metrics?.automationTrend ?? [];
  const labels = trend.map((t) => t.weekStart);
  const totals = trend.map((t) => t.automations);

  const data = {
    labels,
    datasets: [
      {
        label: 'Total Automations',
        data: totals,
        borderColor: '#60A5FA',
        backgroundColor: 'rgba(96,165,250,0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options: any = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { title: { display: true, text: 'Automations' } } },
  };

  return (
    <div className="card h-56 flex flex-col">
      <div className="p-4">
        <h3 className="text-sm font-medium">Automation Growth Trend</h3>
        <p className="text-xs text-muted-foreground">Total automations over time</p>
      </div>
      <div className="flex-1 min-h-0 p-4">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
