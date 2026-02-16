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
import { AlertCircle, TrendingUp, Calendar, Settings } from 'lucide-react';

interface ProjectsProps {
  jiraConnected?: boolean;
  withNav?: boolean;
}

interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  assignee: string;
  due?: string;
  created?: string;
}

interface ProjectMetrics {
  healthScore: number;
  completedCount: number;
  totalCount: number;
  issues: JiraIssue[];
  team: string[];
  hasAlert: boolean;
  endDate?: string;
  weeksRemaining?: number;
}

// Fetch project issues and calculate metrics
const fetchProjectMetrics = async (projectId: string): Promise<ProjectMetrics> => {
  try {
    const response = await fetch(`/api/jira/issues?projectKey=${encodeURIComponent(projectId)}`);
    if (!response.ok) throw new Error('Failed to fetch issues');
    
    const data = await response.json();
    const issues: JiraIssue[] = data.issues || [];

    if (issues.length === 0) {
      return {
        healthScore: 0,
        completedCount: 0,
        totalCount: 0,
        issues: [],
        team: [],
        hasAlert: false,
      };
    }

    // Calculate health score based on status
    const completedStatuses = ['Done', 'DONE', 'Closed', 'CLOSED', 'Resolved', 'RESOLVED'];
    const completedCount = issues.filter(i => 
      completedStatuses.some(status => i.status?.toLowerCase().includes(status.toLowerCase()))
    ).length;

    const healthScore = Math.round((completedCount / issues.length) * 100);

    // Extract unique team members
    const team = Array.from(new Set(
      issues
        .map(i => i.assignee)
        .filter(a => a && a !== 'Unassigned')
    ));

    // Determine if there's a critical alert (low health or risk)
    const hasAlert = healthScore < 40 || issues.some(i => 
      i.status?.toLowerCase().includes('blocked') || 
      i.status?.toLowerCase().includes('stuck')
    );

    // Calculate end date (latest due date)
    const dueDates = issues
      .filter(i => i.due)
      .map(i => new Date(i.due!).getTime());
    
    const endDate = dueDates.length > 0 
      ? new Date(Math.max(...dueDates))
      : undefined;

    // Calculate weeks remaining
    const weeksRemaining = endDate
      ? Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7))
      : undefined;

    return {
      healthScore,
      completedCount,
      totalCount: issues.length,
      issues,
      team,
      hasAlert,
      endDate: endDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weeksRemaining,
    };
  } catch (error) {
    console.error(`[Projects] Error fetching metrics for ${projectId}:`, error);
    return {
      healthScore: 0,
      completedCount: 0,
      totalCount: 0,
      issues: [],
      team: [],
      hasAlert: true,
    };
  }
};

// Health badge color based on score
const getHealthColor = (score: number): { bg: string; text: string; dot: string } => {
  if (score >= 80) return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
  if (score >= 60) return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' };
  if (score >= 40) return { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' };
  return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' };
};

// Progress bar component
const ProgressBar = ({ percentage }: { percentage: number }) => {
  const color = percentage >= 80 ? 'bg-green-500' : 
                percentage >= 60 ? 'bg-blue-500' : 
                percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Avatar group component
const TeamAvatars = ({ team, maxShow = 4 }: { team: string[]; maxShow?: number }) => {
  const displayed = team.slice(0, maxShow);
  const remaining = team.length - maxShow;

  return (
    <div className="flex items-center -space-x-2">
      {displayed.map((member) => (
        <div
          key={member}
          className="w-8 h-8 rounded-full bg-primary text-white text-xs font-light flex items-center justify-center border-2 border-white"
          title={member}
        >
          {member.charAt(0).toUpperCase()}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 text-xs font-light flex items-center justify-center border-2 border-white">
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default function Projects({ jiraConnected = true, withNav = true }: ProjectsProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [metricsData, setMetricsData] = useState<Record<string, MetricsResponse | null>>({});
  const [projectMetrics, setProjectMetrics] = useState<Record<string, ProjectMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [dataConnected, setDataConnected] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  
  // Add project UI removed

  // Load projects from CSV via dataService on mount
  useEffect(() => {
    const doLoadProjects = async () => {
      try {
        console.log('[Projects] Loading projects...');
        const loadedProjects = await fetchProjects();
        console.log('[Projects] Loaded projects:', loadedProjects.length, loadedProjects);

        setProjects(loadedProjects);
        setDataConnected(loadedProjects.length > 0);

        // Fetch metrics for each project
        const metricsMap: Record<string, ProjectMetrics> = {};
        for (const project of loadedProjects) {
          metricsMap[project.id] = await fetchProjectMetrics(project.id);
        }
        setProjectMetrics(metricsMap);

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
        console.error('[Projects] Failed to load projects:', error);
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
  const jiraProjects = projects;

  // Add project UI removed

  // Delete project controls removed

  const mainContent = (
    <div className="bg-gray-50 min-h-screen py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light mb-3">Projects</h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Selected case studies and platform projects demonstrating impact and outcomes.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/velocity-ai?tab=deployment">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <span>➕</span> Add Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Integration Dashboards removed per request */}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading projects...</p>
          </div>
        ) : (
          <>
            {/* Jira (and other) projects - Row-based layout */}
            {jiraProjects.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-6">Active Projects</h2>
                <div className="space-y-3">
                  {jiraProjects.map((p) => {
                    const metrics = projectMetrics[p.id];
                    if (!metrics) return null;
                    
                    const healthColor = getHealthColor(metrics.healthScore);
                    const timelineText = metrics.endDate 
                      ? `Ends ${metrics.endDate} · ${metrics.weeksRemaining || 0} weeks remaining`
                      : 'Timeline unknown';

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleProjectSelect(p)}
                        className="group rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Left: Project Name & Timeline */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-light text-gray-900 group-hover:text-primary transition-colors">
                              {p.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1 font-light">
                              <Calendar className="w-4 h-4" />
                              {timelineText}
                            </p>
                          </div>

                          {/* Right Side Content */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Progress Data */}
                            <div className="w-32">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-light text-gray-600">Progress</span>
                                <span className="text-xs font-light text-gray-700">
                                  {metrics.completedCount}/{metrics.totalCount}
                                </span>
                              </div>
                              <ProgressBar percentage={metrics.healthScore} />
                            </div>

                            {/* Health Badge */}
                            <div className={`px-4 py-2 rounded-xl border ${healthColor.bg} transition-colors`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${healthColor.dot}`} />
                                <span className={`text-xs font-light ${healthColor.text}`}>
                                  {metrics.healthScore}% Health
                                </span>
                              </div>
                            </div>

                            {/* AI Alert Indicator */}
                            {metrics.hasAlert && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-light text-amber-700">Alert</span>
                              </div>
                            )}

                            {/* Team Avatars */}
                            <div className="flex-shrink-0">
                              <TeamAvatars team={metrics.team} />
                            </div>

                            {/* Manage Button */}
                            <Link
                              to={`/projects/jira-dashboard?project=${encodeURIComponent(p.id)}&fullscreen=true`}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-light rounded-xl transition-colors flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Settings className="w-4 h-4" />
                              Manage
                            </Link>

                            {/* View Button */}
                            <Link
                              to={`/projects/jira-dashboard?project=${encodeURIComponent(p.id)}`}
                              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-light rounded-xl transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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


