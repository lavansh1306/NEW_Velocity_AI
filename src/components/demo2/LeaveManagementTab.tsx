import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Calendar, CheckCircle2, XCircle, Clock, Users, User, ArrowRight, BrainCircuit, Briefcase, AlertCircle } from 'lucide-react';

// --- Types ---
interface Task {
  id: number;
  projectName: string;
  taskName: string;
  assignee: string;
  hours: number;
  day: number; // 0-4 (Mon-Fri)
  isReallocated?: boolean;
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

// --- Initial Mock Data ---
const EMPLOYEES = ["Alex Rivera", "Sarah Chen", "Michael Vance", "Jordan Smith", "Emma Wilson"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const INITIAL_TASKS: Task[] = [
  { id: 101, projectName: "Titan AI", taskName: "API Setup", assignee: "Alex Rivera", hours: 6, day: 0 },
  { id: 102, projectName: "Titan AI", taskName: "DB Schema", assignee: "Alex Rivera", hours: 4, day: 1 },
  { id: 103, projectName: "Cloud Migration", taskName: "Auth Logic", assignee: "Sarah Chen", hours: 8, day: 0 },
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
  
  // State for the AI Reallocation Summary Toast
  const [reallocationSummary, setReallocationSummary] = useState<{task: string, from: string, to: string}[] | null>(null);

  const currentUser = "Alex Rivera";

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // --- AI REALLOCATION ALGORITHM ---
  const handleApproveAndReallocate = (leaveId: number, absenteeName: string) => {
    const summary: {task: string, from: string, to: string}[] = [];
    
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.assignee === absenteeName) {
          // Find candidates (everyone else)
          const candidates = EMPLOYEES.filter(emp => emp !== absenteeName).map(emp => {
            // Calculate their current load for that specific day
            const currentLoad = prevTasks
              .filter(t => t.assignee === emp && t.day === task.day)
              .reduce((sum, t) => sum + t.hours, 0);
            return { name: emp, load: currentLoad };
          });

          // Sort by least load
          const bestFit = candidates.sort((a, b) => a.load - b.load)[0];

          summary.push({
            task: `${task.projectName}: ${task.taskName}`,
            from: absenteeName,
            to: bestFit.name
          });

          return { 
            ...task, 
            assignee: bestFit.name, 
            isReallocated: true, 
            originalAssignee: absenteeName 
          };
        }
        return task;
      });
    });

    setLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status: 'Approved' } : l));
    setReallocationSummary(summary);
    
    // Auto-hide summary after 6 seconds
    setTimeout(() => setReallocationSummary(null), 6000);
  };

  const handleAddLeave = () => {
    const entry: LeaveRequest = {
      id: Date.now(),
      name: activePersona === 'manager' ? (formData.name || "Unknown") : currentUser,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason || "Personal",
      status: activePersona === 'manager' ? 'Approved' : 'Pending',
    };
    if (entry.status === 'Approved') handleApproveAndReallocate(entry.id, entry.name);
    else setLeaves([entry, ...leaves]);
    
    setIsModalOpen(false);
    setFormData({ name: '', startDate: '', endDate: '', reason: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. Reallocation Toast (Floating Summary) */}
      {reallocationSummary && (
        <div className="fixed bottom-5 right-5 z-50 w-80 animate-in slide-in-from-right-10">
          <Card className="border-indigo-200 shadow-2xl bg-indigo-50">
            <CardHeader className="py-3 bg-indigo-600 text-white rounded-t-xl flex flex-row items-center gap-2">
              <BrainCircuit className="w-4 h-4" />
              <CardTitle className="text-sm font-bold">AI Reallocation Summary</CardTitle>
            </CardHeader>
            <CardContent className="py-3 space-y-2 max-h-60 overflow-y-auto">
              {reallocationSummary.map((item, i) => (
                <div key={i} className="text-xs bg-white p-2 rounded border border-indigo-100 shadow-sm">
                  <p className="font-bold text-gray-700">{item.task}</p>
                  <div className="flex items-center gap-1 text-indigo-600 font-medium mt-1">
                    <span>{item.from}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{item.to}</span>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase font-bold" onClick={() => setReallocationSummary(null)}>Dismiss</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. Persona Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg text-white"><Users className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-white text-sm">Persona Simulator</h3>
            <p className="text-xs text-slate-400">Testing: {activePersona === 'manager' ? 'Admin Logic' : 'Employee Flow'}</p>
          </div>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-xl w-fit">
          <button onClick={() => setActivePersona('manager')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePersona === 'manager' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Manager</button>
          <button onClick={() => setActivePersona('employee')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePersona === 'employee' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Employee</button>
        </div>
      </div>

      {/* 3. Leave Requests Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Calendar className="text-indigo-600" /> Leave Portal</h2>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild><Button className="bg-indigo-600">Request Leave</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Application</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                {activePersona === 'manager' && (
                  <div className="space-y-2"><Label>Employee Name</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Alex Rivera" /></div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} /></div>
                  <div className="space-y-2"><Label>End Date</Label><Input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>Reason</Label><Input value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder="Reason" /></div>
              </div>
              <DialogFooter><Button onClick={handleAddLeave} className="w-full">Submit</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="rounded-xl border-none shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Employee</TableHead><TableHead>Date Range</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.filter(l => activePersona === 'manager' || l.name === currentUser).map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-bold">{leave.name}</TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500">{leave.startDate} to {leave.endDate}</span>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase">{calculateDays(leave.startDate, leave.endDate)} Days Absent</p>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${leave.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {leave.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {leave.status === 'Pending' && activePersona === 'manager' && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-[10px] font-bold" onClick={() => handleApproveAndReallocate(leave.id, leave.name)}>APPROVE & REALLOCATE</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* 4. Weekly Task Gantt Chart */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Briefcase className="text-blue-600" /> Weekly Resource Schedule</h2>
        
        

        <Card className="rounded-xl border-none shadow-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  <th className="p-4 text-left text-xs font-black text-gray-400 uppercase w-48 border-r">Resource</th>
                  {DAYS.map(day => <th key={day} className="p-4 text-center text-xs font-black text-gray-400 uppercase">{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {EMPLOYEES.map(emp => (
                  <tr key={emp} className="border-b border-gray-50">
                    <td className={`p-4 border-r font-bold text-sm ${emp === currentUser ? 'text-indigo-600 bg-indigo-50/30' : 'text-gray-700'}`}>{emp}</td>
                    {DAYS.map((_, dayIndex) => {
                      const dayTasks = tasks.filter(t => t.assignee === emp && t.day === dayIndex);
                      return (
                        <td key={dayIndex} className="p-2 min-w-[140px] align-top">
                          {dayTasks.map(t => (
                            <div key={t.id} className={`p-2 mb-2 rounded-lg border shadow-sm ${t.isReallocated ? 'bg-orange-50 border-orange-200 animate-pulse' : 'bg-indigo-50 border-indigo-100'}`}>
                              <p className={`text-[10px] font-black uppercase truncate ${t.isReallocated ? 'text-orange-700' : 'text-indigo-700'}`}>{t.projectName}</p>
                              <p className="text-[9px] text-gray-500 mb-1">{t.taskName}</p>
                              <div className="flex items-center justify-between border-t border-black/5 pt-1 mt-1">
                                <span className="text-[9px] font-bold">{t.hours}h</span>
                                {t.isReallocated && (
                                  <span className="text-[8px] font-black text-orange-600 flex items-center gap-1">
                                    <AlertCircle className="w-2 h-2" /> FROM {t.originalAssignee?.split(' ')[0]}
                                  </span>
                                )}
                              </div>
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