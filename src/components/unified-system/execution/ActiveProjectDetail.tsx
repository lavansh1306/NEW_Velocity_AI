import React, { useState } from 'react';
import { UnifiedProject, UnifiedEmployee } from '../types';
import { BurnoutMonitor } from './BurnoutMonitor';
import { Button } from '../../ui/button';
import { ArrowLeft, CheckCircle2, MoreHorizontal, Clock, Briefcase, Wrench, FlaskConical, Layers } from 'lucide-react';

interface ActiveProjectDetailProps {
  project: UnifiedProject;
  team: UnifiedEmployee[];
  onBack: () => void;
}

// Helper for Icon consistency
const getCategoryIcon = (cat: string) => {
  switch(cat) {
    case 'Client Deliverable': return <Briefcase className="w-3 h-3" />;
    case 'Internal Tool': return <Wrench className="w-3 h-3" />;
    case 'R&D / POC': return <FlaskConical className="w-3 h-3" />;
    default: return <Layers className="w-3 h-3" />;
  }
};

const getCategoryStyle = (cat: string) => {
  switch(cat) {
    case 'Client Deliverable': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Internal Tool': return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'R&D / POC': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Maintenance': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-slate-100 text-slate-600';
  }
};

export const ActiveProjectDetail: React.FC<ActiveProjectDetailProps> = ({ project, team, onBack }) => {
  const [tasks, setTasks] = useState([
    { id: 1, title: `Initialize ${project.requiredSkills[0] || 'Core'} Architecture`, status: 'DONE', assignee: team[0]?.id },
    { id: 2, title: "Database Schema & Migration Scripts", status: 'IN_PROGRESS', progress: 65, assignee: team[0]?.id },
    { id: 3, title: "API Endpoint Security Integration", status: 'TODO', progress: 0, assignee: team[1]?.id },
    { id: 4, title: "Frontend Component Library Setup", status: 'TODO', progress: 0, assignee: team[1]?.id || team[0]?.id },
  ]);

  const toggleTaskStatus = (taskId: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      if (t.status === 'TODO') return { ...t, status: 'IN_PROGRESS', progress: 25 };
      if (t.status === 'IN_PROGRESS') return { ...t, status: 'DONE', progress: 100 };
      return t;
    }));
  };

  const totalProgress = Math.round(tasks.reduce((acc, t) => acc + (t.status === 'DONE' ? 100 : t.progress || 0), 0) / tasks.length);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <h2 className="text-2xl font-bold text-slate-900">{project.title}</h2>
               {/* CATEGORY BADGE */}
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 border ${getCategoryStyle(project.category)}`}>
                 {getCategoryIcon(project.category)}
                 {project.category}
               </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE
              </span>
              <span>•</span>
              <span>Started: Today</span>
            </div>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-3xl font-black text-indigo-600">{totalProgress}%</div>
          <div className="text-xs uppercase font-bold text-slate-400">Completion</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COL: TASK TRACKER */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Live Task Board</span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
            </h3>

            <div className="space-y-3">
              {tasks.map(task => {
                const assignee = team.find(e => e.id === task.assignee);
                return (
                  <div 
                    key={task.id} 
                    onClick={() => toggleTaskStatus(task.id)}
                    className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center border transition-colors
                        ${task.status === 'DONE' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent group-hover:border-indigo-400'}
                      `}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className={`font-medium ${task.status === 'DONE' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {assignee && (
                            <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              {assignee.name}
                            </span>
                          )}
                          {task.status === 'IN_PROGRESS' && (
                            <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                              {task.progress}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {task.status !== 'DONE' && (
                        <div className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to update
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI EOD LOGS */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">AI Verified Updates</h4>
             <div className="flex gap-3 text-sm">
               <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">AI</div>
               <div className="bg-white p-3 rounded-r-xl rounded-bl-xl border border-slate-200 shadow-sm w-full">
                  <p className="text-slate-700">I analyzed <strong>{team[0]?.name || 'a team member'}'s</strong> recent commit. The database migration scripts passed validation. Progress updated.</p>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                     <Clock className="w-3 h-3" /> Just now
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* RIGHT COL: BURNOUT MONITOR */}
        <div className="lg:col-span-1">
          <BurnoutMonitor team={team} />
        </div>

      </div>
    </div>
  );
};