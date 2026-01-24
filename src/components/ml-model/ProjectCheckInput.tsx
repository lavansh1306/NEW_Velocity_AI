import React, { useState, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Search, Sparkles, FileText, UploadCloud, X, Loader2 } from 'lucide-react';
import { extractTextFromPDF } from './pdfParser';

interface ProjectCheckInputProps {
  onAnalyze: (description: string) => void;
  isAnalyzing: boolean;
}

export const ProjectCheckInput: React.FC<ProjectCheckInputProps> = ({ onAnalyze, isAnalyzing }) => {
  const [desc, setDesc] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isParsingPDF, setIsParsingPDF] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- File Handling ---
  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }

    setIsParsingPDF(true);
    setFileName(file.name);

    try {
      const text = await extractTextFromPDF(file);
      setDesc(text); // Auto-fill the textarea with PDF content
    } catch (error) {
      console.error("PDF Parse Error:", error);
      alert("Failed to read PDF. Please try again.");
      setFileName(null);
    } finally {
      setIsParsingPDF(false);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setDesc('');
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className={`p-6 border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30 transition-all ${dragActive ? 'border-indigo-400 ring-2 ring-indigo-200' : ''}`}>
      <div 
        className="flex items-start gap-4"
        onDragEnter={onDrag} 
        onDragLeave={onDrag} 
        onDragOver={onDrag} 
        onDrop={onDrop}
      >
        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">AI Resource Allocator</h3>
            <p className="text-sm text-gray-500">
              Upload your <b>SRS Document (PDF)</b> or describe the project manually. Our AI will extract requirements and match skills.
            </p>
          </div>
          
          {/* FILE UPLOAD ZONE */}
          {!fileName && (
             <div 
               className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:bg-white/80'}`}
               onClick={() => fileInputRef.current?.click()}
             >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  accept="application/pdf"
                  onChange={handleManualUpload}
                />
                <UploadCloud className={`w-8 h-8 mb-2 ${dragActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <p className="text-sm font-bold text-slate-700">Drop your SRS PDF here</p>
                <p className="text-xs text-slate-400">or click to browse</p>
             </div>
          )}

          {/* PARSING LOADER */}
          {isParsingPDF && (
            <div className="p-4 bg-indigo-50 rounded-lg flex items-center justify-center gap-3 text-indigo-700">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-bold text-sm">Extracting requirements from PDF...</span>
            </div>
          )}

          {/* TEXT PREVIEW & EDIT */}
          {fileName && !isParsingPDF && (
            <div className="space-y-2 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center bg-indigo-100 px-3 py-2 rounded-lg text-indigo-800 text-sm font-bold">
                 <span className="flex items-center gap-2"><FileText className="w-4 h-4"/> {fileName}</span>
                 <button onClick={clearFile} className="hover:bg-indigo-200 p-1 rounded-full"><X className="w-4 h-4"/></button>
              </div>
              
              <div className="relative">
                <Textarea 
                  className="min-h-[100px] bg-white text-sm resize-y border-indigo-200 focus:border-indigo-500 pr-4"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Extracted text will appear here..."
                />
                <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 bg-white px-2 rounded-full border">
                  {desc.length} chars extracted
                </div>
              </div>
            </div>
          )}

          {/* Fallback Textarea if no file is uploaded yet */}
          {!fileName && (
             <div className="relative">
                <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-slate-400">OR TYPE MANUALLY</div>
                <Textarea 
                  placeholder="E.g., We need a team for a new Fintech dashboard using React and Node.js..."
                  className="min-h-[80px] bg-white text-base resize-none border-slate-200 focus:border-indigo-500 mt-2"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
             </div>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={() => onAnalyze(desc)} 
              disabled={!desc.trim() || isAnalyzing || isParsingPDF}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-6 rounded-xl shadow-xl shadow-indigo-200 transition-all hover:scale-105"
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">Matching Talent...</span>
              ) : (
                <span className="flex items-center gap-2"><Search className="w-4 h-4"/> Find Team</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};