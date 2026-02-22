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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-[#E7E5E4] text-[#1C1917] p-8 rounded-2xl shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-light flex items-center gap-2 tracking-tight">
            <LayoutDashboard className="w-5 h-5" /> Project Weights & Progress
          </h2>
          <p className="text-[#78716C] text-sm font-light mt-1">Configure weighted milestones. Progress updates automatically.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-light text-[#2DD4BF]">{totalVelocity}%</div>
          <div className="text-xs uppercase tracking-wider text-[#A8A29E] font-light">Total Velocity</div>
        </div>
      </div>

      <div className="grid gap-4">
        {tasks.map(task => {
          const isEditing = editingId === task.id;
          const currentTotalWeight = isEditing 
            ? tempScope.reduce((acc, i) => acc + i.weight, 0) 
            : task.scope.reduce((acc, i) => acc + i.weight, 0);

          return (
            <div key={task.id} className={`bg-white border rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all ${
              isEditing 
                ? 'border-[#2DD4BF] ring-2 ring-[#2DD4BF]/20' 
                : 'border-[#E7E5E4]'
            }`}>
              
              {/* Progress Bar Background */}
              {!isEditing && (
                <div className="absolute bottom-0 left-0 h-1.5 bg-[#E7E5E4] w-full">
                  <div className="h-full bg-[#2DD4BF] transition-all duration-1000" style={{ width: `${task.progress}%` }} />
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-light text-[#1C1917] text-lg">{task.title}</h3>
                  <p className="text-sm text-[#78716C] font-light">Assignee: {task.assignee}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                   {!isEditing ? (
                     <Button size="sm" variant="outline" onClick={() => startEditing(task)} className="gap-2 text-xs h-8 border-[#E7E5E4] hover:border-[#2DD4BF] hover:text-[#2DD4BF] text-[#78716C]">
                        <Settings2 className="w-3.5 h-3.5" /> Configure Weights
                     </Button>
                   ) : (
                     <div className="flex items-center gap-2">
                       {currentTotalWeight !== 100 && (
                         <span className="text-xs font-light text-[#C2410C] flex items-center gap-1 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                           <AlertCircle className="w-3 h-3" /> Total: {currentTotalWeight}%
                         </span>
                       )}
                       <Button size="sm" onClick={() => saveWeights(task)} className="bg-[#2DD4BF] text-[#1C1917] h-8 text-xs gap-1 hover:bg-[#1CC5B3]">
                          <Save className="w-3.5 h-3.5" /> Save Config
                       </Button>
                     </div>
                   )}
                   
                   {!isEditing && (
                     <div className="text-3xl font-light text-[#2DD4BF]">{task.progress}%</div>
                   )}
                </div>
              </div>

              {/* LIST OF TASKS & WEIGHTS */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-light text-[#A8A29E] uppercase border-b border-[#E7E5E4] pb-2 tracking-wide">
                  <span>Sub-Task Name</span>
                  <span className="w-20 text-center">Weight (%)</span>
                </div>

                {(isEditing ? tempScope : task.scope).map((item) => (
                  <div key={item.id} className="flex justify-between items-center group">
                    
                    {/* LEFT: Task Name & Status */}
                    <div className="flex items-center gap-3">
                      {!isEditing ? (
                        <button onClick={() => toggleVerifyItem(task, item.id)} className={`transition-colors ${
                          item.isCompleted 
                            ? 'text-[#2DD4BF]' 
                            : 'text-[#E7E5E4] hover:text-[#2DD4BF]'
                        }`}>
                           {item.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#E7E5E4] bg-[#FAFAF9]" />
                      )}
                      
                      <span className={`text-sm font-light ${
                        item.isCompleted && !isEditing 
                          ? 'text-[#2DD4BF] line-through decoration-[#2DD4BF] opacity-60' 
                          : 'text-[#1C1917]'
                      }`}>
                        {item.name}
                      </span>
                    </div>

                    {/* RIGHT: Weight Input or Badge */}
                    <div className="w-20 flex justify-center">
                      {isEditing ? (
                        <div className="relative">
                          <input 
                            type="number" 
                            className="w-16 p-1 text-center text-sm font-light border border-[#E7E5E4] rounded focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] outline-none"
                            value={item.weight}
                            onChange={(e) => handleWeightChange(item.id, e.target.value)}
                          />
                          <span className="absolute right-4 top-1.5 text-xs text-[#A8A29E] pointer-events-none">%</span>
                        </div>
                      ) : (
                        <span className="text-xs font-light text-[#78716C] bg-[#E7E5E4] px-2 py-1 rounded">
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