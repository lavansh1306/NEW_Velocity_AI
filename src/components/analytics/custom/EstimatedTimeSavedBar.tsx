import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import type { MetricsResponse } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function EstimatedTimeSavedBar({ metrics }: { metrics: MetricsResponse | null }) {
  // MetricsResponse provides a single estimatedTimeSavedHours value (total across all apps)
  const totalHours = metrics?.estimatedTimeSavedHours ?? 0;

  // Show as a single horizontal bar
  const data = {
    labels: ['Total'],
    datasets: [
      {
        label: 'Hours Saved',
        data: [totalHours],
        backgroundColor: '#60A5FA',
        borderRadius: 4,
      },
    ],
  };

  const options: any = {
    indexAxis: 'y',
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { title: { display: true, text: 'Hours' } },
      y: { ticks: { autoSkip: false } },
    },
  };

  return (
    <div className="card h-56 flex flex-col">
      <div className="p-4">
        <h3 className="text-sm font-medium">Estimated Human Hours Saved</h3>
        <p className="text-xs text-muted-foreground">By integration (hours)</p>
        {/* Cost display intentionally removed — cost will be shown elsewhere when needed */}
      </div>
      <div className="flex-1 min-h-0 p-4">
        <Bar data={data} options={options} />
      </div>
      
    </div>
  );
}
