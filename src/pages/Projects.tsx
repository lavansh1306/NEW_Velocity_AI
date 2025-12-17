import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel';
import type { ProjectItem, ProjectAnalytics } from '@/components/analytics/types';

const projects: ProjectItem[] = [
  {
    id: '01',
    title: 'RetailFlow Analytics',
    category: 'Retail Operations',
    description:
      'Built an integrated inventory management and demand forecasting system for a mid-market retail chain. Reduced stockouts by 32% and optimized warehouse operations, saving $450k annually in operational overhead.',
    image:
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=800&fit=crop',
    link: '#',
    tags: ['Inventory', 'Analytics', 'Operations'],
    color: '#d97706',
  },
  {
    id: '02',
    title: 'CloudSync Enterprise',
    category: 'Infrastructure Platform',
    description:
      "Designed a multi-tenant cloud infrastructure orchestration platform enabling real-time resource allocation, auto-scaling, and cost optimization across distributed systems.",
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop',
    link: '#',
    tags: ['Cloud', 'Infrastructure', 'DevOps'],
    color: '#2563EB',
  },
];

// MOCKED analytics data per project id (shaped per requirements)
const analyticsData: Record<string, ProjectAnalytics> = {
  '01': {
    planned_hours: 240,
    actual_hours: 200,
    tasks: [
      { task_name: 'Design', start_date: '2025-01-01', end_date: '2025-01-10', planned_hours: 40, actual_hours: 36 },
      { task_name: 'Implementation', start_date: '2025-01-11', end_date: '2025-02-15', planned_hours: 120, actual_hours: 110 },
      { task_name: 'QA', start_date: '2025-02-16', end_date: '2025-02-28', planned_hours: 80, actual_hours: 54 },
    ],
    ai_usage: [
      { tool: 'Copilot', hours: 30 },
      { tool: 'GPT-Assist', hours: 24 },
      { tool: 'AutoTest', hours: 12 },
    ],
    jira_tickets: [
      { type: 'bug' },
      { type: 'bug' },
      { type: 'non-bug' },
      { type: 'non-bug' },
      { type: 'bug' },
    ],
    time_logs: [
      { date: '2025-01-01', hours_logged: 8 },
      { date: '2025-01-05', hours_logged: 6 },
      { date: '2025-01-15', hours_logged: 10 },
      { date: '2025-01-25', hours_logged: 12 },
      { date: '2025-02-05', hours_logged: 14 },
      { date: '2025-02-15', hours_logged: 30 },
    ],
  },
  '02': {
    planned_hours: 360,
    actual_hours: 310,
    tasks: [
      { task_name: 'Discovery', start_date: '2025-02-01', end_date: '2025-02-07', planned_hours: 40, actual_hours: 36 },
      { task_name: 'Integrations', start_date: '2025-02-08', end_date: '2025-03-15', planned_hours: 200, actual_hours: 180 },
      { task_name: 'Verification', start_date: '2025-03-16', end_date: '2025-04-10', planned_hours: 120, actual_hours: 94 },
    ],
    ai_usage: [
      { tool: 'Velocity Assist', hours: 60 },
      { tool: 'DataMapper', hours: 28 },
    ],
    jira_tickets: [
      { type: 'non-bug' },
      { type: 'non-bug' },
      { type: 'bug' },
      { type: 'non-bug' },
    ],
    time_logs: [
      { date: '2025-02-01', hours_logged: 5 },
      { date: '2025-02-10', hours_logged: 12 },
      { date: '2025-02-20', hours_logged: 20 },
      { date: '2025-03-05', hours_logged: 40 },
      { date: '2025-03-20', hours_logged: 60 },
    ],
  },
};

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-2">Projects</h1>
        <p className="text-gray-600 mb-8">Selected case studies and platform projects demonstrating impact and outcomes.</p>

        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((p) => (
            <article
              key={p.id}
              className="rounded-lg bg-white shadow-sm overflow-hidden border hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedProject(p)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSelectedProject(p);
              }}
            >
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img src={p.image} alt={p.title} className="w-full h-40 object-cover" />
                </div>
                <div className="p-6 md:flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">{p.title}</h2>
                      <div className="text-sm text-gray-500">{p.category}</div>
                    </div>
                    <div className="ml-4">
                      <span className="inline-block rounded-full px-3 py-1 text-sm font-medium text-white" style={{ background: p.color }}>
                        #{p.id}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-gray-700">{p.description}</p>

                  <div className="mt-4 flex items-center gap-3">
                    {p.tags.map((t) => (
                      <span key={t} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Button asChild>
                      <a href={p.link} target="_blank" rel="noreferrer" className="inline-block">
                        View Project
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Analytics section rendered only when a project is selected */}
        {selectedProject && (
          <div>
            <AnalyticsPanel project={selectedProject} analytics={analyticsData[selectedProject.id] || analyticsData['01']} />
          </div>
        )}
      </div>
    </div>
  );
}
