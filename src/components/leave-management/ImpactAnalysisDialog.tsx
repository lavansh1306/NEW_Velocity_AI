import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { ArrowRight, BrainCircuit, CheckCircle2, Zap } from 'lucide-react';
import { Task } from './types';

interface Prediction {
  task: Task;
  newAssignee: string;
  reason: string;
  score: number;
}

interface ImpactAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  predictions: Prediction[];
  onConfirm: () => void;
}

export const ImpactAnalysisDialog: React.FC<ImpactAnalysisDialogProps> = ({ open, onOpenChange, predictions, onConfirm }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-50">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg"><BrainCircuit className="w-5 h-5 text-indigo-600"/></div>
            <div>
              <DialogTitle className="text-xl">Impact Analysis & Scenario Planning</DialogTitle>
              <DialogDescription>Review AI recommendations before approving leave.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-500 mb-3">Reallocation Strategy</h4>
            {predictions.map((item, i) => (
              <div key={i} className="flex items-center justify-between mb-3 last:mb-0 p-3 bg-slate-50 rounded border border-slate-100">
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-800">{item.task.projectName}</div>
                  <div className="text-xs text-slate-500">{item.task.taskName} ({item.task.hours}h)</div>
                </div>
                
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                  <div className="text-right">
                     <div className="font-bold text-sm text-indigo-700">{item.newAssignee}</div>
                     <div className="text-[10px] text-indigo-500 font-medium">{item.reason}</div>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full ${item.score > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.score}% Match
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
             <div className="flex-1 bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5"/>
                <div>
                  <div className="text-sm font-bold text-emerald-800">Low Risk</div>
                  <div className="text-xs text-emerald-600">Capacity exists to absorb workload.</div>
                </div>
             </div>
             <div className="flex-1 bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-start gap-3">
                <Zap className="w-5 h-5 text-indigo-600 mt-0.5"/>
                <div>
                  <div className="text-sm font-bold text-indigo-800">Skills Aligned</div>
                  <div className="text-xs text-indigo-600">Resources match required skills.</div>
                </div>
             </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={onConfirm}>
            Confirm & Reallocate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};