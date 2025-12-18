import React from 'react';
import type { ProjectItem, ProjectAnalyticsWithIntegrations } from './types';
import PlannedVsActualChart from './PlannedVsActualChart';
import GanttChart from './GanttChart';
import AIUsageChart from './AIUsageChart';
import JiraQualityChart from './JiraQualityChart';
import BurndownChart from './BurndownChart';
import HubSpotDealsChart from './HubSpotDealsChart';
import AsanaTasksChart from './AsanaTasksChart';
import Microsoft365MeetingsChart from './Microsoft365MeetingsChart';
import ZapierRunsChart from './ZapierRunsChart';

interface Props {
  project: ProjectItem;
  analytics: ProjectAnalyticsWithIntegrations;
}

export default function AnalyticsPanel({ project, analytics }: Props) {
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
          <PlannedVsActualChart data={analytics} />
          <AIUsageChart data={analytics} />
          <JiraQualityChart data={analytics} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4 items-start">
          <HubSpotDealsChart analytics={analytics} />
          <AsanaTasksChart analytics={analytics} />
          <Microsoft365MeetingsChart analytics={analytics} />
          <ZapierRunsChart analytics={analytics} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <GanttChart data={analytics} />
          <BurndownChart data={analytics} />
        </div>
      </div>
    </section>
  );
}
