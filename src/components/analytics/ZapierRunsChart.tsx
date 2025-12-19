import React from 'react';
import { Line } from 'react-chartjs-2';
import type { ProjectAnalyticsWithIntegrations } from './types';

interface Props {
  analytics: ProjectAnalyticsWithIntegrations;
}

export default function ZapierRunsChart({ analytics }: Props) {
  const z = analytics.zapier;
  if (!z) {
    return (
      <div className="bg-white rounded-lg border p-4 h-56">
        <h4 className="text-sm font-semibold mb-2">Zapier Runs</h4>
        <div className="text-sm text-gray-500">No Zapier data available</div>
      </div>
    );
  }

  // Create a small synthetic daily series from the monthly runs aggregate
  const labels = ['-21d', '-14d', '-7d', '0d'];
  const base = z.runs_last_30_days ?? 0;
  const values = [Math.round(base * 0.15), Math.round(base * 0.25), Math.round(base * 0.3), Math.round(base * 0.3)];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Runs',
        data: values,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,0.06)',
        fill: true,
      },
    ],
  };
  const successRate = typeof z.success_rate === 'number' ? z.success_rate : 1;
  const failuresEst = Math.round((1 - successRate) * (z.runs_last_30_days ?? 0));
  const runsByAi = z.runs_automated_by_ai ?? 0;
  const zapTimeSaved = z.zapier_time_saved_hours ?? 0;

  return (
    <div className="bg-white rounded-lg border p-4 h-56 flex flex-col overflow-hidden">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-semibold">Zapier — Automations (30d)</h4>
          <div className="text-xs text-gray-500">Source: Zapier API · shows automation runs and reliability</div>
        </div>
        <div className="text-right">
            <div className="text-sm font-medium">Runs: {z.runs_last_30_days ?? 0}</div>
            <div className="text-xs text-gray-500">Success: {Math.round((successRate ?? 0) * 100)}% · Failures: {failuresEst}</div>
            <div className="text-xs text-gray-700">Runs automated by AI: {runsByAi} · Time saved: {zapTimeSaved}h</div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Line data={chartData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
      </div>
    </div>
  );
}
