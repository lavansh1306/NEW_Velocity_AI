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
    <div className="space-y-6">
      {myTasks.map(task => (
        <div key={task.id} className="bg-white border border-[#E7E5E4] p-8 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-light text-[#1C1917] text-lg">{task.title}</h3>
              <div className="flex flex-wrap gap-2 mt-3">
                {task.scope.map((item) => (
                  <span key={item.id} className={`text-xs px-2 py-1 rounded border font-light ${
                    item.isCompleted 
                    ? 'bg-[#2DD4BF]/10 border-[#2DD4BF]/30 text-[#0F766E]' 
                    : 'bg-[#E7E5E4]/50 border-[#E7E5E4] text-[#78716C]'
                  }`}>
                    {item.name} ({item.weight}%)
                  </span>
                ))}
              </div>
            </div>
            <Button onClick={() => setSelectedTask(task)} className="bg-[#2DD4BF] text-[#1C1917] shadow-md hover:bg-[#1CC5B3]">
              <Zap className="w-4 h-4 mr-2" /> Upload EOD
            </Button>
          </div>
          
          <div className="relative pt-1">
             <div className="flex mb-2 items-center justify-between">
               <span className="text-xs font-light inline-block text-[#78716C] uppercase tracking-wide">Current Progress</span>
               <span className="text-xs font-light inline-block text-[#2DD4BF]">{task.progress}%</span>
             </div>
             <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-[#E7E5E4]">
                <div style={{ width: `${task.progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#2DD4BF] transition-all duration-1000"></div>
             </div>
          </div>
        </div>
      ))}
      {/* (Dialog code same as before, just ensuring imports are correct) */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-[#1C1917]">Submit EOD Report</DialogTitle>
                <DialogDescription className="text-[#78716C]">The AI will check your report against the weighted milestones.</DialogDescription>
            </DialogHeader>
            <textarea 
                value={reportContent} 
                onChange={e => setReportContent(e.target.value)} 
                className="w-full h-40 p-3 border border-[#E7E5E4] rounded-lg font-mono text-sm focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] focus:outline-none"
                placeholder="e.g. I have completed the Backend Integration..."
            />
            <DialogFooter>
                <Button onClick={handleSubmit} disabled={isAnalyzing} className="bg-[#2DD4BF] text-[#1C1917] hover:bg-[#1CC5B3]">
                    {isAnalyzing ? <Loader2 className="animate-spin w-4 h-4"/> : "Verify"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};