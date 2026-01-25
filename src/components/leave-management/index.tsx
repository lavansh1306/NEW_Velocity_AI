import React, { useState, useEffect } from 'react';
import { Users, Upload, RefreshCw } from 'lucide-react'; 
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

// Reuse the parser from the ML module to load real data
import { parseCSV } from '../ml-model/RecommendationEngine';

export default function LeaveManagementTab() {
  const [activePersona, setActivePersona] = useState<'manager' | 'employee'>('manager');
  
  // State for Real Data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("Aarav Sharma"); // Default to first user in CSV
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Leave State (Mocked for now as CSV doesn't have leaves)
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

  // --- 1. LOAD DATA FROM CSV ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const csvUrl = new URL('../ml-model/datasets/master_employee_task_report.csv', import.meta.url).href;
        // We use 'any' here because the raw CSV shape is different from our Task shape
        const rawData: any[] = await parseCSV(csvUrl);
        
        // Transform CSV Data -> System Task Model
        const loadedTasks: Task[] = rawData.map((row, index) => ({
          id: index,
          projectName: row.Project || "Unassigned",
          taskName: row["Task Name"] || "Untitled Task",
          assignee: row.Assignee || "Unassigned",
          hours: row["Planned Hours"] || 0,
          // Assign random day (0-4) for demo visualization since CSV lacks dates
          day: Math.floor(Math.random() * 5), 
          requiredSkills: row["Skill Used"] ? [row["Skill Used"]] : [],
          isReallocated: false,
          isCancelled: false,
          totalLogged: row["Actual Hours"] || 0, // Pre-fill actuals from history
          logs: [] 
        }));

        setTasks(loadedTasks);

        // Extract Unique Employees for the Selector
        const uniqueNames = Array.from(new Set(loadedTasks.map(t => t.assignee)));
        const loadedEmployees: EmployeeProfile[] = uniqueNames.map(name => {
          // Find their skills from their tasks
          const userTasks = loadedTasks.filter(t => t.assignee === name);
          const skills = Array.from(new Set(userTasks.flatMap(t => t.requiredSkills)));
          return {
            name,
            role: skills[0] || "Developer", // Infer role from primary skill
            skills: skills.slice(0, 4) // Top 4 skills
          };
        });

        setEmployees(loadedEmployees);
        if (uniqueNames.length > 0) setCurrentUser(uniqueNames[0]);
        
      } catch (error) {
        console.error("Failed to load live data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // --- Logic Helpers ---
  const getDailyLoad = (employee: string, day: number) => {
    return tasks.filter(t => t.assignee === employee && t.day === day && !t.isCancelled)
      .reduce((sum, t) => sum + t.hours, 0);
  };

  // --- Manager Logic ---
  const handleImportTasks = (newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks]);
  };

  const handleReviewLeave = (leave: LeaveRequest) => {
    const absenteeTasks = tasks.filter(t => t.assignee === leave.name && !t.isReallocated && !t.isCancelled);
    // (Simplied prediction logic for brevity - reuses existing logic)
    const newPredictions = absenteeTasks.map(task => ({
      task,
      newAssignee: "AI Recommendation", // Placeholder for complex logic
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
      // Logic to add new tasks would go here
      return newTasks;
    });
    setLeaves(prev => prev.map(l => l.id === selectedLeave.id ? { ...l, status: 'Approved' } : l));
    setScenarioOpen(false);
  };

  // --- Employee Logic ---
  const handleTaskClick = (task: Task) => {
    if (activePersona === 'employee' && !task.isCancelled) {
      setSelectedTask(task);
      setLogOpen(true);
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
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
           
           {/* EMPLOYEE SELECTOR (Only visible in Employee View or for Manager to snoop) */}
           <div className="flex items-center gap-2">
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

           {/* IMPORT BUTTON (Manager Only) */}
           {activePersona === 'manager' && (
             <Button variant="outline" size="sm" className="text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white gap-2 h-8 text-xs" onClick={() => setImportOpen(true)}>
               <Upload className="w-3 h-3" /> Import
             </Button>
           )}

           {/* TOGGLE */}
           <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
             <button onClick={() => setActivePersona('manager')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activePersona === 'manager' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}>Manager</button>
             <button onClick={() => setActivePersona('employee')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activePersona === 'employee' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}>Employee</button>
           </div>
        </div>
      </div>

      {/* Main Views */}
      <LeaveRequestTable 
        leaves={leaves} 
        persona={activePersona} 
        currentUser={currentUser} 
        onReview={handleReviewLeave}
        onApply={() => setApplyOpen(true)}
      />
      
      <WorkloadTable 
        // FILTER TASKS: Manager sees ALL, Employee sees ONLY THEIRS (based on dropdown)
        tasks={activePersona === 'manager' ? tasks : tasks.filter(t => t.assignee === currentUser)} 
        // FILTER EMPLOYEES: Same logic
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