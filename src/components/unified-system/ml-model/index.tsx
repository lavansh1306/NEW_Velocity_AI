import React, { useState, useEffect } from 'react';
import { ProjectCheckInput } from './ProjectCheckInput';
import { ProjectCheckDashboard } from './ProjectCheckDashboard';
import { runRecommendationModel, parseCSV } from './RecommendationEngine';
import { EmployeeRecord, PredictionResult } from './types';
import { Bot, Sparkles, Loader2, FileX } from 'lucide-react';
// IMPORT THE NEW DIALOG
import { JsonOutputDialog } from './JsonOutputDialog';

export default function ProjectCheckView() {
  const [dataset, setDataset] = useState<EmployeeRecord[]>([]);
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [projectDesc, setProjectDesc] = useState(''); 
  
  // UI States
  const [viewMode, setViewMode] = useState<'input' | 'dashboard'>('input');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // --- NEW: Output Modal State ---
  const [outputOpen, setOutputOpen] = useState(false);
  const [finalPayload, setFinalPayload] = useState<any>(null);

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

  const handleAnalyze = async (description: string) => {
    if (dataset.length === 0) return;
    setIsAnalyzing(true);
    setProjectDesc(description); 

    setTimeout(() => {
      try {
        const predictions = runRecommendationModel(description, dataset);
        setResults(predictions);
        setViewMode('dashboard');
      } catch (e) {
        console.error("Prediction Failed", e);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);
  };

  const handleConfirmProject = (selectedEmployees: EmployeeRecord[]) => {
    // 1. Construct Payload
    const payload = {
      project: {
        description: projectDesc || "Manual Project Entry",
        created_at: new Date().toISOString(),
        source: "VelocityAI_ProjectCheck",
        status: "Draft"
      },
      team: selectedEmployees.map(e => ({
        id: e.id,
        name: e.name,
        role: e.role,
        skills: e.skills,
        jira_account_id: `jira_${e.id}_${e.name.split(' ')[0]}` // Mock ID for integration
      }))
    };

    // 2. Set Data and Open Dialog
    setFinalPayload(payload);
    setOutputOpen(true);
    
    // Optional: Log to console as backup
    console.log("JIRA PAYLOAD:", payload);
  };

  const handleReset = () => {
    setViewMode('input');
    setResults([]);
    setProjectDesc('');
    setOutputOpen(false);
  };

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

      <div className="min-h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 p-6 md:p-8">
          
          {dataError && (
            <div className="flex flex-col items-center justify-center h-[400px] text-red-600">
              <FileX className="w-12 h-12 mb-4" />
              <h3 className="font-bold text-lg">Dataset Error</h3>
              <p>{dataError}</p>
            </div>
          )}

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

          {!isLoadingData && !isAnalyzing && !dataError && viewMode === 'input' && (
            <div className="max-w-3xl mx-auto py-10 animate-in slide-in-from-bottom-4 duration-500">
              <ProjectCheckInput onAnalyze={handleAnalyze} />
            </div>
          )}

          {!isLoadingData && !isAnalyzing && !dataError && viewMode === 'dashboard' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <ProjectCheckDashboard 
                results={results} 
                fullDataset={dataset} 
                onConfirmProject={handleConfirmProject} 
              />
            </div>
          )}

        </div>
      </div>

      {/* --- NEW: JSON OUTPUT DIALOG --- */}
      <JsonOutputDialog 
        open={outputOpen} 
        onOpenChange={setOutputOpen} 
        data={finalPayload} 
      />

    </div>
  );
}