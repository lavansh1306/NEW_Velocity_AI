import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { History, Plus, Clock, Trash2 } from 'lucide-react';
import { Task, TimeLog } from './types';

interface TimeLoggingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSave: (taskId: number, logs: TimeLog[]) => void;
}

export const TimeLoggingDialog: React.FC<TimeLoggingDialogProps> = ({ open, onOpenChange, task, onSave }) => {
  const [currentSession, setCurrentSession] = useState({ hours: 1, checkpoint: '' });
  const [tempLogs, setTempLogs] = useState<TimeLog[]>([]);

  // Load existing logs when modal opens
  useEffect(() => {
    if (task && open) {
      setTempLogs(task.logs || []);
    }
  }, [task, open]);

  const addCheckpointSession = () => {
    if (!currentSession.checkpoint) return;
    const newLog: TimeLog = {
      id: Date.now(),
      hours: currentSession.hours,
      checkpoint: currentSession.checkpoint,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTempLogs([newLog, ...tempLogs]);
    setCurrentSession({ hours: 1, checkpoint: '' });
  };

  const removeLog = (logId: number) => {
    setTempLogs(tempLogs.filter(l => l.id !== logId));
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg"><History className="w-5 h-5 text-indigo-600"/></div>
            <div>
              <DialogTitle className="text-lg">Log Activity & Checkpoints</DialogTitle>
              <DialogDescription>Add hourly sessions for <span className="font-bold text-slate-900">{task.projectName}</span></DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
             <Label className="text-xs font-bold text-slate-500 uppercase">New Session Entry</Label>
             <div className="flex gap-3">
               <div className="w-24">
                 <Input 
                   type="number" 
                   value={currentSession.hours}
                   onChange={(e) => setCurrentSession({...currentSession, hours: parseFloat(e.target.value)})}
                   className="bg-white"
                   placeholder="Hrs"
                 />
               </div>
               <div className="flex-1">
                 <Input 
                   value={currentSession.checkpoint}
                   onChange={(e) => setCurrentSession({...currentSession, checkpoint: e.target.value})}
                   className="bg-white"
                   placeholder="Checkpoint: e.g. 'Connected DB'..."
                 />
               </div>
               <Button onClick={addCheckpointSession} size="icon" className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
                  <Plus className="w-4 h-4" />
               </Button>
             </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
               <Label className="text-xs font-bold text-slate-500 uppercase">Today's Checkpoints</Label>
               <span className="text-xs font-mono text-slate-400">Total: {tempLogs.reduce((acc, l) => acc + l.hours, 0)}h / {task.hours}h Planned</span>
            </div>
            
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
              {tempLogs.length === 0 && <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-lg">No sessions logged yet.</div>}
              {tempLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm group">
                  <div className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{log.hours}h</div>
                  <div className="flex-1">
                     <div className="text-sm font-medium text-slate-700">{log.checkpoint}</div>
                     <div className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> Logged at {log.timestamp}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500" onClick={() => removeLog(log.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => onSave(task.id, tempLogs)}>
            Save Progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};