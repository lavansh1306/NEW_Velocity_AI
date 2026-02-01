import React, { useState } from 'react';
import { UnifiedProject, UnifiedEmployee, LeaveRequest } from '../types';
import { ChevronLeft, ChevronRight, Calendar, Clock, Briefcase, CalendarOff, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';

interface TimetableViewProps {
  userRole: 'MANAGER' | 'EMPLOYEE';
  currentUserId: number;
  projects: UnifiedProject[];
  employees: UnifiedEmployee[];
  leaveRequests: LeaveRequest[];
}

export const TimetableView: React.FC<TimetableViewProps> = ({
  userRole,
  currentUserId,
  projects,
  employees,
  leaveRequests,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  // Helper: Get Mon-Fri
  const getWeekDays = (startDate: Date) => {
    const days = [];
    const current = new Date(startDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    current.setDate(diff);
    for (let i = 0; i < 5; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const weekDays = getWeekDays(currentWeekStart);

  // Helper: Distribute tasks
  const getTasksForDay = (empId: number, dayIndex: number) => {
    // 1. Check for Leave
    const date = weekDays[dayIndex];
    const leave = leaveRequests.find(req => {
      if (req.employeeId !== empId || req.status !== 'APPROVED') return false;
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      start.setHours(0,0,0,0); end.setHours(0,0,0,0); date.setHours(0,0,0,0);
      return date >= start && date <= end;
    });

    if (leave) return { type: 'LEAVE', data: leave };

    // 2. Find Assigned Tasks
    // Since we parsed CSV rows as distinct "Projects" in UnifiedView, we filter those.
    // We use the project ID hash or index to deterministically assign it to a day.
    const assignedTasks = projects.filter(p => p.status === 'ACTIVE' && p.assignedTeamIds.includes(empId));
    
    // Distribute: Task N goes to Day (N % 5)
    // This spreads the workload visually across the week
    const tasksForThisDay = assignedTasks.filter((_, idx) => (idx % 5) === dayIndex);

    if (tasksForThisDay.length > 0) return { type: 'WORK', data: tasksForThisDay };
    return null;
  };

  const getStatusColor = (project: UnifiedProject) => {
    if (project.estimatedHours > 20) return 'bg-amber-500';
    if (project.estimatedHours < 10) return 'bg-emerald-500';
    return 'bg-blue-500';
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
        case 'Client Deliverable': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Internal Tool': return 'bg-slate-100 text-slate-700 border-slate-200';
        case 'R&D / POC': return 'bg-purple-100 text-purple-700 border-purple-200';
        default: return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-indigo-700" />
            </div>
            {userRole === 'MANAGER' ? 'Organizational Workload' : 'My Schedule'}
        </h2>
        
        <div className="flex items-center gap-3">
            {/* Legend (Manager Only) */}
            {userRole === 'MANAGER' && (
                <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm mr-2">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> On Track</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Done</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Heavy</span>
                </div>
            )}

            {/* Date Nav */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
               <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() - 7)))}>
                 <ChevronLeft className="w-4 h-4" />
               </Button>
               <span className="text-xs font-bold text-slate-600 w-28 text-center border-x border-slate-100 h-8 flex items-center justify-center">
                 {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[4].toLocaleDateString('en-US', { day: 'numeric' })}
               </span>
               <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() + 7)))}>
                 <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
        </div>
      </div>

      <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          {/* ================= MANAGER VIEW TABLE ================= */}
          {userRole === 'MANAGER' && (
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase w-[280px] min-w-[280px] border-r border-slate-200 sticky left-0 bg-slate-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    Resource & Skills
                  </th>
                  {weekDays.map((day, i) => (
                    <th key={i} className="p-4 text-center text-xs font-bold text-slate-500 uppercase min-w-[160px]">
                      {day.toLocaleDateString('en-US', { weekday: 'long' })}
                      <div className="text-[10px] text-slate-400 font-normal">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="group hover:bg-slate-50/50">
                    
                    {/* RESOURCE COLUMN */}
                    <td className="p-4 border-r border-slate-200 bg-white sticky left-0 z-20 group-hover:bg-slate-50/50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-200 shadow-sm">
                            {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-gray-900 truncate">{emp.name}</div>
                            <div className="text-xs text-slate-500 mb-2 truncate">{emp.role}</div>
                            <div className="flex flex-wrap gap-1">
                              {emp.skills.slice(0, 2).map(s => (
                                <span key={s} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 truncate max-w-[80px]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                    </td>

                    {/* DAYS COLUMNS */}
                    {weekDays.map((_, dayIndex) => {
                      const slot = getTasksForDay(emp.id, dayIndex);
                      
                      return (
                        <td key={dayIndex} className="p-2 align-top h-32 border-l border-dashed border-slate-100 bg-opacity-50">
                          {slot ? (
                             slot.type === 'LEAVE' ? (
                               // LEAVE BLOCK
                               <div className="h-full rounded-lg border border-red-200 bg-red-50 p-2 flex flex-col justify-center items-center text-center opacity-80">
                                 <CalendarOff className="w-5 h-5 text-red-400 mb-1" />
                                 <span className="text-[10px] font-bold text-red-600 uppercase">On Leave</span>
                                 <span className="text-[9px] text-red-400 line-clamp-1">{(slot.data as LeaveRequest).type}</span>
                               </div>
                             ) : (
                               // WORK BLOCK(S)
                               <div className="space-y-2">
                                 {(slot.data as UnifiedProject[]).map(task => (
                                   <div 
                                     key={task.id} 
                                     className="relative bg-white rounded border border-slate-200 p-2 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group/card"
                                   >
                                     <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${getStatusColor(task)}`} />
                                     <div className="pl-2.5">
                                       <div className="flex justify-between items-center mb-1">
                                         <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[80px]">
                                           {task.category.split(' ')[0]}
                                         </span>
                                         <span className="text-[9px] text-slate-400 font-mono">
                                           {task.estimatedHours}h
                                         </span>
                                       </div>
                                       <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-2" title={task.title}>
                                         {task.title}
                                       </p>
                                       <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-slate-50 opacity-50 group-hover/card:opacity-100 transition-opacity">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                          <span className="text-[9px] text-slate-500 italic truncate">Active</span>
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             )
                          ) : (
                            // EMPTY SLOT
                            <div className="h-full flex items-center justify-center group-hover:bg-slate-50/50 rounded transition-colors">
                               {/* Only show dot on hover to keep it clean */}
                               <div className="w-1 h-1 bg-slate-200 rounded-full group-hover:bg-slate-300" />
                            </div>
                          )}
                        </td>
                      );
                    })}

                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ================= EMPLOYEE VIEW (Personal Agenda) ================= */}
          {userRole === 'EMPLOYEE' && (
             <div className="flex divide-x divide-slate-200 min-h-[500px]">
                {weekDays.map((day, i) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  // We need to pass the CURRENT USER ID here, not iterate all employees
                  const slot = getTasksForDay(currentUserId, i); 

                  return (
                    <div key={i} className={`flex-1 flex flex-col ${isToday ? 'bg-indigo-50/10' : ''}`}>
                      <div className={`p-4 text-center border-b border-slate-200 ${isToday ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-80">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-2xl font-black">{day.getDate()}</div>
                      </div>
                      
                      <div className="p-3 space-y-3 flex-1 bg-slate-50/30">
                         {slot ? (
                           slot.type === 'LEAVE' ? (
                             <div className="h-40 flex flex-col items-center justify-center text-red-400 bg-red-50/50 rounded-lg border border-red-100 p-4 animate-in zoom-in-95">
                                <CalendarOff className="w-8 h-8 mb-2 opacity-50" />
                                <span className="text-sm font-bold text-red-600">On Leave</span>
                                <span className="text-xs uppercase tracking-wide">{(slot.data as LeaveRequest).type}</span>
                             </div>
                           ) : (
                             (slot.data as UnifiedProject[]).map((task, idx) => (
                               <div key={task.id} className={`p-3 rounded-lg border-l-4 shadow-sm bg-white ${getCategoryColor(task.category)} border-l-current animate-in slide-in-from-bottom-2`}>
                                  <div className="flex items-center gap-1 text-[10px] font-bold opacity-70 mb-1 uppercase">
                                    <Clock className="w-3 h-3" /> {idx === 0 ? "09:00 - 13:00" : "14:00 - 18:00"}
                                  </div>
                                  <div className="font-bold text-sm leading-tight mb-1">{task.title}</div>
                                  <div className="text-xs opacity-80 truncate">{task.description}</div>
                               </div>
                             ))
                           )
                         ) : (
                           <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 opacity-50">
                              <Briefcase className="w-8 h-8" />
                              <span className="text-xs font-bold">Free</span>
                           </div>
                         )}
                      </div>
                    </div>
                  );
                })}
             </div>
          )}
        </div>
      </Card>
    </div>
  );
};