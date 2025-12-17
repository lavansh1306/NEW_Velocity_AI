import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel';
import { loadProjectAnalytics, fetchCSV, parseProjectCSV } from '@/lib/csvLoader';
import { useToast } from '@/contexts/ToastContext';
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

interface ProjectsProps {
  jiraConnected?: boolean;
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

export default function Projects({ jiraConnected = true }: ProjectsProps) {
  const { addToast } = useToast();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [analyticsData, setAnalyticsData] = useState<Record<string, ProjectAnalytics | null>>({});
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [csvConnected, setCsvConnected] = useState(false);
  const [toastShown, setToastShown] = useState(false);

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
        
        // Show success toast only once
        if (loadedProjects.length > 0 && !toastShown) {
          addToast({
            type: 'success',
            title: 'CSV Data Source Connected',
            description: `Loaded ${loadedProjects.length} projects successfully`,
            duration: 4000,
          });
          setToastShown(true);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        setCsvConnected(false);
        addToast({
          type: 'error',
          title: 'Failed to Load Projects',
          description: 'Could not load CSV data source. Please try again.',
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [addToast, toastShown]);

  // Show toast when Jira disconnected
  useEffect(() => {
    if (!jiraConnected && toastShown) {
      addToast({
        type: 'warning',
        title: 'Jira Integration Disconnected',
        description: 'Project analytics require Jira connection. Please reconnect in Data Integrations.',
        duration: 5000,
      });
    }
  }, [jiraConnected, addToast, toastShown]);

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
    <div className="bg-gray-50 min-h-screen py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">Projects</h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Selected case studies and platform projects demonstrating impact and outcomes.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading projects...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12">
              {projects.map((p) => (
                <article
                  key={p.id}
                  className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleProjectSelect(p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleProjectSelect(p);
                  }}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-1/3 flex-shrink-0">
                      <img src={p.image} alt={p.title} className="w-full h-40 sm:h-full object-cover" />
                    </div>
                    <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate\">{p.title}</h2>
                          <div className="text-xs sm:text-sm text-gray-500\">{p.category}</div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-block rounded-full px-3 py-1 text-xs sm:text-sm font-medium text-white whitespace-nowrap" style={{ background: p.color }}>
                            #{p.id}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm lg:text-base text-gray-700 line-clamp-2 sm:line-clamp-3">{p.description}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {p.tags.slice(0, 2).map((t) => (
                          <span key={t} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                            {t}
                          </span>
                        ))}
                        {p.tags.length > 2 && (
                          <span className="text-xs px-2 py-1 text-gray-600">+{p.tags.length - 2}</span>
                        )}
                      </div>

                      <div className="mt-auto pt-4">
                        <Button asChild className="w-full sm:w-auto text-xs sm:text-sm">
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
              <div className="mt-12 sm:mt-16">
                {!jiraConnected ? (
                  <div className="text-center py-12 sm:py-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-4xl sm:text-6xl mb-4">⊘</div>
                    <p className="text-gray-800 font-semibold mb-2 text-base sm:text-lg">Analytics Unavailable</p>
                    <p className="text-gray-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                      Jira is currently disconnected. Reconnect the Jira integration in Data Integrations to view project graphs, metrics, and analytics.
                    </p>
                  </div>
                ) : analyticsLoading ? (
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
