import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel';
import { loadProjectAnalytics, fetchCSV, parseProjectCSV } from '@/lib/csvLoader';
import type { ProjectAnalytics } from '@/components/analytics/types';

interface ProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  link: string;
  tags: string[];
  color: string;
}

const projectDescriptions: Record<string, string> = {
  '1': 'Built an integrated inventory management and demand forecasting system for a mid-market retail chain. Reduced stockouts by 32% and optimized warehouse operations, saving $450k annually in operational overhead.',
  '2': 'Designed a multi-tenant cloud infrastructure orchestration platform enabling real-time resource allocation, auto-scaling, and cost optimization across distributed systems.',
  '3': 'Developed a comprehensive healthcare tracking platform with HIPAA compliance, real-time patient monitoring, and predictive analytics for better clinical outcomes.',
  '4': 'Built an advanced risk assessment engine for fintech with machine learning models for market volatility prediction and portfolio optimization.',
};

const projectColors: Record<string, string> = {
  '1': '#d97706',
  '2': '#2563EB',
  '3': '#059669',
  '4': '#7c3aed',
};

const projectTags: Record<string, string[]> = {
  '1': ['Inventory', 'Analytics', 'Operations'],
  '2': ['Cloud', 'Infrastructure', 'DevOps'],
  '3': ['Healthcare', 'Compliance', 'Real-time'],
  '4': ['Fintech', 'AI/ML', 'Risk Analysis'],
};

const projectImages: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=800&fit=crop',
  '2': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop',
  '3': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=800&fit=crop',
  '4': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop',
};

export default function Projects() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [analyticsData, setAnalyticsData] = useState<Record<string, ProjectAnalytics | null>>({});
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [csvConnected, setCsvConnected] = useState(false);

  // Load projects from CSV on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const csvText = await fetchCSV('/data/projects-analytics.csv');
        const projectDataMap = await parseProjectCSV(csvText);

        const loadedProjects: ProjectItem[] = Object.entries(projectDataMap).map(([id, data]) => ({
          id,
          title: data.project_name,
          category: data.category,
          description: projectDescriptions[id] || 'Project details not available.',
          image: projectImages[id] || 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=800&fit=crop',
          link: '#',
          tags: projectTags[id] || [],
          color: projectColors[id] || '#6366f1',
        }));

        setProjects(loadedProjects);
        setCsvConnected(loadedProjects.length > 0);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setCsvConnected(false);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleProjectSelect = async (project: ProjectItem) => {
    setSelectedProject(project);
    
    // Load analytics if not already cached
    if (!analyticsData[project.id]) {
      setAnalyticsLoading(true);
      try {
        const data = await loadProjectAnalytics(project.id);
        setAnalyticsData((prev) => ({ ...prev, [project.id]: data }));
      } catch (error) {
        console.error(`Error loading analytics for project ${project.id}:`, error);
        setAnalyticsData((prev) => ({ ...prev, [project.id]: null }));
      } finally {
        setAnalyticsLoading(false);
      }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Connection Status Banner */}
        <div className={`mb-6 rounded-lg border p-4 flex items-center justify-between ${
          csvConnected 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${csvConnected ? 'bg-green-600' : 'bg-red-600'}`}></div>
            <span className={`text-sm font-semibold ${csvConnected ? 'text-green-700' : 'text-red-700'}`}>
              {csvConnected ? '✓ CSV Data Source Connected' : '✗ CSV Data Source Disconnected'}
            </span>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded ${
            csvConnected
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {csvConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-2">Projects</h1>
        <p className="text-gray-600 mb-8">Selected case studies and platform projects demonstrating impact and outcomes.</p>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading projects...</p>
          </div>
        ) : (
          <>
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
                {/* Analytics Connection Status */}
                <div className={`mb-6 rounded-lg border p-4 flex items-center justify-between ${
                  analyticsData[selectedProject.id] && !analyticsLoading
                    ? 'bg-green-50 border-green-200'
                    : analyticsLoading ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      analyticsData[selectedProject.id] && !analyticsLoading
                        ? 'bg-green-600'
                        : analyticsLoading ? 'bg-blue-600' : 'bg-red-600'
                    }`}></div>
                    <span className={`text-sm font-semibold ${
                      analyticsData[selectedProject.id] && !analyticsLoading
                        ? 'text-green-700'
                        : analyticsLoading ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      {analyticsLoading
                        ? '⟳ Loading Analytics...'
                        : analyticsData[selectedProject.id]
                        ? '✓ Analytics Connected'
                        : '✗ Analytics Failed to Load'}
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded ${
                    analyticsData[selectedProject.id] && !analyticsLoading
                      ? 'bg-green-100 text-green-700'
                      : analyticsLoading ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {analyticsLoading
                      ? 'LOADING'
                      : analyticsData[selectedProject.id]
                      ? 'CONNECTED'
                      : 'DISCONNECTED'}
                  </span>
                </div>

                {analyticsLoading ? (
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
          </>
        )}
      </div>
    </div>
  );
}
