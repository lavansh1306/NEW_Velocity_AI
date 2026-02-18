import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VeloNavTabs from '@/components/demo2/VeloNavTabs';
import { Button } from '@/components/ui/button';
// Removed Add Project dialog and delete controls per request
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel';
import { loadProjects as fetchProjects, loadMetrics, type ProjectItem } from '@/lib/dataService';
// apiUrl no longer used in this page
import { useToast } from '@/contexts/ToastContext';
import { AlertCircle, TrendingUp, Calendar, Zap, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
          className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-light flex items-center justify-center border-2 border-white"
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

// Capacity data type
interface CapacityWeekData {
  week: number;
  startDate: string;
  utilization: number;
  available: number;
}

// Generate 8-week capacity data
const generateCapacityData = (startOffset: number = 0): CapacityWeekData[] => {
  const data: CapacityWeekData[] = [];
  const today = new Date();
  
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + (i + startOffset) * 7);
    
    // Generate realistic capacity data
    const utilization = Math.floor(Math.random() * 40 + 50); // 50-90%
    const available = 100 - utilization;
    
    data.push({
      week: i + 1,
      startDate: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      utilization,
      available
    });
  }
  
  return data;
};

// Generate AI insights
const generateAIInsights = (metrics: Record<string, ProjectMetrics>): string[] => {
  const insights: string[] = [];
  
  const totalMetrics = Object.values(metrics);
  const avgHealth = totalMetrics.length > 0 
    ? Math.round(totalMetrics.reduce((sum, m) => sum + m.healthScore, 0) / totalMetrics.length)
    : 0;
  
  if (avgHealth >= 80) {
    insights.push('✅ Team capacity is well-balanced with strong project health across the board.');
  } else if (avgHealth >= 60) {
    insights.push('⚠️ Monitor team workload - some projects showing moderate utilization patterns.');
  }
  
  const alertProjects = totalMetrics.filter(m => m.hasAlert).length;
  if (alertProjects > 0) {
    insights.push(`${alertProjects} project${alertProjects !== 1 ? 's' : ''} need immediate attention or reassessment.`);
  }
  
  const totalTeamSize = new Set(totalMetrics.flatMap(m => m.team)).size;
  if (totalTeamSize > 0) {
    insights.push(`🤝 ${totalTeamSize} team members across ${totalMetrics.length} active projects.`);
  }
  
  return insights;
};

export default function Projects({ jiraConnected = true, withNav = true }: ProjectsProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [metricsData, setMetricsData] = useState<Record<string, any>>({});
  const [projectMetrics, setProjectMetrics] = useState<Record<string, ProjectMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [dataConnected, setDataConnected] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  const [timeframeOffset, setTimeframeOffset] = useState(0);
  const [capacityData, setCapacityData] = useState<CapacityWeekData[]>(generateCapacityData(0));
  
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

  // Update capacity data when timeframe offset changes
  useEffect(() => {
    setCapacityData(generateCapacityData(timeframeOffset));
  }, [timeframeOffset]);

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
    <div className="bg-gray-50 min-h-screen p-12 font-['Inter',sans-serif]">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light text-gray-900 mb-3 tracking-tight">Projects</h1>
            <p className="text-gray-600 text-base font-light leading-relaxed">Selected case studies and platform projects demonstrating impact and outcomes.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/velocity-ai?tab=deployment">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl font-light">
                <span>➕</span> Add Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Capacity Overview Graph */}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-light">Loading projects...</p>
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
                        onClick={() => navigate(`/projects/jira-dashboard?project=${encodeURIComponent(p.id)}&fullscreen=true`)}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer p-8 border border-gray-100"
                      >
                        <div className="flex items-center justify-between gap-6">
                          {/* Left: Project Name & Timeline */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-light text-gray-900 hover:text-blue-600 transition-colors">
                              {p.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2 font-light">
                              <Calendar className="w-4 h-4" />
                              {timelineText}
                            </p>
                          </div>

                          {/* Right Side Content */}
                          <div className="flex items-center gap-4 flex-wrap justify-end">
                            {/* Progress Data */}
                            <div className="w-40">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-light text-gray-600">Progress</span>
                                <span className="text-xs font-light text-gray-700">
                                  {metrics.completedCount}/{metrics.totalCount}
                                </span>
                              </div>
                              <ProgressBar percentage={metrics.healthScore} />
                            </div>

                            {/* Health Badge */}
                            <div className={`px-4 py-2 rounded-xl border font-light transition-colors ${healthColor.bg}`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${healthColor.dot}`} />
                                <span className={`text-xs ${healthColor.text}`}>
                                  {metrics.healthScore}% Health
                                </span>
                              </div>
                            </div>

                            {/* AI Alert Indicator */}
                            {metrics.hasAlert && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg font-light">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <span className="text-xs text-amber-700">Alert</span>
                              </div>
                            )}

                            {/* Team Avatars */}
                            <div className="flex-shrink-0">
                              <TeamAvatars team={metrics.team} />
                            </div>
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


