import React, { useState, useEffect } from 'react';
import { EODUploadDialog } from './EODUploadDialog';
import { analyzeEODReport, AnalysisResult } from './ProgressAgent';
import { CheckCircle2, Circle, Activity, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
// Import the CSV parser
import { fetchRawCSV } from '../ml-model/RecommendationEngine';

// Data Model
interface SmartTask {
  id: number;
  title: string; // From "Task Name"
  assignee: string; // From "Assignee"
  project: string; // From "Project"
  scope: string[]; // Generated from description or defaults
  progress: number; // From "Actual Hours" / "Planned Hours" (normalized)
  lastUpdate?: string;
}

export default function SmartProgressTracker() {
  
  const [tasks, setTasks] = useState<SmartTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interaction State
  const [selectedTask, setSelectedTask] = useState<SmartTask | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- 1. LOAD CSV DATA ---
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const csvUrl = new URL('../ml-model/datasets/master_employee_task_report.csv', import.meta.url).href;
        const rawData: any[] = await fetchRawCSV(csvUrl);

        // Transform CSV rows into Smart Tasks
        const loadedTasks: SmartTask[] = rawData
          .filter(row => row["Task Name"] && row.Assignee) // Filter empty rows
          .slice(0, 8) // Limit to top 8 for cleaner demo
          .map((row, index) => {
            
            // Calculate initial progress based on CSV hours
            const actual = parseFloat(row["Actual Hours"]) || 0;
            const planned = parseFloat(row["Planned Hours"]) || 10;
            const initPercent = Math.min(100, Math.round((actual / planned) * 100));

            // Generate a "Smart Scope" (Mocking subtasks based on role/title)
            // In a real app, this would come from Jira subtasks
            const generatedScope = [
                `Analyze Requirements for ${row["Task Name"]}`,
                `Implementation Phase 1`,
                `Unit Testing & Validation`,
                `Code Review & Documentation`
            ];

            return {
              id: index,
              title: row["Task Name"],
              assignee: row.Assignee,
              project: row.Project || "General Engineering",
              scope: generatedScope,
              progress: initPercent,
              lastUpdate: actual > 0 ? "Hours logged via Timesheet" : undefined
            };
          });

        setTasks(loadedTasks);
      } catch (err) {
        console.error("Failed to load tracker tasks", err);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  // --- 2. HANDLE AI ANALYSIS ---
  const handleAnalyze = async (content: string) => {
    if (!selectedTask) return;
    
    setIsAnalyzing(true);
    
    // Call the simulated Agent
    const result = await analyzeEODReport(selectedTask.scope, content);
    
    setIsAnalyzing(false);
    setIsDialogOpen(false); 
    
    // Update Task State with new progress
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? {
      ...t,
      progress: result.extractedProgress,
      lastUpdate: result.summary
    } : t));
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-2"/> Loading Tasks...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 rounded-xl">
          <Activity className="w-8 h-8 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Smart Progress Tracker</h2>
          <p className="text-slate-500">AI-verified EOD updates. Tasks loaded from <strong>Master Report</strong>.</p>
        </div>
      </div>

      {/* Task List */}
      <div className="grid gap-6">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        {task.project}
                    </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                <p className="text-sm text-slate-500">Assigned to: <span className="font-medium text-slate-700">{task.assignee}</span></p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black ${task.progress === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {task.progress}%
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase">Completion</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 ease-out ${task.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                style={{ width: `${task.progress}%` }}
              />
            </div>

            {/* Scope Checklist Visualization */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {task.scope.map((item, idx) => {
                 // Visual logic: If progress > step threshold, mark green
                 // e.g. 4 items = 25%, 50%, 75%, 100% steps
                 const threshold = ((idx + 1) / task.scope.length) * 100;
                 const isDone = task.progress >= threshold;
                 
                 return (
                   <span key={idx} className={`text-xs px-2 py-1 rounded border flex items-center gap-1.5 ${isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                     {isDone ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                     {item}
                   </span>
                 );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
               <div className="text-xs text-slate-400 italic">
                 {task.lastUpdate ? `ℹ️ ${task.lastUpdate}` : "No EOD updates submitted yet."}
               </div>
               
               <Button 
                 onClick={() => { setSelectedTask(task); setIsDialogOpen(true); }}
                 className="bg-slate-900 text-white hover:bg-slate-800 text-xs px-4"
               >
                 <Zap className="w-3 h-3 mr-2 text-yellow-400" />
                 Upload EOD Update
               </Button>
            </div>

          </div>
        ))}
      </div>

      {/* Upload Dialog */}
      {selectedTask && (
        <EODUploadDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          taskName={selectedTask.title}
          scope={selectedTask.scope}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />
      )}

    </div>
  );
}