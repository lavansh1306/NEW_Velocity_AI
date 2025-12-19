import React from 'react';
import { Line } from 'react-chartjs-2';
import type { ProjectAnalyticsWithIntegrations } from './types';

interface Props {
  analytics: ProjectAnalyticsWithIntegrations;
}

export default function Microsoft365MeetingsChart({ analytics }: Props) {
  const ms = analytics.microsoft365;
  if (!ms || !ms.last_sync) {
    return (
      <div className="bg-white rounded-lg border p-4 h-56">
        <h4 className="text-sm font-semibold mb-2">Microsoft 365 Meetings</h4>
        <div className="text-sm text-gray-500">No Microsoft 365 data available</div>
      </div>
    );
  }

  // For the fake dataset we have aggregates; create a small synthetic timeseries for the chart
  const labels = ['-30d', '-20d', '-10d', '0d'];
  const base = ms.meeting_duration_minutes ?? (ms.meeting_duration_minutes ?? 0);
  const values = [Math.round(base * 0.6), Math.round(base * 0.8), Math.round(base * 0.9), Math.round(base)];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Meeting minutes',
        data: values,
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        fill: true,
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-56 flex flex-col overflow-hidden">
      <h4 className="text-sm font-semibold mb-2">Microsoft 365 Meeting Load</h4>
      <div className="text-xs text-gray-500 mb-2">Total meeting minutes (approx) · Source: Microsoft Graph metadata</div>
      <div className="text-xs text-gray-700 mb-3">Meeting minutes saved: {ms.meeting_minutes_saved ?? '—'} · Time saved: {ms.microsoft365_time_saved_hours ?? '—'}h</div>
      <div className="flex-1 min-h-0">
        <Line data={chartData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
      </div>
    </div>
  );
}
