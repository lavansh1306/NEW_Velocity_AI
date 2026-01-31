// src/components/unified-system/ideation/DraftProjectDialog.tsx

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Sparkles, Loader2, Plus, X, UploadCloud, ListTodo, Users, PlayCircle } from 'lucide-react';
import { UnifiedProject, ProjectCategory, ProjectStatus } from '../types'; 
import { extractTextFromPDF } from '../../ml-model/pdfParser';

interface DraftProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (project: UnifiedProject) => void;
}

export const DraftProjectDialog: React.FC<DraftProjectDialogProps> = ({ open, onOpenChange, onSave }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [skills, setSkills] = useState<string[]>([]);
  const [estHours, setEstHours] = useState<number>(0);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [category, setCategory] = useState<ProjectCategory>('Client Deliverable');
  const [targetStatus, setTargetStatus] = useState<ProjectStatus>('QUEUED');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const text = await extractTextFromPDF(file);
      if (!title) setTitle(file.name.replace('.pdf', ''));
      setDesc(prev => (prev ? prev + "\n\n--- IMPORTED PDF ---\n" + text : text));
      handleAnalyze(text);
    } catch (err) {
      console.error("PDF Parse Error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = (textToAnalyze?: string) => {
    const content = textToAnalyze || desc;
    if (!content) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const detectedSkills = [];
      const lower = content.toLowerCase();
      if (lower.includes('react')) detectedSkills.push('React');
      if (lower.includes('node')) detectedSkills.push('Node.js');
      if (lower.includes('python')) detectedSkills.push('Python');
      if (lower.includes('sql')) detectedSkills.push('SQL');
      
      setSkills(Array.from(new Set(detectedSkills.length ? detectedSkills : ['General Development'])));
      setEstHours(Math.round(20 + (content.length / 200)));
      setIsAnalyzing(false);
    }, 1000);
  };

  const handleSave = () => {
    onSave({
      id: `proj_${Date.now()}`,
      title,
      description: desc,
      status: targetStatus,
      category,
      requiredSkills: skills,
      estimatedHours: estHours,
      priority,
      assignedTeamIds: []
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setSkills([]);
    setEstHours(0);
    setTargetStatus('QUEUED');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-600"/> Add New Project</DialogTitle>
          <DialogDescription>Initialize project lifecycle: from planning to active tracking.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Project Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ProjectCategory)} className="mt-1 w-full h-10 px-3 rounded-md border text-sm">
                <option value="Client Deliverable">Client Project</option>
                <option value="Internal Tool">Internal Tool</option>
                <option value="R&D / POC">R&D / POC</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="text-[10px] font-bold text-indigo-600 uppercase mb-3 block">Set Initial Stage</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'QUEUED', label: 'Queue', icon: ListTodo, sub: 'Save as draft' },
                { id: 'READY_FOR_ALLOCATION', label: 'Assignment', icon: Users, sub: 'Ready for AI' },
                { id: 'ACTIVE', label: 'Execution', icon: PlayCircle, sub: 'Start Now' }
              ].map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setTargetStatus(stage.id as ProjectStatus)}
                  className={`p-3 rounded-lg border flex flex-col items-center text-center transition-all ${targetStatus === stage.id ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-100' : 'bg-transparent border-slate-200 opacity-60'}`}
                >
                  <stage.icon className={`w-5 h-5 mb-1 ${targetStatus === stage.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">{stage.label}</span>
                  <span className="text-[9px] text-slate-500">{stage.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">SRS Content / PDF</label>
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-lg p-4 mb-3 hover:bg-indigo-50 cursor-pointer flex flex-col items-center">
              <input type="file" ref={fileInputRef} accept=".pdf" className="hidden" onChange={handleFileUpload} />
              <UploadCloud className="w-5 h-5 text-indigo-400 mb-1" />
              <span className="text-xs text-slate-500">Upload PDF to auto-fill details</span>
            </div>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)} className="h-24 text-sm font-mono" placeholder="Project description..." />
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]">
            Confirm & {targetStatus === 'ACTIVE' ? 'Start' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};