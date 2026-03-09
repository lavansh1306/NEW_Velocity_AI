import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { ArrowRight, BrainCircuit, CheckCircle2, AlertTriangle, Zap, Clock } from 'lucide-react';
import { Task } from './types';

// Define Prediction interface here or export from types.ts if used globally
export interface Prediction {
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
  isSubmitting?: boolean;
}

export const ImpactAnalysisDialog: React.FC<ImpactAnalysisDialogProps> = ({ 
  open, 
  onOpenChange, 
  predictions, 
  onConfirm,
  isSubmitting = false
}) => {
  
  // Calculate Totals
  const summary = useMemo(() => {
    return {
      totalHours: predictions.reduce((sum, p) => sum + (p.task.hours || 0), 0),
      avgScore: predictions.length > 0 
        ? Math.round(predictions.reduce((sum, p) => sum + p.score, 0) / predictions.length) 
        : 0,
      riskLevel: predictions.some(p => p.score < 60) ? 'High' : 'Low'
    };
  }, [predictions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col bg-slate-50">
        
        <DialogHeader className="flex-shrink-0 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-xl">
              <BrainCircuit className="w-6 h-6 text-indigo-600"/>
            </div>
            <div>
              <DialogTitle className="text-xl font-light text-slate-900">Impact Analysis</DialogTitle>
              <DialogDescription>AI-driven resource reallocation proposal.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-5">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Tasks Moved</div>
              <div className="text-2xl font-light text-slate-900">{predictions.length}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Hours Saved</div>
              <div className="text-2xl font-light text-indigo-600">{summary.totalHours}h</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Confidence</div>
              <div className={`text-2xl font-light ${summary.avgScore > 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {summary.avgScore}%
              </div>
            </div>
          </div>

          {/* Reallocation List */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Suggested Moves
            </h4>
            
            <div className="space-y-3">
              {predictions.length === 0 ? (
                <div className="text-sm text-slate-400 italic text-center py-8 bg-slate-100/50 rounded-lg border border-dashed border-slate-200">
                  No active tasks require reallocation.
                </div>
              ) : (
                predictions.map((item, i) => (
                  <div key={i} className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-slate-800 text-sm">{item.task.taskName}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded">{item.task.projectName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {item.task.hours}h</span>
                        </div>
                      </div>
                      <div className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        item.score > 80 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {item.score}% Match
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg text-sm">
                      <div className="text-slate-400 text-xs font-mono">FROM</div>
                      <div className="line-through text-slate-500 decoration-slate-400">{item.task.assignee}</div>
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                      <div className="font-bold text-indigo-700">{item.newAssignee}</div>
                    </div>
                    
                    <div className="mt-2 text-[11px] text-slate-500 italic">
                      Reason: {item.reason}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="grid grid-cols-1 gap-3">
             {summary.riskLevel === 'Low' ? (
               <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                 <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0"/>
                 <div>
                   <div className="text-sm font-bold text-emerald-800">Low Risk Reallocation</div>
                   <div className="text-xs text-emerald-600 mt-1">
                     Team capacity can absorb this workload without impacting other critical path deadlines.
                   </div>
                 </div>
               </div>
             ) : (
               <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                 <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0"/>
                 <div>
                   <div className="text-sm font-bold text-amber-800">Capacity Strain Detected</div>
                   <div className="text-xs text-amber-700 mt-1">
                     Some reallocations have low confidence scores. Manual review is recommended.
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-2 border-t border-slate-100 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500 hover:text-slate-800">
            Cancel
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200" 
            onClick={onConfirm}
            disabled={isSubmitting || predictions.length === 0}
          >
            {isSubmitting ? 'Processing...' : 'Confirm & Reallocate'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};