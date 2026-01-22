import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Calendar, CheckCircle2, XCircle, Clock, Users, User, ArrowRight, BrainCircuit, Briefcase, AlertTriangle, Info } from 'lucide-react';

// --- Types ---
interface Task {
  id: number;
  projectName: string;
  taskName: string;
  assignee: string;
  hours: number;
  day: number; // 0-4 (Mon-Fri)
  isReallocated?: boolean;
  isCancelled?: boolean;
  originalAssignee?: string;
}

interface LeaveRequest {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const EMPLOYEES = ["Alex Rivera", "Sarah Chen", "Michael Vance", "Jordan Smith", "Emma Wilson"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const INITIAL_TASKS: Task[] = [
  { id: 101, projectName: "Titan AI", taskName: "API Setup", assignee: "Alex Rivera", hours: 6, day: 0 },
  { id: 102, projectName: "Titan AI", taskName: "DB Schema", assignee: "Alex Rivera", hours: 4, day: 1 },
  { id: 103, projectName: "Cloud Migration", taskName: "Auth Logic", assignee: "Sarah Chen", hours: 9, day: 0 },
  { id: 104, projectName: "Velocity Dashboard", taskName: "UI Refactor", assignee: "Michael Vance", hours: 5, day: 2 },
  { id: 105, projectName: "Titan AI", taskName: "Testing", assignee: "Jordan Smith", hours: 3, day: 0 },
  { id: 106, projectName: "Security Audit", taskName: "Patching", assignee: "Emma Wilson", hours: 2, day: 1 },
];

export default function LeaveManagementTab() {
  const [activePersona, setActivePersona] = useState<'manager' | 'employee'>('manager');
  const [leaves, setLeaves] = useState<LeaveRequest[]>([
    { id: 1, name: "Alex Rivera", startDate: "2024-06-10", endDate: "2024-06-11", reason: "Family Event", status: "Pending" }
  ]);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', reason: '' });
  const [reallocationSummary, setReallocationSummary] = useState<{task: string, from: string, to: string}[] | null>(null);

  const currentUser = "Alex Rivera";

  // Helper to calculate capacity per day for an employee
  const getDailyLoad = (employee: string, day: number, currentTasks: Task[]) => {
    return currentTasks
      .filter(t => t.assignee === employee && t.day === day && !t.isCancelled)
      .reduce((sum, t) => sum + t.hours, 0);
  };

  const handleApproveAndReallocate = (leaveId: number, absenteeName: string) => {
    const summary: {task: string, from: string, to: string}[] = [];
    
    setTasks(prevTasks => {
      const newTasks = [...prevTasks];
      
      // 1. Mark absentee's tasks as "Cancelled" (Show in Red)
      const absenteeTasks = newTasks.filter(t => t.assignee === absenteeName && !t.isReallocated);
      absenteeTasks.forEach(t => t.isCancelled = true);

      // 2. Create clones of those tasks for other employees
      absenteeTasks.forEach(originalTask => {
        const candidates = EMPLOYEES.filter(emp => emp !== absenteeName).map(emp => ({
          name: emp,
          load: getDailyLoad(emp, originalTask.day, newTasks)
        }));

        const bestFit = candidates.sort((a, b) => a.load - b.load)[0];

        summary.push({
          task: `${originalTask.projectName}: ${originalTask.taskName}`,
          from: absenteeName,
          to: bestFit.name
        });

        newTasks.push({
          ...originalTask,
          id: Date.now() + Math.random(),
          assignee: bestFit.name,
          isReallocated: true,
          isCancelled: false,
          originalAssignee: absenteeName
        });
      });

      return newTasks;
    });

    setLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status: 'Approved' } : l));
    setReallocationSummary(summary);
    setTimeout(() => setReallocationSummary(null), 8000);
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    return Math.ceil(Math.abs(new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. Reallocation Summary Toast */}
      {reallocationSummary && (
        <div className="fixed bottom-5 right-5 z-50 w-80 animate-in slide-in-from-bottom-10">
          <Card className="border-indigo-200 shadow-2xl bg-white border-t-4 border-t-indigo-600">
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">AI Reallocation</CardTitle>
              </div>
              <XCircle className="w-4 h-4 text-gray-300 cursor-pointer" onClick={() => setReallocationSummary(null)} />
            </CardHeader>
            <CardContent className="py-2 space-y-2">
              {reallocationSummary.map((item, i) => (
                <div key={i} className="text-[11px] p-2 bg-slate-50 rounded border border-slate-100">
                  <p className="font-bold text-gray-700 truncate">{item.task}</p>
                  <div className="flex items-center gap-2 text-indigo-600 mt-1">
                    <span className="opacity-50">{item.from}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-bold">{item.to}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. Persona Switcher */}
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

      {/* 3. Leave Management Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Leave Requests</h2>
            <p className="text-xs text-gray-500 font-medium">Approve to trigger AI redistribution</p>
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
                  <TableCell>
                    <div className="text-xs font-medium text-gray-600">{leave.startDate} → {leave.endDate}</div>
                    <div className="text-[10px] font-black text-indigo-500 uppercase">{calculateDays(leave.startDate, leave.endDate)} Days Leave</div>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {leave.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {leave.status === 'Pending' && activePersona === 'manager' && (
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8 font-black text-[10px]" onClick={() => handleApproveAndReallocate(leave.id, leave.name)}>
                        APPROVE & REALLOCATE
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* 4. Gantt Chart with Capacity Logic */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2"><Briefcase className="text-indigo-600" /> Organizational Workload</h2>
            <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100"><AlertTriangle className="w-3 h-3" /> OVER CAPACITY (&gt;10h)</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400"><div className="w-2 h-2 bg-red-100 border border-red-300 rounded"></div> CANCELLED (LEAVE)</div>
            </div>
        </div>

        <Card className="rounded-xl border-none shadow-2xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  <th className="p-4 text-left text-[10px] font-black text-gray-400 uppercase w-48 border-r">Resource / Day</th>
                  {DAYS.map(day => <th key={day} className="p-4 text-center text-[10px] font-black text-gray-400 uppercase">{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {EMPLOYEES.map(emp => (
                  <tr key={emp} className="border-b border-gray-50 align-top">
                    <td className="p-4 border-r bg-slate-50/30">
                        <div className="font-bold text-sm text-gray-800">{emp}</div>
                        <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Base Hours: 40h/wk</div>
                    </td>
                    {DAYS.map((_, dayIndex) => {
                      const dayTasks = tasks.filter(t => t.assignee === emp && t.day === dayIndex);
                      const totalHours = getDailyLoad(emp, dayIndex, tasks);
                      const isOverCapacity = totalHours > 10;

                      return (
                        <td key={dayIndex} className={`p-2 min-w-[160px] transition-colors ${isOverCapacity ? 'bg-rose-50/50' : ''}`}>
                          <div className="flex justify-between items-center mb-2 px-1">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isOverCapacity ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {totalHours}h TOTAL
                            </span>
                          </div>
                          
                          {dayTasks.map(t => (
                            <div key={t.id} className={`p-2 mb-2 rounded-lg border text-[11px] relative transition-all shadow-sm
                              ${t.isCancelled ? 'bg-red-50 border-red-200 opacity-80' : 
                                t.isReallocated ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-200' : 'bg-white border-slate-200 text-slate-700'}
                            `}>
                              <div className="flex justify-between font-black uppercase tracking-tight mb-1">
                                <span className="truncate">{t.projectName}</span>
                                <span className={t.isReallocated ? 'text-indigo-200' : 'text-slate-400'}>{t.hours}h</span>
                              </div>
                              <p className={`text-[9px] mb-1 leading-tight ${t.isReallocated ? 'text-indigo-100' : 'text-slate-500'}`}>{t.taskName}</p>
                              
                              {t.isCancelled && (
                                <div className="mt-1 pt-1 border-t border-red-200 text-[8px] font-bold text-red-600 uppercase flex items-center gap-1">
                                    <Info className="w-2 h-2" /> Absent (Reallocated)
                                </div>
                              )}
                              {t.isReallocated && (
                                <div className="mt-1 pt-1 border-t border-indigo-400 text-[8px] font-bold text-indigo-200 uppercase">
                                    Assigned from {t.originalAssignee?.split(' ')[0]}
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