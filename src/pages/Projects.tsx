import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VeloNavTabs from '@/components/demo2/VeloNavTabs';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel';
import type { MetricsResponse } from '@/lib/types';
import { loadProjects as fetchProjects, loadMetrics, type ProjectItem } from '@/lib/dataService';
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
  
  // Add project modal state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [projectKeyInput, setProjectKeyInput] = useState('');
  const [addingProject, setAddingProject] = useState(false);

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

  // Add project handler - checks both Jira and Asana
  const handleAddProject = async () => {
    const projectKey = projectKeyInput.trim();
    if (!projectKey) {
      addToast({ type: 'error', title: 'Error', description: 'Please enter a project key', duration: 3000 });
      return;
    }

    // Check if already exists
    if (projects.some((p) => p.id === projectKey)) {
      addToast({ type: 'warning', title: 'Already Added', description: 'This project is already in your list', duration: 3000 });
      return;
    }

    setAddingProject(true);

    try {
      // Try Jira first
      const jiraRes = await fetch(`/api/issues?projectKey=${encodeURIComponent(projectKey)}`);
      if (jiraRes.ok) {
        const jiraData = await jiraRes.json();
        const issues = jiraData.issues || [];
        if (issues.length > 0 || jiraRes.status === 200) {
          // It's a valid Jira project
          const newProject: ProjectItem = {
            id: projectKey,
            title: projectKey,
            category: 'Jira Project',
            description: `Jira project with ${issues.length} issues`,
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop',
            tags: ['Jira', 'Project Management'],
            color: '#2563EB',
            source: 'jira',
          };
          setProjects((prev) => [...prev, newProject]);
          addToast({ type: 'success', title: 'Jira Project Added', description: `Added "${projectKey}" to Jira projects`, duration: 4000 });
          setProjectKeyInput('');
          setAddDialogOpen(false);
          setAddingProject(false);
          return;
        }
      }

      // Try Asana
      const asanaRes = await fetch(`/api/asana/issues?projectKey=${encodeURIComponent(projectKey)}`);
      if (asanaRes.ok) {
        const asanaData = await asanaRes.json();
        const tasks = asanaData.issues || [];
        if (tasks.length > 0 || asanaRes.status === 200) {
          // It's a valid Asana project
          const newProject: ProjectItem = {
            id: projectKey,
            title: projectKey,
            category: 'Asana Project',
            description: `Asana project with ${tasks.length} tasks`,
            image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=800&fit=crop',
            tags: ['Asana', 'Task Management'],
            color: '#fb923c',
            source: 'asana',
          };
          setProjects((prev) => [...prev, newProject]);
          addToast({ type: 'success', title: 'Asana Project Added', description: `Added "${projectKey}" to Asana projects`, duration: 4000 });
          setProjectKeyInput('');
          setAddDialogOpen(false);
          setAddingProject(false);
          return;
        }
      }

      // Neither worked
      addToast({
        type: 'error',
        title: 'Project Not Found',
        description: 'Could not find this project in Jira or Asana. Check the project key and try again.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error adding project:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to add project. Please check your connection and try again.',
        duration: 5000,
      });
    } finally {
      setAddingProject(false);
    }
  };

  // Delete project handler
  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    addToast({ type: 'success', title: 'Project Removed', description: 'Project has been removed from your list', duration: 3000 });
  };

  const mainContent = (
    <div className="bg-gray-50 min-h-screen py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">Projects</h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Selected case studies and platform projects demonstrating impact and outcomes.</p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-gray-600">
                  Enter a Jira project key (e.g., TEST) or Asana project ID. We'll automatically detect which platform it belongs to.
                </p>
                <Input
                  placeholder="Project key or ID..."
                  value={projectKeyInput}
                  onChange={(e) => setProjectKeyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !addingProject) handleAddProject();
                  }}
                  disabled={addingProject}
                />
                <Button 
                  onClick={handleAddProject} 
                  disabled={addingProject || !projectKeyInput.trim()}
                  className="w-full"
                >
                  {addingProject ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Add Project'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                              onClick={(e) => handleDeleteProject(p.id, e)}
                              title="Remove project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                              onClick={(e) => handleDeleteProject(p.id, e)}
                              title="Remove project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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


