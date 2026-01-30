import React, { useState, useEffect } from 'react';
import { DraftProjectDialog } from './ideation/DraftProjectDialog';
import { ProjectQueue } from './ideation/ProjectQueue';
import { AllocatorEngine } from './allocator/AllocatorEngine';
import { ActiveProjectDetail } from './execution/ActiveProjectDetail';
import { UnifiedProject, UnifiedEmployee } from './types';
import { fetchRawCSV } from '../ml-model/RecommendationEngine';
import { Button } from '../ui/button';
import { Plus, LayoutGrid, CheckCircle2 } from 'lucide-react';

export default function UnifiedView() {
  // --- SYSTEM DATA STATE ---
  const [employees, setEmployees] = useState<UnifiedEmployee[]>([]);
  const [projects, setProjects] = useState<UnifiedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- UI STATE: IDEATION ---
  const [isDraftOpen, setIsDraftOpen] = useState(false);

  // --- UI STATE: ALLOCATION ---
  const [isAllocatorOpen, setIsAllocatorOpen] = useState(false);
  const [projectToAllocate, setProjectToAllocate] = useState<UnifiedProject | null>(null);

  // --- UI STATE: EXECUTION ---
  const [selectedActiveProject, setSelectedActiveProject] = useState<UnifiedProject | null>(null);

  // 1. INITIALIZE SYSTEM (Load Data)
  useEffect(() => {
    const initSystem = async () => {
      try {
        const csvUrl = new URL('../ml-model/datasets/master_employee_task_report.csv', import.meta.url).href;
        const rawData = await fetchRawCSV(csvUrl);

        const uniqueEmps = new Map<string, UnifiedEmployee>();
        
        rawData.forEach((row: any, idx: number) => {
          if (!row.Assignee) return;
          if (!uniqueEmps.has(row.Assignee)) {
            uniqueEmps.set(row.Assignee, {
              id: idx,
              name: row.Assignee,
              role: row.Role || "Developer",
              skills: [row["Skill Used"]].filter(Boolean),
              efficiencyRating: 1.0, // Baseline RL Score
              currentLoad: Math.floor(Math.random() * 40), // Simulating some initial load
              availableFrom: new Date().toISOString(),
              totalProjectsCompleted: Math.floor(Math.random() * 10),
              avgHoursPerTask: 0
            });
          }
          // Aggregate skills
          const emp = uniqueEmps.get(row.Assignee)!;
          if(row["Skill Used"] && !emp.skills.includes(row["Skill Used"])) {
              emp.skills.push(row["Skill Used"]);
          }
        });

        setEmployees(Array.from(uniqueEmps.values()));
        
        // Seed initial data
        setProjects([
          {
            id: 'seed_1',
            title: 'Legacy Database Migration',
            description: 'Migrate the old SQL Server data to the new MongoDB cluster.',
            status: 'QUEUED',
            requiredSkills: ['SQL', 'MongoDB', 'Python'],
            estimatedHours: 40,
            priority: 'High',
            assignedTeamIds: []
          }
        ]);
      } catch (error) {
        console.error("Failed to load Unified System data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initSystem();
  }, []);

  // --- HANDLERS: IDEATION ---
  const handleAddProject = (newProject: UnifiedProject) => {
    setProjects(prev => [...prev, newProject]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  // --- HANDLERS: ALLOCATION ---
  const handleAllocateStart = (project: UnifiedProject) => {
    setProjectToAllocate(project);
    setIsAllocatorOpen(true);
  };

  const handleConfirmAllocation = (projectId: string, selectedIds: number[]) => {
    // 1. Move Project to ACTIVE and Assign Team
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { ...p, status: 'ACTIVE', assignedTeamIds: selectedIds, startDate: new Date().toISOString() } 
        : p
    ));

    // 2. Update Employee Loads (Simulate: +25% load per assigned project)
    setEmployees(prev => prev.map(emp => 
      selectedIds.includes(emp.id) 
        ? { ...emp, currentLoad: Math.min(100, emp.currentLoad + 25) } 
        : emp
    ));

    setIsAllocatorOpen(false);
    setProjectToAllocate(null);
  };

  // --- RENDER LOGIC ---

  if (isLoading) {
    return <div className="p-20 text-center text-slate-500 animate-pulse">Initializing Unified Resource OS...</div>;
  }

  // 1. EXECUTION VIEW (If a project is selected)
  if (selectedActiveProject) {
    const projectTeam = employees.filter(e => selectedActiveProject.assignedTeamIds.includes(e.id));
    return (
      <ActiveProjectDetail 
        project={selectedActiveProject} 
        team={projectTeam} 
        onBack={() => setSelectedActiveProject(null)} 
      />
    );
  }

  // Filter lists for dashboard
  const queuedProjects = projects.filter(p => p.status === 'QUEUED');
  const activeProjects = projects.filter(p => p.status === 'ACTIVE');

  // 2. MAIN DASHBOARD VIEW
  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-indigo-600" />
            Unified Resource OS
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Ideation <span className="text-slate-300 mx-2">→</span> Allocation <span className="text-slate-300 mx-2">→</span> Execution
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="text-right hidden md:block border-r border-slate-200 pr-4">
             <div className="text-2xl font-black text-slate-800">{employees.length}</div>
             <div className="text-[10px] uppercase font-bold text-slate-400">Total Resources</div>
           </div>
           
           <Button onClick={() => setIsDraftOpen(true)} className="bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700">
             <Plus className="w-4 h-4 mr-2" /> New Project
           </Button>
        </div>
      </div>

      {/* PHASE 1: IDEATION QUEUE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">1</div>
           <h2 className="text-lg font-bold text-gray-800">Ideation Queue ({queuedProjects.length})</h2>
        </div>
        
        <ProjectQueue 
          projects={projects} 
          onAllocateStart={handleAllocateStart}
          onDelete={handleDeleteProject}
        />
      </div>

      {/* PHASE 3: ACTIVE PROJECTS */}
      {activeProjects.length > 0 && (
        <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-4">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">2</div>
             <h2 className="text-lg font-bold text-gray-800">Active Allocations ({activeProjects.length})</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {activeProjects.map(p => (
               <div 
                 key={p.id} 
                 onClick={() => setSelectedActiveProject(p)} 
                 className="bg-white border border-emerald-100 p-5 rounded-xl shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group"
               >
                 <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div>
                 
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors truncate pr-4">{p.title}</h3>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">RUNNING</span>
                 </div>

                 <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {p.assignedTeamIds.length} Resources Assigned
                 </div>

                 {/* Team Avatars */}
                 <div className="flex -space-x-2 overflow-hidden">
                    {p.assignedTeamIds.slice(0, 5).map(id => {
                        const emp = employees.find(e => e.id === id);
                        return (
                            <div 
                              key={id} 
                              className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm" 
                              title={emp?.name}
                            >
                                {emp?.name?.substring(0,2).toUpperCase()}
                            </div>
                        )
                    })}
                    {p.assignedTeamIds.length > 5 && (
                      <div className="h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        +{p.assignedTeamIds.length - 5}
                      </div>
                    )}
                 </div>

                 <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 text-xs font-bold text-emerald-600 bg-white/90 px-3 py-1 rounded-full shadow-sm">
                    Open Control Center →
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* DIALOGS */}
      <DraftProjectDialog 
        open={isDraftOpen} 
        onOpenChange={setIsDraftOpen} 
        onSave={handleAddProject} 
      />

      <AllocatorEngine 
        open={isAllocatorOpen}
        onOpenChange={setIsAllocatorOpen}
        project={projectToAllocate}
        employees={employees}
        onConfirmAllocation={handleConfirmAllocation}
      />

    </div>
  );
}