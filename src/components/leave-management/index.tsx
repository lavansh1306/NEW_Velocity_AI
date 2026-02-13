import React, { useState, useEffect } from 'react';
import { Users, Upload, Zap, AlertCircle, RefreshCw } from 'lucide-react'; 
import { Button } from '../ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';

// Imports from your existing structure
import { Task, LeaveRequest, TimeLog, EmployeeProfile } from './types';
import { ImpactAnalysisDialog } from './ImpactAnalysisDialog';
import { TimeLoggingDialog } from './TimeLoggingDialog';
import { TimesheetUploadDialog } from './TimeSheetUploadDialog';
import { WorkloadTable } from './WorkloadTable';
import { LeaveRequestTable } from './LeaveRequestTable';
import { LeaveApplicationDialog } from './LeaveApplicationDialog';
import LeaveApprovalAgent from '../leave-approval/LeaveApprovalAgent';

// FIX: Import 'fetchRawCSV' to get the actual Task data, not the ML Summary
import { fetchRawCSV } from '../ml-model/RecommendationEngine';

// --- JIRA INTEGRATION HELPERS ---
interface JiraProjectData {
  tasks: Task[];
  employees: EmployeeProfile[];
  leaves: LeaveRequest[];
}

const checkJiraConnectionForLeaves = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/jira/auth/status');
    if (response.ok) {
      const data = await response.json();
      return data.connected === true;
    }
    return false;
  } catch (error) {
    console.error('[Jira Leave] Connection check failed:', error);
    return false;
  }
};

const fetchJiraProjectsForLeaves = async (): Promise<any[]> => {
  try {
    const response = await fetch('/api/jira/projects');
    if (response.ok) {
      const data = await response.json();
      return data.projects || [];
    }
    console.warn('[Jira Leave] Failed to fetch projects:', response.status);
    return [];
  } catch (error) {
    console.error('[Jira Leave] Error fetching projects:', error);
    return [];
  }
};

const fetchJiraLeaveAndTaskData = async (): Promise<JiraProjectData> => {
  const result: JiraProjectData = {
    tasks: [],
    employees: new Map() as any,
    leaves: [],
  };

  try {
    // Check Jira connection
    const isConnected = await checkJiraConnectionForLeaves();
    if (!isConnected) {
      console.log('[Jira Leave] Not connected to Jira');
      return result;
    }

    console.log('[Jira Leave] Connected to Jira! Fetching data...');

    // Fetch all Jira projects
    const jiraProjects = await fetchJiraProjectsForLeaves();
    if (jiraProjects.length === 0) {
      console.log('[Jira Leave] No Jira projects found');
      return result;
    }

    console.log(`[Jira Leave] Found ${jiraProjects.length} Jira projects`);

    // Collect tasks and employees from all projects
    const uniqueEmployees = new Map<string, EmployeeProfile>();
    const allTasks: Task[] = [];
    const getsStableDay = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      return Math.abs(hash) % 5;
    };

    console.log('%c=== LEAVE MANAGEMENT - JIRA SYNC ===', 'color: #FF5722; font-size: 14px; font-weight: bold;');
    console.log(`Total Projects: ${jiraProjects.length}`);
    console.log('');

    for (const project of jiraProjects) {
      try {
        const issuesResponse = await fetch(`/api/jira/issues?projectKey=${encodeURIComponent(project.key)}`);
        if (!issuesResponse.ok) {
          console.warn(`[Jira Leave] Failed to fetch issues for ${project.key}`);
          continue;
        }

        const issuesData = await issuesResponse.json();
        const issues = issuesData.issues || [];

        console.log(`%c📋 PROJECT: ${project.title} (${project.key})`, 'color: #2196F3; font-weight: bold; font-size: 12px;');
        console.log(`   Total Issues: ${issues.length}`);
        console.log('%c   First 5 Issues:', 'color: #666; font-style: italic;');
        
        const firstFive = issues.slice(0, 5);
        firstFive.forEach((issue: any, index: number) => {
          console.log(`   ${index + 1}. [${issue.key}] ${issue.summary}`);
          console.log(`      Assignee: ${issue.assignee || 'Unassigned'} | Status: ${issue.status}`);
        });
        console.log('');

        issues.forEach((issue: any, idx: number) => {
          // Create task from issue
          const assignee = issue.assignee || 'Unassigned';
          const task: Task = {
            id: allTasks.length + idx,
            projectName: project.key || project.title,
            taskName: `${issue.key}: ${issue.summary}`,
            assignee,
            hours: issue.priority?.toLowerCase().includes('high') ? 16 : 8,
            day: getsStableDay(issue.key),
            requiredSkills: [issue.issueType || 'Development'],
            isReallocated: false,
            isCancelled: issue.status?.toLowerCase().includes('closed'),
            totalLogged: 0,
            logs: [],
          };

          allTasks.push(task);

          // Add employee if not exists
          if (assignee && assignee !== 'Unassigned' && !uniqueEmployees.has(assignee)) {
            uniqueEmployees.set(assignee, {
              name: assignee,
              role: issue.issueType || 'Developer',
              skills: [issue.issueType || 'Development'],
            });
          }
        });
      } catch (error) {
        console.error(`[Jira Leave] Error processing project ${project.key}:`, error);
        continue;
      }
    }

    result.tasks = allTasks;
    result.employees = Array.from(uniqueEmployees.values());

    // Try to fetch leave-related data (look for issues with "Leave" label)
    // Note: This requires a Leave issue type or custom label in Jira
    try {
      const leaveIssuesResponse = await fetch('/api/jira/issues?projectKey=LEAVE');
      if (leaveIssuesResponse.ok) {
        const leaveData = await leaveIssuesResponse.json();
        const leaveIssues = leaveData.issues || [];
        
        result.leaves = leaveIssues.map((issue: any, idx: number) => ({
          id: idx,
          name: issue.assignee || 'Unassigned',
          startDate: issue.created?.split('T')[0] || new Date().toISOString().split('T')[0],
          endDate: issue.due || new Date().toISOString().split('T')[0],
          reason: issue.description || issue.summary,
          status: issue.status?.toLowerCase().includes('approved') ? 'Approved' : 'Pending' as const,
        }));

        console.log(`[Jira Leave] Fetched ${result.leaves.length} leave requests`);
      }
    } catch (error) {
      console.warn('[Jira Leave] Could not fetch leave issues:', error);
      result.leaves = [];
    }

    console.log('%c=== LEAVE MANAGEMENT SUMMARY ===', 'color: #FF5722; font-size: 13px; font-weight: bold;');
    console.log(`✅ Total Tasks: ${result.tasks.length}`);
    console.log(`✅ Team Members: ${result.employees.length}`);
    console.log(`✅ Leave Requests: ${result.leaves.length}`);
    console.log('%c=== END SYNC ===', 'color: #FF5722; font-size: 11px; font-weight: bold;');
    console.log('');

    console.log('[Jira Leave] Data loaded successfully!', {
      tasks: result.tasks.length,
      employees: result.employees.length,
      leaves: result.leaves.length,
    });

    return result;
  } catch (error) {
    console.error('[Jira Leave] Error fetching Jira data:', error);
    return result;
  }
};

export default function LeaveManagementTab() {
  const [activePersona, setActivePersona] = useState<'manager' | 'employee'>('manager');
  
  // State for Real Data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("Aarav Sharma"); 
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataSource, setDataSource] = useState<'JIRA' | 'CSV'>('CSV'); // Track data source

  // Leave State
  const [leaves, setLeaves] = useState<LeaveRequest[]>([
    { id: 1, name: "Aarav Sharma", startDate: "2024-06-10", endDate: "2024-06-11", reason: "Family Event", status: "Pending" }
  ]);

  // Dialog States
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  // --- 1. LOAD DATA FROM JIRA OR CSV ---
  useEffect(() => {
    const fetchData = async () => {
      let loadedTasks: Task[] = [];
      let loadedEmployees: EmployeeProfile[] = [];
      let loadedLeaves: LeaveRequest[] = [];
      let source: 'JIRA' | 'CSV' = 'CSV';

      const getStableDay = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return Math.abs(hash) % 5;
      };

      try {
        // Try to fetch from Jira first
        console.log('[LeaveManagement] Attempting to load from Jira...');
        const jiraData = await fetchJiraLeaveAndTaskData();
        
        if (jiraData.tasks.length > 0 && jiraData.employees.length > 0) {
          console.log('[LeaveManagement] Successfully loaded data from Jira!');
          loadedTasks = jiraData.tasks;
          loadedEmployees = jiraData.employees;
          loadedLeaves = jiraData.leaves;
          source = 'JIRA';
        } else {
          console.log('[LeaveManagement] No Jira data available, falling back to CSV...');
          // Fall back to CSV if no Jira data
          const csvUrl = new URL('../ml-model/datasets/master_employee_task_report.csv', import.meta.url).href;
          const rawData: any[] = await fetchRawCSV(csvUrl);
          
          // Transform CSV Data -> System Task Model
          const tasks: Task[] = rawData
            .filter(row => row.Assignee && row["Task Name"]) // Ensure row has data
            .map((row, index) => ({
              id: index,
              projectName: row.Project || "Unassigned",
              taskName: row["Task Name"] || "Untitled Task",
              assignee: row.Assignee || "Unassigned",
              hours: parseFloat(row["Planned Hours"]) || 1,
              day: getStableDay(row["Task Name"] || index.toString()), 
              requiredSkills: row["Skill Used"] ? [row["Skill Used"]] : [],
              isReallocated: false,
              isCancelled: false,
              totalLogged: parseFloat(row["Actual Hours"]) || 0,
              logs: [] 
            }));

          loadedTasks = tasks;

          // Extract Employees from the loaded tasks
          const uniqueNames = Array.from(new Set(tasks.map(t => t.assignee)));
          const employees: EmployeeProfile[] = uniqueNames.map(name => {
            const userTasks = tasks.filter(t => t.assignee === name);
            const skills = Array.from(new Set(userTasks.flatMap(t => t.requiredSkills)));
            return {
              name,
              role: skills[0] || "Developer",
              skills: skills.slice(0, 4)
            };
          });

          loadedEmployees = employees;
          source = 'CSV';
        }
        
      } catch (error) {
        console.error("[LeaveManagement] Load Failed (CSV fallback):", error);
        source = 'CSV';
      } finally {
        setTasks(loadedTasks);
        setEmployees(loadedEmployees);
        setDataSource(source);

        if (loadedLeaves.length > 0) {
          setLeaves(loadedLeaves);
        }

        const uniqueNames = loadedTasks.map(t => t.assignee);
        if (uniqueNames.length > 0 && !uniqueNames.includes(currentUser)) {
          setCurrentUser(uniqueNames[0]);
        }
        
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // --- Logic Helpers ---
  const handleImportTasks = (newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks]);
  };

  const handleReviewLeave = (leave: LeaveRequest) => {
    const absenteeTasks = tasks.filter(t => t.assignee === leave.name && !t.isReallocated && !t.isCancelled);
    const newPredictions = absenteeTasks.map(task => ({
      task,
      newAssignee: "AI Recommendation", 
      reason: "Capacity Available",
      score: 85
    }));
    setPredictions(newPredictions);
    setSelectedLeave(leave);
    setScenarioOpen(true);
  };

  const confirmReallocation = () => {
    if (!selectedLeave) return;
    setTasks(prev => {
      const newTasks = [...prev];
      newTasks.filter(t => t.assignee === selectedLeave.name && !t.isReallocated).forEach(t => t.isCancelled = true);
      return newTasks;
    });
    setLeaves(prev => prev.map(l => l.id === selectedLeave.id ? { ...l, status: 'Approved' } : l));
    setScenarioOpen(false);
  };

  // --- Agent Handler ---
  const handleApprovalsComplete = (results: any[], summary: any) => {
    console.log('🤖 Agent Approval Complete');
    console.log('Results:', results);
    console.log('Summary:', summary);

    // Update leave statuses based on approval results
    const updatedLeaves = leaves.map(leave => {
      const result = results.find(r => r.leaveId === leave.id);
      if (result && result.approved) {
        return { ...leave, status: 'Approved' as const };
      }
      return leave;
    });

    setLeaves(updatedLeaves);
  };

  const handleTaskClick = (task: Task) => {
    if (activePersona === 'employee' && !task.isCancelled) {
      setSelectedTask(task);
      setLogOpen(true);
    }
  };

  const handleRefreshJiraData = async () => {
    if (dataSource !== 'JIRA') {
      alert('Currently using CSV data. Connect to Jira to enable refresh.');
      return;
    }
    
    setIsLoadingData(true);
    try {
      const jiraData = await fetchJiraLeaveAndTaskData();
      if (jiraData.tasks.length > 0 && jiraData.employees.length > 0) {
        setTasks(jiraData.tasks);
        setEmployees(jiraData.employees);
        if (jiraData.leaves.length > 0) {
          setLeaves(jiraData.leaves);
        }
        alert('Jira data refreshed successfully!');
      } else {
        alert('Failed to refresh Jira data.');
      }
    } catch (error) {
      console.error('[LeaveManagement] Error refreshing Jira data:', error);
      alert('Error refreshing Jira data.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const saveLogs = (taskId: number, newLogs: TimeLog[]) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { 
      ...t, 
      logs: newLogs, 
      totalLogged: (t.totalLogged || 0) + newLogs.reduce((a, b) => a + b.hours, 0) 
    } : t));
    setLogOpen(false);
  };

  const handleApplyLeave = (request: Omit<LeaveRequest, 'id' | 'status'>) => {
    const newLeave: LeaveRequest = {
      id: Date.now(),
      ...request,
      status: 'Pending'
    };
    setLeaves(prev => [newLeave, ...prev]);
  };

  if (isLoadingData) {
    return <div className="p-10 text-center text-gray-500 animate-pulse">Loading Workforce Data...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg gap-4">
        
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg text-white"><Users className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-white text-sm">System Persona</h3>
            <p className="text-xs text-slate-400">
              {activePersona === 'manager' ? 'Managing Team Workload' : `Logged in as: ${currentUser}`}
            </p>
          </div>
          
          {/* DATA SOURCE INDICATOR */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ml-4 border ${
            dataSource === 'JIRA' 
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {dataSource === 'JIRA' ? (
              <>
                <Zap className="w-3 h-3" />
                Live Jira
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                CSV Data
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
           
           {activePersona === 'employee' && (
             <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
               <span className="text-xs font-bold text-slate-400 uppercase">View As:</span>
               <Select value={currentUser} onValueChange={setCurrentUser}>
                 <SelectTrigger className="w-[180px] h-8 text-xs bg-slate-800 border-slate-700 text-white">
                   <SelectValue placeholder="Select Employee" />
                 </SelectTrigger>
                 <SelectContent className="max-h-[200px]">
                   {employees.map(emp => (
                     <SelectItem key={emp.name} value={emp.name}>{emp.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           )}

           {activePersona === 'manager' && (
             <>
               <Button variant="outline" size="sm" className="text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white gap-2 h-8 text-xs" onClick={() => setImportOpen(true)}>
                 <Upload className="w-3 h-3" /> Import
               </Button>
               
               {dataSource === 'JIRA' && (
                 <Button variant="outline" size="sm" className="text-blue-300 border-blue-700 hover:bg-blue-900/20 hover:text-blue-200 gap-2 h-8 text-xs" onClick={handleRefreshJiraData}>
                   <RefreshCw className="w-3 h-3" /> Refresh Jira
                 </Button>
               )}
             </>
           )}

           <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
             <button onClick={() => setActivePersona('manager')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activePersona === 'manager' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}>Manager</button>
             <button onClick={() => setActivePersona('employee')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activePersona === 'employee' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}>Employee</button>
           </div>
        </div>
      </div>

      {/* Agent Component - Only show to managers with pending leaves */}
      {activePersona === 'manager' && leaves.filter(l => l.status === 'Pending').length > 0 && (
        <div className="w-full mb-4 mt-4">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
              🤖 Automated Leave Approval System
            </h3>
            <LeaveApprovalAgent 
              leaves={leaves.filter(l => l.status === 'Pending')}
              onApprovalsComplete={handleApprovalsComplete}
            />
          </div>
        </div>
      )}

      {/* Main Views */}
      <LeaveRequestTable 
        leaves={leaves} 
        persona={activePersona} 
        currentUser={currentUser} 
        onReview={handleReviewLeave}
        onApply={() => setApplyOpen(true)}
      />
      
      <WorkloadTable 
        tasks={activePersona === 'manager' ? tasks : tasks.filter(t => t.assignee === currentUser)} 
        employees={activePersona === 'manager' ? employees : employees.filter(e => e.name === currentUser)}
        persona={activePersona}
        onTaskClick={handleTaskClick}
      />

      {/* Dialogs */}
      <ImpactAnalysisDialog open={scenarioOpen} onOpenChange={setScenarioOpen} predictions={predictions} onConfirm={confirmReallocation} />
      <TimeLoggingDialog open={logOpen} onOpenChange={setLogOpen} task={selectedTask} onSave={saveLogs} />
      <TimesheetUploadDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImportTasks} />
      <LeaveApplicationDialog 
        open={applyOpen} 
        onOpenChange={setApplyOpen} 
        currentUser={currentUser} 
        onSubmit={handleApplyLeave} 
      />
    </div>
  );
}