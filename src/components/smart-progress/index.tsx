import React, { useState, useEffect } from 'react';
import { ManagerView } from './ManagerView';
import { EmployeeView } from './EmployeeView';
import { SmartTask } from './types';
import { UserCircle2, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';

interface JiraIssue {
  key: string;
  summary: string;
  description: string;
  status: string;
  assignee: string;
  priority: string;
  issueType: string;
  created?: string;
  due?: string;
}

interface JiraProject {
  key: string;
  title: string;
}

const checkJiraConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/jira/auth/status', { credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      return data.connected === true;
    }
    return false;
  } catch (error) {
    console.error('[SmartProgress] Jira connection check failed:', error);
    return false;
  }
};

const fetchJiraProjects = async (): Promise<JiraProject[]> => {
  try {
    const response = await fetch('/api/jira/projects', { credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      return data.projects || [];
    }
    return [];
  } catch (error) {
    console.error('[SmartProgress] Error fetching projects:', error);
    return [];
  }
};

const fetchJiraIssuesForProjects = async (projects: JiraProject[]): Promise<JiraIssue[]> => {
  const allIssues: JiraIssue[] = [];
  
  for (const project of projects) {
    try {
      const response = await fetch(`/api/jira/issues?projectKey=${encodeURIComponent(project.key)}`);
      if (response.ok) {
        const data = await response.json();
        const issues = data.issues || [];
        allIssues.push(...issues);
      }
    } catch (error) {
      console.error(`[SmartProgress] Error fetching issues for ${project.key}:`, error);
    }
  }
  
  return allIssues;
};

const convertIssueToTask = (issue: JiraIssue, index: number): SmartTask => {
  // Create scope items from issue description or defaults
  const scope = [
    { id: `${index}-1`, name: 'Development', weight: 50, isCompleted: issue.status?.toLowerCase().includes('in progress') },
    { id: `${index}-2`, name: 'Testing', weight: 30, isCompleted: issue.status?.toLowerCase().includes('in review') },
    { id: `${index}-3`, name: 'QA', weight: 20, isCompleted: issue.status?.toLowerCase().includes('done') }
  ];

  const completedWeight = scope
    .filter(s => s.isCompleted)
    .reduce((sum, s) => sum + s.weight, 0);

  return {
    id: index,
    title: `${issue.key}: ${issue.summary}`,
    assignee: issue.assignee || 'Unassigned',
    scope,
    progress: completedWeight,
    lastUpdate: `Status: ${issue.status}`,
    lastUpdatedTime: new Date(issue.created || new Date()).toLocaleTimeString()
  };
};

export default function SmartProgressTracker() {
  const [activeTab, setActiveTab] = useState<'manager' | 'employee'>('manager');
  const [tasks, setTasks] = useState<SmartTask[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'JIRA' | 'NONE'>('NONE');

  // Load data from Jira
  useEffect(() => {
    const loadJiraData = async () => {
      setIsLoading(true);
      try {
        const isConnected = await checkJiraConnection();
        
        if (!isConnected) {
          console.log('[SmartProgress] Jira not connected');
          setIsLoading(false);
          return;
        }

        console.log('[SmartProgress] Jira connected! Fetching projects and issues...');
        
        const projects = await fetchJiraProjects();
        if (projects.length === 0) {
          console.log('[SmartProgress] No Jira projects found');
          setIsLoading(false);
          return;
        }

        console.log(`[SmartProgress] Found ${projects.length} projects, fetching issues...`);
        
        const issues = await fetchJiraIssuesForProjects(projects);
        
        if (issues.length === 0) {
          console.log('[SmartProgress] No Jira issues found');
          setIsLoading(false);
          return;
        }

        console.log(`[SmartProgress] Found ${issues.length} issues`);

        // Convert issues to tasks
        const convertedTasks = issues.map((issue, idx) => convertIssueToTask(issue, idx));
        setTasks(convertedTasks);

        // Extract unique employees
        const uniqueEmployees = Array.from(new Set(issues
          .map(i => i.assignee)
          .filter((a): a is string => a !== null && a !== 'Unassigned')));
        
        setEmployees(uniqueEmployees);
        setDataSource('JIRA');

        // Auto-select first employee
        if (uniqueEmployees.length > 0) {
          setSelectedEmployee(uniqueEmployees[0]);
        }

        console.log(`[SmartProgress] Loaded ${convertedTasks.length} tasks from ${uniqueEmployees.length} employees`);
      } catch (error) {
        console.error('[SmartProgress] Error loading Jira data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadJiraData();
  }, []);

  const handleTaskUpdate = (taskId: number, updates: Partial<SmartTask>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  // Filter tasks for current view
  const displayTasks = activeTab === 'employee' && selectedEmployee
    ? tasks.filter(t => t.assignee === selectedEmployee)
    : tasks;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Persona Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-light text-gray-900">Smart Progress Tracker</h1>
          <p className="text-slate-500 text-sm">Weighted Task Analysis from Jira</p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Employee Selector */}
          {activeTab === 'employee' && (
            <div className="w-full md:w-auto">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-full md:w-[200px] h-10 bg-white border border-slate-300">
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Data Source Indicator */}
          {dataSource === 'JIRA' && (
            <div className="px-3 py-1 rounded text-xs font-light uppercase bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Live Jira Data
            </div>
          )}

          {/* Persona Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('manager')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-light transition-all ${activeTab === 'manager' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ShieldCheck className="w-4 h-4" /> Manager
            </button>
            <button 
              onClick={() => setActiveTab('employee')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-light transition-all ${activeTab === 'employee' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <UserCircle2 className="w-4 h-4" /> Employee
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {isLoading ? (
          <div className="text-center p-10 text-slate-500 animate-pulse">
            Loading Jira data...
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-amber-600 mb-3 opacity-50" />
            <h3 className="text-lg font-light text-amber-900 mb-2">No Tasks Available</h3>
            <p className="text-sm text-amber-700">
              Check your Jira connection or ensure your projects have issues assigned to team members.
            </p>
          </div>
        ) : activeTab === 'manager' ? (
          <ManagerView tasks={displayTasks} onUpdateTask={handleTaskUpdate} />
        ) : selectedEmployee ? (
          <EmployeeView tasks={displayTasks} currentUser={selectedEmployee} onUpdateTask={handleTaskUpdate} />
        ) : (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-blue-600 mb-3 opacity-50" />
            <h3 className="text-lg font-bold text-blue-900 mb-2">Select an Employee</h3>
            <p className="text-sm text-blue-700">
              Please select an employee to view their tasks
            </p>
          </div>
        )}
      </div>
    </div>
  );
}