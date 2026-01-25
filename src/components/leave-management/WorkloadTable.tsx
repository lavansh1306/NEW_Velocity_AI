import React from 'react';
import { Card } from '../ui/card';
import { CheckCircle2, Briefcase, Plus, FolderGit2 } from 'lucide-react';
import { Task, EmployeeProfile } from './types';
import { DAYS } from './data';

interface WorkloadTableProps {
  tasks: Task[];
  employees: EmployeeProfile[];
  persona: 'manager' | 'employee';
  onTaskClick: (task: Task) => void;
}

export const WorkloadTable: React.FC<WorkloadTableProps> = ({ tasks, employees, persona, onTaskClick }) => {
  const isManager = persona === 'manager';

  // --- HELPER: Compute Rows based on Persona ---
  // Manager -> Rows are Employees
  // Employee -> Rows are Projects
  const managerRows = employees;
  const employeeRows = Array.from(new Set(tasks.map(t => t.projectName))).sort();

  // --- HELPER: Get Tasks for a specific cell ---
  const getCellData = (rowId: string, dayIndex: number) => {
    if (isManager) {
      // RowID is Employee Name
      return tasks.filter(t => t.assignee === rowId && t.day === dayIndex && !t.isCancelled);
    } else {
      // RowID is Project Name
      // Note: 'tasks' prop is already filtered to the current user by the parent component
      return tasks.filter(t => t.projectName === rowId && t.day === dayIndex && !t.isCancelled);
    }
  };

  const getDailyHours = (rowId: string, dayIndex: number) => {
    const cellTasks = getCellData(rowId, dayIndex);
    return cellTasks.reduce((sum, t) => sum + t.hours, 0);
  };

  const getProgressColor = (logged: number, planned: number) => {
    const ratio = logged / planned;
    if (ratio > 1.1) return 'bg-amber-500'; 
    if (ratio >= 1) return 'bg-emerald-500';
    return 'bg-blue-500'; 
  };

  const title = isManager ? "Organizational Workload" : "My Timesheet Matrix";

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <Briefcase className="text-indigo-600" /> {title}
      </h2>

      <Card className="rounded-xl border-none shadow-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                {/* DYNAMIC HEADER */}
                <th className="p-4 text-left text-[10px] font-black text-gray-400 uppercase w-48 border-r sticky left-0 bg-slate-50 z-10">
                  {isManager ? "Resource / Skill" : "Project / Context"}
                </th>
                {DAYS.map(day => (
                  <th key={day} className="p-4 text-center text-[10px] font-black text-gray-400 uppercase min-w-[140px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* MANAGER VIEW: Iterate Employees */}
              {isManager && managerRows.map(emp => (
                <tr key={emp.name} className="border-b border-gray-50 align-top">
                  <td className="p-4 border-r bg-slate-50/30 sticky left-0 z-10 backdrop-blur-sm">
                      <div className="font-bold text-sm text-gray-800">{emp.name}</div>
                      <div className="text-[10px] text-gray-500 font-medium mb-1">{emp.role}</div>
                      <div className="flex flex-wrap gap-1">
                        {emp.skills.slice(0, 3).map(s => (
                          <span key={s} className="text-[9px] px-1 bg-white border rounded text-slate-500">{s}</span>
                        ))}
                      </div>
                  </td>
                  {renderDayCells(emp.name, getDailyHours, getCellData, onTaskClick, isManager)}
                </tr>
              ))}

              {/* EMPLOYEE VIEW: Iterate Projects */}
              {!isManager && employeeRows.map(project => (
                <tr key={project} className="border-b border-gray-50 align-top">
                   <td className="p-4 border-r bg-slate-50 sticky left-0 z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <FolderGit2 className="w-4 h-4 text-indigo-500" />
                        <span className="font-bold text-sm text-indigo-900 leading-tight">{project}</span>
                      </div>
                   </td>
                   {renderDayCells(project, getDailyHours, getCellData, onTaskClick, isManager)}
                </tr>
              ))}
              
              {/* Empty State for Employees with no tasks */}
              {!isManager && employeeRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-sm italic">
                    No active projects assigned this week.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// --- HELPER COMPONENT FOR CELLS (Reduces code duplication) ---
const renderDayCells = (
  rowId: string, 
  getDailyHours: (id: string, day: number) => number,
  getCellData: (id: string, day: number) => Task[],
  onTaskClick: (t: Task) => void,
  isManager: boolean
) => {
  return DAYS.map((_, dayIndex) => {
    const totalHours = getDailyHours(rowId, dayIndex);
    const dayTasks = getCellData(rowId, dayIndex);
    const isOverloaded = totalHours > 10;
    
    // Only show "Total Hours" pill if there is actually work
    const showTotal = totalHours > 0;

    return (
      <td key={dayIndex} className="p-2 align-top h-32 hover:bg-slate-50 transition-colors">
        {showTotal && (
          <div className="flex justify-between items-center mb-2 px-1">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isOverloaded && isManager ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                {totalHours}h TOTAL
            </span>
          </div>
        )}
        
        <div className="space-y-2">
          {dayTasks.map(t => {
              const progressPercent = Math.min(100, ((t.totalLogged || 0) / t.hours) * 100);
              const latestCheckpoint = t.logs && t.logs.length > 0 ? t.logs[0].checkpoint : null;

              return (
              <div 
                key={t.id} 
                onClick={() => onTaskClick(t)}
                className={`p-3 rounded-lg border relative transition-all shadow-sm group overflow-hidden
                ${t.isCancelled ? 'bg-red-50 border-red-200 opacity-60 grayscale' : 
                  'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer'}
              `}>
                {/* Progress Bar */}
                {!t.isCancelled && (
                  <div 
                    className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${
                      // Re-implemented color logic inline for simplicity in helper
                      ((t.totalLogged||0)/t.hours) > 1.1 ? 'bg-amber-500' : ((t.totalLogged||0)/t.hours) >= 1 ? 'bg-emerald-500' : 'bg-blue-500'
                    }`} 
                    style={{ width: `${progressPercent}%` }}
                  />
                )}

                <div className="flex justify-between font-black uppercase tracking-tight mb-1">
                  {/* For Manager: Show Project Name. For Employee: Show 'Task' label since Project is Row Header */}
                  <span className="truncate w-24 text-slate-700 text-[10px]">
                    {isManager ? t.projectName : "Task Item"}
                  </span>
                  <span className="text-slate-400 text-[9px]">{t.totalLogged || 0}/{t.hours}h</span>
                </div>
                <p className="text-[11px] font-bold text-indigo-900 mb-1 leading-tight">{t.taskName}</p>
                
                {latestCheckpoint && !t.isCancelled && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-[9px] text-slate-500 italic leading-tight line-clamp-2">
                        "{latestCheckpoint}"
                      </span>
                  </div>
                )}
                
                {!isManager && !t.isCancelled && (
                  <div className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 transition-opacity">
                    <div className="bg-indigo-600 text-white p-1 rounded-md shadow-sm">
                      <Plus className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </div>
              );
          })}
        </div>
      </td>
    );
  });
};