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

// THE "RL" SCORING MODEL
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

  // 1. RUN THE ALGORITHM
  useEffect(() => {
    if (open && project) {
      setIsComputing(true);
      
      // Simulate "Thinking" time for the AI
      setTimeout(() => {
        const scored = employees.map(emp => {
          let score = 0;
          const reasons: string[] = [];

          // FACTOR 1: SKILL MATCH (40%)
          // Check how many of the project's required skills the employee has
          const skillMatches = project.requiredSkills.filter(req => 
            emp.skills.some(es => es.toLowerCase().includes(req.toLowerCase()))
          );
          const skillRatio = skillMatches.length / Math.max(project.requiredSkills.length, 1);
          score += skillRatio * 40;
          if (skillRatio > 0.5) reasons.push(`Matches ${skillMatches.length} skills`);

          // FACTOR 2: EFFICIENCY RATING (Simulated RL) (30%)
          // Base rating is 1.0. If rating is 1.2, they get full points.
          const efficiencyScore = Math.min(emp.efficiencyRating, 1.5) / 1.5; 
          score += efficiencyScore * 30;
          if (emp.efficiencyRating > 1.1) reasons.push("High Efficiency Rating");

          // FACTOR 3: CURRENT LOAD (20%)
          // Invert load: 0% load = 100 points, 100% load = 0 points
          const loadScore = Math.max(0, (100 - emp.currentLoad) / 100);
          score += loadScore * 20;
          if (emp.currentLoad < 20) reasons.push("High Availability");

          // FACTOR 4: HISTORICAL VOLUME (10%)
          const volScore = Math.min(emp.totalProjectsCompleted, 10) / 10;
          score += volScore * 10;

          return { ...emp, matchScore: Math.round(score), matchReasons: reasons };
        });

        // Sort by Score Descending
        setCandidates(scored.sort((a, b) => b.matchScore - a.matchScore));
        setIsComputing(false);
      }, 1500);
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
            Optimizing team for <strong>{project.title}</strong> based on skills, availability, and past performance.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-4">
          
          {isComputing ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-purple-600">AI</div>
              </div>
              <p className="text-sm text-slate-500 animate-pulse">Running reinforcement logic...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase mb-2">
                 <span>Recommended Candidates</span>
                 <span>Match Score</span>
              </div>

              {candidates.slice(0, 8).map((candidate, idx) => {
                const isTopPick = idx < 3; // Highlight top 3
                const isSelected = selectedIds.includes(candidate.id);

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
                          {candidate.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            {candidate.name}
                            {isTopPick && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded-full flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Top Fit</span>}
                          </div>
                          <div className="text-xs text-slate-500">{candidate.role} • Rating: {candidate.efficiencyRating.toFixed(1)}</div>
                          
                          {/* Reasons */}
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
                        <div className={`text-xl font-black ${candidate.matchScore > 80 ? 'text-emerald-600' : candidate.matchScore > 50 ? 'text-amber-500' : 'text-slate-400'}`}>
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button 
                onClick={handleConfirm} 
                disabled={selectedIds.length === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Allocate & Start Project
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};