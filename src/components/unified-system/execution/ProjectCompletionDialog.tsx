import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { UnifiedProject, UnifiedEmployee } from '../types';
import { Trophy, TrendingUp, Clock, Download, CheckCircle2, PartyPopper } from 'lucide-react';

interface ProjectCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: UnifiedProject | null;
  team: UnifiedEmployee[];
  onConfirm: () => void;
}

export const ProjectCompletionDialog: React.FC<ProjectCompletionDialogProps> = ({ 
  open, onOpenChange, project, team, onConfirm 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'REVIEW' | 'SUCCESS'>('REVIEW');

  if (!project) return null;

  // Mock Calculation of "Actuals" vs "Estimates"
  const actualHours = Math.round(project.estimatedHours * 0.9); // Finished 10% faster
  const efficiencyGain = 12; // 12% boost
  const moneySaved = Math.round(project.estimatedHours * 45); // Mock $ saved

  const handleComplete = () => {
    setIsGenerating(true);
    // Simulate Report Generation
    setTimeout(() => {
      setIsGenerating(false);
      setStep('SUCCESS');
    }, 1500);
  };

  const handleClose = () => {
    onConfirm(); // Trigger the actual cleanup in parent
    onOpenChange(false);
    setTimeout(() => setStep('REVIEW'), 500); // Reset for next time
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        
        {step === 'REVIEW' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-indigo-700">
                <CheckCircle2 className="w-5 h-5" /> Project Retrospective
              </DialogTitle>
              <DialogDescription>
                Review performance metrics before archiving <strong>{project.title}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              {/* Stat Card 1 */}
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700 font-bold mb-1">
                  <Clock className="w-4 h-4" /> Time Saved
                </div>
                <div className="text-2xl font-black text-gray-900">{project.estimatedHours - actualHours} Hours</div>
                <div className="text-xs text-emerald-600 mt-1">Finished ahead of schedule</div>
              </div>

              {/* Stat Card 2 */}
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 text-purple-700 font-bold mb-1">
                  <TrendingUp className="w-4 h-4" /> Efficiency
                </div>
                <div className="text-2xl font-black text-gray-900">+{efficiencyGain}%</div>
                <div className="text-xs text-purple-600 mt-1">Above team average</div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
               <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Team MVP Candidates</h4>
               <div className="flex gap-2">
                 {team.slice(0, 3).map((emp, i) => (
                   <div key={emp.id} className="flex-1 bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {emp.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{emp.name}</div>
                        <div className="text-[10px] text-slate-500">{i === 0 ? "🔥 Top Code Contributor" : "✨ Most PRs Reviewed"}</div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleComplete} disabled={isGenerating} className="bg-indigo-600 text-white">
                {isGenerating ? "Generating Report..." : "Complete & Archive"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'SUCCESS' && (
           <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in spin-in-12">
                 <PartyPopper className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Completed!</h2>
              <p className="text-slate-500 mb-6">
                Resources have been released. The final report has been generated.
              </p>
              
              <div className="flex justify-center gap-3">
                 <Button variant="outline" className="gap-2">
                   <Download className="w-4 h-4" /> Download PDF Report
                 </Button>
                 <Button onClick={handleClose} className="bg-emerald-600 text-white hover:bg-emerald-700">
                   Done
                 </Button>
              </div>
           </div>
        )}

      </DialogContent>
    </Dialog>
  );
};