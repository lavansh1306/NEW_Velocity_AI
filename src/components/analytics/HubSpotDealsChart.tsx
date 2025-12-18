import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { ProjectAnalyticsWithIntegrations } from './types';

interface Props {
  analytics: ProjectAnalyticsWithIntegrations;
}

export default function HubSpotDealsChart({ analytics }: Props) {
  const hub = analytics.hubspot;
  if (!hub || !hub.deals_by_stage) {
    return (
      <div className="bg-white rounded-lg border p-4 h-56">
        <h4 className="text-sm font-semibold mb-2">HubSpot Deals</h4>
        <div className="text-sm text-gray-500">No HubSpot deals data available</div>
      </div>
    );
  }

  const labels = hub.deals_by_stage.map((d) => d.stage);
  const data = hub.deals_by_stage.map((d) => d.count);

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: ['#60A5FA', '#F97316', '#34D399', '#FCA5A5'],
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-56">
      <h4 className="text-sm font-semibold mb-2">HubSpot Deals by Stage</h4>
      <div className="text-xs text-gray-500 mb-2">Closed revenue: ${hub.closed_revenue ?? '—'} · Source: HubSpot (deals)</div>
      <div className="h-40">
        <Doughnut data={chartData} />
      </div>
    </div>
  );
}
