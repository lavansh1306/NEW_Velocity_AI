import React, { useState } from 'react';
import { Users, Upload } from 'lucide-react'; // Added Upload icon
import { Button } from '../ui/button'; // Need Button
import { INITIAL_TASKS, EMPLOYEES_DATA } from './data';
import { Task, LeaveRequest, TimeLog } from './types';
import { ImpactAnalysisDialog } from './ImpactAnalysisDialog';
import { TimeLoggingDialog } from './TimeLoggingDialog';
import { TimesheetUploadDialog } from './TimeSheetUploadDialog'; // Import New Dialog
import { WorkloadTable } from './WorkloadTable';
import { LeaveRequestTable } from './LeaveRequestTable';

export default function LeaveManagementTab() {
  const [activePersona, setActivePersona] = useState<'manager' | 'employee'>('manager');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([
    { id: 1, name: "Alex Rivera", startDate: "2024-06-10", endDate: "2024-06-11", reason: "Family Event", status: "Pending" }
  ]);

  // Dialog States
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false); // New State
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  const currentUser = "Alex Rivera";

  // --- Logic Helpers ---
  const getDailyLoad = (employee: string, day: number) => {
    return tasks.filter(t => t.assignee === employee && t.day === day && !t.isCancelled)
      .reduce((sum, t) => sum + t.hours, 0);
  };

  // --- Manager: Import Logic ---
  const handleImportTasks = (newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks]);
  };

  // --- Manager: Impact Analysis ---
  const handleReviewLeave = (leave: LeaveRequest) => {
    const absenteeTasks = tasks.filter(t => t.assignee === leave.name && !t.isReallocated && !t.isCancelled);
    const newPredictions = absenteeTasks.map(task => {
      const candidates = EMPLOYEES_DATA.filter(e => e.name !== leave.name);
      const scored = candidates.map(emp => {
        let score = 0;
        if (task.requiredSkills.some(s => emp.skills.includes(s))) score += 50;
        const load = getDailyLoad(emp.name, task.day);
        if ((10 - load) >= task.hours) score += 30; else if ((10 - load) > 0) score += 10; else score -= 20;
        score += Math.floor(Math.random() * 10);
        return { ...emp, score };
      });
      const best = scored.sort((a, b) => b.score - a.score)[0];
      return {
        task,
        newAssignee: best.name,
        reason: best.score > 40 ? `Skills Matched` : "Capacity",
        score: Math.min(99, best.score + 20)
      };
    });

    setPredictions(newPredictions);
    setSelectedLeave(leave);
    setScenarioOpen(true);
  };

  const confirmReallocation = () => {
    if (!selectedLeave) return;
    setTasks(prev => {
      const newTasks = [...prev];
      // Cancel old
      newTasks.filter(t => t.assignee === selectedLeave.name && !t.isReallocated).forEach(t => t.isCancelled = true);
      // Create new
      predictions.forEach(p => {
        newTasks.push({
          ...p.task, id: Date.now() + Math.random(), assignee: p.newAssignee, isReallocated: true, isCancelled: false, originalAssignee: selectedLeave.name, logs: [], totalLogged: 0
        });
      });
      return newTasks;
    });
    setLeaves(prev => prev.map(l => l.id === selectedLeave.id ? { ...l, status: 'Approved' } : l));
    setScenarioOpen(false);
  };

  // --- Employee: Time Logging ---
  const handleTaskClick = (task: Task) => {
    if (activePersona === 'employee' && !task.isCancelled) {
      setSelectedTask(task);
      setLogOpen(true);
    }
  };

  const saveLogs = (taskId: number, newLogs: TimeLog[]) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, logs: newLogs, totalLogged: newLogs.reduce((a, b) => a + b.hours, 0) } : t));
    setLogOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Persona Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg text-white"><Users className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-white text-sm">System Persona</h3>
            <p className="text-xs text-slate-400">Current Role: {activePersona === 'manager' ? 'HR / Manager' : 'Individual Contributor'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {/* IMPORT BUTTON (Visible only for Managers) */}
           {activePersona === 'manager' && (
             <Button variant="outline" className="text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white gap-2" onClick={() => setImportOpen(true)}>
               <Upload className="w-4 h-4" />
               Import Timesheet
             </Button>
           )}

           <div className="flex bg-slate-800 p-1 rounded-xl w-fit border border-slate-700">
             <button onClick={() => setActivePersona('manager')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePersona === 'manager' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Manager</button>
             <button onClick={() => setActivePersona('employee')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePersona === 'employee' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Employee</button>
           </div>
        </div>
      </div>

      {/* Main Views */}
      <LeaveRequestTable leaves={leaves} persona={activePersona} currentUser={currentUser} onReview={handleReviewLeave} />
      
      <WorkloadTable 
        tasks={tasks} 
        employees={activePersona === 'manager' ? EMPLOYEES_DATA : EMPLOYEES_DATA.filter(e => e.name === currentUser)} 
        persona={activePersona}
        onTaskClick={handleTaskClick}
      />

      {/* Dialogs */}
      <ImpactAnalysisDialog open={scenarioOpen} onOpenChange={setScenarioOpen} predictions={predictions} onConfirm={confirmReallocation} />
      <TimeLoggingDialog open={logOpen} onOpenChange={setLogOpen} task={selectedTask} onSave={saveLogs} />
      <TimesheetUploadDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImportTasks} />
    </div>
  );
}