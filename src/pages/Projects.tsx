import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
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
    <div>
      <Header />
      <div className="bg-gray-50 min-h-screen py-6 sm:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">Projects</h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Selected case studies and platform projects demonstrating impact and outcomes.</p>
        </div>

        {/* Integration Dashboards */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Jira Dashboard Button */}
          <Link
            to="/projects/jira-dashboard"
            className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
              <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.213 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">Jira Dashboard</h3>
              <p className="text-sm text-gray-500">Connect your Jira project for issue tracking & Gantt charts</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Asana Dashboard Button */}
          <Link
            to="/projects/asana-dashboard"
            className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition">
              <svg className="w-7 h-7 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.782 12.708c-2.892 0-5.24 2.347-5.24 5.24s2.348 5.24 5.24 5.24c2.893 0 5.24-2.347 5.24-5.24s-2.347-5.24-5.24-5.24zm-13.564 0c-2.893 0-5.24 2.347-5.24 5.24s2.347 5.24 5.24 5.24c2.892 0 5.24-2.347 5.24-5.24s-2.348-5.24-5.24-5.24zM12 1.24c-2.893 0-5.24 2.347-5.24 5.24s2.347 5.24 5.24 5.24c2.892 0 5.24-2.347 5.24-5.24S14.892 1.24 12 1.24z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition">Asana Dashboard</h3>
              <p className="text-sm text-gray-500">Connect your Asana project for task tracking & Gantt charts</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Jira feature card removed per request */}

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
                    <div className="w-full sm:w-1/2 md:w-2/5 flex-shrink-0">
                      <img src={p.image} alt={p.title} className="w-full h-56 sm:h-full object-cover" />
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
                          <Link
                            to={
                              p.source === 'asana'
                                ? `/projects/asana-dashboard?project=${encodeURIComponent(p.id)}`
                                : `/projects/jira-dashboard?project=${encodeURIComponent(p.id)}`
                            }
                            className="inline-block"
                          >
                            View Project
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Upcoming Projects Section */}
            <div className="mt-16 sm:mt-20">
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Upcoming Projects</h2>
                <p className="text-gray-600 text-sm sm:text-base">New initiatives and platform expansions launching soon.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Upcoming Project 1 */}
                <article className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-1/2 md:w-2/5 flex-shrink-0 bg-gradient-to-br from-purple-400 to-indigo-500 h-56 sm:h-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-white opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">AI Workflow Automation</h3>
                          <div className="text-xs sm:text-sm text-gray-500">Enterprise Automation</div>
                        </div>
                        <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full whitespace-nowrap">Q1 2025</span>
                      </div>

                      <p className="text-xs sm:text-sm lg:text-base text-gray-700 line-clamp-2 sm:line-clamp-3">End-to-end workflow automation platform leveraging AI to reduce manual process execution by 80%.</p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">Workflow</span>
                        <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">Automation</span>
                      </div>

                      <div className="mt-auto pt-4">
                        <button className="w-full sm:w-auto text-xs sm:text-sm px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition cursor-not-allowed opacity-75">
                          Coming Soon
                        </button>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Upcoming Project 2 */}
                <article className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-1/2 md:w-2/5 flex-shrink-0 bg-gradient-to-br from-green-400 to-emerald-500 h-56 sm:h-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-white opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">Predictive Resource Planning</h3>
                          <div className="text-xs sm:text-sm text-gray-500">Resource Optimization</div>
                        </div>
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full whitespace-nowrap">Q1 2025</span>
                      </div>

                      <p className="text-xs sm:text-sm lg:text-base text-gray-700 line-clamp-2 sm:line-clamp-3">ML-powered resource allocation engine that forecasts demand and optimizes team capacity planning.</p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">Forecast</span>
                        <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">Planning</span>
                      </div>

                      <div className="mt-auto pt-4">
                        <button className="w-full sm:w-auto text-xs sm:text-sm px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition cursor-not-allowed opacity-75">
                          Coming Soon
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
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
    </div>
  )
}
