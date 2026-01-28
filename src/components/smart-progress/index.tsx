import React, { useState } from 'react';
import { EODUploadDialog } from './EODUploadDialog';
import { analyzeEODReport, AnalysisResult } from './ProgressAgent';
import { CheckCircle2, Circle, Activity, ArrowRight, Zap } from 'lucide-react';
import { Button } from '../ui/button';

// Mock Data Structure
interface SmartTask {
  id: number;
  title: string;
  assignee: string;
  scope: string[]; // Specific items to check against
  progress: number;
  lastUpdate?: string;
}

export default function SmartProgressTracker() {
  
  // 1. Initial State
  const [tasks, setTasks] = useState<SmartTask[]>([
    {
      id: 1,
      title: "Payment Gateway Integration",
      assignee: "John Doe",
      scope: ["Stripe API Setup", "PayPal API Setup", "Webhook Listener", "Refund Logic"],
      progress: 0,
    },
    {
      id: 2,
      title: "Frontend Dashboard UI",
      assignee: "Jane Smith",
      scope: ["Sidebar Component", "Header", "Charts Integration", "Dark Mode"],
      progress: 25,
      lastUpdate: "Sidebar Completed"
    }
  ]);

  const [selectedTask, setSelectedTask] = useState<SmartTask | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);

  // 2. Handle Analysis
  const handleAnalyze = async (content: string) => {
    if (!selectedTask) return;
    
    setIsAnalyzing(true);
    
    // Call the Agent
    const result = await analyzeEODReport(selectedTask.scope, content);
    
    setLastAnalysis(result);
    setIsAnalyzing(false);
    setIsDialogOpen(false); // Close upload, show results inline or update immediately
    
    // Update Task State
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? {
      ...t,
      progress: result.extractedProgress,
      lastUpdate: result.summary
    } : t));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 rounded-xl">
          <Activity className="w-8 h-8 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Smart Progress Tracker</h2>
          <p className="text-slate-500">AI-verified EOD updates. Upload logs to auto-update progress.</p>
        </div>
      </div>

      {/* Task List */}
      <div className="grid gap-6">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                <p className="text-sm text-slate-500">Assigned to: <span className="font-medium text-slate-700">{task.assignee}</span></p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-indigo-600">{task.progress}%</div>
                <div className="text-xs font-bold text-slate-400 uppercase">Completion</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${task.progress}%` }}
              />
            </div>

            {/* Scope Checklist Visualization */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {task.scope.map((item, idx) => {
                 // Visual logic: If progress > step threshold, mark green
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