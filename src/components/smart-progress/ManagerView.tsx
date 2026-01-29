import React from 'react';
import { SmartTask } from './types';
import { CheckCircle2, Circle, Clock, LayoutDashboard } from 'lucide-react';

interface ManagerViewProps {
  tasks: SmartTask[];
}

export const ManagerView: React.FC<ManagerViewProps> = ({ tasks }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" /> Live Project Overview
          </h2>
          <p className="text-indigo-200 text-sm">Updates occur automatically as EOD reports are processed.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black">{tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length}%</div>
          <div className="text-xs uppercase tracking-wider text-indigo-300">Total Velocity</div>
        </div>
      </div>

      <div className="grid gap-4">
        {tasks.map(task => (
          <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden group">
            
            {/* Background Progress Bar (Subtle) */}
            <div 
              className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-1000" 
              style={{ width: `${task.progress}%` }} 
            />

            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{task.title}</h3>
                <p className="text-sm text-slate-500">Assignee: <span className="font-semibold text-slate-700">{task.assignee}</span></p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${task.progress === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                  {task.progress}% Done
                </span>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" /> {task.lastUpdatedTime || "No updates"}
                </div>
              </div>
            </div>

            {/* Scope Visualization */}
            <div className="flex flex-wrap gap-2 mb-4">
              {task.scope.map((item, idx) => {
                const isDone = task.completedScope.includes(item);
                return (
                  <span key={idx} className={`text-xs px-2 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                    isDone 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 dashed'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                    {item}
                  </span>
                );
              })}
            </div>

            {/* Agent Log */}
            <div className="text-xs bg-slate-50 p-2 rounded text-slate-500 italic border-l-2 border-slate-300">
              🤖 Agent Log: {task.lastUpdate || "Waiting for employee input..."}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};