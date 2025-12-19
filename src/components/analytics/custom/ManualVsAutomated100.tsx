import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import type { MetricsResponse } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function ManualVsAutomated100({ metrics }: { metrics: MetricsResponse | null }) {
  // manualVsAutomated is an array of { app, manual, automated }
  const data_raw = metrics?.manualVsAutomated ?? [];

  const labels = data_raw.map((d) => d.app);
  const automated = data_raw.map((d) => {
    const total = d.manual + d.automated;
    return total === 0 ? 0 : Math.round((d.automated / total) * 100);
  });
  const manual = automated.map((a) => 100 - a);

  const data = {
    labels,
    datasets: [
      { label: 'Automated %', data: automated, backgroundColor: '#10B981' },
      { label: 'Manual %', data: manual, backgroundColor: '#E5E7EB' },
    ],
  };

  const options: any = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            // ctx.parsed can be a number or an object (for stacked/chart types).
            let value: number | string = ctx.parsed;
            if (value && typeof value === 'object') {
              // prefer the y value when parsed is an object
              value = (value as any).y ?? (value as any).value ?? JSON.stringify(value);
            }
            return `${ctx.dataset.label}: ${value}%`;
          },
        },
      },
    },
    scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: (v: any) => v + '%' } } },
  };

  return (
    <div className="card h-56 flex flex-col">
      <div className="p-4">
        <h3 className="text-sm font-medium">Manual vs Automated</h3>
        <p className="text-xs text-muted-foreground">100% stacked by integration</p>
      </div>
      <div className="flex-1 min-h-0 p-4">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
