import React, { useState } from 'react';
import { UnifiedProject, UnifiedEmployee, LeaveRequest } from '../types';
import { ChevronLeft, ChevronRight, Calendar, Briefcase, CalendarOff, CheckCircle2, Clock, Battery, BatteryCharging } from 'lucide-react';
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

  // --- CONFIG ---
  const WORK_START = 9;
  const WORK_END = 18;
  const TOTAL_HOURS_PER_DAY = WORK_END - WORK_START; // 9 Hours

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

  // --- LOGIC: Calculate Task/Free Hours for a Specific Day ---
  const getDayMetrics = (empId: number, dayIndex: number) => {
    // 1. Check Leave
    const date = weekDays[dayIndex];
    const leave = leaveRequests.find(req => {
      if (req.employeeId !== empId || req.status !== 'APPROVED') return false;
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      start.setHours(0,0,0,0); end.setHours(0,0,0,0); date.setHours(0,0,0,0);
      return date >= start && date <= end;
    });

    if (leave) return { type: 'LEAVE', data: leave, freeHours: 0, consumedHours: TOTAL_HOURS_PER_DAY };

    // 2. Calculate Work
    const assignedTasks = projects.filter(p => p.status === 'ACTIVE' && p.assignedTeamIds.includes(empId));
    // Distribute logic: Task N -> Day (N % 5)
    const tasksForThisDay = assignedTasks.filter((_, idx) => (idx % 5) === dayIndex);

    let consumedHours = 0;
    const taskBlocks = tasksForThisDay.map(t => {
      const hours = Math.min(4, Math.max(1, Math.round(t.estimatedHours / 5))); 
      consumedHours += hours;
      return { ...t, dailyHours: hours };
    });

    const freeHours = Math.max(0, TOTAL_HOURS_PER_DAY - consumedHours);
    
    // If no tasks, it's fully free
    if (taskBlocks.length === 0) return { type: 'FREE', freeHours: TOTAL_HOURS_PER_DAY, consumedHours: 0 };

    return { type: 'WORK', tasks: taskBlocks, freeHours, consumedHours };
  };

  // --- LOGIC: Calculate Total Weekly Free Time ---
  const getWeeklyFreeTime = (empId: number) => {
    let totalFree = 0;
    // Loop 0 to 4 (Mon-Fri)
    for (let i = 0; i < 5; i++) {
      const metrics = getDayMetrics(empId, i);
      totalFree += metrics.freeHours;
    }
    return totalFree;
  };

  const getStatusColor = (hours: number) => {
    if (hours >= 8) return 'bg-amber-500';
    if (hours >= 4) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
        case 'Client Deliverable': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Internal Tool': return 'bg-slate-100 text-slate-700 border-slate-200';
        case 'R&D / POC': return 'bg-purple-100 text-purple-700 border-purple-200';
        default: return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };

  // Calculate current user's stats for the header
  const myWeeklyFree = getWeeklyFreeTime(currentUserId);
  const myWeeklyTotal = TOTAL_HOURS_PER_DAY * 5;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-indigo-700" />
              </div>
              {userRole === 'MANAGER' ? 'Organizational Workload' : 'My Schedule'}
          </h2>
          
          {/* Employee View: Weekly Summary Badge */}
          {userRole === 'EMPLOYEE' && (
             <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                <BatteryCharging className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800">
                  Weekly Free Time: {myWeeklyFree}h / {myWeeklyTotal}h
                </span>
             </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
            {/* Legend */}
            {userRole === 'MANAGER' && (
                <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm mr-2">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Occupied</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200"></div> Free Time</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Leave</span>
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
                {employees.map(emp => {
                  // Calculate Weekly Free Time for this employee
                  const weeklyFree = getWeeklyFreeTime(emp.id);
                  const isLowAvailability = weeklyFree < 10;

                  return (
                    <tr key={emp.id} className="group hover:bg-slate-50/50">
                      
                      {/* RESOURCE COLUMN */}
                      <td className="p-4 border-r border-slate-200 bg-white sticky left-0 z-20 group-hover:bg-slate-50/50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-200 shadow-sm">
                              {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-sm text-gray-900 truncate">{emp.name}</div>
                              <div className="text-xs text-slate-500 mb-1 truncate">{emp.role}</div>
                              
                              {/* WEEKLY CAPACITY BADGE */}
                              <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${isLowAvailability ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                 <Battery className="w-3 h-3" />
                                 {weeklyFree}h Free / Week
                              </div>
                            </div>
                          </div>
                      </td>

                      {/* DAYS COLUMNS */}
                      {weekDays.map((_, dayIndex) => {
                        const slot = getDayMetrics(emp.id, dayIndex);
                        
                        return (
                          <td key={dayIndex} className="p-2 align-top h-32 border-l border-dashed border-slate-100 bg-opacity-50">
                             {slot.type === 'LEAVE' ? (
                                 <div className="h-full rounded-lg border border-red-200 bg-red-50 p-2 flex flex-col justify-center items-center text-center opacity-80">
                                   <CalendarOff className="w-5 h-5 text-red-400 mb-1" />
                                   <span className="text-[10px] font-bold text-red-600 uppercase">On Leave</span>
                                 </div>
                             ) : slot.type === 'FREE' ? (
                                 <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-1 bg-slate-50/30 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Available</span>
                                    <span className="text-[9px]">{TOTAL_HOURS_PER_DAY}h Free</span>
                                 </div>
                             ) : (
                                 // WORK BLOCKS
                                 <div className="space-y-1 h-full flex flex-col">
                                   {slot.tasks?.map((task: any) => (
                                     <div key={task.id} className="relative bg-white rounded border border-slate-200 p-2 shadow-sm hover:border-indigo-400 cursor-pointer flex-1 min-h-[40px]">
                                       <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${getStatusColor(task.dailyHours)}`} />
                                       <div className="pl-2.5">
                                         <div className="flex justify-between items-center mb-1">
                                           <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[60px]">{task.category.split(' ')[0]}</span>
                                           <span className="text-[9px] text-slate-400 font-mono">{task.dailyHours}h</span>
                                         </div>
                                         <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-2" title={task.title}>{task.title}</p>
                                       </div>
                                     </div>
                                   ))}
                                   {slot.freeHours > 0 && (
                                      <div className="flex-1 min-h-[30px] rounded border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center gap-1 text-slate-400">
                                          <span className="text-[9px] font-medium">{slot.freeHours}h Free</span>
                                      </div>
                                   )}
                                 </div>
                             )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* ================= EMPLOYEE VIEW ================= */}
          {userRole === 'EMPLOYEE' && (
             <div className="flex divide-x divide-slate-200 min-h-[500px]">
                {weekDays.map((day, i) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const slot = getDayMetrics(currentUserId, i); 

                  return (
                    <div key={i} className={`flex-1 flex flex-col ${isToday ? 'bg-indigo-50/10' : ''}`}>
                      <div className={`p-4 text-center border-b border-slate-200 ${isToday ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-80">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-2xl font-black">{day.getDate()}</div>
                      </div>
                      
                      <div className="p-3 space-y-3 flex-1 bg-slate-50/30 flex flex-col">
                         {slot.type === 'LEAVE' ? (
                             <div className="h-full flex flex-col items-center justify-center text-red-400 bg-red-50/50 rounded-lg border border-red-100 p-4 animate-in zoom-in-95">
                                <CalendarOff className="w-8 h-8 mb-2 opacity-50" />
                                <span className="text-sm font-bold text-red-600">On Leave</span>
                                <span className="text-xs uppercase tracking-wide">{(slot.data as LeaveRequest).type}</span>
                             </div>
                         ) : slot.type === 'FREE' ? (
                             <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-60">
                                <Briefcase className="w-8 h-8 opacity-50" />
                                <span className="text-xs font-bold">No Allocations</span>
                                <span className="text-[9px] bg-slate-100 px-2 py-1 rounded">9:00 - 18:00 Free</span>
                             </div>
                         ) : (
                             <>
                               {slot.tasks?.map((task: any, idx: number) => {
                                 const startHour = WORK_START + (idx * 4);
                                 const endHour = Math.min(WORK_END, startHour + task.dailyHours);
                                 return (
                                   <div key={task.id} className={`p-3 rounded-lg border-l-4 shadow-sm bg-white ${getCategoryColor(task.category)} border-l-current animate-in slide-in-from-bottom-2`}>
                                      <div className="flex items-center gap-1 text-[10px] font-bold opacity-70 mb-1 uppercase">
                                        <Clock className="w-3 h-3" /> {startHour}:00 - {endHour}:00
                                      </div>
                                      <div className="font-bold text-sm leading-tight mb-1">{task.title}</div>
                                      <div className="text-xs opacity-80 truncate">{task.description}</div>
                                   </div>
                                 );
                               })}
                               {slot.freeHours > 0 && (
                                 <div className="flex-1 min-h-[50px] rounded-lg border-2 border-dashed border-emerald-100 bg-emerald-50/30 flex flex-col items-center justify-center text-emerald-600 opacity-70 hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-bold">Free Time</span>
                                    <span className="text-[10px]">{slot.freeHours} hours remaining</span>
                                 </div>
                               )}
                             </>
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