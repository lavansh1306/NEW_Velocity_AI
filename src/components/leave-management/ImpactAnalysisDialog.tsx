import React from 'react';
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
  if (!open) return null;

  return (
    <>
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Centered Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
          
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BrainCircuit className="w-5 h-5 text-blue-600"/>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-[#121212]">Leave Impact Analysis</h2>
                  <p className="text-sm text-gray-600 mt-1">Review AI recommendations before approving leave.</p>
                </div>
              </div>
              <button 
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div className="space-y-4 mb-6">
              
              {/* Reallocation Strategy Box */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold uppercase text-gray-700 mb-4">
                  Reallocation Strategy ({predictions.length} Tasks)
                </h4>
                
                {predictions.length === 0 ? (
                  <div className="text-sm text-gray-500 italic text-center py-4">
                    No active tasks need reallocation for this period.
                  </div>
                ) : (
                  predictions.map((item, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 last:mb-0 p-4 bg-white rounded-lg border border-gray-200 gap-3 hover:border-blue-200 transition-colors">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-[#121212]">{item.task.projectName}</div>
                        <div className="text-xs text-gray-600">{item.task.taskName} ({item.task.hours}h)</div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <ArrowRight className="hidden sm:block w-4 h-4 text-gray-400" />
                        <div className="text-right flex-1 sm:flex-none">
                           <div className="font-semibold text-sm text-blue-600">{item.newAssignee}</div>
                           <div className="text-[10px] text-blue-500 font-medium truncate max-w-[150px]">{item.reason}</div>
                        </div>
                        <div className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${item.score > 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {item.score}% Match
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Risk Assessment Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0"/>
                    <div>
                      <div className="text-sm font-semibold text-green-800">Low Risk</div>
                      <div className="text-xs text-green-700">Capacity exists to absorb workload.</div>
                    </div>
                 </div>
                 <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-600 mt-0.5 shrink-0"/>
                    <div>
                      <div className="text-sm font-semibold text-blue-800">Skills Aligned</div>
                      <div className="text-xs text-blue-700">Resources match required skills.</div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 pt-6 flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="px-6 h-11 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-light"
              >
                Cancel
              </Button>
              <Button 
                className="px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-light shadow-md"
                onClick={onConfirm}
              >
                Commit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};