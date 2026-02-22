import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PlanMyProject() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('/api/ml', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-[#FAFAF9] min-h-screen p-12 font-['Inter',sans-serif]">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[#6366F1] rounded-lg p-2">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1C1917]">Project Check AI</h1>
        </div>
        

        {/* Upload Card */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-8 shadow-sm max-w-2xl">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E7E5E4] rounded-lg p-12 cursor-pointer hover:border-[#2DD4BF] transition-colors group">
            <Upload className="w-8 h-8 text-[#A8A29E] group-hover:text-[#2DD4BF] mb-3" />
            <p className="text-[#1C1917] font-light text-base">Drop SRS documents here or click to upload</p>
            <p className="text-[#A8A29E] font-light text-sm mt-1">PDF, DOCX, or TXT files supported</p>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.docx,.txt"
            />
          </label>

          {file && (
            <div className="mt-6 p-4 bg-[#FAFAF9] rounded-lg border border-[#E7E5E4]">
              <p className="text-sm text-[#1C1917] font-light">
                📄 <span className="font-medium">{file.name}</span>
              </p>
              {isAnalyzing && (
                <div className="flex items-center gap-2 mt-3">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2DD4BF]" />
                  <p className="text-sm text-[#78716C] font-light">Analyzing...</p>
                </div>
              )}
            </div>
          )}

          {analysis && (
            <div className="mt-6 p-4 bg-[#F0FDFA] rounded-lg border border-[#CCFBF1]">
              <h3 className="text-sm font-light text-[#0F766E] mb-3">Analysis Results</h3>
              <div className="space-y-2 text-[#0F766E] font-light text-sm">
                {typeof analysis === 'string' ? (
                  <p>{analysis}</p>
                ) : (
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(analysis, null, 2)}</pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
