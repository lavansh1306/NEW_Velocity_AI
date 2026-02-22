import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
// Removed Add Project dialog and delete controls per request
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel';
import { ProjectLeaveManagement } from '@/components/projects/ProjectLeaveManagement';
import { loadProjects as fetchProjects, loadMetrics, type ProjectItem } from '@/lib/dataService';
// apiUrl no longer used in this page
import { useToast } from '@/contexts/ToastContext';
import { AlertCircle, TrendingUp, Calendar, Zap, BarChart3 } from 'lucide-react';
import { fetchIssuesHybrid } from '@/lib/jiraDbClient';
import { calculateProjectHealthScore } from '@/lib/metrics';
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
    const { issues: rawIssues } = await fetchIssuesHybrid(projectId);
    const issues: JiraIssue[] = rawIssues as unknown as JiraIssue[];

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

    // Calculate health score using comprehensive formula
    const completedStatuses = ['Done', 'DONE', 'Closed', 'CLOSED', 'Resolved', 'RESOLVED'];
    const completedCount = issues.filter(i => 
      completedStatuses.some(status => i.status?.toLowerCase().includes(status.toLowerCase()))
    ).length;

    // Get project dates for health calculation
    const startDates = issues
      .filter(i => i.created)
      .map(i => new Date(i.created!).getTime());
    const endDates = issues
      .filter(i => i.due)
      .map(i => new Date(i.due!).getTime());
    
    const projectStartDate = startDates.length > 0 ? new Date(Math.min(...startDates)) : undefined;
    const projectEndDate = endDates.length > 0 ? new Date(Math.max(...endDates)) : undefined;

    // Use new comprehensive health score calculation
    const healthScore = calculateProjectHealthScore({
      issues,
      startDate: projectStartDate,
      endDate: projectEndDate,
    });

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
const getHealthColor = (score: number): { bg: string; text: string; dot: string; value: string } => {
  if (score >= 80) return { bg: 'bg-[#F0FDFA]', text: 'text-[#0F766E]', dot: 'bg-[#0F766E]', value: 'text-[#0F766E]' };
  if (score >= 60) return { bg: 'bg-[#F0FDFA]', text: 'text-[#0F766E]', dot: 'bg-[#0F766E]', value: 'text-[#0F766E]' };
  if (score >= 40) return { bg: 'bg-[#FFF7ED]', text: 'text-[#C2410C]', dot: 'bg-[#C2410C]', value: 'text-[#C2410C]' };
  return { bg: 'bg-[#FFF1F2]', text: 'text-[#BE123C]', dot: 'bg-[#BE123C]', value: 'text-[#BE123C]' };
};

// Progress bar component
const ProgressBar = ({ percentage }: { percentage: number }) => {
  const color = percentage >= 80 ? 'bg-[#0F766E]' : 
                percentage >= 60 ? 'bg-[#0F766E]' : 
                percentage >= 40 ? 'bg-[#C2410C]' : 'bg-[#BE123C]';
  return (
    <div className="w-full h-1.5 bg-[#E7E5E4] rounded-full overflow-hidden">
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
    <div className="flex items-center -space-x-1">
      {displayed.map((member) => (
        <div
          key={member}
          className="w-7 h-7 rounded-md bg-[#F5F5F4] text-[#1C1917] text-[10px] font-medium flex items-center justify-center border border-[#E7E5E4] hover:scale-110 transition-transform"
          title={member}
        >
          {member.substring(0, 2).toUpperCase()}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-7 h-7 rounded-md bg-[#E7E5E4] text-[#78716C] text-[10px] font-medium flex items-center justify-center border border-[#D6D3D1]">
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
    <div className="bg-[#FAFAF9] min-h-full p-12 font-['Inter',sans-serif]">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light text-[#1C1917] mb-3 tracking-tight">Projects</h1>
            <p className="text-[#78716C] text-base font-light leading-relaxed">Selected case studies and platform projects demonstrating impact and outcomes.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/velocity-ai?tab=deployment">
              <Button className="gap-2 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light text-white shadow-md transition-all duration-200 hover:scale-105">
                <span className="text-lg">+</span> New Project
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#A8A29E] font-light">Loading projects...</p>
          </div>
        ) : (
          <>
            {/* Jira (and other) projects - Grid-based layout */}
            {jiraProjects.length > 0 && (
              <div className="mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-[#E7E5E4] overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-6 px-8 py-6 border-b border-[#E7E5E4] bg-[#FAFAF9]">
                    <div className="col-span-4">
                      <p className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">Project</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">Health</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">Progress</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">Team</p>
                    </div>
                  </div>

                  {/* Project Rows */}
                  {jiraProjects.map((p, idx) => {
                    const metrics = projectMetrics[p.id];
                    if (!metrics) return null;
                    
                    const healthColor = getHealthColor(metrics.healthScore);
                    const timelineText = metrics.endDate 
                      ? `${metrics.endDate}`
                      : 'Timeline unknown';

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          localStorage.setItem('returnPage', '/velocity-ai');
                          navigate(`/project-analytics/${encodeURIComponent(p.id)}`);
                        }}
                        className="grid grid-cols-12 gap-6 px-8 py-6 border-b border-[#E7E5E4] hover:bg-[#FAFAF9] transition-all duration-200 cursor-pointer group last:border-b-0"
                      >
                        {/* Project Name & Date */}
                        <div className="col-span-4 min-w-0">
                          <h3 className="text-sm font-light text-[#1C1917] mb-2 group-hover:text-[#2DD4BF] transition-colors truncate">
                            {p.title}
                          </h3>
                          <p className="text-xs text-[#A8A29E] font-light">
                            {timelineText}
                          </p>
                        </div>

                        {/* Health Score */}
                        <div className="col-span-2 flex items-center">
                          <div className={`text-lg font-light ${healthColor.value}`}>
                            {metrics.healthScore}
                          </div>
                        </div>

                        {/* Progress Bar & Percentage */}
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="flex-1">
                            <ProgressBar percentage={metrics.healthScore} />
                          </div>
                          <div className="text-xs font-light text-[#78716C] min-w-fit">
                            {metrics.healthScore}%
                          </div>
                        </div>

                        {/* Team Avatars & Alert */}
                        <div className="col-span-3 flex items-center justify-end gap-4">
                          <TeamAvatars team={metrics.team} maxShow={4} />
                          {metrics.hasAlert && (
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#BE123C]" title="Alert" />
                          )}
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
    <VelocityAISidebar>
      {mainContent}
    </VelocityAISidebar>
  );
}


