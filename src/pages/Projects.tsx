import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel';
import type { MetricsResponse } from '@/lib/types';
import { loadProjects as fetchProjects, loadMetrics, type ProjectItem } from '@/lib/dataService';
import { useToast } from '@/contexts/ToastContext';

interface ProjectsProps {
  jiraConnected?: boolean;
}

export default function Projects({ jiraConnected = true }: ProjectsProps) {
  const { addToast } = useToast();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [metricsData, setMetricsData] = useState<Record<string, MetricsResponse | null>>({});
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [dataConnected, setDataConnected] = useState(false);
  const [toastShown, setToastShown] = useState(false);

  // Load projects from CSV via dataService on mount
  useEffect(() => {
    const doLoadProjects = async () => {
      try {
        const loadedProjects = await fetchProjects();

        setProjects(loadedProjects);
        setDataConnected(loadedProjects.length > 0);

        // Show success toast only once
        if (loadedProjects.length > 0 && !toastShown) {
          addToast({
            type: 'success',
            title: 'Data Source Connected',
            description: `Loaded ${loadedProjects.length} projects successfully`,
            duration: 4000,
          });
          setToastShown(true);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        setDataConnected(false);
        addToast({
          type: 'error',
          title: 'Failed to Load Projects',
          description: 'Could not load project data. Please try again.',
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    doLoadProjects();
  }, [addToast, toastShown]);

  // Warn once if Jira is disconnected — analytics may be limited
  useEffect(() => {
    if (!jiraConnected && toastShown) {
      addToast({
        type: 'warning',
        title: 'Jira Integration Disconnected',
        description: 'Some analytics may be limited while Jira is disconnected. Reconnect any integrations in Security Audit to restore full data.',
        duration: 6000,
      });
    }
  }, [jiraConnected, addToast, toastShown]);

  const handleProjectSelect = async (project: ProjectItem) => {
    setSelectedProject(project);
    
    // Load metrics if not already cached
    if (!metricsData[project.id]) {
      setAnalyticsLoading(true);
      try {
        const data = await loadMetrics(project.id);
        setMetricsData((prev) => ({ ...prev, [project.id]: data }));
      } catch (error) {
        console.error(`Error loading analytics for project ${project.id}:`, error);
        setMetricsData((prev) => ({ ...prev, [project.id]: null }));
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
                          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">{p.title}</h2>
                          <div className="text-xs sm:text-sm text-gray-500">{p.category}</div>
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
                {analyticsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading analytics...</p>
                  </div>
                ) : metricsData[selectedProject.id] ? (
                  <AnalyticsPanel project={selectedProject} metrics={metricsData[selectedProject.id]!} />
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
