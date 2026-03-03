import React, { useState } from 'react';
import { UnifiedProject, UnifiedEmployee, LeaveRequest } from '../types';
import { ChevronLeft, ChevronRight, Briefcase, CalendarOff, Clock, BatteryCharging } from 'lucide-react';
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
    for (let i = 0; i < 5; i++) {
      const metrics = getDayMetrics(empId, i);
      totalFree += metrics.freeHours;
    }
    return totalFree;
  };

  // --- COLOR HELPERS (UPDATED TO GREEN/YELLOW/RED) ---
  const getStatusColor = (hours: number) => {
    // Occupied = Green shades based on intensity
    if (hours >= 8) return 'bg-emerald-700';
    if (hours >= 4) return 'bg-emerald-500';
    return 'bg-emerald-400';
  };

  const getCategoryColor = (cat: string) => {
    // Keep category background lights for readability, but using green accents for work
    switch(cat) {
        case 'Client Deliverable': return 'bg-emerald-50 text-emerald-900 border-emerald-200';
        case 'Internal Tool': return 'bg-teal-50 text-teal-900 border-teal-200';
        case 'R&D / POC': return 'bg-green-50 text-green-900 border-green-200';
        default: return 'bg-emerald-50 text-emerald-900 border-emerald-100';
    }
  };

  const myWeeklyFree = getWeeklyFreeTime(currentUserId);
  const myWeeklyTotal = TOTAL_HOURS_PER_DAY * 5;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-indigo-700" />
              </div>
              {userRole === 'MANAGER' ? 'Organizational Workload' : 'My Schedule'}
          </h2>
          
          {/* Employee View: Weekly Summary Badge */}
          {userRole === 'EMPLOYEE' && (
             <div className="hidden md:flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-full">
                <BatteryCharging className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-bold text-yellow-800">
                  Weekly Free Time: {myWeeklyFree}h / {myWeeklyTotal}h
                </span>
             </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
            {/* Legend (Manager Only) */}
            {userRole === 'MANAGER' && (
                <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm mr-2">
                    {/* OCCUPIED = GREEN */}
                    <span className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Occupied
                    </span>
                    {/* FREE = YELLOW */}
                    <span className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div> Free Time
                    </span>
                    {/* LEAVE = RED */}
                    <span className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div> Leave
                    </span>
                </div>
            )}

            {/* Date Nav */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
               <Button variant="ghost" size="sm" className="h-9 px-3" onClick={() => setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() - 7)))}>
                 <ChevronLeft className="w-5 h-5" />
               </Button>
               <span className="text-sm font-bold text-slate-700 w-36 text-center border-x border-slate-100 h-9 flex items-center justify-center">
                 {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[4].toLocaleDateString('en-US', { day: 'numeric' })}
               </span>
               <Button variant="ghost" size="sm" className="h-9 px-3" onClick={() => setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() + 7)))}>
                 <ChevronRight className="w-5 h-5" />
               </Button>
            </div>
        </div>
      </div>

      <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          {/* ================= MANAGER VIEW TABLE ================= */}
          {userRole === 'MANAGER' && (
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-5 text-left text-sm font-bold text-slate-600 uppercase w-[300px] min-w-[300px] border-r border-slate-200 sticky left-0 bg-slate-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    Resource & Skills
                  </th>
                  {weekDays.map((day, i) => (
                    <th key={i} className="p-5 text-center text-sm font-bold text-slate-600 uppercase min-w-[180px]">
                      {day.toLocaleDateString('en-US', { weekday: 'long' })}
                      <div className="text-xs text-slate-400 font-normal mt-1">{day.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => {
                  const weeklyFree = getWeeklyFreeTime(emp.id);
                  const isLowAvailability = weeklyFree < 10;

                  return (
                    <tr key={emp.id} className="group hover:bg-slate-50/50">
                      
                      {/* RESOURCE COLUMN */}
                      <td className="p-5 border-r border-slate-200 bg-white sticky left-0 z-20 group-hover:bg-slate-50/50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-200 shadow-sm">
                              {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-base text-gray-900 truncate">{emp.name}</div>
                              <div className="text-sm text-slate-500 mb-2 truncate">{emp.role}</div>
                              
                              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold border ${isLowAvailability ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                 <BatteryCharging className="w-3.5 h-3.5" />
                                 {weeklyFree}h Free / Week
                              </div>
                            </div>
                          </div>
                      </td>

                      {/* DAYS COLUMNS */}
                      {weekDays.map((_, dayIndex) => {
                        const slot = getDayMetrics(emp.id, dayIndex);
                        
                        return (
                          <td key={dayIndex} className="p-2 align-top h-40 border-l border-dashed border-slate-100 bg-opacity-50">
                             {slot.type === 'LEAVE' ? (
                                 // LEAVE = RED
                                 <div className="h-full rounded-xl border border-rose-200 bg-rose-50 p-2 flex flex-col justify-center items-center text-center opacity-90">
                                   <CalendarOff className="w-6 h-6 text-rose-500 mb-1" />
                                   <span className="text-xs font-bold text-rose-700 uppercase">On Leave</span>
                                 </div>
                             ) : slot.type === 'FREE' ? (
                                 // FREE = YELLOW
                                 <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-1 bg-yellow-50/50 rounded-xl border border-transparent hover:border-yellow-200 transition-colors">
                                    <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200">Available</span>
                                    <span className="text-xs font-medium text-yellow-600">{TOTAL_HOURS_PER_DAY}h Free</span>
                                 </div>
                             ) : (
                                 // WORK BLOCKS = GREEN
                                 <div className="space-y-1.5 h-full flex flex-col">
                                   {slot.tasks?.map((task: any) => (
                                     <div key={task.id} className="relative bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm hover:border-emerald-400 cursor-pointer flex-1 min-h-[44px]">
                                       <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg ${getStatusColor(task.dailyHours)}`} />
                                       <div className="pl-3">
                                         <div className="flex justify-between items-center mb-1">
                                           <span className="text-[10px] font-bold text-emerald-600 uppercase truncate max-w-[70px]">TASK</span>
                                           <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 px-1 rounded">{task.dailyHours}h</span>
                                         </div>
                                         <p className="text-sm font-bold text-gray-800 leading-snug line-clamp-2" title={task.title}>{task.title}</p>
                                       </div>
                                     </div>
                                   ))}
                                   {slot.freeHours > 0 && (
                                      <div className="flex-1 min-h-[30px] rounded-lg border border-dashed border-yellow-200 bg-yellow-50 flex items-center justify-center gap-1.5 text-yellow-600">
                                          <span className="text-xs font-medium">{slot.freeHours}h Free</span>
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
             <div className="flex divide-x divide-slate-200 min-h-[600px]">
                {weekDays.map((day, i) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const slot = getDayMetrics(currentUserId, i); 

                  return (
                    <div key={i} className={`flex-1 flex flex-col ${isToday ? 'bg-emerald-50/10' : ''}`}>
                      <div className={`p-5 text-center border-b border-slate-200 ${isToday ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{day.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                        <div className="text-3xl font-black">{day.getDate()}</div>
                      </div>
                      
                      <div className="p-4 space-y-3 flex-1 bg-slate-50/30 flex flex-col">
                         {slot.type === 'LEAVE' ? (
                             <div className="h-full flex flex-col items-center justify-center text-rose-500 bg-rose-50/50 rounded-xl border border-rose-100 p-6 animate-in zoom-in-95">
                                <CalendarOff className="w-10 h-10 mb-3 opacity-60" />
                                <span className="text-base font-bold text-rose-700">On Leave</span>
                                <span className="text-sm uppercase tracking-wide font-medium">{(slot.data as LeaveRequest).type}</span>
                             </div>
                         ) : slot.type === 'FREE' ? (
                             <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-70 bg-yellow-50/30">
                                <Briefcase className="w-10 h-10 opacity-50 text-yellow-600" />
                                <span className="text-sm font-bold text-yellow-700">No Allocations</span>
                                <span className="text-xs bg-white border border-yellow-200 text-yellow-600 px-3 py-1 rounded-full font-medium">9:00 - 18:00 Available</span>
                             </div>
                         ) : (
                             <>
                               {slot.tasks?.map((task: any, idx: number) => {
                                 const startHour = WORK_START + (idx * 4);
                                 const endHour = Math.min(WORK_END, startHour + task.dailyHours);
                                 return (
                                   <div key={task.id} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white ${getCategoryColor(task.category)} border-l-current animate-in slide-in-from-bottom-2`}>
                                      <div className="flex items-center gap-1.5 text-xs font-bold opacity-70 mb-1.5 uppercase text-emerald-800">
                                        <Clock className="w-3.5 h-3.5" /> {startHour}:00 - {endHour}:00
                                      </div>
                                      <div className="font-bold text-sm leading-tight mb-1">{task.title}</div>
                                      <div className="text-xs opacity-90 truncate text-emerald-700">{task.description}</div>
                                   </div>
                                 );
                               })}
                               {slot.freeHours > 0 && (
                                 <div className="flex-1 min-h-[60px] rounded-xl border-2 border-dashed border-yellow-200 bg-yellow-50/50 flex flex-col items-center justify-center text-yellow-700 opacity-80 hover:opacity-100 transition-opacity">
                                    <span className="text-sm font-bold">Free Time</span>
                                    <span className="text-xs font-medium">{slot.freeHours} hours remaining</span>
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