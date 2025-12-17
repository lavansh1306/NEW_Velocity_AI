import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel';
import { loadProjectAnalytics } from '@/lib/csvLoader';
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

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [analyticsData, setAnalyticsData] = useState<Record<string, ProjectAnalytics | null>>({});
  const [loading, setLoading] = useState(false);

  const handleProjectSelect = async (project: ProjectItem) => {
    setSelectedProject(project);
    
    // Load analytics if not already cached
    if (!analyticsData[project.id]) {
      setLoading(true);
      try {
        const data = await loadProjectAnalytics(project.id);
        setAnalyticsData((prev) => ({ ...prev, [project.id]: data }));
      } catch (error) {
        console.error(`Error loading analytics for project ${project.id}:`, error);
        setAnalyticsData((prev) => ({ ...prev, [project.id]: null }));
      } finally {
        setLoading(false);
      }
    }
  }

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
              onClick={() => handleProjectSelect(p)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleProjectSelect(p);
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
          <div className="mt-12">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading analytics...</p>
              </div>
            ) : analyticsData[selectedProject.id] ? (
              <AnalyticsPanel project={selectedProject} analytics={analyticsData[selectedProject.id]!} />
            ) : (
              <div className="text-center py-8">
                <p className="text-red-500">Failed to load analytics data</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
