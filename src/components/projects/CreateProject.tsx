import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, ChevronDown, Check, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCurrentOrgId } from '@/lib/orgContext';
import { useProjects } from '@/hooks/useProjects'; // <--- NEW HOOK
import { useLeaveManagementData } from '@/hooks/useLeaveManagementData'; // Reuse for members list

// --- Helper: Key Generator ---
function deriveProjectKey(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  let key = words.length === 1 ? words[0].substring(0, 5) : words.map(w => w[0]).join('').substring(0, 5);
  return key.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default function CreateProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // 1. Logic Hooks
  const { commitProject, isLoading: isSubmitting } = useProjects();
  const { employees, isLoading: loadingMembers } = useLeaveManagementData();

  // 2. Form State
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [projectLeadId, setProjectLeadId] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Task State (Manual Entry)
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Database Setup', hours: 4 },
    { id: 2, name: 'Initial Design', hours: 8 },
  ]);

  // 3. Auto-Select Lead
  useEffect(() => {
    if (employees.length > 0 && !projectLeadId) {
      setProjectLeadId(employees[0].id);
    }
  }, [employees, projectLeadId]);

  // 4. Handlers
  const handleAddTask = () => setTasks(prev => [...prev, { id: Date.now(), name: '', hours: 0 }]);
  const handleDeleteTask = (id: number) => setTasks(prev => prev.filter(t => t.id !== id));
  
  const handleTaskChange = (id: number, field: string, value: string | number) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  // 5. Submission (Using Hook)
  const handleSubmit = async () => {
    if (!projectName.trim()) {
      toast({ title: 'Validation Error', description: 'Project name is required.', variant: 'destructive' });
      return;
    }

    const orgId = getCurrentOrgId();
    if (!orgId) {
      toast({ title: 'Error', description: 'Organization context missing.', variant: 'destructive' });
      return;
    }

    // Prepare payload for hook
    const successProjectId = await commitProject(orgId, {
      description: description || `Project: ${projectName}`, // Fallback description
      selectedTeamIds: selectedMembers,
      tasks: tasks.filter(t => t.name.trim()).map(t => ({
        id: String(t.id),
        task: t.name,
        estimatedHours: Number(t.hours) || 0
      }))
    });

    if (successProjectId) {
      navigate('/projects');
    }
  };

  return (
    <VelocityAISidebar>
      <div className="bg-[#FAFAF9] min-h-screen p-8 md:p-12 font-['Inter',sans-serif]">
        <div className="max-w-[1400px] mx-auto">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate('/projects')} className="p-2 hover:bg-[#E7E5E4] rounded-full transition-colors text-[#78716C]">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-light text-[#1C1917] tracking-tight">Create Manual Project</h1>
          </div>

          <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

              {/* Left Column: Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Project Name *</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Mobile App Redesign"
                    className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C1917]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Goals and objectives..."
                    className="w-full h-32 px-4 py-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C1917] resize-none"
                  />
                </div>

                {/* Tasks Table */}
                <div className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-[#1C1917]">Initial Tasks</h3>
                    <Button onClick={handleAddTask} variant="outline" size="sm" className="h-8 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> Add Task
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex gap-3 items-center">
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) => handleTaskChange(task.id, 'name', e.target.value)}
                          placeholder="Task name"
                          className="flex-1 h-10 px-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          value={task.hours}
                          onChange={(e) => handleTaskChange(task.id, 'hours', e.target.value)}
                          placeholder="Hrs"
                          className="w-20 h-10 px-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg text-sm text-center"
                        />
                        <button onClick={() => handleDeleteTask(task.id)} className="text-rose-400 hover:text-rose-600 p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Team */}
              <div className="lg:col-span-1 border-l border-[#E7E5E4] lg:pl-12">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-medium text-[#1C1917]">Assign Team</h3>
                  <span className="text-xs text-[#78716C] bg-[#F5F5F4] px-2 py-1 rounded-md">{selectedMembers.length} selected</span>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {loadingMembers ? (
                    <div className="text-center py-4 text-xs text-[#A8A29E]">Loading team...</div>
                  ) : (
                    employees.map(emp => {
                      const isSelected = selectedMembers.includes(emp.id);
                      return (
                        <div
                          key={emp.id}
                          onClick={() => toggleMember(emp.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                            isSelected ? 'bg-[#FAFAF9] border-[#1C1917]' : 'bg-white border-transparent hover:bg-[#FAFAF9]'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {emp.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#1C1917]">{emp.name}</p>
                            <p className="text-xs text-[#A8A29E]">{emp.role}</p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#1C1917]" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#E7E5E4]">
              <Button variant="ghost" onClick={() => navigate('/projects')} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !projectName.trim()}
                className="bg-[#1C1917] text-white px-8 rounded-xl"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Project
              </Button>
            </div>
          </div>
        </div>
      </div>
    </VelocityAISidebar>
  );
}