import React, { useState, useEffect } from 'react';
import { ProjectCheckInput } from './ProjectCheckInput';
import { ProjectCheckDashboard } from './ProjectCheckDashboard';
import { runRecommendationModel, parseCSV } from './RecommendationEngine';
import { EmployeeRecord, PredictionResult } from './types';
import { Bot, Sparkles, Loader2, FileX } from 'lucide-react';

export default function ProjectCheckView() {
  // --- 1. DATA & STATE MANAGEMENT ---
  const [dataset, setDataset] = useState<EmployeeRecord[]>([]);
  const [results, setResults] = useState<PredictionResult[]>([]);
  
  // UI States
  const [viewMode, setViewMode] = useState<'input' | 'dashboard'>('input');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // --- 2. LOAD DATASET ON MOUNT ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const csvUrl = new URL('./datasets/master_employee_task_report.csv', import.meta.url).href;
        const data = await parseCSV(csvUrl);
        setDataset(data);
        setIsLoadingData(false);
      } catch (error) {
        console.error("ML Data Load Error:", error);
        setDataError("Could not load 'master_employee_task_report.csv'. Ensure it exists in 'components/ml-model/datasets/'.");
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  // --- 3. HANDLE ANALYSIS ---
  const handleAnalyze = async (description: string) => {
    if (dataset.length === 0) return;

    setIsAnalyzing(true);
    
    // Artificial delay for "AI Thinking" effect
    setTimeout(() => {
      try {
        const predictions = runRecommendationModel(description, dataset);
        setResults(predictions);
        setViewMode('dashboard'); // Switch View
      } catch (e) {
        console.error("Prediction Failed", e);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);
  };

  const handleReset = () => {
    setViewMode('input');
    setResults([]);
  };

  // --- 4. RENDER ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
              <Bot className="w-6 h-6 text-white" />
            </div>
            Project Check AI
          </h1>
          <p className="text-gray-500 mt-1 ml-1">
            Upload SRS documents to predict delivery risks and resource gaps.
          </p>
        </div>
        
        {viewMode === 'dashboard' && (
           <button 
             onClick={handleReset}
             className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-indigo-50"
           >
             <Sparkles className="w-4 h-4" /> New Analysis
           </button>
        )}
      </div>

      {/* Main Content Card */}
      <div className="min-h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
        
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 p-6 md:p-8">
          
          {/* Error State */}
          {dataError && (
            <div className="flex flex-col items-center justify-center h-[400px] text-red-600">
              <FileX className="w-12 h-12 mb-4" />
              <h3 className="font-bold text-lg">Dataset Error</h3>
              <p>{dataError}</p>
            </div>
          )}

          {/* Loading State */}
          {(isLoadingData || isAnalyzing) && !dataError && (
             <div className="flex flex-col items-center justify-center h-[400px] animate-in fade-in">
               <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
               <h3 className="font-bold text-xl text-slate-800">
                 {isLoadingData ? "Initializing Neural Engine..." : "Analyzing SRS Document..."}
               </h3>
               <p className="text-slate-500 mt-2">
                 {isLoadingData ? "Loading 140+ employee records" : "Matching skills against project requirements"}
               </p>
             </div>
          )}

          {/* View: INPUT */}
          {!isLoadingData && !isAnalyzing && !dataError && viewMode === 'input' && (
            <div className="max-w-3xl mx-auto py-10 animate-in slide-in-from-bottom-4 duration-500">
              <ProjectCheckInput onAnalyze={handleAnalyze} />
            </div>
          )}

          {/* View: DASHBOARD */}
          {!isLoadingData && !isAnalyzing && !dataError && viewMode === 'dashboard' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <ProjectCheckDashboard results={results} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}