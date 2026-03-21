import { useState, useEffect, useMemo } from 'react';
import { VelocityAISidebar } from '../components/dashboard/VelocityAISidebar';
import { PeopleCapacityScreen } from '../components/PeopleCapacityScreen';
import {
  BarChart3,
  Users,
  Zap,
  Activity,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Feature Components
import StandardTimeCatalogTab from '../components/demo2/StandardTimeCatalogTab';
import CapacityLedgerTab from '../components/demo2/CapacityLedgerTab';
import ProjectActivityTab from '../components/demo2/ProjectActivityTab';
import SecurityAuditTab from '../components/demo2/SecurityAuditTab';
import Projects from '../components/projects/Projects';
import LeaveManagementTab from '../components/leave-management';
import ProjectCheckView from '@/components/ml-model';
import ManagerGantt from '@/components/ManagerGantt';
import SmartProgressTracker from '../components/smart-progress';

import { getJiraConnected, setJiraConnected } from '../lib/storage';
import { apiUrl } from '../lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

import { JiraCapacityMap } from '../components/leave-management/JiraCapacityMap';
import { useJiraData } from '../hooks/useJiraData';
import { fetchProjectsHybrid, fetchAllIssuesHybrid } from '../lib/jiraDbClient';
import { setCurrentOrgId } from '../lib/orgContext';
import { parseCSV } from '../components/ml-model/RecommendationEngine';
import { Task, EmployeeProfile } from '../components/leave-management/types';

// NEW: Import Jira data service
import { syncJiraDataWithDB, syncAfterJiraOAuth, getJiraDataState } from '../lib/jiraDataService';
import { JiraSyncLoading } from '../components/dashboard/JiraSyncLoading';

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
    // Store orgId in localStorage so jiraDbClient can use it
    if (data.orgId) {
      setCurrentOrgId(data.orgId);
    }
    return data.connected ? data : null;
  } catch (error) {
    console.error('Error fetching Jira status:', error instanceof Error ? error.message : error);
    return null;
  }
}

// Fetch Jira resources — DB-first with API fallback
async function fetchJiraData() {
  const status = await fetchJiraStatus();

  try {
    // Fetch projects from DB (hybrid)
    const { projects: dbProjects, source: projSource } = await fetchProjectsHybrid();

    // Deduplicate projects by key
    const seenProjectKeys = new Set<string>();
    const projects = dbProjects.filter((p: any) => {
      if (seenProjectKeys.has(p.key)) {
        console.warn(`[VelocityAI] Duplicate project detected: ${p.key}`);
        return false;
      }
      seenProjectKeys.add(p.key);
      return true;
    });

    console.log(`%c[VelocityAI] Projects Fetched`, 'color: #2DD4BF; font-weight: bold;');
    console.log(`  Source: ${projSource}`);
    console.log(`  Total fetched: ${dbProjects.length}, Unique: ${projects.length}`);

    if (projects.length === 0) {
      console.warn('No Jira projects found');
      return null;
    }

    // Fetch all issues from DB (hybrid)
    const { issues: allIssues, source: issSource } = await fetchAllIssuesHybrid();
    console.log(`[VelocityAI] Got ${allIssues.length} issues from ${issSource}`);

    let totalHours = 0;
    const assigneesSet = new Set<string>();

    console.log('%c=== JIRA PROJECTS CONNECTED ===', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
    console.log(`Total Projects: ${projects.length}`);
    console.log('');

    // Group issues by project_key for logging
    const byProject = new Map<string, any[]>();
    for (const issue of allIssues) {
      const pk = issue.project_key || issue.team || 'unknown';
      if (!byProject.has(pk)) byProject.set(pk, []);
      byProject.get(pk)!.push(issue);
    }

    for (const project of projects) {
      const issues = byProject.get(project.key) || [];

      console.log(`%c📋 PROJECT: ${project.title} (${project.key})`, 'color: #2196F3; font-weight: bold; font-size: 13px;');
      console.log(`   Total Tasks: ${issues.length}`);
      console.log('%c   First 5 Tasks:', 'color: #666; font-style: italic;');

      const firstFive = issues.slice(0, 5);
      firstFive.forEach((issue: any, index: number) => {
        console.log(`   ${index + 1}. [${issue.key}] ${issue.summary}`);
        console.log(`      Status: ${issue.status} | Priority: ${issue.priority} | Assignee: ${issue.assignee || 'Unassigned'}`);
        if (issue.description) {
          const desc = issue.description.substring(0, 80);
          console.log(`      Description: ${desc}${issue.description.length > 80 ? '...' : ''}`);
        }
      });
      console.log('');

      issues.forEach((issue: any) => {
        let hours = 8;
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

    const stats = {
      totalTasks: allIssues.length,
      totalProjects: projects.length,
      teamMembers: assigneesSet.size,
      totalHours: Math.round(totalHours)
    };

    console.log('%c=== SUMMARY ===', 'color: #FF9800; font-size: 14px; font-weight: bold;');
    console.log(`✅ Total Projects: ${stats.totalProjects}`);
    console.log(`✅ Total Tasks/Issues: ${stats.totalTasks}`);
    console.log(`✅ Team Members: ${stats.teamMembers}`);
    console.log(`✅ Total Hours (estimated): ${stats.totalHours}`);
    console.log('%c=== END JIRA SETUP ===', 'color: #4CAF50; font-size: 12px; font-weight: bold;');
    console.log('');

    console.log('Jira data fetched successfully:', {
      projects: projects.length,
      stats
    });

    return {
      resources: status?.availableSites || [],
      projects,
      cloudId: status?.site?.cloudId || null,
      site: status?.site || null,
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
  const [capacityBreakdown, setCapacityBreakdown] = useState<any>(null);
  const [fromDate, setFromDate] = useState({ month: '01', year: '2025' });
  const [toDate, setToDate] = useState({ month: '03', year: '2025' });

  // Generate capacity data from Jira issues for the selected date range
  const generateCapacityData = useMemo(() => {
    const from = new Date(`${fromDate.year}-${fromDate.month}-01`);
    const to = new Date(`${toDate.year}-${toDate.month}-01`);
    to.setMonth(to.getMonth() + 1);
    to.setDate(0); // Last day of month

    const weeks: any[] = [];
    let currentDate = new Date(from);
    let weekNum = 1;

    while (currentDate <= to) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Calculate hours worked vs hours not worked for this week from ALL employees
      let hoursWorked = 0;
      let hoursNotWorked = 0;

      jiraIssues.forEach((issue: any) => {
        // Use due date or start date to match with week
        const issueDate = issue.due ? new Date(issue.due) : (issue.start ? new Date(issue.start) : null);

        // Check if issue falls within this week - if no date, still include it
        const isInWeek = !issueDate || (issueDate >= weekStart && issueDate <= weekEnd);

        if (isInWeek && issue.assignee) { // Only count if assigned to someone (an employee is working on it)
          const hours = typeof issue.duration === 'string' ? parseInt(issue.duration) : (issue.duration || 0);

          if (hours > 0) {
            // Check if issue is completed - sum all hours from all employees
            const isCompleted = issue.status?.toLowerCase?.()?.includes('done') ||
              issue.status?.toLowerCase?.()?.includes('completed') ||
              issue.status?.toLowerCase?.()?.includes('closed');

            if (isCompleted) {
              hoursWorked += hours;
            } else {
              hoursNotWorked += hours;
            }
          }
        }
      });

      weeks.push({
        week: `W${weekNum}`,
        worked: hoursWorked,
        notWorked: hoursNotWorked,
      });

      currentDate.setDate(currentDate.getDate() + 7);
      weekNum++;
    }

    return weeks;
  }, [fromDate, toDate, jiraIssues]);

  // Date range for capacity overview (kept for backward compatibility)
  const dateFrom = `${fromDate.year}-${fromDate.month}-01`;
  const dateTo = `${toDate.year}-${toDate.month}-01`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    // Use ALL Jira issues - no date filtering
    const filteredIssues = jiraIssues;

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
    let availableCapacity = 0;
    let allocatedCapacity = 0;
    let totalOccupiedDays = 0;
    let totalProjectBusinessDays = 0;

    // Group issues by PROJECT first
    const byProject: { [projectKey: string]: any[] } = {};

    filteredIssues.forEach((issue: any) => {
      const issueDueDate = issue.due ? new Date(issue.due) : null;
      const issueStartDate = issue.start ? new Date(issue.start) : null;
      const projectKey = issue.key?.split('-')[0] || 'Unknown';

      // Calculate duration from start to due date (in business hours)
      let duration = 0;
      if (issueStartDate && issueDueDate) {
        const businessDaysForTask = countBusinessDays(issueStartDate, issueDueDate);
        duration = businessDaysForTask * 8; // 8 hours per business day
      }

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

      if (!byProject[projectKey]) {
        byProject[projectKey] = [];
      }
      byProject[projectKey].push(issue);
      allocatedCapacity += duration;
    });

    const uniqueAssignees = new Set(jiraIssues.map((i: any) => i.assignee || 'Unassigned'));

    // Track per-assignee per-project capacity - ONLY count their working window in that project
    const assigneeProjectCapacity: { [key: string]: Array<{ projectKey: string; windowStart: string; windowEnd: string; businessDays: number; occupiedDays: number; idleDays: number; idleHours: number }> } = {};

    // Process each project individually
    const projectKeys = Object.keys(byProject).sort();
    for (let projectIndex = 0; projectIndex < projectKeys.length; projectIndex++) {
      const projectKey = projectKeys[projectIndex];
      const projectIssues = byProject[projectKey];

      // Group by assignee FIRST to get each person's window in this project
      const byAssigneeInProject: { [key: string]: Array<{ start: Date; due: Date }> } = {};

      projectIssues.forEach((issue: any) => {
        const assignee = issue.assignee || 'Unassigned';
        const startDate = issue.start ? new Date(issue.start) : null;
        const dueDate = issue.due ? new Date(issue.due) : null;

        if (!byAssigneeInProject[assignee]) {
          byAssigneeInProject[assignee] = [];
        }

        if (startDate || dueDate) {
          byAssigneeInProject[assignee].push({
            start: startDate || dueDate!,
            due: dueDate || startDate!
          });
        }
      });

      // For each assignee in this project, calculate their individual capacity
      for (const assignee in byAssigneeInProject) {
        const intervals = byAssigneeInProject[assignee];

        if (intervals.length === 0) continue;

        // Find this assignee's working window in this project (first task to last task)
        let assigneeProjectMinDate: Date | null = null;
        let assigneeProjectMaxDate: Date | null = null;

        intervals.forEach(interval => {
          if (!assigneeProjectMinDate || interval.start < assigneeProjectMinDate) {
            assigneeProjectMinDate = new Date(interval.start);
          }
          if (!assigneeProjectMaxDate || interval.due > assigneeProjectMaxDate) {
            assigneeProjectMaxDate = new Date(interval.due);
          }
        });

        if (!assigneeProjectMinDate || !assigneeProjectMaxDate) continue;

        // Count business days ONLY in this assignee's working window for this project
        const assigneeWindowBusinessDays = countBusinessDays(assigneeProjectMinDate, assigneeProjectMaxDate);

        // Merge overlapping intervals for this assignee
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

        // Count occupied business days for this assignee in this project
        let assigneeOccupiedDays = 0;
        merged.forEach(interval => {
          const occupiedDays = countBusinessDays(interval.start, interval.due);
          assigneeOccupiedDays += occupiedDays;
        });

        // Calculate idle days for this assignee in this project
        const assigneeIdleDays = Math.max(0, assigneeWindowBusinessDays - assigneeOccupiedDays);
        const assigneeIdleHours = assigneeIdleDays * 8;

        // Track this data
        if (!assigneeProjectCapacity[assignee]) {
          assigneeProjectCapacity[assignee] = [];
        }
        assigneeProjectCapacity[assignee].push({
          projectKey,
          windowStart: assigneeProjectMinDate.toLocaleDateString(),
          windowEnd: assigneeProjectMaxDate.toLocaleDateString(),
          businessDays: assigneeWindowBusinessDays,
          occupiedDays: assigneeOccupiedDays,
          idleDays: assigneeIdleDays,
          idleHours: assigneeIdleHours
        });

        // Add to project totals
        totalProjectBusinessDays += assigneeWindowBusinessDays;
        totalOccupiedDays += assigneeOccupiedDays;
        availableCapacity += assigneeIdleHours;
      }
    }

    // Log per-assignee per-project capacity
    console.log('📊 Per-Assignee Per-Project Capacity Breakdown (Based on Their Working Window Only):');
    for (const assignee in assigneeProjectCapacity) {
      console.log(`\n👤 ${assignee}:`);
      assigneeProjectCapacity[assignee].forEach((proj, idx) => {
        console.log(`  ${idx + 1}. ${proj.projectKey}: ${proj.windowStart} → ${proj.windowEnd}`);
        console.log(`     Assignee Working Window: ${proj.businessDays} business days`);
        console.log(`     Occupied: ${proj.occupiedDays}d | Idle: ${proj.idleDays}d = ${proj.idleHours}hrs`);
      });
    }

    // Calculate per-project utilization (project start to project end, no buffers between projects)
    const projectUtilizations: number[] = [];
    for (const projectKey of projectKeys) {
      const projectIssues = byProject[projectKey];

      // Find earliest and latest dates across ALL team members in this project
      let projectMinDate: Date | null = null;
      let projectMaxDate: Date | null = null;
      let projectOccupiedDays = 0;

      // Get all intervals in this project
      const allProjectIntervals: Array<{ start: Date; due: Date }> = [];
      projectIssues.forEach((issue: any) => {
        const startDate = issue.start ? new Date(issue.start) : null;
        const dueDate = issue.due ? new Date(issue.due) : null;

        if (startDate || dueDate) {
          allProjectIntervals.push({
            start: startDate || dueDate!,
            due: dueDate || startDate!
          });

          // Track project timebox
          if (!projectMinDate || (startDate && startDate < projectMinDate)) {
            projectMinDate = startDate;
          }
          if (!projectMaxDate || (dueDate && dueDate > projectMaxDate)) {
            projectMaxDate = dueDate;
          }
        }
      });

      // If no clear start/end, use min/max from intervals
      if (!projectMinDate) {
        projectMinDate = allProjectIntervals[0]?.start;
      }
      if (!projectMaxDate) {
        projectMaxDate = allProjectIntervals[allProjectIntervals.length - 1]?.due;
      }

      if (!projectMinDate || !projectMaxDate) continue;

      // Count project business days (from first to last task, no buffers)
      const projectBusinessDays = countBusinessDays(projectMinDate, projectMaxDate);

      // Merge overlaps and count occupied days for this project
      const sortedIntervals = allProjectIntervals.sort((a, b) => a.start.getTime() - b.start.getTime());
      const merged: Array<{ start: Date; due: Date }> = [];

      sortedIntervals.forEach(interval => {
        if (merged.length === 0) {
          merged.push(interval);
        } else {
          const last = merged[merged.length - 1];
          if (interval.start <= last.due) {
            last.due = interval.due > last.due ? interval.due : last.due;
          } else {
            merged.push(interval);
          }
        }
      });

      merged.forEach(interval => {
        projectOccupiedDays += countBusinessDays(interval.start, interval.due);
      });

      // Calculate project utilization
      const projectUtilization = projectBusinessDays > 0 ? (projectOccupiedDays / projectBusinessDays) * 100 : 0;
      projectUtilizations.push(projectUtilization);

      console.log(`📋 ${projectKey}: ${projectMinDate.toLocaleDateString()} → ${projectMaxDate.toLocaleDateString()}`);
      console.log(`   Business Days: ${projectBusinessDays}, Occupied: ${projectOccupiedDays}d, Utilization: ${Math.round(projectUtilization)}%`);
    }

    // Average utilization across projects
    const totalTeamUtilization = projectUtilizations.length > 0
      ? Math.round(projectUtilizations.reduce((a, b) => a + b) / projectUtilizations.length)
      : 0;

    // Store capacity breakdown in state for display
    setCapacityBreakdown({
      assigneeData: assigneeProjectCapacity,
      totalBusinessDays: totalProjectBusinessDays,
      totalOccupiedDays: totalOccupiedDays,
      totalAvailableDays: totalProjectBusinessDays - totalOccupiedDays,
      totalTeamUtilization: totalTeamUtilization
    });

    return {
      activeProjects: activeProjectsSet.size,
      projectsAtRisk: projectsAtRiskSet.size,
      teamUtilization: Math.min(100, totalTeamUtilization),
      availableCapacity: Math.max(0, availableCapacity),
      teamMembers: uniqueAssignees.size,
      totalTasks: jiraIssues.length,
      totalAllocated: Math.round(allocatedCapacity),
    };
  }, [jiraIssues, dateFrom, dateTo]);



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
          id: String(index),
          projectName: row.Project || "Unassigned",
          taskName: row["Task Name"] || "Untitled Task",
          assignee: row.Assignee || "Unassigned",
          hours: row["Planned Hours"] || 0,
          day: Math.floor(Math.random() * 5),
          requiredSkills: row["Skill Used"] ? [row["Skill Used"]] : [],
          isReallocated: false,
          isCancelled: false,
          totalLogged: row["Actual Hours"] || 0,
          status: 'Todo',
          logs: []
        }));

        setTasks(loadedTasks);

        const uniqueNames = Array.from(new Set(loadedTasks.map(t => t.assignee)));
        const loadedEmployees: EmployeeProfile[] = uniqueNames.map((name, index) => {
          const userTasks = loadedTasks.filter(t => t.assignee === name);
          const skills = Array.from(new Set(userTasks.flatMap(t => t.requiredSkills)));
          return {
            id: `emp-${index}`,
            organization_id: 'default-org',
            email: `${name.toLowerCase().replace(/ /g, '.')}@example.com`,
            name,
            role: 'employee',
            skills: skills.slice(0, 3),
            capacity_hours_per_week: 40,
            is_active: true
          };
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
    <div className="bg-gray-50 min-h-screen p-12 font-['Inter',sans-serif]">
      <div className="max-w-[1600px] mx-auto space-y-12">

        {/* Header Section */}
        <div>
          <h1 className="text-4xl font-light text-gray-900 mb-3 tracking-tight">Dashboard</h1>
          <p className="text-gray-600 font-light text-base">Here's what's happening with your teams today.</p>
        </div>

        {/* Main Content Area - KPI Cards (Full Width) */}
        <div className="grid grid-cols-4 gap-6">
          {/* Active Project Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-light text-gray-500 uppercase tracking-wider">Active Projects</h3>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            <div className="text-4xl font-light text-gray-900 mb-2">{dashboardMetrics.activeProjects}</div>
            <p className="text-xs text-gray-500 font-light">Projects with activity today</p>
          </div>

          {/* Team Utilization Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-all">
            <h3 className="text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Team Utilization</h3>
            <div className="text-4xl font-light text-gray-900 mb-3">{dashboardMetrics.teamUtilization}%</div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${dashboardMetrics.teamUtilization}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 font-light mt-2">{dashboardMetrics.teamMembers} team members</p>
          </div>

          {/* Project at Risk Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-light text-gray-500 uppercase tracking-wider">Projects at Risk</h3>
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            </div>
            <div className="text-4xl font-light text-gray-900 mb-2">{dashboardMetrics.projectsAtRisk}</div>
            <p className="text-xs text-gray-500 font-light">Behind schedule</p>
          </div>

          {/* Team Members Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-all">
            <h3 className="text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Team Members</h3>
            <div className="text-4xl font-light text-gray-900 mb-2">{dashboardMetrics.teamMembers}</div>
            <p className="text-xs text-gray-500 font-light">Active across all projects</p>
          </div>
        </div>

        {/* Employee Timeline View */}
        <div className="">
          <h2 className="text-xl font-light text-gray-900 mb-8">Employee Timeline</h2>
          {(() => {
            const state = {
              loading: jiraLoading,
              issuesCount: jiraIssues?.length || 0,
              shouldRender: jiraIssues && jiraIssues.length > 0 && !jiraLoading
            }
            console.log('[ModernDashboard] Gantt section render check:', state)

            // Don't block render on loading - show content with fade-in instead

            if (!jiraIssues || jiraIssues.length === 0) {
              console.log('[ModernDashboard] Showing no tasks state')
              return (
                <div className="bg-white rounded-2xl shadow-sm p-10 border border-gray-100 text-center">
                  <p className="text-gray-500 font-light">No tasks available to display timeline</p>
                  <p className="text-gray-400 text-sm mt-1 font-light">Connect to Jira to view your tasks</p>
                </div>
              )
            }

            console.log('[ModernDashboard] Rendering Gantt with', jiraIssues.length, 'issues:', jiraIssues.map(i => ({ key: i.key, summary: i.summary, dates: { start: i.start, due: i.due, created: i.created } })))
            return <ManagerGantt autoFetch={false} jiraIssues={jiraIssues} />
          })()}
        </div>
      </div>
    </div>
  );
};

export default function VelocityAI() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<'manager' | 'vp'>('manager');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jiraConnected, setJiraConnectionState] = useState<boolean>(() => {
    return getJiraConnected();
  });
  const [jiraData, setJiraData] = useState<any>(null);
  const [jiraAuthStatus, setJiraAuthStatus] = useState<boolean>(false);
  const [authCheckDone, setAuthCheckDone] = useState(false);

  // NEW: Jira sync loading state
  const [jiraSyncLoading, setJiraSyncLoading] = useState(false);
  const [jiraSyncProgress, setJiraSyncProgress] = useState(0);
  const [jiraCheckComplete, setJiraCheckComplete] = useState(false);

  // Check for tab query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && !document.hidden) { // Only update tab if page is visible
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // NEW: Detect when user returns from Jira OAuth and sync data
  useEffect(() => {
    const jiraLoginInitiated = sessionStorage.getItem('jiraLoginInitiated');
    if (jiraLoginInitiated === 'true') {
      console.log('[VelocityAI] User returned from Jira OAuth, syncing data...');
      sessionStorage.removeItem('jiraLoginInitiated');

      setJiraSyncLoading(true);
      setJiraSyncProgress(20);

      // Wait a moment for server-side sync to complete
      setTimeout(async () => {
        try {
          setJiraSyncProgress(40);

          // Check auth status first
          const response = await fetch(apiUrl('/api/jira/auth/status'), {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.orgId) {
              setCurrentOrgId(data.orgId);
              setJiraSyncProgress(60);

              // Now sync the data
              await syncAfterJiraOAuth(data.orgId);
              setJiraSyncProgress(90);

              // Small delay then hide - use state update instead of reload
              setTimeout(() => {
                setJiraSyncProgress(100);
                setTimeout(() => {
                  setJiraSyncLoading(false);
                  // Instead of reloading, re-fetch Jira data to trigger state update
                  setJiraAuthStatus(true);
                  if (fetchJiraData) fetchJiraData();
                }, 500);
              }, 500);
            }
          }
        } catch (err) {
          console.error('[VelocityAI] Error syncing after Jira OAuth:', err);
          setJiraSyncLoading(false);
        }
      }, 1000);
    }
  }, []);

  // Check Jira authentication status on mount (only once)
  useEffect(() => {
    if (jiraCheckComplete) return; // Prevent re-running on tab focus
    if (document.hidden) return; // Skip if page is hidden

    const checkJiraAuth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(apiUrl('/api/jira/auth/status'), {
          credentials: 'include',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const isConnected = data?.connected === true;
          console.log('[VelocityAI] Jira auth status response:', {
            connected: isConnected,
            responseData: data
          });
          setJiraAuthStatus(isConnected);

          // Store orgId for data fetching
          if (data?.orgId) {
            setCurrentOrgId(data.orgId);
          }
        } else {
          console.warn('[VelocityAI] Jira status endpoint returned non-OK status:', response.status);
          setJiraAuthStatus(false);
        }
      } catch (error) {
        console.error('[VelocityAI] Error checking Jira auth:', error);
        setJiraAuthStatus(false);
      } finally {
        setAuthCheckDone(true);
        setJiraCheckComplete(true); // Mark as complete to prevent re-running
      }
    };

    checkJiraAuth();
  }, [jiraCheckComplete]);

  // Protect route - allow if either Supabase user OR Jira is authenticated
  // Only navigate if auth check is truly done AND user is not authenticated
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
  }, [authLoading, authCheckDone]); // Remove user/jiraAuthStatus to prevent re-triggering on state changes

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

  // Show loading indicator but don't completely block rendering
  return (
    <>
      {/* Jira sync loading overlay */}
      <JiraSyncLoading
        isVisible={jiraSyncLoading}
        message="Syncing your Jira data"
        progress={jiraSyncProgress}
      />

      <VelocityAISidebar>
        <style>{`
              .capacity-bar {
                height: 24px;
                background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
                border-radius: 8px;
                transition: width 0.3s ease;
              }
              .hotspot-card {
                transition: all 0.2s ease;
                border-radius: 16px;
                border: 1px solid #f3f4f6;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              .hotspot-card:hover {
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                transform: translateY(-2px);
              }
              .tab-transition {
                animation: fadeInUpSmooth 0.3s ease-out;
              }
              @keyframes fadeInUpSmooth {
                from {
                  opacity: 0;
                  transform: translateY(8px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>

        <div className="tab-transition">
          {activeTab === 'dashboard' && <ModernDashboard jiraData={jiraData} />}
          {activeTab === 'projects' && <Projects />}
          {activeTab === 'people' && <PeopleCapacityScreen />}
          {activeTab === 'stc' && <StandardTimeCatalogTab />}
          {activeTab === 'ledger' && <CapacityLedgerTab />}
          {activeTab === 'deployment' && <ProjectCheckView />}
          {activeTab === 'activity' && <ProjectActivityTab />}
          {activeTab === 'security' && <SecurityAuditTab onJiraConnectionChange={handleJiraConnectionChange} />}
          {activeTab === 'leave' && <LeaveManagementTab />}
          {activeTab === 'progress' && <SmartProgressTracker />}
        </div>
      </VelocityAISidebar>
    </>
  );
}