import React, { useState, useEffect } from 'react';
import { DraftProjectDialog } from './ideation/DraftProjectDialog';
import { ProjectQueue } from './ideation/ProjectQueue';
import { AllocatorEngine } from './allocator/AllocatorEngine';
import { ActiveProjectDetail } from './execution/ActiveProjectDetail';
import { UnifiedProject, UnifiedEmployee } from './types';
import { Button } from '../ui/button';
import { Plus, LayoutGrid, CheckCircle2, Briefcase, Wrench, FlaskConical, Layers } from 'lucide-react';

// Using your existing CSV loader logic
import { fetchRawCSV } from '../ml-model/RecommendationEngine'; 
import csvPath from '../ml-model/datasets/master_employee_task_report.csv?url';

export default function UnifiedView() {
  const [employees, setEmployees] = useState<UnifiedEmployee[]>([]);
  const [projects, setProjects] = useState<UnifiedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI States
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [isAllocatorOpen, setIsAllocatorOpen] = useState(false);
  const [projectToAllocate, setProjectToAllocate] = useState<UnifiedProject | null>(null);
  const [selectedActiveProject, setSelectedActiveProject] = useState<UnifiedProject | null>(null);

  useEffect(() => {
    const initSystem = async () => {
      // 1. Load Projects from LocalStorage (Sync with Smart Tracker)
      const savedProjects = localStorage.getItem('unified_projects');
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      } else {
        // Seed initial project if none exist
        setProjects([{
          id: 'seed_1',
          title: 'Legacy Database Migration',
          description: 'Migrate the old SQL Server data to the new MongoDB cluster.',
          status: 'QUEUED',
          category: 'Internal Tool',
          requiredSkills: ['SQL', 'MongoDB'],
          estimatedHours: 40,
          priority: 'High',
          assignedTeamIds: []
        }]);
      }

      // 2. Load Employees from your CSV logic
      try {
        const rawData = await fetchRawCSV(csvPath);
        const uniqueEmps = new Map<string, UnifiedEmployee>();
        rawData.forEach((row: any, idx: number) => {
          const name = row.Assignee || row.assignee;
          if (name && !uniqueEmps.has(name)) {
            uniqueEmps.set(name, {
              id: idx + 1000,
              name: name,
              role: row.Role || "Developer",
              skills: [row["Skill Used"]].filter(Boolean),
              efficiencyRating: 1.2,
              currentLoad: 20,
              availableFrom: new Date().toISOString(),
              totalProjectsCompleted: 5,
              avgHoursPerTask: 0
            });
          }
        });
        setEmployees(Array.from(uniqueEmps.values()));
      } catch (e) { console.error("CSV Load Error", e); }
      
      setIsLoading(false);
    };
    initSystem();
  }, []);

  // Sync with LocalStorage whenever projects change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('unified_projects', JSON.stringify(projects));
    }
  }, [projects, isLoading]);

  const handleAddProject = (newProject: UnifiedProject) => {
    // If manager starts it as 'ACTIVE', ensure it has a placeholder assignment for the tracker
    if (newProject.status === 'ACTIVE' && newProject.assignedTeamIds.length === 0) {
      newProject.assignedTeamIds = [employees[0]?.id].filter(Boolean);
      newProject.startDate = new Date().toISOString();
    }
    setProjects(prev => [...prev, newProject]);
  };

  const handleConfirmAllocation = (projectId: string, selectedIds: number[]) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { ...p, status: 'ACTIVE', assignedTeamIds: selectedIds, startDate: new Date().toISOString() } 
        : p
    ));
    setIsAllocatorOpen(false);
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse">Initializing...</div>;

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="text-indigo-600" /> Unified Resource OS
          </h1>
          <p className="text-slate-500 text-sm">Manager View: Ideation → Allocation → Execution</p>
        </div>
        
        {/* ADD PROJECT BUTTON */}
        <Button onClick={() => setIsDraftOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      <div className="grid gap-8">
        {/* Section 1: Queue (Drafts & Assignment) */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">1</span>
            Planning Queue
          </h2>
          <ProjectQueue 
            projects={projects.filter(p => p.status === 'QUEUED' || p.status === 'READY_FOR_ALLOCATION')} 
            onAllocateStart={(p) => { setProjectToAllocate(p); setIsAllocatorOpen(true); }}
            onDelete={(id) => setProjects(prev => prev.filter(p => p.id !== id))}
          />
        </section>

        {/* Section 2: Active (Visible in Smart Tracker) */}
        <section className="pt-8 border-t">
          <h2 className="text-lg font-bold mb-4 text-emerald-700 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">2</span>
            Active in Smart Tracker
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {projects.filter(p => p.status === 'ACTIVE').map(p => (
              <div 
                key={p.id} 
                onClick={() => setSelectedActiveProject(p)}
                className="bg-white border-l-4 border-l-emerald-500 border rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Running</span>
                  <span className="text-slate-400">{p.category}</span>
                </div>
                <h3 className="font-bold text-slate-900">{p.title}</h3>
                <div className="mt-3 flex -space-x-2">
                  {p.assignedTeamIds.map(id => (
                    <div key={id} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold">
                      {employees.find(e => e.id === id)?.name.substring(0,2)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <DraftProjectDialog open={isDraftOpen} onOpenChange={setIsDraftOpen} onSave={handleAddProject} />
      
      <AllocatorEngine 
        open={isAllocatorOpen} 
        onOpenChange={setIsAllocatorOpen} 
        project={projectToAllocate} 
        employees={employees} 
        onConfirmAllocation={handleConfirmAllocation} 
      />

      {selectedActiveProject && (
        <ActiveProjectDetail 
          project={selectedActiveProject} 
          team={employees.filter(e => selectedActiveProject.assignedTeamIds.includes(e.id))} 
          onBack={() => setSelectedActiveProject(null)} 
        />
      )}
    </div>
  );
}