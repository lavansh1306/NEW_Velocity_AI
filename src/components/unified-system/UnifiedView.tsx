import React, { useState, useEffect } from 'react';
import { DraftProjectDialog } from './ideation/DraftProjectDialog';
import { ProjectQueue } from './ideation/ProjectQueue';
import { AllocatorEngine } from './allocator/AllocatorEngine';
import { ActiveProjectDetail } from './execution/ActiveProjectDetail';
import { UnifiedProject, UnifiedEmployee } from './types';
import { Button } from '../ui/button';
import { Plus, LayoutGrid, CheckCircle2, AlertCircle } from 'lucide-react';

// --- FIXED IMPORT PATHS (Added ../) ---
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
      let loadedEmployees: UnifiedEmployee[] = [];
      
      try {
        console.log("Loading CSV from:", csvPath);
        const rawData = await fetchRawCSV(csvPath);

        const uniqueEmps = new Map<string, UnifiedEmployee>();
        
        rawData.forEach((row: any, idx: number) => {
          const name = row.Assignee || row.assignee;
          if (!name) return;
          
          if (!uniqueEmps.has(name)) {
            uniqueEmps.set(name, {
              id: idx + 1000,
              name: name,
              role: row.Role || row.role || "Developer",
              skills: [row["Skill Used"] || row.skill].filter(Boolean),
              efficiencyRating: 1.0 + (Math.random() * 0.5),
              currentLoad: Math.floor(Math.random() * 60),
              availableFrom: new Date().toISOString(),
              totalProjectsCompleted: Math.floor(Math.random() * 20),
              avgHoursPerTask: 0
            });
          }
          const emp = uniqueEmps.get(name)!;
          const skill = row["Skill Used"] || row.skill;
          if(skill && !emp.skills.includes(skill)) emp.skills.push(skill);
        });

        loadedEmployees = Array.from(uniqueEmps.values());
        console.log(`CSV Parsing complete. Found ${loadedEmployees.length} employees.`);

      } catch (error) {
        console.error("CSV Load Failed, falling back to mock data:", error);
      }

      // --- GUARANTEED FALLBACK ---
      // Even if CSV fails, this ensures you ALWAYS have employees to demo
      if (loadedEmployees.length < 3) {
        console.warn("Using Mock Data Fallback");
        const mockData: UnifiedEmployee[] = [
           { id: 101, name: "Alice Chen", role: "Frontend Architect", skills: ["React", "TypeScript", "Tailwind", "CSS"], efficiencyRating: 1.4, currentLoad: 20, availableFrom: "", totalProjectsCompleted: 15, avgHoursPerTask: 0 },
           { id: 102, name: "Bob Smith", role: "Backend Lead", skills: ["Node.js", "SQL", "Python", "MongoDB", "AWS"], efficiencyRating: 1.2, currentLoad: 40, availableFrom: "", totalProjectsCompleted: 8, avgHoursPerTask: 0 },
           { id: 103, name: "Charlie Kim", role: "ML Engineer", skills: ["Python", "TensorFlow", "AWS", "Docker"], efficiencyRating: 1.5, currentLoad: 10, availableFrom: "", totalProjectsCompleted: 12, avgHoursPerTask: 0 },
           { id: 104, name: "Diana Prince", role: "Full Stack", skills: ["React", "Node.js", "SQL", "Java"], efficiencyRating: 1.1, currentLoad: 80, availableFrom: "", totalProjectsCompleted: 22, avgHoursPerTask: 0 },
           { id: 105, name: "Ethan Hunt", role: "DevOps Engineer", skills: ["AWS", "Docker", "Kubernetes", "CI/CD"], efficiencyRating: 1.3, currentLoad: 0, availableFrom: "", totalProjectsCompleted: 5, avgHoursPerTask: 0 },
           { id: 106, name: "Fiona Gallagher", role: "Mobile Dev", skills: ["Flutter", "React Native", "iOS"], efficiencyRating: 1.2, currentLoad: 30, availableFrom: "", totalProjectsCompleted: 9, avgHoursPerTask: 0 },
        ];
        loadedEmployees = [...loadedEmployees, ...mockData];
      }

      setEmployees(loadedEmployees);
      
      // Initial Project
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
      
      setIsLoading(false);
    };

    initSystem();
  }, []);

  const handleAddProject = (newProject: UnifiedProject) => setProjects(prev => [...prev, newProject]);
  const handleDeleteProject = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));

  const handleAllocateStart = (project: UnifiedProject) => {
    setProjectToAllocate(project);
    setIsAllocatorOpen(true);
  };

  const handleConfirmAllocation = (projectId: string, selectedIds: number[]) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { ...p, status: 'ACTIVE', assignedTeamIds: selectedIds, startDate: new Date().toISOString() } 
        : p
    ));
    setEmployees(prev => prev.map(emp => 
      selectedIds.includes(emp.id) 
        ? { ...emp, currentLoad: Math.min(100, emp.currentLoad + 25) } 
        : emp
    ));
    setIsAllocatorOpen(false);
    setProjectToAllocate(null);
  };

  if (isLoading) return <div className="p-20 text-center text-slate-500 animate-pulse">Initializing Unified Resource OS...</div>;

  if (selectedActiveProject) {
    const projectTeam = employees.filter(e => selectedActiveProject.assignedTeamIds.includes(e.id));
    return <ActiveProjectDetail project={selectedActiveProject} team={projectTeam} onBack={() => setSelectedActiveProject(null)} />;
  }

  const queuedProjects = projects.filter(p => p.status === 'QUEUED');
  const activeProjects = projects.filter(p => p.status === 'ACTIVE');

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
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
             <div className="text-[10px] uppercase font-bold text-slate-400">Resources Available</div>
           </div>
           <Button onClick={() => setIsDraftOpen(true)} className="bg-indigo-600 text-white shadow-lg hover:bg-indigo-700">
             <Plus className="w-4 h-4 mr-2" /> New Project
           </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">1</div>
           <h2 className="text-lg font-bold text-gray-800">Ideation Queue ({queuedProjects.length})</h2>
        </div>
        <ProjectQueue projects={projects} onAllocateStart={handleAllocateStart} onDelete={handleDeleteProject} />
      </div>

      {activeProjects.length > 0 && (
        <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-4">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">2</div>
             <h2 className="text-lg font-bold text-gray-800">Active Allocations ({activeProjects.length})</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {activeProjects.map(p => (
               <div key={p.id} onClick={() => setSelectedActiveProject(p)} className="bg-white border border-emerald-100 p-5 rounded-xl shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md transition-all group">
                 <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div>
                 <h3 className="font-bold text-gray-900 truncate pr-4">{p.title}</h3>
                 <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {p.assignedTeamIds.length} Resources Assigned
                 </div>
                 <div className="flex -space-x-2 overflow-hidden">
                    {p.assignedTeamIds.slice(0, 5).map(id => {
                        const emp = employees.find(e => e.id === id);
                        return <div key={id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{emp?.name?.substring(0,2).toUpperCase()}</div>
                    })}
                 </div>
                 <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all text-xs font-bold text-emerald-600 bg-white/90 px-3 py-1 rounded-full shadow-sm">
                    Open Control Center →
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}

      <DraftProjectDialog open={isDraftOpen} onOpenChange={setIsDraftOpen} onSave={handleAddProject} />
      <AllocatorEngine open={isAllocatorOpen} onOpenChange={setIsAllocatorOpen} project={projectToAllocate} employees={employees} onConfirmAllocation={handleConfirmAllocation} />
    </div>
  );
}