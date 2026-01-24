import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { CheckCircle2, XCircle, Users, ArrowRight, BrainCircuit, Briefcase, AlertTriangle, Info, Zap, Clock, FileText, Check } from 'lucide-react';

// --- Types ---
interface Task {
  id: number;
  projectName: string;
  taskName: string;
  assignee: string;
  hours: number; // Planned hours
  day: number; // 0-4 (Mon-Fri)
  requiredSkills: string[];
  isReallocated?: boolean;
  isCancelled?: boolean;
  originalAssignee?: string;
  // NEW: Time Logging State
  status?: 'Logged' | 'Pending'; 
  actualHours?: number;
  workDescription?: string;
  extraTasks?: string;
}

interface LeaveRequest {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface EmployeeProfile {
  name: string;
  role: string;
  skills: string[];
}

// --- Mock Data ---
const EMPLOYEES_DATA: EmployeeProfile[] = [
  { name: "Alex Rivera", role: "Full Stack", skills: ["React", "Node.js", "SQL"] },
  { name: "Sarah Chen", role: "Backend Lead", skills: ["Python", "AWS", "Auth"] },
  { name: "Michael Vance", role: "Frontend Dev", skills: ["React", "UI/UX", "Tailwind"] },
  { name: "Jordan Smith", role: "QA Engineer", skills: ["Testing", "Cypress", "Python"] },
  { name: "Emma Wilson", role: "DevOps", skills: ["Docker", "Security", "AWS"] },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const INITIAL_TASKS: Task[] = [
  { id: 101, projectName: "Titan AI", taskName: "API Setup", assignee: "Alex Rivera", hours: 6, day: 0, requiredSkills: ["Node.js"] },
  { id: 102, projectName: "Titan AI", taskName: "DB Schema", assignee: "Alex Rivera", hours: 4, day: 1, requiredSkills: ["SQL"] },
  { id: 103, projectName: "Cloud Migration", taskName: "Auth Logic", assignee: "Sarah Chen", hours: 9, day: 0, requiredSkills: ["AWS", "Auth"] },
  { id: 104, projectName: "Velocity Dashboard", taskName: "UI Refactor", assignee: "Michael Vance", hours: 5, day: 2, requiredSkills: ["React"] },
  { id: 105, projectName: "Titan AI", taskName: "Testing", assignee: "Jordan Smith", hours: 3, day: 0, requiredSkills: ["Testing"] },
  { id: 106, projectName: "Security Audit", taskName: "Patching", assignee: "Emma Wilson", hours: 2, day: 1, requiredSkills: ["Security"] },
];

export default function LeaveManagementTab() {
  const [activePersona, setActivePersona] = useState<'manager' | 'employee'>('manager');
  const [leaves, setLeaves] = useState<LeaveRequest[]>([
    { id: 1, name: "Alex Rivera", startDate: "2024-06-10", endDate: "2024-06-11", reason: "Family Event", status: "Pending" }
  ]);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  
  // Scenario Planning State (Manager)
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [predictionResult, setPredictionResult] = useState<{task: Task, newAssignee: string, reason: string, score: number}[]>([]);

  // Time Logging State (Employee)
  const [logOpen, setLogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [logForm, setLogForm] = useState({ actualHours: 0, description: '', extraTasks: '' });

  const currentUser = "Alex Rivera";

  // --- Logic ---

  const getDailyLoad = (employee: string, day: number, currentTasks: Task[]) => {
    return currentTasks
      .filter(t => t.assignee === employee && t.day === day && !t.isCancelled)
      .reduce((sum, t) => sum + t.hours, 0);
  };

  // --- Manager Logic: Impact Analysis ---
  const runImpactAnalysis = (leave: LeaveRequest) => {
    const absenteeTasks = tasks.filter(t => t.assignee === leave.name && !t.isReallocated && !t.isCancelled);
    const predictions = [];

    for (const task of absenteeTasks) {
      const candidates = EMPLOYEES_DATA.filter(e => e.name !== leave.name);
      
      const scoredCandidates = candidates.map(emp => {
        let score = 0;
        const hasSkill = task.requiredSkills.some(skill => emp.skills.includes(skill));
        if (hasSkill) score += 50;
        const currentLoad = getDailyLoad(emp.name, task.day, tasks);
        const capacity = 10 - currentLoad;
        if (capacity >= task.hours) score += 30;
        else if (capacity > 0) score += 10;
        else score -= 20;
        score += Math.floor(Math.random() * 10); 
        return { ...emp, score, capacity };
      });

      const bestFit = scoredCandidates.sort((a, b) => b.score - a.score)[0];
      
      predictions.push({
        task,
        newAssignee: bestFit.name,
        reason: bestFit.score > 40 ? `Skills Matched: ${task.requiredSkills.join(', ')}` : "Capacity Availability",
        score: Math.min(99, bestFit.score + 20)
      });
    }

    setPredictionResult(predictions);
    setSelectedLeave(leave);
    setScenarioOpen(true);
  };

  const confirmReallocation = () => {
    if (!selectedLeave || !predictionResult) return;
    setTasks(prevTasks => {
      const newTasks = [...prevTasks];
      const absenteeTasks = newTasks.filter(t => t.assignee === selectedLeave.name && !t.isReallocated);
      absenteeTasks.forEach(t => t.isCancelled = true);
      predictionResult.forEach(pred => {
        newTasks.push({
          ...pred.task,
          id: Date.now() + Math.random(),
          assignee: pred.newAssignee,
          isReallocated: true,
          isCancelled: false,
          originalAssignee: selectedLeave.name
        });
      });
      return newTasks;
    });
    setLeaves(prev => prev.map(l => l.id === selectedLeave.id ? { ...l, status: 'Approved' } : l));
    setScenarioOpen(false);
  };

  // --- Employee Logic: Time Logging ---
  const handleTaskClick = (task: Task) => {
    if (activePersona !== 'employee' || task.isCancelled) return;
    setSelectedTask(task);
    setLogForm({
      actualHours: task.actualHours || task.hours,
      description: task.workDescription || '',
      extraTasks: task.extraTasks || ''
    });
    setLogOpen(true);
  };

  const saveTimeLog = () => {
    if (!selectedTask) return;
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? {
      ...t,
      status: 'Logged',
      actualHours: logForm.actualHours,
      workDescription: logForm.description,
      extraTasks: logForm.extraTasks
    } : t));
    setLogOpen(false);
  };

  // --- View Logic ---
  const visibleEmployees = activePersona === 'manager' 
    ? EMPLOYEES_DATA 
    : EMPLOYEES_DATA.filter(e => e.name === currentUser);

  const sectionTitle = activePersona === 'manager' ? "Organizational Workload" : "My Work Schedule";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. SCENARIO DIALOG (Manager) */}
      <Dialog open={scenarioOpen} onOpenChange={setScenarioOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-50">
          <DialogHeader>
            <DialogTitle>Impact Analysis & Scenario Planning</DialogTitle>
            <DialogDescription>Review AI recommendations before approving leave.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
             {/* ... Prediction UI (Same as previous) ... */}
             <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h4 className="text-xs font-black uppercase text-slate-500 mb-3">Reallocation Strategy</h4>
                {predictionResult.map((item, i) => (
                  <div key={i} className="flex items-center justify-between mb-3 last:mb-0 p-3 bg-slate-50 rounded border border-slate-100">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-800">{item.task.projectName}</div>
                      <div className="text-xs text-slate-500">{item.task.taskName} ({item.task.hours}h)</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                      <div className="text-right">
                         <div className="font-bold text-sm text-indigo-700">{item.newAssignee}</div>
                         <div className="text-[10px] text-indigo-500 font-medium">{item.reason}</div>
                      </div>
                      <div className={`text-xs font-bold px-2 py-1 rounded-full ${item.score > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.score}% Match
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScenarioOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={confirmReallocation}>Confirm & Reallocate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. TIME CHARGE DIALOG (Employee) */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg"><Clock className="w-5 h-5 text-blue-600"/></div>
              <div>
                <DialogTitle className="text-lg">Log Time & Progress</DialogTitle>
                <DialogDescription>Update your timesheet for <span className="font-bold text-slate-900">{selectedTask?.projectName}</span></DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Planned vs Actual */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase font-bold">Planned Hours</Label>
                  <div className="p-2 bg-slate-50 border rounded-md font-mono text-sm text-slate-500">
                    {selectedTask?.hours} Hours
                  </div>
               </div>
               <div className="space-y-2">
                  <Label className="text-xs text-blue-600 uppercase font-bold">Actual Hours Worked</Label>
                  <Input 
                    type="number" 
                    value={logForm.actualHours} 
                    onChange={(e) => setLogForm({...logForm, actualHours: Number(e.target.value)})}
                    className="font-mono font-bold"
                  />
               </div>
            </div>

            {/* Work Performed */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-700 uppercase font-bold flex items-center gap-1"><FileText className="w-3 h-3"/> Work Performed</Label>
              <Textarea 
                placeholder="Briefly describe what you achieved..."
                className="resize-none h-20 text-sm"
                value={logForm.description}
                onChange={(e) => setLogForm({...logForm, description: e.target.value})}
              />
            </div>

            {/* Extra Tasks */}
            <div className="space-y-2">
              <Label className="text-xs text-amber-600 uppercase font-bold flex items-center gap-1"><Zap className="w-3 h-3"/> Unplanned / Extra Tasks</Label>
              <Textarea 
                placeholder="Did you do anything outside the original scope? (Scope creep, hotfixes)"
                className="resize-none h-20 bg-amber-50/50 border-amber-200 focus:border-amber-400 text-sm"
                value={logForm.extraTasks}
                onChange={(e) => setLogForm({...logForm, extraTasks: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={saveTimeLog}>
              Save Time Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Persona Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg text-white"><Users className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-white text-sm">System Persona</h3>
            <p className="text-xs text-slate-400">Current Role: {activePersona === 'manager' ? 'HR / Manager' : 'Individual Contributor'}</p>
          </div>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-xl w-fit border border-slate-700">
          <button onClick={() => setActivePersona('manager')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePersona === 'manager' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Manager</button>
          <button onClick={() => setActivePersona('employee')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePersona === 'employee' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Employee</button>
        </div>
      </div>

      {/* Leave Management (Unchanged - Collapsed for brevity) */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Leave Requests</h2>
            <p className="text-xs text-gray-500 font-medium">{activePersona === 'manager' ? 'Approve to trigger AI redistribution' : 'Track your leave status'}</p>
          </div>
          <Button className="bg-indigo-600 px-6 font-bold shadow-indigo-100 shadow-xl">Apply for Leave</Button>
        </div>
        <Card className="rounded-xl border-none shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold uppercase text-[10px]">Employee</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Dates</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.filter(l => activePersona === 'manager' || l.name === currentUser).map((leave) => (
                <TableRow key={leave.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-bold text-gray-800">{leave.name}</TableCell>
                  <TableCell><div className="text-xs font-medium text-gray-600">{leave.startDate} → {leave.endDate}</div></TableCell>
                  <TableCell>
                    <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{leave.status}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {leave.status === 'Pending' && activePersona === 'manager' ? (
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8 font-black text-[10px]" onClick={() => runImpactAnalysis(leave)}>REVIEW IMPACT</Button>
                    ) : ( <span className="text-[10px] text-gray-400 font-medium">--</span> )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Dynamic Workload Chart */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Briefcase className="text-indigo-600" /> {sectionTitle}
        </h2>

        <Card className="rounded-xl border-none shadow-2xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  <th className="p-4 text-left text-[10px] font-black text-gray-400 uppercase w-48 border-r">Resource / Skill</th>
                  {DAYS.map(day => <th key={day} className="p-4 text-center text-[10px] font-black text-gray-400 uppercase">{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.map(emp => (
                  <tr key={emp.name} className="border-b border-gray-50 align-top">
                    <td className="p-4 border-r bg-slate-50/30">
                        <div className="font-bold text-sm text-gray-800">{emp.name}</div>
                        <div className="text-[10px] text-gray-500 font-medium mb-1">{emp.role}</div>
                        <div className="flex flex-wrap gap-1">
                          {emp.skills.slice(0, 2).map(skill => <span key={skill} className="text-[8px] bg-white border border-slate-200 px-1 rounded">{skill}</span>)}
                        </div>
                    </td>
                    {DAYS.map((_, dayIndex) => {
                      const dayTasks = tasks.filter(t => t.assignee === emp.name && t.day === dayIndex);
                      const totalHours = getDailyLoad(emp.name, dayIndex, tasks);
                      const showCapacityWarning = activePersona === 'manager' && totalHours > 10;

                      return (
                        <td key={dayIndex} className={`p-2 min-w-[160px] transition-colors ${showCapacityWarning ? 'bg-rose-50/50' : ''}`}>
                          <div className="flex justify-between items-center mb-2 px-1">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${showCapacityWarning ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {totalHours}h TOTAL
                            </span>
                          </div>
                          
                          {dayTasks.map(t => (
                            <div 
                              key={t.id} 
                              onClick={() => handleTaskClick(t)}
                              className={`p-2 mb-2 rounded-lg border text-[11px] relative transition-all shadow-sm group
                              ${t.isCancelled ? 'bg-red-50 border-red-200 opacity-60 grayscale' : 
                                t.status === 'Logged' ? 'bg-emerald-50 border-emerald-300 shadow-emerald-100' :
                                t.isReallocated ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-200' : 'bg-white border-slate-200 text-slate-700'}
                              ${activePersona === 'employee' && !t.isCancelled ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md' : ''}
                            `}>
                              <div className="flex justify-between font-black uppercase tracking-tight mb-1">
                                <span className="truncate w-20">{t.projectName}</span>
                                <span className={t.isReallocated ? 'text-indigo-200' : 'text-slate-400'}>{t.hours}h</span>
                              </div>
                              <p className={`text-[9px] mb-1 leading-tight ${t.isReallocated ? 'text-indigo-100' : 'text-slate-500'}`}>{t.taskName}</p>
                              
                              {/* Logged Status Indicator */}
                              {t.status === 'Logged' && (
                                <div className="mt-1 pt-1 border-t border-emerald-200 flex items-center gap-1 text-[8px] font-bold text-emerald-700 uppercase">
                                  <Check className="w-2.5 h-2.5" /> Logged ({t.actualHours}h)
                                </div>
                              )}
                              
                              {/* Hover Hint for Employee */}
                              {activePersona === 'employee' && !t.isCancelled && t.status !== 'Logged' && (
                                <div className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-blue-600/90 text-white flex items-center justify-center font-bold text-xs rounded-lg transition-opacity">
                                  Log Time
                                </div>
                              )}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}