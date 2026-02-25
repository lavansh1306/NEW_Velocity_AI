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
      <div>
        <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">
          Plan My Project
        </h1>
      </div>

      {/* Card Container */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-10 space-y-6 min-h-[450px] flex flex-col justify-between">
        
        {/* Project Description Label */}
        <div>
          <label className="text-sm font-medium text-[#1C1917] block mb-3">Project Description</label>
        </div>

        {/* Textarea */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your project in detail... What are the goals? What features do you need? Who is the target audience?"
          className="w-full flex-1 p-4 text-[#78716C] placeholder:text-[#A8A29E] resize-none outline-none text-base rounded-xl border border-[#E7E5E4] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-colors bg-white"
        />

        {/* Button */}
        <div className="flex items-center gap-3 mt-2">
          <Button 
            onClick={handleSubmit} 
            disabled={isAnalyzing || isParsing || !description.trim()}
            className="bg-[#1C1917] hover:bg-[#2D2520] text-white px-6 py-2.5 rounded-full font-light transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze with AI</span>
          </Button>

          {/* File Upload Trigger */}
          <div {...getRootProps()} className="cursor-pointer">
            <input {...getInputProps()} />
            <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#E7E5E4] text-[#78716C] hover:border-[#0F766E] hover:text-[#0F766E] transition-all text-sm">
              {isParsing ? (
                <span className="animate-pulse font-light">Parsing PDF...</span>
              ) : fileName ? (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span className="font-light truncate max-w-[120px]">{fileName}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFileName(null); setDescription(''); }}
                    className="hover:bg-red-100 rounded-full p-0.5 ml-1"
                  >
                    <X className="w-3 h-3 text-red-600" />
                  </button>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span className="font-light">Upload SRS (PDF)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-[#BE123C] bg-[#BE123C]/10 px-4 py-2.5 rounded-lg border border-[#BE123C]/20 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-light">{error}</span>
        </div>
      )}



    </div>
  );
};