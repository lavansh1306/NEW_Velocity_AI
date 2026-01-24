import React, { useState, useEffect } from 'react';
import { ProjectCheckInput } from './ProjectCheckInput';
import { RecommendationCard } from './RecommendationCard';
import { runRecommendationModel, parseCSV } from './RecommendationEngine';
import { EmployeeRecord, PredictionResult } from './types';
import { BrainCircuit, Loader2, AlertCircle, FileX } from 'lucide-react';

export default function ProjectCheckView() {
  const [dataset, setDataset] = useState<EmployeeRecord[]>([]);
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // VITE SPECIFIC: This resolves the file path correctly inside src/
        const csvUrl = new URL('./datasets/master_employee_task_report.csv', import.meta.url).href;
        
        const data = await parseCSV(csvUrl);
        setDataset(data);
        setIsDataLoading(false);
      } catch (error) {
        console.error("ML Data Load Error:", error);
        setDataError("Could not load 'master_employee_task_report.csv'. Ensure it exists in 'components/ml-model/datasets/'.");
        setIsDataLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAnalysis = async (description: string) => {
    if (dataset.length === 0) return;

    setIsLoading(true);
    setHasSearched(true);
    setResults([]); 

    // Simulate Processing Delay for UX
    setTimeout(() => {
      try {
        const predictions = runRecommendationModel(description, dataset);
        setResults(predictions);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 rounded-xl">
           <BrainCircuit className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">ProjectCheck AI</h2>
          <p className="text-gray-500">Predictive Resource Allocation Engine (Powered by Live Data)</p>
        </div>
      </div>

      {/* DATA LOADING ERROR STATE */}
      {dataError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4 text-red-700">
           <FileX className="w-8 h-8 shrink-0" />
           <div>
             <h4 className="font-bold text-lg">Dataset Missing</h4>
             <p className="text-sm">{dataError}</p>
           </div>
        </div>
      )}

      {/* NORMAL STATE */}
      {!dataError && (
        <>
          <ProjectCheckInput onAnalyze={handleAnalysis} isAnalyzing={isLoading || isDataLoading} />

          {/* LOADING SPINNER */}
          {(isLoading || isDataLoading) && (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 animate-in fade-in">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
              <p>{isDataLoading ? "Initializing Dataset..." : "Running Prediction Model..."}</p>
            </div>
          )}

          {/* RESULTS */}
          {!isLoading && results.length > 0 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                AI Recommendations
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">{results.length} Matches</span>
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                {results.map((res, idx) => (
                  <RecommendationCard key={idx} result={res} />
                ))}
              </div>
            </div>
          )}

          {/* EMPTY SEARCH RESULTS */}
          {!isLoading && hasSearched && results.length === 0 && (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
              <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
              <h4 className="font-bold text-slate-600">No matching talent found</h4>
              <p className="text-sm">The model analyzed {dataset.length} records but found no employees matching your skill requirements.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}