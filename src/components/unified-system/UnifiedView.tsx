import React, { useState, useEffect } from 'react';
import { DraftProjectDialog } from './ideation/DraftProjectDialog';
import { ProjectQueue } from './ideation/ProjectQueue';
import { UnifiedProject, UnifiedEmployee } from './types';
import { fetchRawCSV } from '../ml-model/RecommendationEngine';
import { Button } from '../ui/button';
import { Plus, LayoutGrid, Users } from 'lucide-react';

export default function UnifiedView() {
  // --- SYSTEM STATE ---
  const [employees, setEmployees] = useState<UnifiedEmployee[]>([]);
  const [projects, setProjects] = useState<UnifiedProject[]>([]);
  
  // UI State
  const [isDraftOpen, setIsDraftOpen] = useState(false);

  // 1. Initialize System (Load Data from CSV)
  useEffect(() => {
    const initSystem = async () => {
      const csvUrl = new URL('../ml-model/datasets/master_employee_task_report.csv', import.meta.url).href;
      const rawData = await fetchRawCSV(csvUrl);

      // Extract Employees & Calculate Baseline Metrics
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
            currentLoad: 0, 
            availableFrom: new Date().toISOString(),
            totalProjectsCompleted: 0,
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
      
      // Seed some Queue items if empty
      setProjects([
        {
          id: 'seed_1',
          title: 'Legacy System Migration',
          description: 'Migrate the old SQL database to MongoDB.',
          status: 'QUEUED',
          requiredSkills: ['SQL', 'MongoDB', 'Python'],
          estimatedHours: 40,
          priority: 'High',
          assignedTeamIds: []
        }
      ]);
    };

    initSystem();
  }, []);

  const handleAddProject = (newProject: UnifiedProject) => {
    setProjects(prev => [...prev, newProject]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleAllocateStart = (project: UnifiedProject) => {
    alert(`Phase 2 (Allocator) Triggered for: ${project.title}\n\nThis will trigger the RL Matchmaker next.`);
    // TODO: Connect Phase 2 here
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-indigo-600" />
            Unified Resource OS
          </h1>
          <p className="text-slate-500 mt-1">
            Ideation <span className="text-slate-300">→</span> Allocation <span className="text-slate-300">→</span> Execution <span className="text-slate-300">→</span> Report
          </p>
        </div>

        <div className="flex items-center gap-3">
           <div className="text-right hidden md:block mr-2">
             <div className="text-2xl font-black text-slate-800">{employees.length}</div>
             <div className="text-xs uppercase font-bold text-slate-400">Total Resources</div>
           </div>
           
           <Button onClick={() => setIsDraftOpen(true)} className="bg-indigo-600 text-white shadow-lg shadow-indigo-200">
             <Plus className="w-4 h-4 mr-2" /> New Project
           </Button>
        </div>
      </div>

      {/* PHASE 1: IDEATION SANDBOX */}
      <div>
        <div className="flex items-center gap-2 mb-4">
           <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">1</div>
           <h2 className="text-lg font-bold text-gray-800">Ideation Queue</h2>
        </div>
        
        <ProjectQueue 
          projects={projects} 
          onAllocateStart={handleAllocateStart}
          onDelete={handleDeleteProject}
        />
      </div>

      <DraftProjectDialog 
        open={isDraftOpen} 
        onOpenChange={setIsDraftOpen} 
        onSave={handleAddProject} 
      />

    </div>
  );
}