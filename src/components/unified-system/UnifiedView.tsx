import React, { useState, useEffect } from 'react';
import { ProjectQueue } from './ideation/ProjectQueue';
import { ActiveProjectDetail } from './execution/ActiveProjectDetail';
import { TimetableView } from './timetable/TimetableView';
import { NotificationPanel } from './notifications/NotificationPanel';
import { UnifiedProject, UnifiedEmployee, LeaveRequest, ProjectCategory, Notification } from './types';
import { Button } from '../ui/button';
import { 
  LayoutGrid, CheckCircle2, Briefcase, Wrench, FlaskConical, 
  Layers, User, UserCog, Calendar, LayoutDashboard, CalendarRange, Filter, X, Bell, Zap, AlertCircle 
} from 'lucide-react';

import { fetchRawCSV } from '../ml-model/RecommendationEngine'; 
import csvPath from '../ml-model/datasets/master_employee_task_report.csv?url';
<<<<<<< HEAD
import { CapacityReport } from '../../lib/types'; // Import the CapacityReport type
=======
import { fetchProjectsHybrid, fetchIssuesHybrid } from '@/lib/jiraDbClient';
>>>>>>> c5ce8ffec616cbcb8837c7327cdb35a999716df2

import { mlService } from '../../services/mlService'; // adjust path if needed

const [capacityReports, setCapacityReports] = useState<CapacityReport[]>([]);

// 2. Add this inside the initSystem() function, right AFTER setEmployees(loadedEmployees);
try {
  // Map UnifiedEmployee to MLCandidate format
  const mlCandidates = loadedEmployees.map(emp => ({
    id: emp.id.toString(),
    name: emp.name,
    current_load: emp.currentLoad,
    skills: emp.skills,
    role_level: 'mid' as const, // default fallback
    base_productive_hours: emp.base_productive_hours,
    pto_hours_this_week: emp.pto_hours_this_week,
    holiday_hours_this_week: emp.holiday_hours_this_week
  }));
  
  const capacity = await mlService.analyzeCapacity(mlCandidates);
  setCapacityReports(capacity);
} catch (error) {
  console.error("Failed to load capacity reports", error);
}
// --- HELPER ICONS ---
const getCategoryIcon = (cat: string) => {
  switch(cat) {
    case 'Client Deliverable': return <Briefcase className="w-3 h-3" />;
    case 'Internal Tool': return <Wrench className="w-3 h-3" />;
    case 'R&D / POC': return <FlaskConical className="w-3 h-3" />;
    default: return <Layers className="w-3 h-3" />;
  }
};

const getCategoryStyle = (cat: string) => {
  switch(cat) {
    case 'Client Deliverable': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'Internal Tool': return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'R&D / POC': return 'bg-purple-50 text-purple-700 border-purple-100';
    default: return 'bg-slate-50 text-slate-600';
  }
};

// --- JIRA INTEGRATION HELPERS ---
interface JiraIssue {
  key: string;
  summary: string;
  description: string;
  status: string;
  assignee: string;
  priority: string;
  issueType: string;
  team: string;
  due?: string;
  created?: string;
  start?: string;
}

interface JiraConnectionStatus {
  connected: boolean;
  site?: { id: string; name: string; url: string };
  availableSites?: Array<{ id: string; name: string; url: string }>;
}

const checkJiraConnection = async (): Promise<JiraConnectionStatus> => {
  try {
    const response = await fetch('/api/jira/auth/status', { credentials: 'include' });
    if (response.ok) {
      return await response.json();
    }
    return { connected: false };
  } catch (error) {
    console.error('[Jira] Connection check failed:', error);
    return { connected: false };
  }
};

const fetchJiraProjects = async (): Promise<any[]> => {
  try {
    const { projects } = await fetchProjectsHybrid();
    return projects;
  } catch (error) {
    console.error('[Jira] Error fetching projects:', error);
    return [];
  }
};

const fetchJiraIssuesForProject = async (projectKey: string): Promise<JiraIssue[]> => {
  try {
    const { issues } = await fetchIssuesHybrid(projectKey);
    return issues as unknown as JiraIssue[];
  } catch (error) {
    console.error(`[Jira] Error fetching issues for ${projectKey}:`, error);
    return [];
  }
};

const mapJiraIssuesToProjects = (
  jiraIssues: JiraIssue[],
  employees: UnifiedEmployee[]
): UnifiedProject[] => {
  return jiraIssues.map((issue, idx) => {
    // Find or create employee from assignee
    let assignedTeamIds: number[] = [];
    if (issue.assignee && issue.assignee !== 'Unassigned') {
      const emp = employees.find(e => e.name.toLowerCase() === issue.assignee.toLowerCase());
      if (emp) {
        assignedTeamIds = [emp.id];
      }
    }

    // Determine category based on issue type
    let category: ProjectCategory = 'Client Deliverable';
    const lowerType = (issue.issueType || '').toLowerCase();
    if (lowerType.includes('task') || lowerType.includes('internal')) category = 'Internal Tool';
    else if (lowerType.includes('bug') || lowerType.includes('research')) category = 'R&D / POC';

    // Determine priority
    const priority = issue.priority?.toLowerCase().includes('high') ? 'High' : 'Medium';

    // Estimate hours based on priority
    const estimatedHours = priority === 'High' ? 16 : 8;

    // Determine status
    const status = (
      issue.status?.toLowerCase().includes('done') ||
      issue.status?.toLowerCase().includes('closed') ||
      issue.status?.toLowerCase().includes('resolved')
    ) ? 'COMPLETED' : 'ACTIVE';

    // Extract dates from Jira
    const createdDate = issue.start || issue.created || new Date().toISOString();
    const dueDate = issue.due || createdDate;

    return {
      id: `jira_${issue.key}`,
      title: `${issue.key}: ${issue.summary}`,
      description: issue.description || issue.team,
      status,
      category,
      requiredSkills: [issue.issueType || 'Development'],
      estimatedHours,
      priority,
      assignedTeamIds,
      startDate: typeof createdDate === 'string' ? createdDate.split('T')[0] : createdDate,
      deadline: typeof dueDate === 'string' ? dueDate.split('T')[0] : dueDate,
    };
  });
};

const fetchAllJiraTasksData = async (): Promise<{
  employees: UnifiedEmployee[];
  projects: UnifiedProject[];
}> => {
  const result = { employees: [], projects: [] };

  try {
    // Check Jira connection
    const connStatus = await checkJiraConnection();
    if (!connStatus.connected) {
      console.log('[Unified] Jira not connected, using CSV fallback');
      return result;
    }

    console.log('[Unified] Jira connected! Fetching Jira projects...');

    // Fetch all Jira projects
    const jiraProjects = await fetchJiraProjects();
    if (jiraProjects.length === 0) {
      console.log('[Unified] No Jira projects found');
      return result;
    }

    console.log(`[Unified] Found ${jiraProjects.length} Jira projects`);

    // Collect all issues from all projects
    const allJiraIssues: JiraIssue[] = [];
    const uniqueEmployees = new Map<string, UnifiedEmployee>();

    console.log('%c=== UNIFIED RESOURCE OS - JIRA SYNC ===', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
    console.log(`Total Projects to sync: ${jiraProjects.length}`);
    console.log('');

    for (const project of jiraProjects) {
      const issues = await fetchJiraIssuesForProject(project.key);
      console.log(`%c📋 PROJECT: ${project.title} (${project.key})`, 'color: #2196F3; font-weight: bold; font-size: 12px;');
      console.log(`   Total Issues: ${issues.length}`);
      console.log('%c   First 5 Issues:', 'color: #666; font-style: italic;');
      
      const firstFive = issues.slice(0, 5);
      firstFive.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.key}] ${issue.summary}`);
        console.log(`      Status: ${issue.status} | Priority: ${issue.priority} | Assignee: ${issue.assignee || 'Unassigned'}`);
      });
      console.log('');
      
      for (const issue of issues) {
        allJiraIssues.push(issue);

        // Build unique employee list from assignees
        if (issue.assignee && issue.assignee !== 'Unassigned' && !uniqueEmployees.has(issue.assignee)) {
          uniqueEmployees.set(issue.assignee, {
            id: 1000 + uniqueEmployees.size,
            name: issue.assignee,
            role: issue.issueType || 'Developer',
            skills: [issue.issueType || 'Development'],
            efficiencyRating: 1.0 + Math.random() * 0.5,
            currentLoad: 0,
            availableFrom: new Date().toISOString(),
            totalProjectsCompleted: Math.floor(Math.random() * 20),
            avgHoursPerTask: 0,
            isOnLeave: false,
          });
        }
      }
    }

    console.log(`[Unified] Total Jira issues collected: ${allJiraIssues.length}`);
    console.log(`[Unified] Total unique employees: ${uniqueEmployees.size}`);

    // Calculate load for each employee
    const employeeIssueCount = new Map<string, number>();
    allJiraIssues.forEach(issue => {
      if (issue.assignee && issue.assignee !== 'Unassigned') {
        employeeIssueCount.set(issue.assignee, (employeeIssueCount.get(issue.assignee) || 0) + 1);
      }
    });

    // Update employee loads
    uniqueEmployees.forEach(emp => {
      const issueCount = employeeIssueCount.get(emp.name) || 0;
      emp.currentLoad = Math.min(100, issueCount * 15); // Estimate ~15% per issue
    });

    result.employees = Array.from(uniqueEmployees.values());
    result.projects = mapJiraIssuesToProjects(allJiraIssues, result.employees);

    console.log('%c=== UNIFIED OS SUMMARY ===', 'color: #FF9800; font-size: 13px; font-weight: bold;');
    console.log(`✅ Total Issues: ${allJiraIssues.length}`);
    console.log(`✅ Team Members: ${result.employees.length}`);
    console.log(`✅ Projects: ${result.projects.length}`);
    console.log(`✅ Unique Assignees: ${uniqueEmployees.size}`);
    console.log('%c=== END SYNC ===', 'color: #4CAF50; font-size: 11px; font-weight: bold;');
    console.log('');

    console.log('[Unified] Jira data loaded successfully!', {
      employees: result.employees.length,
      projects: result.projects.length,
    });

    return result;
  } catch (error) {
    console.error('[Unified] Error fetching Jira data:', error);
    return result;
  }
};

export default function UnifiedView() {
  const [employees, setEmployees] = useState<UnifiedEmployee[]>([]);
  const [projects, setProjects] = useState<UnifiedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'JIRA' | 'CSV'>('CSV'); // Track data source
  
  // --- STATE ---
  const [userRole, setUserRole] = useState<'MANAGER' | 'EMPLOYEE'>('MANAGER');
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'TIMETABLE'>('DASHBOARD');
  const [currentUserId] = useState<number>(101); // Mock Logged-in User
  const [employeeFilter, setEmployeeFilter] = useState<number | 'ALL'>('ALL');
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Data
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // --- NOTIFICATION HELPER ---
  const sendNotification = (
    role: 'MANAGER' | 'EMPLOYEE' | 'ALL', 
    title: string, 
    message: string, 
    type: 'ASSIGNMENT' | 'COMPLETION' | 'LEAVE_UPDATE' | 'SYSTEM',
    recipientId?: number
  ) => {
    const newNotif: Notification = {
      id: `notif_${Date.now()}_${Math.random()}`,
      recipientRole: role,
      recipientId,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleClearNotifs = () => setNotifications([]);

  useEffect(() => {
    const initSystem = async () => {
      let loadedEmployees: UnifiedEmployee[] = [];
      let loadedProjects: UnifiedProject[] = [];
      let source: 'JIRA' | 'CSV' = 'CSV';

      try {
        // Try to fetch from Jira first
        console.log('[Unified] Attempting to load from Jira...');
        const jiraData = await fetchAllJiraTasksData();
        
        if (jiraData.employees.length > 0 && jiraData.projects.length > 0) {
          console.log('[Unified] Successfully loaded data from Jira!');
          loadedEmployees = jiraData.employees;
          loadedProjects = jiraData.projects;
          source = 'JIRA';
        } else {
          console.log('[Unified] No Jira data available, falling back to CSV...');
          // Fall back to CSV if no Jira data
          const rawData = await fetchRawCSV(csvPath);
          const uniqueEmps = new Map<string, UnifiedEmployee>();
          const taskProjects: UnifiedProject[] = [];

          rawData.forEach((row: any, idx: number) => {
            const name = row.Assignee || row.assignee;
            if (!name) return;

            let empId = 0;
            if (!uniqueEmps.has(name)) {
              empId = 1000 + uniqueEmps.size;
              uniqueEmps.set(name, {
                id: empId,
                name: name,
                role: row["Skill Used"] || "Developer",
                skills: [row["Skill Used"]].filter(Boolean),
                efficiencyRating: 1.0 + (Math.random() * 0.5),
                currentLoad: 0,
                availableFrom: new Date().toISOString(),
                totalProjectsCompleted: Math.floor(Math.random() * 20),
                avgHoursPerTask: 0,
                isOnLeave: false
              });
            } else {
              const existing = uniqueEmps.get(name)!;
              empId = existing.id;
              if (row["Skill Used"] && !existing.skills.includes(row["Skill Used"])) {
                  existing.skills.push(row["Skill Used"]);
              }
            }

            const projectGroup = row.Project || "General Project";
            const taskName = row["Task Name"] || `Task ${idx + 1}`;
            const plannedHours = parseInt(row["Planned Hours"] || "40");
            
            let category: ProjectCategory = 'Client Deliverable';
            const lowerProj = projectGroup.toLowerCase();
            if (lowerProj.includes('hr') || lowerProj.includes('internal')) category = 'Internal Tool';
            else if (lowerProj.includes('bot') || lowerProj.includes('analytics')) category = 'R&D / POC';

            taskProjects.push({
               id: `task_${idx}`,
               title: taskName,
               description: `${projectGroup} - ${row["Skill Used"] || 'Development'}`,
               status: 'ACTIVE',
               category: category,
               requiredSkills: [row["Skill Used"] || "General"],
               estimatedHours: plannedHours,
               priority: 'Medium',
               assignedTeamIds: [empId]
            });
            
            const emp = uniqueEmps.get(name)!;
            emp.currentLoad = Math.min(100, emp.currentLoad + 20);
          });

          loadedEmployees = Array.from(uniqueEmps.values());
          loadedProjects = taskProjects;
          source = 'CSV';
        }
      } catch (error) { 
        console.error("[Unified] Load Failed (CSV fallback):", error);
      }

      // Only use loaded data from Jira or CSV if available

      setEmployees(loadedEmployees);
      setProjects(loadedProjects);
      setDataSource(source);
      
      const initNotif = source === 'JIRA' 
        ? { id: 'n1', recipientRole: 'MANAGER' as const, title: 'System Ready', message: 'Tasks loaded from Jira Cloud - Unified Resource OS initialized successfully.', type: 'SYSTEM' as const, timestamp: new Date().toISOString(), isRead: false }
        : { id: 'n1', recipientRole: 'MANAGER' as const, title: 'System Ready', message: 'Tasks loaded from CSV - Unified Resource OS initialized successfully.', type: 'SYSTEM' as const, timestamp: new Date().toISOString(), isRead: false };
      
      setNotifications([initNotif]);

      setIsLoading(false);
    };
    initSystem();
  }, []);

  // --- HANDLERS ---
  const unreadCount = notifications.filter(n => !n.isRead && (n.recipientRole === 'ALL' || n.recipientRole === userRole)).length;

  if (isLoading) return <div className="p-20 text-center text-slate-500 animate-pulse">Initializing Unified Resource OS...</div>;

  const allActiveProjects = projects.filter(p => p.status === 'ACTIVE');
  const queuedProjects = projects.filter(p => p.status !== 'ACTIVE').slice(0, 5);
  const filteredActiveProjects = employeeFilter === 'ALL' 
    ? allActiveProjects 
    : allActiveProjects.filter(p => p.assignedTeamIds.includes(employeeFilter));

  const actualUserId = employees.length > 0 
    ? (employees.find(e => e.id === currentUserId) ? currentUserId : employees[0]?.id)
    : currentUserId;
  const currentUser = employees.find(e => e.id === actualUserId);
  const myProjects = allActiveProjects.filter(p => currentUser && p.assignedTeamIds.includes(actualUserId));
  const pendingLeaves = leaveRequests.filter(r => r.status === 'PENDING').length;

  // Handlers for project management
  const handleAllocateStart = (projectId: string) => {
    sendNotification('MANAGER', 'Project Allocated', `Started allocation for project: ${projectId}`, 'ASSIGNMENT');
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    sendNotification('MANAGER', 'Project Removed', `Removed project: ${projectId}`, 'SYSTEM');
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm z-20 relative">
        <div>
          <h1 className="text-2xl font-light text-gray-900 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-indigo-600" />
            Unified Resource OS
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 text-sm flex items-center gap-2">
              Viewing as: 
              <span className={`font-light px-2 py-0.5 rounded text-xs uppercase ${userRole === 'MANAGER' ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'}`}>
                {userRole}
              </span>
               <span className="text-xs text-slate-400">({currentUser?.name || 'Unknown'})</span>
            </p>
            
            {/* DATA SOURCE INDICATOR */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              dataSource === 'JIRA' 
                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {dataSource === 'JIRA' ? (
                <>
                  <Zap className="w-3 h-3" />
                  Live Jira Data
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  CSV Data
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* VIEW TOGGLE */}
           <div className="bg-slate-100 p-1 rounded-lg flex items-center mr-2">
              <button onClick={() => setViewMode('DASHBOARD')} className={`p-2 rounded-md transition-all ${viewMode === 'DASHBOARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Dashboard"><LayoutDashboard className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('TIMETABLE')} className={`p-2 rounded-md transition-all ${viewMode === 'TIMETABLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Timetable"><CalendarRange className="w-4 h-4" /></button>
           </div>

           {/* NOTIFICATION BELL */}
           <div className="relative">
             <Button variant="ghost" className="relative text-slate-500 hover:bg-slate-50" onClick={() => setIsNotifOpen(!isNotifOpen)}>
               <Bell className={`w-5 h-5 ${isNotifOpen ? 'text-indigo-600' : ''}`} />
               {unreadCount > 0 && <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
             </Button>
             <NotificationPanel 
                isOpen={isNotifOpen} 
                onClose={() => setIsNotifOpen(false)}
                notifications={notifications}
                userRole={userRole}
                currentUserId={actualUserId}
                onMarkAsRead={handleMarkAsRead}
                onClearAll={handleClearNotifs}
             />
           </div>

           {/* ROLE SWITCHER */}
           <div className="bg-slate-100 p-1 rounded-lg flex items-center">
              <button onClick={() => setUserRole('MANAGER')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${userRole === 'MANAGER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><UserCog className="w-4 h-4" /> Manager</button>
              <button onClick={() => setUserRole('EMPLOYEE')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${userRole === 'EMPLOYEE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><User className="w-4 h-4" /> Employee</button>
           </div>
        </div>
      </div>

      {/* --- CONTENT AREA SWITCHER --- */}
      {viewMode === 'TIMETABLE' ? (
         <TimetableView 
           userRole={userRole} 
           currentUserId={actualUserId}
           projects={projects}
           employees={employees}
           leaveRequests={leaveRequests}
         />
      ) : (
        <>
          {/* MANAGER VIEW */}
          {userRole === 'MANAGER' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-light text-xs">1</div><h2 className="text-lg font-light text-gray-800">Ideation Queue ({queuedProjects.length})</h2></div>
                <ProjectQueue projects={projects} onAllocateStart={handleAllocateStart} onDelete={handleDeleteProject} />
              </div>

              <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-4">
                
                {/* FILTER HEADER */}
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-light text-xs">2</div>
                       <h2 className="text-lg font-light text-gray-800">Active Allocations ({filteredActiveProjects.length})</h2>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase mr-1">Filter By:</span>
                        <select 
                            value={employeeFilter} 
                            onChange={(e) => setEmployeeFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                            className="text-sm bg-transparent outline-none text-slate-700 font-medium cursor-pointer"
                        >
                            <option value="ALL">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                        {employeeFilter !== 'ALL' && (
                            <button onClick={() => setEmployeeFilter('ALL')} className="ml-1 text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                        )}
                    </div>
                </div>

                {filteredActiveProjects.length === 0 ? (
                    <div className="text-center p-10 bg-slate-50 border border-dashed rounded-xl text-slate-400">
                        {employeeFilter === 'ALL' ? "No active projects." : "No active projects found for this employee."}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredActiveProjects.slice(0, 12).map(p => (
                        <div key={p.id} className="bg-white border border-emerald-100 p-5 rounded-xl shadow-sm relative overflow-hidden hover:shadow-md transition-all group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div>
                          <div className="mb-3">
                              <div className="flex justify-between items-start"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 border w-fit mb-1 ${getCategoryStyle(p.category)}`}>{getCategoryIcon(p.category)} {p.category}</span><span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">RUNNING</span></div>
                              <h3 className="font-bold text-gray-900 truncate pr-4 text-lg">{p.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 mb-4"><CheckCircle2 className="w-4 h-4 text-emerald-500" />{p.assignedTeamIds.length} Resources Assigned</div>
                          <div className="flex -space-x-2 overflow-hidden">
                              {p.assignedTeamIds.slice(0, 5).map(id => {
                                  const emp = employees.find(e => e.id === id);
                                  return <div key={id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{emp?.name?.substring(0,2).toUpperCase()}</div>
                              })}
                          </div>
                        </div>
                      ))}
                      {filteredActiveProjects.length > 12 && (
                          <div className="flex items-center justify-center text-slate-400 text-sm italic col-span-full">
                            + {filteredActiveProjects.length - 12} more active tasks
                          </div>
                      )}
                    </div>
                )}
              </div>
            </>
          )}

          {/* EMPLOYEE VIEW */}
          {userRole === 'EMPLOYEE' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase">My Workload</h3>
                        <div className="text-3xl font-black text-indigo-600 mt-2">{currentUser?.currentLoad ?? 0}%</div>
                        <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${currentUser?.currentLoad ?? 0}%` }}></div></div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><h3 className="text-xs font-light text-slate-400 uppercase">Active Projects</h3><div className="text-3xl font-light text-primary mt-2">{myProjects.length}</div></div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><h3 className="text-xs font-light text-slate-400 uppercase">Efficiency Score</h3><div className="text-3xl font-light text-primary mt-2">{currentUser?.efficiencyRating?.toFixed(1) ?? '0.0'}</div></div>
                </div>

                <div>
                    <h2 className="text-lg font-light text-gray-800 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> My Assigned Projects</h2>
                    {myProjects.length === 0 ? (
                        <div className="bg-slate-50 p-8 rounded-xl border border-dashed text-center text-slate-500">You have no active project assignments.</div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {myProjects.map(p => (
                                <div key={p.id} className="bg-white border-l-4 border-l-indigo-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getCategoryStyle(p.category)}`}>{p.category}</span><span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3"/> Due Soon</span></div>
                                    <h3 className="font-light text-xl text-gray-900 mb-2">{p.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>
                                    <Button className="w-full mt-4 bg-slate-50 text-indigo-600 hover:bg-indigo-50 border border-indigo-100">Open Workspace</Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}