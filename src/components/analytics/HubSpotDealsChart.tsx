import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { ProjectAnalyticsWithIntegrations } from './types';

interface Props {
  analytics: ProjectAnalyticsWithIntegrations;
}

export default function HubSpotDealsChart({ analytics }: Props) {
  const hub = analytics.hubspot;
  if (!hub) {
    return (
      <div className="bg-white rounded-lg border p-4 h-56 min-h-0 min-w-0 overflow-hidden">
        <h4 className="text-sm font-semibold mb-2">HubSpot Deals</h4>
        <div className="text-sm text-gray-500">No HubSpot deals data available</div>
      </div>
    );
  }

  // Use hubspot_time_saved_hours compared to other integration savings if available
  const hubSaved = hub.hubspot_time_saved_hours ?? analytics.integration_savings?.hubspot ?? 0;
  const integrationTotals = analytics.integration_savings
    ? Object.values(analytics.integration_savings).reduce((s, v) => s + (v || 0), 0)
    : hubSaved;
  const other = Math.max(0, integrationTotals - hubSaved);

  const chartData = {
    labels: ['HubSpot', 'Other integrations'],
    datasets: [
      {
        data: [hubSaved, other],
        backgroundColor: ['#34D399', '#60A5FA'],
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { legend: { position: 'right' as const } },
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-56 min-h-0 min-w-0 flex flex-col overflow-hidden">
      <h4 className="text-sm font-semibold mb-2">HubSpot Deals by Stage</h4>
      <div className="text-xs text-gray-500 mb-2">Closed revenue: ${hub.closed_revenue ?? '—'} · Source: HubSpot (deals)</div>
      <div className="text-xs text-gray-700 mb-3">HubSpot time saved: {hubSaved}h</div>
      <div className="flex-1 min-h-0">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
