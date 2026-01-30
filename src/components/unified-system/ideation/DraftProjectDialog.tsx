import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea'; // Ensure you have this or use standard textarea
import { Sparkles, Loader2, Plus, X } from 'lucide-react';
import { UnifiedProject } from '../types';

interface DraftProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (project: UnifiedProject) => void;
}

export const DraftProjectDialog: React.FC<DraftProjectDialogProps> = ({ open, onOpenChange, onSave }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // AI Suggested State
  const [skills, setSkills] = useState<string[]>([]);
  const [estHours, setEstHours] = useState<number>(0);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Simulate AI Analysis of the Description
  const handleAnalyze = () => {
    if (!desc) return;
    setIsAnalyzing(true);
    
    setTimeout(() => {
      // 1. Simple Keyword Extraction (Heuristic)
      const detectedSkills = [];
      const lower = desc.toLowerCase();
      if (lower.includes('react') || lower.includes('frontend')) detectedSkills.push('React');
      if (lower.includes('api') || lower.includes('node')) detectedSkills.push('Node.js');
      if (lower.includes('python') || lower.includes('ml')) detectedSkills.push('Python');
      if (lower.includes('database') || lower.includes('sql')) detectedSkills.push('SQL');
      if (detectedSkills.length === 0) detectedSkills.push('General Development');

      // 2. Estimate Hours based on length/complexity
      const complexity = desc.length / 10;
      const hours = Math.round(20 + complexity);

      setSkills(detectedSkills);
      setEstHours(hours);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleSave = () => {
    const newProject: UnifiedProject = {
      id: `proj_${Date.now()}`,
      title,
      description: desc,
      status: 'QUEUED', // Goes to Queue
      requiredSkills: skills,
      estimatedHours: estHours,
      priority,
      assignedTeamIds: []
    };
    onSave(newProject);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setSkills([]);
    setEstHours(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Draft New Project</DialogTitle>
          <DialogDescription>Describe the project. AI will estimate scope and skills.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Project Title</label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Customer Support Chatbot"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Requirements (SRS)</label>
            <div className="relative mt-1">
              <Textarea 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
                placeholder="Detailed description of the project..."
                className="h-32 pr-10"
              />
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !desc}
                className="absolute bottom-3 right-3 p-1.5 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200 transition-colors"
                title="Auto-Analyze Scope"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* AI Results Section */}
          {estHours > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" /> AI Estimates
                </h4>
                <select 
                  value={priority} 
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="text-xs border rounded p-1"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] text-slate-400 uppercase font-bold">Recommended Tech Stack</label>
                   <div className="flex flex-wrap gap-1 mt-1">
                     {skills.map(s => (
                       <span key={s} className="text-xs bg-white border px-2 py-1 rounded flex items-center gap-1">
                         {s} <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setSkills(s_ => s_.filter(x => x !== s))} />
                       </span>
                     ))}
                     <button onClick={() => {
                         const s = prompt("Add skill:");
                         if(s) setSkills([...skills, s]);
                     }} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100">
                       <Plus className="w-3 h-3" />
                     </button>
                   </div>
                </div>
                <div>
                   <label className="text-[10px] text-slate-400 uppercase font-bold">Est. Effort</label>
                   <div className="mt-1 flex items-center gap-2">
                     <Input 
                       type="number" 
                       value={estHours} 
                       onChange={e => setEstHours(parseInt(e.target.value))} 
                       className="w-20 h-8 text-sm"
                     />
                     <span className="text-xs text-slate-500">Hours</span>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={estHours === 0} className="bg-indigo-600 text-white">
            Add to Queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};