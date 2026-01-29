import React, { useState } from 'react';
import { SmartTask } from './types';
import { analyzeEODReport } from './ProgressAgent';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { UploadCloud, CheckCircle2, Loader2, Zap } from 'lucide-react';

interface EmployeeViewProps {
  tasks: SmartTask[];
  currentUser: string;
  onUpdateTask: (taskId: number, updates: Partial<SmartTask>) => void;
}

export const EmployeeView: React.FC<EmployeeViewProps> = ({ tasks, currentUser, onUpdateTask }) => {
  const myTasks = tasks.filter(t => t.assignee === currentUser);
  
  const [selectedTask, setSelectedTask] = useState<SmartTask | null>(null);
  const [reportContent, setReportContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async () => {
    if (!selectedTask) return;
    setIsAnalyzing(true);

    // 1. Run Agent Logic
    const result = await analyzeEODReport(selectedTask, reportContent);

    // 2. Update Parent State (Automating the Manager View)
    onUpdateTask(selectedTask.id, result);

    setIsAnalyzing(false);
    setSelectedTask(null);
    setReportContent('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold">My Tasks ({myTasks.length})</h2>
        <p className="text-slate-400 text-sm">Upload your EOD reports. The Agent will verify your progress.</p>
      </div>

      <div className="grid gap-6">
        {myTasks.map(task => (
          <div key={task.id} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{task.title}</h3>
                <div className="flex gap-2 mt-2">
                  {task.scope.map((s, i) => (
                    <span key={i} className={`text-xs px-2 py-1 rounded ${task.completedScope.includes(s) ? 'bg-emerald-100 text-emerald-700 line-through' : 'bg-slate-100 text-slate-600'}`}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <Button 
                onClick={() => setSelectedTask(task)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
              >
                <Zap className="w-4 h-4 mr-2" /> Upload EOD
              </Button>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
            </div>
            <div className="text-right text-xs font-bold text-emerald-600 mt-1">{task.progress}% Verified</div>
          </div>
        ))}
      </div>

      {/* UPLOAD MODAL */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit EOD for: {selectedTask?.title}</DialogTitle>
            <DialogDescription>Paste your work logs, commit messages, or summaries.</DialogDescription>
          </DialogHeader>
          
          <textarea
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
            className="w-full h-40 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            placeholder="e.g. Completed the API integration and fixed the Login bugs..."
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTask(null)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isAnalyzing || !reportContent.trim()} className="bg-indigo-600 text-white">
              {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Verifying...</> : "Submit & Auto-Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};