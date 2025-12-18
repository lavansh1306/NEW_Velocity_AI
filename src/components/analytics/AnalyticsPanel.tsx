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

        {/* Integration summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {analytics.hubspot && (
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium">HubSpot</h3>
              <div className="text-xs text-gray-600 mt-2">Contacts: {analytics.hubspot.contacts_count ?? '—'}</div>
              <div className="text-xs text-gray-600">Deals: {analytics.hubspot.deals_count ?? '—'}</div>
              <div className="text-xs text-gray-600">Revenue: ${analytics.hubspot.closed_revenue ?? '—'}</div>
            </div>
          )}

          {analytics.asana && (
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium">Asana</h3>
              <div className="text-xs text-gray-600 mt-2">Projects: {analytics.asana.projects_count ?? '—'}</div>
              <div className="text-xs text-gray-600">Tasks: {analytics.asana.tasks_count ?? '—'}</div>
              <div className="text-xs text-gray-600">Done (30d): {analytics.asana.completed_last_30_days ?? '—'}</div>
            </div>
          )}

          {analytics.microsoft365 && (
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium">Microsoft 365</h3>
              <div className="text-xs text-gray-600 mt-2">Emails (meta): {analytics.microsoft365.mail_count ?? '—'}</div>
              <div className="text-xs text-gray-600">Meetings: {analytics.microsoft365.calendar_meetings_count ?? '—'}</div>
            </div>
          )}

          {analytics.zapier && (
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium">Zapier</h3>
              <div className="text-xs text-gray-600 mt-2">Zaps: {analytics.zapier.zaps_count ?? '—'}</div>
              <div className="text-xs text-gray-600">Runs (30d): {analytics.zapier.runs_last_30_days ?? '—'}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <PlannedVsActualChart data={analytics} />
          <AIUsageChart data={analytics} />
          <JiraQualityChart data={analytics} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
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
