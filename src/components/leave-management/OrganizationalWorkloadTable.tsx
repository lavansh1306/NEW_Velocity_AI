import React from 'react';
import { Card } from '../ui/card';
import { CheckCircle2, Briefcase, User } from 'lucide-react';
import { Task, EmployeeProfile } from './types';
import { DAYS } from './data';

interface OrganizationalWorkloadProps {
  tasks: Task[];
  employees: EmployeeProfile[];
  onTaskClick?: (task: Task) => void;
  title?: string;
  className?: string;
}

export const OrganizationalWorkloadTable: React.FC<OrganizationalWorkloadProps> = ({ 
  tasks, 
  employees, 
  onTaskClick,
  title = "Organizational Workload",
  className
}) => {
  
  const getDailyLoad = (employeeName: string, day: number) => {
    return tasks
      .filter(t => t.assignee === employeeName && t.day === day && !t.isCancelled)
      .reduce((sum, t) => sum + t.hours, 0);
  };

  const getStatusColor = (logged: number, planned: number) => {
    const ratio = logged / planned;
    if (ratio > 1.1) return 'bg-amber-500'; 
    if (ratio >= 1) return 'bg-emerald-500';
    return 'bg-blue-500'; 
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
            {title}
        </h2>
        {/* Simple Legend */}
        <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> In Progress</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Completed</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Overtime</span>
        </div>
      </div>

      <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 backdrop-blur-sm">
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase w-72 border-r border-slate-200 sticky left-0 bg-slate-50 z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                  Resource & Skills
                </th>
                {DAYS.map(day => (
                  <th key={day} className="p-4 text-center text-xs font-bold text-slate-500 uppercase min-w-[180px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => (
                <tr key={emp.name} className="group hover:bg-slate-50/50 transition-colors">
                  {/* Employee Info Column */}
                  <td className="p-4 border-r border-slate-200 bg-white sticky left-0 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.02)]">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-slate-100 border border-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm shrink-0">
                          {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-900 truncate">{emp.name}</div>
                          <div className="text-[11px] text-slate-500 font-medium mb-2 truncate">{emp.role}</div>
                          
                          {/* Skills Pills */}
                          <div className="flex flex-wrap gap-1.5">
                            {emp.skills.slice(0, 3).map(s => (
                              <span key={s} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200 font-medium whitespace-nowrap">
                                {s}
                              </span>
                            ))}
                            {emp.skills.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md border border-slate-100 font-medium">
                                +{emp.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                  </td>

                  {/* Days Columns */}
                  {DAYS.map((_, dayIndex) => {
                    const dayTasks = tasks.filter(t => t.assignee === emp.name && t.day === dayIndex && !t.isCancelled);
                    const totalHours = getDailyLoad(emp.name, dayIndex);
                    const isOverloaded = totalHours > 10;
                    
                    return (
                      <td key={dayIndex} className="p-2 align-top h-32 border-l border-dashed border-slate-100">
                        {totalHours > 0 ? (
                          <div className="flex justify-end mb-2">
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${
                               isOverloaded 
                               ? 'bg-rose-50 text-rose-600 border-rose-100' 
                               : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                             }`}>
                                {totalHours}h
                             </span>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          {dayTasks.map(t => {
                             const latestCheckpoint = t.logs && t.logs.length > 0 ? t.logs[0].checkpoint : null;
                             const statusColor = getStatusColor(t.totalLogged || 0, t.hours);

                             return (
                              <div 
                                key={t.id} 
                                onClick={() => onTaskClick && onTaskClick(t)}
                                className="group/card relative bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer overflow-hidden"
                              >
                                {/* Status Strip (Left Border) */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor}`} />

                                <div className="pl-2">
                                  <div className="flex justify-between items-start mb-1 gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                      {t.projectName}
                                    </span>
                                    {/* Hours - Only high contrast on hover */}
                                    <span className="text-[9px] text-slate-300 font-mono group-hover/card:text-indigo-500 transition-colors">
                                      {t.totalLogged}/{t.hours}h
                                    </span>
                                  </div>
                                  
                                  <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                                    {t.taskName}
                                  </p>
                                  
                                  {/* Hover Detail: Checkpoint */}
                                  {latestCheckpoint && !t.isCancelled && (
                                    <div className="hidden group-hover/card:flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                       <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                       <span className="text-[10px] text-slate-600 italic truncate">
                                         {latestCheckpoint}
                                       </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                             );
                          })}
                        </div>
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
  );
};