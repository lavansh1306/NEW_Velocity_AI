import React, { useState, useEffect } from 'react';
import { ManagerView } from './ManagerView';
import { EmployeeView } from './EmployeeView';
import { SmartTask } from './types';
import { Upload, Workflow, Loader2 } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { fetchProjectsHybrid, fetchIssuesHybrid } from '@/lib/jiraDbClient';

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
    const { projects } = await fetchProjectsHybrid();
    return projects as unknown as JiraProject[];
  } catch (error) {
    console.error('[SmartProgress] Error fetching projects:', error);
    return [];
  }
};

const fetchJiraIssuesForProjects = async (projects: JiraProject[]): Promise<JiraIssue[]> => {
  const allIssues: JiraIssue[] = [];
  
  for (const project of projects) {
    try {
      const { issues } = await fetchIssuesHybrid(project.key);
      allIssues.push(...(issues as unknown as JiraIssue[]));
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
    <div className="space-y-0 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-[#2DD4BF] rounded-lg p-2">
          <Workflow className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-[#1C1917]">Smart Progress Tracker</h1>
      </div>
      <p className="text-[#78716C] font-light text-sm mb-8 ml-11">Track weighted tasks and team capacity from Jira integration.</p>

      {/* Tabs Section */}
      {tasks.length > 0 && (
        <div className="flex bg-[#E7E5E4] p-1 rounded-lg mb-8 w-fit">
          <button 
            onClick={() => setActiveTab('manager')}
            className={`px-4 py-2 rounded-md text-sm font-light transition-all ${
              activeTab === 'manager' 
                ? 'bg-white text-[#1C1917] shadow-sm' 
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Manager View
          </button>
          <button 
            onClick={() => setActiveTab('employee')}
            className={`px-4 py-2 rounded-md text-sm font-light transition-all ${
              activeTab === 'employee' 
                ? 'bg-white text-[#1C1917] shadow-sm' 
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Employee View
          </button>
        </div>
      )}

      {/* Employee Selector */}
      {activeTab === 'employee' && employees.length > 0 && (
        <div className="mb-8 max-w-xs">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="h-10 bg-white border border-[#E7E5E4] rounded-lg text-[#1C1917]">
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

      {/* Content Area */}
      <div className="min-h-[500px]">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-[#E7E5E4] p-12 text-center shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#2DD4BF] mx-auto mb-3" />
            <p className="text-[#78716C] font-light">Loading Jira data...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 text-center shadow-sm">
            <Upload className="w-12 h-12 mx-auto text-[#A8A29E] mb-3 opacity-40" />
            <h3 className="text-lg font-light text-[#1C1917] mb-2">No Tasks Found</h3>
            <p className="text-sm text-[#78716C] font-light">
              Connect your Jira workspace to load and manage project tasks.
            </p>
          </div>
        ) : activeTab === 'manager' ? (
          <ManagerView tasks={displayTasks} onUpdateTask={handleTaskUpdate} />
        ) : selectedEmployee ? (
          <EmployeeView tasks={displayTasks} currentUser={selectedEmployee} onUpdateTask={handleTaskUpdate} />
        ) : (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 text-center shadow-sm">
            <p className="text-[#78716C] font-light">Select an employee to view their tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}