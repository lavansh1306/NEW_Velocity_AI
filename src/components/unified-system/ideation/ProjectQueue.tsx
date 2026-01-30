import React from 'react';
import { UnifiedProject } from '../types';
import { Card } from '../../ui/card';
import { Clock, Layers, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';

interface ProjectQueueProps {
  projects: UnifiedProject[];
  onAllocateStart: (project: UnifiedProject) => void;
  onDelete: (id: string) => void;
}

export const ProjectQueue: React.FC<ProjectQueueProps> = ({ projects, onAllocateStart, onDelete }) => {
  const queuedProjects = projects.filter(p => p.status === 'QUEUED');

  if (queuedProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <Layers className="w-10 h-10 text-slate-300 mb-2" />
        <p className="text-slate-500 font-medium">No projects in queue</p>
        <p className="text-xs text-slate-400">Draft a project to get started</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {queuedProjects.map(project => (
        <Card key={project.id} className="p-5 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow relative group">
          
          <div className="flex justify-between items-start mb-2">
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
               project.priority === 'High' ? 'bg-red-50 text-red-600' : 
               project.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
             }`}>
               {project.priority} Priority
             </span>
             <button 
               onClick={() => onDelete(project.id)}
               className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
             >
               <Trash2 className="w-4 h-4" />
             </button>
          </div>

          <h3 className="font-bold text-gray-900 mb-1">{project.title}</h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">{project.description}</p>

          <div className="flex flex-wrap gap-1 mb-4">
            {project.requiredSkills.slice(0, 3).map(s => (
              <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                {s}
              </span>
            ))}
            {project.requiredSkills.length > 3 && <span className="text-[10px] text-slate-400">+{project.requiredSkills.length - 3}</span>}
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
             <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
               <Clock className="w-3 h-3" /> {project.estimatedHours}h
             </div>
             
             <Button 
               size="sm" 
               onClick={() => onAllocateStart(project)}
               className="h-8 text-xs bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
             >
               Assign Team <ArrowRight className="w-3 h-3 ml-1" />
             </Button>
          </div>

        </Card>
      ))}
    </div>
  );
};