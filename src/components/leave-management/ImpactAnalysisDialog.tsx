import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
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
      {/* FIX: Added max-h-[85vh] and flex-col to handle overflow correctly */}
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col bg-slate-50">
        
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg"><BrainCircuit className="w-5 h-5 text-indigo-600"/></div>
            <div>
              <DialogTitle className="text-xl">Impact Analysis & Scenario Planning</DialogTitle>
              <DialogDescription>Review AI recommendations before approving leave.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {/* FIX: This div wraps the scrollable content */}
        <div className="flex-1 overflow-y-auto py-2 pr-2 space-y-4">
          
          {/* Reallocation Strategy Box */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-500 mb-3 sticky top-0 bg-white z-10 py-1">
              Reallocation Strategy ({predictions.length} Tasks)
            </h4>
            
            {predictions.length === 0 ? (
              <div className="text-sm text-slate-400 italic text-center py-4">
                No active tasks need reallocation for this period.
              </div>
            ) : (
              predictions.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 last:mb-0 p-3 bg-slate-50 rounded border border-slate-100 gap-3">
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-800">{item.task.projectName}</div>
                    <div className="text-xs text-slate-500">{item.task.taskName} ({item.task.hours}h)</div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <ArrowRight className="hidden sm:block w-4 h-4 text-slate-300" />
                    <div className="text-right flex-1 sm:flex-none">
                       <div className="font-bold text-sm text-indigo-700">{item.newAssignee}</div>
                       <div className="text-[10px] text-indigo-500 font-medium truncate max-w-[150px]">{item.reason}</div>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${item.score > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.score}% Match
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Risk Assessment Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0"/>
                <div>
                  <div className="text-sm font-bold text-emerald-800">Low Risk</div>
                  <div className="text-xs text-emerald-600">Capacity exists to absorb workload.</div>
                </div>
             </div>
             <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-start gap-3">
                <Zap className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0"/>
                <div>
                  <div className="text-sm font-bold text-indigo-800">Skills Aligned</div>
                  <div className="text-xs text-indigo-600">Resources match required skills.</div>
                </div>
             </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={onConfirm}>
            Confirm & Reallocate
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};