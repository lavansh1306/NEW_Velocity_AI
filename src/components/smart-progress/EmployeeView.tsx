import React, { useState } from 'react';
import { SmartTask } from './types';
import { analyzeEODReport } from './ProgressAgent';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Loader2, Zap } from 'lucide-react';

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
    const result = await analyzeEODReport(selectedTask, reportContent);
    onUpdateTask(selectedTask.id, result);
    setIsAnalyzing(false);
    setSelectedTask(null);
    setReportContent('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      {myTasks.map(task => (
        <div key={task.id} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{task.title}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {task.scope.map((item) => (
                  <span key={item.id} className={`text-xs px-2 py-1 rounded border ${
                    item.isCompleted 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    {item.name} ({item.weight}%)
                  </span>
                ))}
              </div>
            </div>
            <Button onClick={() => setSelectedTask(task)} className="bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Zap className="w-4 h-4 mr-2" /> Upload EOD
            </Button>
          </div>
          
          <div className="relative pt-1">
             <div className="flex mb-2 items-center justify-between">
               <span className="text-xs font-semibold inline-block text-indigo-600 uppercase">Current Progress</span>
               <span className="text-xs font-bold inline-block text-indigo-600">{task.progress}%</span>
             </div>
             <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-100">
                <div style={{ width: `${task.progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-1000"></div>
             </div>
          </div>
        </div>
      ))}
      {/* (Dialog code same as before, just ensuring imports are correct) */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Submit EOD Report</DialogTitle>
                <DialogDescription>The AI will check your report against the weighted milestones.</DialogDescription>
            </DialogHeader>
            <textarea 
                value={reportContent} 
                onChange={e => setReportContent(e.target.value)} 
                className="w-full h-40 p-3 border rounded-lg font-mono text-sm"
                placeholder="e.g. I have completed the Backend Integration..."
            />
            <DialogFooter>
                <Button onClick={handleSubmit} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="animate-spin w-4 h-4"/> : "Verify"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};