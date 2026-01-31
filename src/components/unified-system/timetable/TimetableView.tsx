import React, { useState } from 'react';
import { UnifiedProject, UnifiedEmployee, LeaveRequest } from '../types';
import { ChevronLeft, ChevronRight, Calendar, Clock, Briefcase, CalendarOff } from 'lucide-react';
import { Button } from '../../ui/button';

interface TimetableViewProps {
  userRole: 'MANAGER' | 'EMPLOYEE';
  currentUserId: number;
  projects: UnifiedProject[];
  employees: UnifiedEmployee[];
  leaveRequests: LeaveRequest[]; // <--- NEW PROP
}

export const TimetableView: React.FC<TimetableViewProps> = ({
  userRole,
  currentUserId,
  projects,
  employees,
  leaveRequests, // <--- Receive Leave Data
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

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

  // --- NEW HELPER: CHECK FOR LEAVE ---
  const getLeaveForEmployee = (empId: number, date: Date) => {
    // Normalize date to compare dates only (ignore time)
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    return leaveRequests.find(req => {
      if (req.employeeId !== empId || req.status !== 'APPROVED') return false;
      
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      
      // Reset times for accurate comparison
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);

      return checkDate >= start && checkDate <= end;
    });
  };

  const getTasksForEmployee = (empId: number) => {
    const activeAssignments = projects.filter(p => 
      p.status === 'ACTIVE' && p.assignedTeamIds.includes(empId)
    );
    return activeAssignments.length > 0 ? activeAssignments[0] : null;
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          {userRole === 'MANAGER' ? 'Organizational Workload' : 'My Weekly Schedule'}
        </h2>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" onClick={() => setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() - 7)))}>
             <ChevronLeft className="w-4 h-4" />
           </Button>
           <span className="text-sm font-medium text-slate-600 w-40 text-center bg-white border border-slate-200 rounded py-1">
             {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
           </span>
           <Button variant="ghost" size="sm" onClick={() => setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() + 7)))}>
             <ChevronRight className="w-4 h-4" />
           </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* ================= MANAGER VIEW ================= */}
        {userRole === 'MANAGER' && (
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-white text-left">
                <th className="p-4 w-64 text-xs font-bold text-slate-500 uppercase sticky left-0 bg-white z-20 border-r border-b border-slate-200">
                  Resource Name
                </th>
                {weekDays.map((day, i) => (
                  <th key={i} className="p-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 border-r border-slate-100 last:border-r-0 min-w-[140px] text-center bg-slate-50">
                    {day.toLocaleDateString('en-US', { weekday: 'long' })}
                    <div className="text-[10px] text-slate-400 font-normal">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const assignedProject = getTasksForEmployee(emp.id);
                
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* Employee Info */}
                    <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-200 border-b border-slate-100 group-hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200 shadow-sm">
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{emp.name}</div>
                          <div className="text-[10px] text-slate-500">{emp.role}</div>
                        </div>
                      </div>
                    </td>

                    {/* Schedule Cells */}
                    {weekDays.map((day, i) => {
                      // 1. Check for Leave FIRST
                      const leave = getLeaveForEmployee(emp.id, day);

                      return (
                        <td key={i} className="p-2 border-r border-slate-100 border-b border-slate-100 h-20 align-middle">
                          {leave ? (
                            // --- RENDER LEAVE BLOCK ---
                            <div className="w-full h-full rounded-lg border border-red-200 bg-red-50 p-2 shadow-sm flex flex-col justify-center items-center gap-1 opacity-90">
                               <CalendarOff className="w-4 h-4 text-red-400" />
                               <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">On Leave</span>
                               <span className="text-[9px] text-red-400">{leave.type}</span>
                            </div>
                          ) : assignedProject ? (
                            // --- RENDER PROJECT BLOCK ---
                            <div className={`w-full h-full rounded-lg border p-2 shadow-sm flex flex-col justify-center gap-1 cursor-pointer hover:shadow-md transition-all ${getCategoryColor(assignedProject.category)}`}>
                              <div className="font-bold text-xs truncate leading-tight">{assignedProject.title}</div>
                              <div className="flex items-center justify-between opacity-80">
                                  <span className="text-[10px] uppercase font-bold tracking-wider">{assignedProject.category.split(' ')[0]}</span>
                                  <span className="text-[10px] bg-white/50 px-1 rounded">8h</span>
                              </div>
                            </div>
                          ) : (
                            // --- RENDER AVAILABLE ---
                            <div className="w-full h-full rounded-lg border border-dashed border-slate-100 flex items-center justify-center">
                              <span className="text-[10px] text-slate-300 font-medium">Available</span>
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
           <div className="flex divide-x divide-slate-200">
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const assignedProject = getTasksForEmployee(currentUserId);
                const leave = getLeaveForEmployee(currentUserId, day);

                return (
                  <div key={i} className={`flex-1 min-h-[400px] flex flex-col ${isToday ? 'bg-indigo-50/10' : ''}`}>
                    <div className={`p-4 text-center border-b border-slate-200 ${isToday ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>
                      <div className="text-xs font-bold uppercase tracking-widest opacity-80">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-2xl font-black">{day.getDate()}</div>
                    </div>
                    
                    <div className="p-3 space-y-3 flex-1 bg-slate-50/50">
                       {leave ? (
                         // --- LEAVE OVERLAY ---
                         <div className="h-full flex flex-col items-center justify-center text-red-400 bg-red-50/50 rounded-lg border border-red-100 p-4">
                            <CalendarOff className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-sm font-bold text-red-600">On Leave</span>
                            <span className="text-xs uppercase tracking-wide">{leave.type}</span>
                         </div>
                       ) : assignedProject ? (
                         <>
                           <div className={`p-3 rounded-lg border-l-4 shadow-sm bg-white ${getCategoryColor(assignedProject.category)} border-l-current`}>
                              <div className="flex items-center gap-1 text-[10px] font-bold opacity-70 mb-1 uppercase">
                                <Clock className="w-3 h-3" /> 09:00 - 13:00
                              </div>
                              <div className="font-bold text-sm leading-tight">{assignedProject.title}</div>
                              <div className="text-xs mt-1 opacity-80">Core Development</div>
                           </div>
                           <div className={`p-3 rounded-lg border-l-4 shadow-sm bg-white ${getCategoryColor(assignedProject.category)} border-l-current opacity-90`}>
                              <div className="flex items-center gap-1 text-[10px] font-bold opacity-70 mb-1 uppercase">
                                <Clock className="w-3 h-3" /> 14:00 - 18:00
                              </div>
                              <div className="font-bold text-sm leading-tight">{assignedProject.title}</div>
                              <div className="text-xs mt-1 opacity-80">Testing & Review</div>
                           </div>
                         </>
                       ) : (
                         <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                            <Briefcase className="w-8 h-8 opacity-50" />
                            <span className="text-xs font-bold">No Allocations</span>
                         </div>
                       )}
                    </div>
                  </div>
                );
              })}
           </div>
        )}

      </div>
    </div>
  );
};