import React, { useState } from 'react';
import { SmartTask, ScopeItem } from './types';
import { CheckCircle2, Circle, Clock, LayoutDashboard, Settings2, Save, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface ManagerViewProps {
  tasks: SmartTask[];
  onUpdateTask: (taskId: number, updates: Partial<SmartTask>) => void;
}

export const ManagerView: React.FC<ManagerViewProps> = ({ tasks, onUpdateTask }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Temp state for editing weights
  const [tempScope, setTempScope] = useState<ScopeItem[]>([]);

  const startEditing = (task: SmartTask) => {
    setEditingId(task.id);
    setTempScope(JSON.parse(JSON.stringify(task.scope))); // Deep copy
  };

  const handleWeightChange = (itemId: string, newWeight: string) => {
    const val = parseInt(newWeight) || 0;
    setTempScope(prev => prev.map(item => item.id === itemId ? { ...item, weight: val } : item));
  };

  const saveWeights = (task: SmartTask) => {
    // Recalculate progress based on new weights
    const newProgress = tempScope
      .filter(i => i.isCompleted)
      .reduce((acc, curr) => acc + curr.weight, 0);

    onUpdateTask(task.id, {
      scope: tempScope,
      progress: Math.min(100, newProgress),
      lastUpdate: "Manager updated task weights configuration."
    });
    setEditingId(null);
  };

  const toggleVerifyItem = (task: SmartTask, itemId: string) => {
    const newScope = task.scope.map(item => 
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    
    const newProgress = newScope
      .filter(i => i.isCompleted)
      .reduce((acc, curr) => acc + curr.weight, 0);

    onUpdateTask(task.id, {
      scope: newScope,
      progress: Math.min(100, newProgress), // Cap at 100
      lastUpdate: `Manager verification update.`
    });
  };

  const totalVelocity = Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / (tasks.length || 1));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header */}
      <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-light flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" /> Project Weights & Progress
          </h2>
          <p className="text-indigo-200 text-sm">Configure weighted milestones. Progress updates automatically.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black">{totalVelocity}%</div>
          <div className="text-xs uppercase tracking-wider text-indigo-300">Total Velocity</div>
        </div>
      </div>

      <div className="grid gap-4">
        {tasks.map(task => {
          const isEditing = editingId === task.id;
          const currentTotalWeight = isEditing 
            ? tempScope.reduce((acc, i) => acc + i.weight, 0) 
            : task.scope.reduce((acc, i) => acc + i.weight, 0);

          return (
            <div key={task.id} className={`bg-white border rounded-xl p-6 shadow-sm relative overflow-hidden transition-all ${isEditing ? 'border-indigo-400 ring-4 ring-indigo-50/50' : 'border-slate-200'}`}>
              
              {/* Progress Bar Background */}
              {!isEditing && (
                <div className="absolute bottom-0 left-0 h-1.5 bg-indigo-100 w-full">
                  <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${task.progress}%` }} />
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-light text-gray-900 text-lg">{task.title}</h3>
                  <p className="text-sm text-slate-500">Assignee: {task.assignee}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                   {!isEditing ? (
                     <Button size="sm" variant="outline" onClick={() => startEditing(task)} className="gap-2 text-xs h-8 border-slate-200 hover:border-indigo-300 hover:text-indigo-600">
                        <Settings2 className="w-3.5 h-3.5" /> Configure Weights
                     </Button>
                   ) : (
                     <div className="flex items-center gap-2">
                       {currentTotalWeight !== 100 && (
                         <span className="text-xs font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded">
                           <AlertCircle className="w-3 h-3" /> Total: {currentTotalWeight}%
                         </span>
                       )}
                       <Button size="sm" onClick={() => saveWeights(task)} className="bg-indigo-600 h-8 text-xs gap-1">
                          <Save className="w-3.5 h-3.5" /> Save Config
                       </Button>
                     </div>
                   )}
                   
                   {!isEditing && (
                     <div className="text-3xl font-black text-indigo-600">{task.progress}%</div>
                   )}
                </div>
              </div>

              {/* LIST OF TASKS & WEIGHTS */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-2">
                  <span>Sub-Task Name</span>
                  <span className="w-20 text-center">Weight (%)</span>
                </div>

                {(isEditing ? tempScope : task.scope).map((item) => (
                  <div key={item.id} className="flex justify-between items-center group">
                    
                    {/* LEFT: Task Name & Status */}
                    <div className="flex items-center gap-3">
                      {!isEditing ? (
                        <button onClick={() => toggleVerifyItem(task, item.id)} className={`transition-colors ${item.isCompleted ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}>
                           {item.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-slate-50" />
                      )}
                      
                      <span className={`text-sm font-medium ${item.isCompleted && !isEditing ? 'text-emerald-700 line-through decoration-emerald-300' : 'text-slate-700'}`}>
                        {item.name}
                      </span>
                    </div>

                    {/* RIGHT: Weight Input or Badge */}
                    <div className="w-20 flex justify-center">
                      {isEditing ? (
                        <div className="relative">
                          <input 
                            type="number" 
                            className="w-16 p-1 text-center text-sm font-bold border border-slate-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            value={item.weight}
                            onChange={(e) => handleWeightChange(item.id, e.target.value)}
                          />
                          <span className="absolute right-4 top-1.5 text-xs text-slate-400 pointer-events-none">%</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {item.weight}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};