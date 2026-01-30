import React, { useState, useEffect } from 'react';
import { UnifiedProject, UnifiedEmployee } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { BrainCircuit, CheckCircle2, TrendingUp, AlertTriangle, User } from 'lucide-react';

interface AllocatorEngineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: UnifiedProject | null;
  employees: UnifiedEmployee[];
  onConfirmAllocation: (projectId: string, selectedEmployeeIds: number[]) => void;
}

interface ScoredEmployee extends UnifiedEmployee {
  matchScore: number;
  matchReasons: string[];
}

export const AllocatorEngine: React.FC<AllocatorEngineProps> = ({ 
  open, onOpenChange, project, employees, onConfirmAllocation 
}) => {
  const [candidates, setCandidates] = useState<ScoredEmployee[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isComputing, setIsComputing] = useState(false);

  useEffect(() => {
    if (open && project && employees.length > 0) {
      setIsComputing(true);
      
      setTimeout(() => {
        const scored = employees.map(emp => {
          let score = 0;
          const reasons: string[] = [];

          // SAFEGUARD: Ensure skills array exists
          const empSkills = emp.skills || [];
          const projSkills = project.requiredSkills || [];

          // FACTOR 1: SKILL MATCH (40%)
          // We use a looser check: verify if the string includes the keyword
          const skillMatches = projSkills.filter(req => 
            empSkills.some(es => es && typeof es === 'string' && es.toLowerCase().includes(req.toLowerCase()))
          );
          
          const skillRatio = projSkills.length > 0 ? skillMatches.length / projSkills.length : 0;
          score += skillRatio * 40;
          
          if (skillMatches.length > 0) {
            reasons.push(`Matches: ${skillMatches.slice(0, 2).join(', ')}`);
          }

          // FACTOR 2: EFFICIENCY (30%)
          // Default to 1.0 if missing
          const efficiency = emp.efficiencyRating || 1.0;
          score += (efficiency / 2) * 30; 
          if (efficiency > 1.2) reasons.push("Top Performer");

          // FACTOR 3: AVAILABILITY (20%)
          const load = emp.currentLoad || 0;
          const loadScore = Math.max(0, (100 - load) / 100);
          score += loadScore * 20;
          if (load < 30) reasons.push("Available Now");

          // FACTOR 4: EXPERIENCE (10%)
          score += Math.min((emp.totalProjectsCompleted || 0), 10);

          // BASE SCORE: Give everyone at least 10 points so they show up
          score = Math.max(10, Math.round(score));

          return { ...emp, matchScore: score, matchReasons: reasons };
        });

        // Sort: Highest Score first
        setCandidates(scored.sort((a, b) => b.matchScore - a.matchScore));
        setIsComputing(false);
      }, 800);
    } else if (open && employees.length === 0) {
        // Handle case where no employees exist
        setCandidates([]);
        setIsComputing(false);
    }
  }, [open, project, employees]);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleConfirm = () => {
    if (project) {
      onConfirmAllocation(project.id, selectedIds);
      onOpenChange(false);
      setSelectedIds([]);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-600" />
            AI Resource Allocator
          </DialogTitle>
          <DialogDescription>
            Finding best candidates for <strong>{project.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-4">
          
          {isComputing ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <LoaderSpinner />
              <p className="text-sm text-slate-500 animate-pulse">Running reinforcement logic...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p>No employees found in the database.</p>
                <p className="text-xs">Please check if the CSV data loaded correctly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase mb-2">
                 <span>Recommended Candidates ({candidates.length})</span>
                 <span>Match Score</span>
              </div>

              {candidates.map((candidate, idx) => {
                const isSelected = selectedIds.includes(candidate.id);
                // Top 3 get special styling
                const isTopPick = idx < 3 && candidate.matchScore > 40; 

                return (
                  <div 
                    key={candidate.id}
                    onClick={() => toggleSelection(candidate.id)}
                    className={`
                      relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md
                      ${isSelected ? 'border-purple-600 bg-purple-50/30' : 'border-slate-100 bg-white hover:border-purple-200'}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isTopPick ? 'bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                          {candidate.name ? candidate.name.substring(0,2).toUpperCase() : "??"}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            {candidate.name}
                            {isTopPick && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded-full flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Top Fit</span>}
                          </div>
                          <div className="text-xs text-slate-500">{candidate.role || "Developer"} • Load: {candidate.currentLoad}%</div>
                          
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {candidate.matchReasons.map((r, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xl font-black ${candidate.matchScore > 70 ? 'text-emerald-600' : candidate.matchScore > 40 ? 'text-amber-500' : 'text-slate-400'}`}>
                          {candidate.matchScore}%
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-600 ml-auto mt-1" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-500">
              <strong className="text-purple-700">{selectedIds.length}</strong> members selected
            </div>
            <Button 
              onClick={handleConfirm} 
              disabled={selectedIds.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Allocate & Start Project
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Simple Spinner Helper
const LoaderSpinner = () => (
    <div className="relative">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-purple-600">AI</div>
    </div>
);