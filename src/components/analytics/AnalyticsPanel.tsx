import React from 'react';
import type { MetricsResponse } from '@/lib/types';
import AutomationCoverageDonut from './custom/AutomationCoverageDonut';
import TotalAutomationsStacked from './custom/TotalAutomationsStacked';
import EstimatedTimeSavedBar from './custom/EstimatedTimeSavedBar';
import AutomationGrowthTrend from './custom/AutomationGrowthTrend';
import ManualVsAutomated100 from './custom/ManualVsAutomated100';

interface ProjectItem {
  id: string;
  title: string;
}

interface Props {
  project: ProjectItem;
  metrics: MetricsResponse;
}

export default function AnalyticsPanel({ project, metrics }: Props) {
  return (
    <section className="mt-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{project.title} — Analytics</h2>
            <p className="text-sm text-gray-500">Product / Project level metrics and PM dashboard</p>
          </div>
        </div>

        

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          <AutomationCoverageDonut metrics={metrics} />
          <TotalAutomationsStacked metrics={metrics} />
          <EstimatedTimeSavedBar metrics={metrics} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <AutomationGrowthTrend metrics={metrics} />
          <ManualVsAutomated100 metrics={metrics} />
        </div>
      </div>
    </section>
  );
}
