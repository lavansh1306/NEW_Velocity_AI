import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Sparkles, Loader2, Plus, X, UploadCloud, FileText } from 'lucide-react';
import { UnifiedProject } from '../types';
import { extractTextFromPDF } from '../../ml-model/pdfParser'; // This imports your working parser

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
  
  // AI Suggested State
  const [skills, setSkills] = useState<string[]>([]);
  const [estHours, setEstHours] = useState<number>(0);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Parse PDF using your robust parser
      const text = await extractTextFromPDF(file);
      
      // 2. Auto-fill fields
      if (!title) setTitle(file.name.replace('.pdf', ''));
      
      // Append text clearly to description
      setDesc(prev => (prev ? prev + "\n\n--- IMPORTED PDF CONTENT ---\n" + text : text));
      
      // 3. Trigger Analysis immediately
      handleAnalyze(text);
      
    } catch (err) {
      console.error("PDF Parse Error:", err);
      alert("Failed to parse PDF. Please ensure it is a text-based PDF (not scanned).");
    } finally {
      setIsUploading(false);
      // Reset input to allow re-uploading the same file if needed
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = (textToAnalyze?: string) => {
    const content = textToAnalyze || desc;
    if (!content) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI extraction delay
    setTimeout(() => {
      const detectedSkills = [];
      const lower = content.toLowerCase();
      
      // Basic keyword matching heuristics
      if (lower.includes('react') || lower.includes('frontend')) detectedSkills.push('React');
      if (lower.includes('node') || lower.includes('express')) detectedSkills.push('Node.js');
      if (lower.includes('python') || lower.includes('django') || lower.includes('flask')) detectedSkills.push('Python');
      if (lower.includes('sql') || lower.includes('postgres')) detectedSkills.push('SQL');
      if (lower.includes('aws') || lower.includes('cloud')) detectedSkills.push('AWS');
      if (lower.includes('mobile') || lower.includes('flutter')) detectedSkills.push('Flutter');
      if (lower.includes('java') || lower.includes('spring')) detectedSkills.push('Java');
      
      if (detectedSkills.length === 0) detectedSkills.push('General Development');

      // Rough estimation: 20 hours base + 1 hour per 50 words
      const wordCount = content.split(/\s+/).length;
      const hours = Math.round(20 + (wordCount / 50));

      setSkills(Array.from(new Set(detectedSkills)));
      setEstHours(hours);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleSave = () => {
    onSave({
      id: `proj_${Date.now()}`,
      title,
      description: desc,
      status: 'QUEUED',
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Draft New Project</DialogTitle>
          <DialogDescription>Describe the project or upload an SRS document.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          
          {/* 1. PROJECT TITLE */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Project Title</label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. E-Commerce Platform Rewrite"
              className="mt-1"
            />
          </div>
          
          {/* 2. DESCRIPTION & UPLOAD TOOLBAR */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Requirements (SRS)</label>
            </div>

            {/* --- VISIBLE UPLOAD BOX --- */}
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-slate-200 rounded-xl p-6 mb-3 transition-all flex flex-col items-center justify-center text-center group ${
                isUploading ? 'bg-slate-50 cursor-wait' : 'hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform mb-3">
                {isUploading ? <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /> : <UploadCloud className="w-6 h-6 text-indigo-600" />}
              </div>
              <p className="text-sm font-bold text-slate-700">
                {isUploading ? "Reading PDF..." : "Click to Upload SRS (PDF)"}
              </p>
              <p className="text-xs text-slate-400 mt-1">Auto-extracts skills & estimations from text</p>
            </div>
            
            {/* TEXT AREA */}
            <div className="relative">
              <Textarea 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
                placeholder="Or type the requirements manually..."
                className="h-32 pr-10 text-sm font-mono leading-relaxed resize-none"
              />
              <button 
                onClick={() => handleAnalyze()}
                disabled={isAnalyzing || !desc}
                className="absolute bottom-3 right-3 p-2 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200 transition-colors shadow-sm"
                title="Re-run Analysis"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 3. AI ESTIMATES PANEL */}
          {(estHours > 0 || isAnalyzing) && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" /> 
                  {isAnalyzing ? "AI is Thinking..." : "AI Estimates"}
                </h4>
                <select 
                  value={priority} 
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="text-xs border rounded p-1 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              {isAnalyzing ? (
                 <div className="h-20 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                    <span>Analyzing document complexity...</span>
                 </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] text-slate-400 uppercase font-bold">Tech Stack</label>
                     <div className="flex flex-wrap gap-1 mt-1">
                       {skills.map(s => (
                         <span key={s} className="text-xs bg-white border px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                           {s} <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setSkills(s_ => s_.filter(x => x !== s))} />
                         </span>
                       ))}
                       <button onClick={() => {
                           const s = prompt("Add skill manually:");
                           if(s) setSkills([...skills, s]);
                       }} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 border border-indigo-100">
                         <Plus className="w-3 h-3" />
                       </button>
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] text-slate-400 uppercase font-bold">Est. Hours</label>
                     <div className="mt-1 flex items-center gap-2">
                       <Input 
                         type="number" 
                         value={estHours} 
                         onChange={e => setEstHours(parseInt(e.target.value))} 
                         className="w-20 h-8 text-sm font-bold text-slate-700"
                       />
                       <span className="text-xs text-slate-500">Hours</span>
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={estHours === 0 || isAnalyzing} className="bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            Add to Queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};