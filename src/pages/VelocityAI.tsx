import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  Zap, 
  Activity,
  ArrowUpRight,
  Clock 
} from 'lucide-react';

// Layout Components
import VeloHeader from '../components/demo2/VeloHeader';
import VeloNavTabs from '../components/demo2/VeloNavTabs';
import VPDashboard from '../components/demo2/VPDashboard';

// Feature Components
import StandardTimeCatalogTab from '../components/demo2/StandardTimeCatalogTab';
import CapacityLedgerTab from '../components/demo2/CapacityLedgerTab';
import ROIVerificationTab from '../components/demo2/ROIVerificationTab';
import ProjectActivityTab from '../components/demo2/ProjectActivityTab';
import SecurityAuditTab from '../components/demo2/SecurityAuditTab';
import HubSpotTab from '../components/demo2/HubSpotTab';
import Projects from './Projects';
import LeaveManagementTab from '../components/leave-management'; 
import ProjectCheckView from '@/components/ml-model';
import ManagerGantt from '@/components/ManagerGantt';
import SmartProgressTracker from '../components/smart-progress';
import UnifiedView from '../components/unified-system/UnifiedView'; 

import { getJiraConnected, setJiraConnected } from '../lib/storage';
import { apiUrl } from '../lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import { JiraCapacityMap } from '../components/leave-management/JiraCapacityMap';
import { useJiraData } from '../hooks/useJiraData';
import { parseCSV } from '../components/ml-model/RecommendationEngine';
import { Task, EmployeeProfile } from '../components/leave-management/types';

// Fetch Jira connection status using API
async function fetchJiraStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(apiUrl('/api/jira/auth/status'), {
      credentials: 'include',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.connected ? data : null;
  } catch (error) {
    console.error('Error fetching Jira status:', error instanceof Error ? error.message : error);
    return null;
  }
}

// Fetch Jira resources using OAuth token
async function fetchJiraData() {
  const status = await fetchJiraStatus();
  
  if (!status || !status.connected) {
    console.warn('No Jira connection found');
    return null;
  }

  try {
    const cloudId = status.site?.cloudId;
    
    if (!cloudId) {
      console.warn('No Jira cloudId found');
      return null;
    }
    
    // Fetch projects from Jira API through our backend with timeout
    const projectsController = new AbortController();
    const projectsTimeout = setTimeout(() => projectsController.abort(), 10000);
    
    const projectsRes = await fetch(apiUrl('/api/jira/projects'), {
      credentials: 'include',
      signal: projectsController.signal
    });
    clearTimeout(projectsTimeout);

    if (!projectsRes.ok) {
      throw new Error(`Failed to fetch projects: ${projectsRes.statusText}`);
    }

    const projectsData = await projectsRes.json();
    const projects = projectsData.projects || [];
    
    // Fetch all issues from all projects to calculate stats
    let allIssues = [];
    let totalHours = 0;
    const assigneesSet = new Set<string>();
    
    for (const project of projects) {
      try {
        const issuesController = new AbortController();
        const issuesTimeout = setTimeout(() => issuesController.abort(), 8000);
        
        const issuesRes = await fetch(apiUrl(`/api/jira/issues?projectKey=${encodeURIComponent(project.key)}`), {
          credentials: 'include',
          signal: issuesController.signal
        });
        clearTimeout(issuesTimeout);
        
        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          const issues = issuesData.issues || [];
          allIssues.push(...issues);
          
          // Sum up hours and collect assignees
          issues.forEach((issue: any) => {
            let hours = 8; // default
            if (issue.duration) {
              const parsed = parseInt(String(issue.duration), 10);
              if (!isNaN(parsed) && parsed > 0 && parsed < 10000) {
                hours = parsed;
              }
            }
            totalHours += hours;
            if (issue.assignee) {
              assigneesSet.add(issue.assignee);
            }
          });
        }
      } catch (e) {
        console.warn(`Failed to fetch issues for project ${project.key}:`, e);
      }
    }
    
    const stats = {
      totalTasks: allIssues.length,
      totalProjects: projects.length,
      teamMembers: assigneesSet.size,
      totalHours: Math.round(totalHours)
    };
    
    console.log('Jira data fetched successfully:', { 
      site: status.site,
      availableSites: status.availableSites,
      projects: projects.length,
      stats
    });
    
    return { 
      resources: status.availableSites,
      projects, 
      cloudId,
      site: status.site,
      stats
    };
  } catch (error) {
    console.error('Error fetching Jira data:', error);
    return null;
  }
}

// --- NEW REDESIGNED DASHBOARD COMPONENT ---
const ModernDashboard = ({ jiraData }: { jiraData: any }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [csvLoading, setCsvLoading] = useState(true);
  const { issues: jiraIssues, loading: jiraLoading } = useJiraData();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    // Helper to count business days (Mon-Fri only)
    const countBusinessDays = (startDate: Date, endDate: Date): number => {
      let count = 0;
      const current = new Date(startDate);
      current.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      
      while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      return count;
    };

    // Active Projects - projects with issues due today or in progress
    const activeProjectsSet = new Set<string>();
    const projectsAtRiskSet = new Set<string>();
    let totalTeamUtilization = 0;
    let availableCapacity = 0;
    let allocatedCapacity = 0;

    // Group issues by assignee and collect date range
    const byAssignee: { [key: string]: Array<{ start: Date; due: Date }> } = {};
    let minDate = new Date(today);
    let maxDate = new Date(today);
    let hasValidDates = false;

    jiraIssues.forEach((issue: any) => {
      const issueDueDate = issue.due ? new Date(issue.due) : null;
      const issueStartDate = issue.start ? new Date(issue.start) : null;
      const projectKey = issue.key?.split('-')[0] || 'Unknown';
      const duration = Number(issue.duration) || 0;

      // Active projects - due today or in progress
      if (issueDueDate && issueDueDate.getTime() === today.getTime() && issue.status !== 'Done') {
        activeProjectsSet.add(projectKey);
      }
      if (issue.status === 'In Progress' || issue.status === 'In_Progress') {
        activeProjectsSet.add(projectKey);
      }

      // Projects at risk - overdue items
      if (issueDueDate && issueDueDate < today && issue.status !== 'Done') {
        projectsAtRiskSet.add(projectKey);
      }

      // Capacity calculations - collect intervals per assignee
      const assignee = issue.assignee || 'Unassigned';
      const startDate = issueStartDate || new Date();
      const endDate = issueDueDate || startDate;
      
      if (!byAssignee[assignee]) {
        byAssignee[assignee] = [];
      }
      byAssignee[assignee].push({ start: startDate, due: endDate });
      
      // Track date range
      if (startDate < minDate) minDate = new Date(startDate);
      if (endDate > maxDate) maxDate = new Date(endDate);
      hasValidDates = true;
      allocatedCapacity += duration;
    });

    const uniqueAssignees = new Set(jiraIssues.map((i: any) => i.assignee || 'Unassigned'));
    
    // Calculate available capacity based on actual working window
    if (hasValidDates && uniqueAssignees.size > 0) {
      // Get business days in the working window
      const windowBusinessDays = countBusinessDays(minDate, maxDate);
      const totalCapacityHours = windowBusinessDays * 8 * uniqueAssignees.size; // 8 hours per business day
      
      // Calculate occupied business days per assignee
      let totalOccupiedDays = 0;
      for (const assignee in byAssignee) {
        const intervals = byAssignee[assignee];
        // Merge overlapping intervals
        const sortedIntervals = intervals.sort((a, b) => a.start.getTime() - b.start.getTime());
        const merged: Array<{ start: Date; due: Date }> = [];
        
        sortedIntervals.forEach(interval => {
          if (merged.length === 0) {
            merged.push(interval);
          } else {
            const last = merged[merged.length - 1];
            if (interval.start <= last.due) {
              // Overlapping - merge
              last.due = interval.due > last.due ? interval.due : last.due;
            } else {
              merged.push(interval);
            }
          }
        });
        
        // Count business days in merged intervals
        merged.forEach(interval => {
          const occupiedDays = countBusinessDays(interval.start, interval.due);
          totalOccupiedDays += occupiedDays;
        });
      }
      
      const totalAvailableDays = (windowBusinessDays * uniqueAssignees.size) - totalOccupiedDays;
      availableCapacity = Math.max(0, totalAvailableDays * 8); // Convert to hours
      totalTeamUtilization = windowBusinessDays > 0 ? Math.round((totalOccupiedDays / (windowBusinessDays * uniqueAssignees.size)) * 100) : 0;
    } else {
      // Fallback to simple calculation if no dates available
      const totalCapacityPerWeek = uniqueAssignees.size * 40;
      availableCapacity = Math.max(0, totalCapacityPerWeek - allocatedCapacity);
      totalTeamUtilization = uniqueAssignees.size > 0 ? Math.round((allocatedCapacity / (uniqueAssignees.size * 40)) * 100) : 0;
    }

    return {
      activeProjects: activeProjectsSet.size,
      projectsAtRisk: projectsAtRiskSet.size,
      teamUtilization: Math.min(100, totalTeamUtilization),
      availableCapacity: Math.max(0, availableCapacity),
      teamMembers: uniqueAssignees.size,
      totalTasks: jiraIssues.length,
      totalAllocated: Math.round(allocatedCapacity),
    };
  }, [jiraIssues]);

  // Get upcoming deadlines (next 2 weeks)
  const upcomingDeadlines = useMemo(() => {
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    return jiraIssues
      .filter((issue: any) => {
        const dueDate = issue.due ? new Date(issue.due) : null;
        return dueDate && dueDate >= today && dueDate <= twoWeeksFromNow && issue.status !== 'Done';
      })
      .sort((a: any, b: any) => new Date(a.due).getTime() - new Date(b.due).getTime())
      .slice(0, 5);
  }, [jiraIssues]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const csvUrl = new URL('../components/ml-model/datasets/master_employee_task_report.csv', import.meta.url).href;
        const rawData: any[] = await parseCSV(csvUrl);

        const loadedTasks: Task[] = rawData.map((row, index) => ({
          id: index,
          projectName: row.Project || "Unassigned",
          taskName: row["Task Name"] || "Untitled Task",
          assignee: row.Assignee || "Unassigned",
          hours: row["Planned Hours"] || 0,
          day: Math.floor(Math.random() * 5),
          requiredSkills: row["Skill Used"] ? [row["Skill Used"]] : [],
          isReallocated: false,
          isCancelled: false,
          totalLogged: row["Actual Hours"] || 0,
          logs: []
        }));

        setTasks(loadedTasks);

        const uniqueNames = Array.from(new Set(loadedTasks.map(t => t.assignee)));
        const loadedEmployees: EmployeeProfile[] = uniqueNames.map(name => {
          const userTasks = loadedTasks.filter(t => t.assignee === name);
          const skills = Array.from(new Set(userTasks.flatMap(t => t.requiredSkills)));
          return { name, role: skills[0] || "Developer", skills: skills.slice(0, 3) };
        });

        setEmployees(loadedEmployees);
      } catch (err) {
        console.error("Workload data load failed", err);
      } finally {
        setCsvLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">WELCOME BACK MANAGER</h1>
        <p className="text-gray-600">Here's what's happening with your teams today.</p>
      </div>

      {/* Main Content Area - KPI Cards + Deadlines + AI Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:auto-rows-max">
        {/* Left Column - KPI Cards (2x2 Grid) */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Active Project Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">ACTIVE PROJECT</h3>
                <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-red-200"></div>
              </div>
              <div className="text-4xl font-bold text-gray-900">{dashboardMetrics.activeProjects}</div>
              <p className="text-xs text-gray-500 mt-2">Projects with activity today</p>
            </div>

            {/* Team Utilization Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">TEAM UTILIZATION</h3>
              <div className="text-4xl font-bold text-gray-900">{dashboardMetrics.teamUtilization}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dashboardMetrics.teamUtilization}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{dashboardMetrics.teamMembers} team members</p>
            </div>

            {/* Available Capacity Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">AVAILABLE CAPACITY</h3>
              <div className="text-4xl font-bold text-gray-900">{dashboardMetrics.availableCapacity}h</div>
              <p className="text-xs text-gray-500 mt-2">This week</p>
            </div>

            {/* Project at Risk Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">PROJECT AT RISK</h3>
                <div className="w-3 h-3 bg-amber-500 rounded-full border-2 border-amber-200"></div>
              </div>
              <div className="text-4xl font-bold text-gray-900">{dashboardMetrics.projectsAtRisk}</div>
              <p className="text-xs text-gray-500 mt-2">Behind schedule</p>
            </div>
          </div>
        </div>

        {/* Right Column - AI Recommendation (spans 2 rows) */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6 lg:row-span-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg font-bold text-gray-900">AI RECOMMENDATION</h2>
          </div>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {dashboardMetrics.projectsAtRisk > 0
                ? `⚠️ ${dashboardMetrics.projectsAtRisk} project(s) are behind schedule. Consider reallocating resources from lower priority tasks.`
                : dashboardMetrics.teamUtilization > 85
                ? `📈 Team utilization is high at ${dashboardMetrics.teamUtilization}%. Monitor workload closely and plan capacity accordingly.`
                : `✅ Team is working at optimal capacity. Good job maintaining work-life balance!`}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-indigo-600">→</span>
              <span className="text-gray-700">Review overdue tasks</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-indigo-600">→</span>
              <span className="text-gray-700">Rebalance team workload</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-indigo-600">→</span>
              <span className="text-gray-700">Schedule team sync</span>
            </div>
          </div>
        </div>

        {/* Left Column - Project Deadlines */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">PROJECT UPCOMING DEADLINES</h2>
          
          {upcomingDeadlines.length > 0 ? (
            <div className="space-y-3">
              {upcomingDeadlines.map((issue: any, idx: number) => {
                const dueDate = new Date(issue.due);
                const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntil <= 3;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{issue.summary}</p>
                      <p className="text-xs text-gray-500 mt-1">{issue.key} • {issue.assignee || 'Unassigned'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isUrgent ? 'text-red-600' : 'text-gray-600'}`}>
                        {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
                      </p>
                      <p className="text-xs text-gray-400">{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">No upcoming deadlines in the next 2 weeks</p>
            </div>
          )}
        </div>
      </div>

      {/* Capacity Overview - Full Width */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">CAPACITY OVERVIEW</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Total Allocated</p>
            <div className="text-3xl font-bold text-gray-900">{dashboardMetrics.totalAllocated}h</div>
            <p className="text-xs text-gray-500 mt-2">Out of {(dashboardMetrics.teamMembers * 40).toLocaleString()}h weekly capacity</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Available</p>
            <div className="text-3xl font-bold text-emerald-600">{dashboardMetrics.availableCapacity}h</div>
            <p className="text-xs text-gray-500 mt-2">{dashboardMetrics.availableCapacity > 0 ? 'Ready for new work' : 'At full capacity'}</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Team Members</p>
            <div className="text-3xl font-bold text-blue-600">{dashboardMetrics.teamMembers}</div>
            <p className="text-xs text-gray-500 mt-2">Active in projects</p>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Weekly Capacity Utilization</p>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${dashboardMetrics.teamUtilization}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">0%</span>
            <span className="text-xs font-semibold text-gray-900">{dashboardMetrics.teamUtilization}% Utilized</span>
            <span className="text-xs text-gray-500">100%</span>
          </div>
        </div>
      </div>

      {/* Gantt Timeline View */}
      {jiraIssues.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">EMPLOYEE TIMELINE</h2>
          {jiraLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <p className="text-gray-600">Loading timeline...</p>
            </div>
          ) : (
            <ManagerGantt autoFetch={true} jiraIssues={jiraIssues} />
          )}
        </div>
      )}
    </div>
  );
};

export default function VelocityAI() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'manager' | 'vp'>('manager');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jiraConnected, setJiraConnectionState] = useState<boolean>(() => {
    return getJiraConnected();
  });
  const [jiraData, setJiraData] = useState<any>(null);
  const [jiraAuthStatus, setJiraAuthStatus] = useState<boolean>(false);
  const [authCheckDone, setAuthCheckDone] = useState(false);

  // Check Jira authentication status on mount
  useEffect(() => {
    const checkJiraAuth = async () => {
      try {
        const response = await fetch(apiUrl('/api/jira/auth/status'), {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          console.log('[VelocityAI] Jira auth status:', data.connected);
          setJiraAuthStatus(data.connected);
        }
      } catch (error) {
        console.error('[VelocityAI] Error checking Jira auth:', error);
      } finally {
        setAuthCheckDone(true);
      }
    };

    checkJiraAuth();
  }, []);

  // Protect route - allow if either Supabase user OR Jira is authenticated
  useEffect(() => {
    if (!authLoading && authCheckDone) {
      const isAuthenticated = user || jiraAuthStatus;
      
      if (!isAuthenticated) {
        console.log('[VelocityAI] User not authenticated (no Supabase user and no Jira auth), redirecting to login');
        navigate('/login', { replace: true });
      } else {
        console.log('[VelocityAI] User authenticated via:', user ? 'Supabase' : 'Jira');
      }
    }
  }, [user, authLoading, jiraAuthStatus, authCheckDone, navigate]);

  useEffect(() => {
    fetchJiraData().then(data => {
      if (data) {
        setJiraData(data);
        setJiraConnectionState(true);
        console.log('Jira connected with data:', data);
      }
    }).catch(err => {
      console.error('Failed to fetch Jira data:', err);
      // Don't block dashboard - continue without Jira data
    });
  }, []);

  useEffect(() => {
    setJiraConnected(jiraConnected);
  }, [jiraConnected]);

  const handleJiraConnectionChange = (connected: boolean) => {
    setJiraConnectionState(connected);
  };

  const handleSecurityAuditClick = () => {
    setActiveTab('security');
  };

  // Show loading while checking authentication
  if (authLoading || !authCheckDone) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect happens in useEffect if not authenticated
  if (!user && !jiraAuthStatus) {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <style>{`
        .capacity-bar {
          height: 24px;
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .hotspot-card {
          transition: all 0.2s ease;
        }
        .hotspot-card:hover {
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
      `}</style>

      {/* --- HEADERS --- */}
      {currentView === 'manager' && (
        <VeloHeader 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          onSecurityAuditClick={handleSecurityAuditClick} 
        />
      )}

      {currentView === 'vp' && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center">
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setCurrentView('manager')}
                className={`h-8 sm:h-10 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentView === 'manager'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="hidden sm:inline">Manager View</span>
                </span>
              </button>
              <button
                onClick={() => setCurrentView('vp')}
                className={`h-8 sm:h-10 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentView === 'vp'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">VP Executive View</span>
                </span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* --- MAIN CONTENT LAYOUT --- */}
      {currentView === 'vp' ? (
        <main className="w-full">
          <VPDashboard />
        </main>
      ) : (
        <VeloNavTabs activeTab={activeTab} onTabChange={setActiveTab}>
          <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto animate-in fade-in duration-300">
            
            {activeTab === 'dashboard' && <ModernDashboard jiraData={jiraData} />}
            {activeTab === 'unified' && <UnifiedView />} {/* NEW TAB */}
            {activeTab === 'projects' && <Projects jiraConnected={jiraConnected} withNav={false} />}
            {activeTab === 'stc' && <StandardTimeCatalogTab />}
            {activeTab === 'ledger' && <CapacityLedgerTab />}
            {activeTab === 'hubspot' && <HubSpotTab />}
            {activeTab === 'deployment' && <ProjectCheckView />}
            
            {activeTab === 'activity' && <ProjectActivityTab />}
            {activeTab === 'roi' && <ROIVerificationTab />}
            {activeTab === 'security' && <SecurityAuditTab onJiraConnectionChange={handleJiraConnectionChange} />}
            {activeTab === 'leave' && <LeaveManagementTab />}
            {activeTab === 'progress' && <SmartProgressTracker />}
            
          </div>
        </VeloNavTabs>
      )}
    </div>
  );
}