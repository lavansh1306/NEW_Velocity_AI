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
    const ratio = logged / (planned || 1);
    if (ratio > 1.1) return 'bg-amber-500'; 
    if (ratio >= 1) return 'bg-emerald-500';
    return 'bg-blue-500'; 
  };

  // Safe Avatar Initials Getter
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-indigo-700" />
            </div>
            {title}
        </h2>
        {/* Simple Legend */}
        <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200">
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> On Track</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Done</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Risk</span>
        </div>
      </div>

      <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {/* STICKY HEADER: High Z-Index to stay on top */}
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase w-[280px] min-w-[280px] border-r border-slate-200 sticky left-0 bg-slate-50 z-30">
                  Resource & Skills
                </th>
                {DAYS.map(day => (
                  <th key={day} className="p-4 text-center text-xs font-bold text-slate-500 uppercase min-w-[160px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => (
                <tr key={emp.name} className="group hover:bg-slate-50/50">
                  
                  {/* STICKY COLUMN: Resource Name */}
                  <td className="p-4 border-r border-slate-200 bg-white sticky left-0 z-20 group-hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Simple Avatar Circle */}
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-200">
                          {getInitials(emp.name)}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-gray-900 truncate">{emp.name}</div>
                          <div className="text-xs text-slate-500 mb-2 truncate">{emp.role}</div>
                          
                          {/* Skills Pills */}
                          <div className="flex flex-wrap gap-1">
                            {emp.skills.slice(0, 3).map(s => (
                              <span key={s} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                  </td>

                  {/* TIMELINE COLUMNS */}
                  {DAYS.map((_, dayIndex) => {
                    const dayTasks = tasks.filter(t => t.assignee === emp.name && t.day === dayIndex && !t.isCancelled);
                    const totalHours = getDailyLoad(emp.name, dayIndex);
                    
                    return (
                      <td key={dayIndex} className="p-2 align-top h-32 border-l border-dashed border-slate-100">
                        {/* Daily Total Badge */}
                        {totalHours > 0 ? (
                          <div className="flex justify-end mb-2">
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                               totalHours > 8 
                               ? 'bg-rose-50 text-rose-700 border-rose-100' 
                               : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                             }`}>
                                {totalHours}h
                             </span>
                          </div>
                        ) : (
                          <div className="h-6 mb-2"></div> /* Spacer */
                        )}
                        
                        {/* Tasks List */}
                        <div className="space-y-2">
                          {dayTasks.map(t => {
                             const latestCheckpoint = t.logs && t.logs.length > 0 ? t.logs[0].checkpoint : null;
                             const statusColor = getStatusColor(t.totalLogged || 0, t.hours);

                             return (
                              <div 
                                key={t.id} 
                                onClick={() => onTaskClick && onTaskClick(t)}
                                className="relative bg-white rounded border border-slate-200 p-2 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer"
                              >
                                {/* Left Color Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${statusColor}`} />

                                <div className="pl-2.5">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[60px]">
                                      {t.projectName}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono">
                                      {t.totalLogged}/{t.hours}h
                                    </span>
                                  </div>
                                  
                                  <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-2">
                                    {t.taskName}
                                  </p>
                                  
                                  {latestCheckpoint && !t.isCancelled && (
                                    <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-slate-50">
                                       <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                       <span className="text-[9px] text-slate-500 italic truncate">
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