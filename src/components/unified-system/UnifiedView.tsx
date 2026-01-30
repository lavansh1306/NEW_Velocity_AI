import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Sparkles, Loader2, Plus, X, UploadCloud, FileText } from 'lucide-react';
import { UnifiedProject } from './types';
import { extractTextFromPDF } from '../ml-model/pdfParser'; // Import the PDF Parser

interface DraftProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (project: UnifiedProject) => void;
}

export const DraftProjectDialog: React.FC<DraftProjectDialogProps> = ({ open, onOpenChange, onSave }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // New state for upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Suggested State
  const [skills, setSkills] = useState<string[]>([]);
  const [estHours, setEstHours] = useState<number>(0);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // --- NEW: HANDLE PDF UPLOAD ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Parse PDF Text
      const text = await extractTextFromPDF(file);
      
      // 2. Set Description
      setDesc(prev => (prev ? prev + "\n\n" + text : text));
      
      // 3. Auto-Analyze immediately after upload
      handleAnalyze(text);
      
      // 4. Auto-Set Title if empty
      if (!title) {
        setTitle(file.name.replace('.pdf', ''));
      }
    } catch (err) {
      console.error("PDF Parse Error:", err);
      alert("Failed to parse PDF. Please ensure it is a text-based PDF.");
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Simulate AI Analysis of the Description
  const handleAnalyze = (textToAnalyze?: string) => {
    const content = textToAnalyze || desc;
    if (!content) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      // 1. Simple Keyword Extraction (Heuristic)
      const detectedSkills = [];
      const lower = content.toLowerCase();
      
      // Expanded keyword list for better demo
      if (lower.includes('react') || lower.includes('frontend') || lower.includes('ui')) detectedSkills.push('React');
      if (lower.includes('api') || lower.includes('node') || lower.includes('backend')) detectedSkills.push('Node.js');
      if (lower.includes('python') || lower.includes('ml') || lower.includes('ai')) detectedSkills.push('Python');
      if (lower.includes('database') || lower.includes('sql') || lower.includes('mongo')) detectedSkills.push('SQL');
      if (lower.includes('mobile') || lower.includes('flutter') || lower.includes('ios')) detectedSkills.push('Flutter');
      if (lower.includes('aws') || lower.includes('cloud') || lower.includes('deploy')) detectedSkills.push('AWS');
      
      if (detectedSkills.length === 0) detectedSkills.push('General Development');

      // 2. Estimate Hours based on length/complexity
      const wordCount = content.split(/\s+/).length;
      // Rough heuristic: 1 hour per 50 words of SRS complexity + base 20h
      const hours = Math.round(20 + (wordCount / 50));

      setSkills(Array.from(new Set(detectedSkills))); // Dedupe
      setEstHours(hours);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleSave = () => {
    const newProject: UnifiedProject = {
      id: `proj_${Date.now()}`,
      title,
      description: desc,
      status: 'QUEUED',
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
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Draft New Project</DialogTitle>
          <DialogDescription>Upload an SRS PDF or describe the project manually.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          
          {/* TITLE INPUT */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Project Title</label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Customer Support Chatbot"
              className="mt-1"
            />
          </div>
          
          {/* DESCRIPTION & UPLOAD AREA */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Requirements (SRS)</label>
              
              {/* HIDDEN FILE INPUT TRIGGER */}
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin"/> : <UploadCloud className="w-3 h-3" />}
                {isUploading ? "Parsing..." : "Upload PDF"}
              </button>
            </div>
            
            <div className="relative">
              <Textarea 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
                placeholder="Detailed description of the project..."
                className="h-40 pr-10 text-sm font-mono leading-relaxed"
              />
              
              {/* ANALYZE BUTTON (Inside Textarea) */}
              <button 
                onClick={() => handleAnalyze()}
                disabled={isAnalyzing || !desc}
                className="absolute bottom-3 right-3 p-2 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200 transition-colors shadow-sm"
                title="Auto-Analyze Scope"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* AI Results Section */}
          {(estHours > 0 || isAnalyzing) && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" /> 
                  {isAnalyzing ? "AI is Analyzing..." : "AI Estimates"}
                </h4>
                <select 
                  value={priority} 
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="text-xs border rounded p-1 bg-white"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              {isAnalyzing ? (
                 <div className="h-20 flex items-center justify-center text-xs text-slate-400">
                    Extracting skills and calculating effort...
                 </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] text-slate-400 uppercase font-bold">Recommended Tech Stack</label>
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
                     <label className="text-[10px] text-slate-400 uppercase font-bold">Est. Effort</label>
                     <div className="mt-1 flex items-center gap-2">
                       <Input 
                         type="number" 
                         value={estHours} 
                         onChange={e => setEstHours(parseInt(e.target.value))} 
                         className="w-24 h-8 text-sm font-bold text-slate-700"
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
            {isAnalyzing ? "Processing..." : "Add to Queue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};