import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { extractTextFromPDF } from './pdfParser';
import { FileText, UploadCloud, X, Search, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface ProjectCheckInputProps {
  onAnalyze: (description: string) => void;
  isAnalyzing?: boolean;
}

export const ProjectCheckInput: React.FC<ProjectCheckInputProps> = ({ onAnalyze, isAnalyzing = false }) => {
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // --- 1. HANDLE FILE DROP ---
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("Please upload a valid PDF document.");
      return;
    }

    setFileName(file.name);
    setError(null);
    setIsParsing(true);

    try {
      // Use the robust parser we fixed earlier
      const text = await extractTextFromPDF(file);
      setDescription(prev => prev + (prev ? "\n\n" : "") + text.slice(0, 5000)); // Limit length for performance
    } catch (err) {
      console.error(err);
      setError("Failed to read PDF. It might be a scanned image.");
    } finally {
      setIsParsing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  // --- 2. SUBMIT HANDLER ---
  const handleSubmit = () => {
    if (!description.trim()) {
      setError("Please enter a description or upload an SRS document.");
      return;
    }
    onAnalyze(description);
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Header Text */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Describe Your Project
        </h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Paste your requirements or upload a PDF SRS document. Our AI will match it against 140+ employee profiles to find the perfect team.
        </p>
      </div>

      {/* Main Input Area */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. We need a team of 3 developers to build a Fintech Dashboard using React and Python. The project will start in June..."
          className="w-full h-48 p-4 text-slate-700 placeholder:text-slate-300 resize-none outline-none text-lg rounded-xl"
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 pb-4 mt-2">
          
          {/* File Upload Trigger */}
          <div {...getRootProps()} className="cursor-pointer group">
            <input {...getInputProps()} />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${fileName ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
              {isParsing ? (
                <span className="animate-pulse">Parsing PDF...</span>
              ) : fileName ? (
                <>
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-bold truncate max-w-[150px]">{fileName}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFileName(null); setDescription(''); }}
                    className="hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 group-hover:text-indigo-500" />
                  <span className="text-xs font-bold">Upload SRS (PDF)</span>
                </>
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleSubmit} 
            disabled={isAnalyzing || isParsing || !description.trim()}
            className={`
              bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-200
              ${(isAnalyzing || isParsing) ? 'opacity-70 cursor-not-allowed' : 'hover:translate-y-[-1px]'}
            `}
          >
            {isAnalyzing ? (
              "Analyzing..."
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Run AI Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-3 rounded-lg border border-rose-100 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Drop Overlay (Visual Only) */}
      {isDragActive && (
        <div className="absolute inset-0 bg-indigo-600/10 border-2 border-indigo-600 border-dashed rounded-2xl flex items-center justify-center backdrop-blur-sm z-50 pointer-events-none">
          <div className="bg-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3">
            <UploadCloud className="w-6 h-6 text-indigo-600 animate-bounce" />
            <span className="font-bold text-indigo-900">Drop PDF to Extract Requirements</span>
          </div>
        </div>
      )}

    </div>
  );
};