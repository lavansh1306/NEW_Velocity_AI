import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VeloNavTabs from '@/components/demo2/VeloNavTabs';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
// Removed Add Project dialog and delete controls per request
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel';
import type { MetricsResponse } from '@/lib/types';
import { loadProjects as fetchProjects, loadMetrics, type ProjectItem } from '@/lib/dataService';
// apiUrl no longer used in this page
import { useToast } from '@/contexts/ToastContext';

interface ProjectsProps {
  jiraConnected?: boolean;
  withNav?: boolean;
}

export default function Projects({ jiraConnected = true, withNav = true }: ProjectsProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [metricsData, setMetricsData] = useState<Record<string, MetricsResponse | null>>({});
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [dataConnected, setDataConnected] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  
  // Add project UI removed

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

  // Simple separation by source for UI grouping
  const asanaProjects = projects.filter((p) => p.source === 'asana');
  const jiraProjects = projects.filter((p) => p.source !== 'asana');

  // Add project UI removed

  // Delete project controls removed

  const mainContent = (
    <div className="bg-gray-50 min-h-screen py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">Projects</h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Selected case studies and platform projects demonstrating impact and outcomes.</p>
          </div>
          {/* Add Project removed */}
        </div>

        {/* Integration Dashboards removed per request */}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading projects...</p>
          </div>
        ) : (
          <>
            {/* Asana projects */}
            {asanaProjects.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Asana Projects</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                  {asanaProjects.map((p) => (
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
                                to={`/projects/asana-dashboard?project=${encodeURIComponent(p.id)}`}
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
              </div>
            )}

            {/* Jira (and other) projects */}
            {jiraProjects.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Jira Projects</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                  {jiraProjects.map((p) => (
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
                                to={`/projects/jira-dashboard?project=${encodeURIComponent(p.id)}`}
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
              </div>
            )}

            {/* Jira Employee Skills Extractor */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Jira Integration Tools</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <article className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-1/2 md:w-2/5 flex-shrink-0 bg-gradient-to-br from-blue-500 to-cyan-500 h-56 sm:h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">Employee Skills Extractor</h3>
                          <div className="text-xs sm:text-sm text-gray-500">Jira Integration</div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm lg:text-base text-gray-700 line-clamp-2 sm:line-clamp-3">
                        Extract employee skills from Jira projects and automatically populate the employee database for AI-powered task assignments.
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-medium">Jira</span>
                        <span className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">AI</span>
                        <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">Skills</span>
                      </div>

                      <div className="mt-auto pt-4">
                        <Button asChild className="w-full sm:w-auto text-xs sm:text-sm">
                          <Link
                            to="/projects/jira-employee-extractor"
                            className="inline-block"
                          >
                            Extract Skills
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
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
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <Header />
      {withNav ? (
        <VeloNavTabs
          activeTab="projects"
          onTabChange={(tab) => {
            // Basic navigation mapping for top-level tabs
            if (tab === 'dashboard') navigate('/');
            else if (tab === 'projects') navigate('/projects');
            else if (tab === 'activity') navigate('/projects');
            else if (tab === 'ledger') navigate('/projects');
            else navigate('/projects');
          }}
        >
          {mainContent}
        </VeloNavTabs>
      ) : (
        mainContent
      )}
    </div>
  );
}


