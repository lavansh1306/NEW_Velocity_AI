import React, { useState, useEffect } from 'react';
import { ProjectCheckInput } from './ProjectCheckInput';
import { ProjectCheckDashboard } from './ProjectCheckDashboard';
import { runRecommendationModel, parseCSV } from './RecommendationEngine';
import { EmployeeRecord, PredictionResult } from './types';
import { Bot, Sparkles, Loader2, FileX, AlertCircle } from 'lucide-react';
// IMPORT THE NEW DIALOG
import { JsonOutputDialog } from './JsonOutputDialog';
// IMPORT ML SERVICE
import { mlService, transformJiraToML, MLCandidate, MLTask } from '@/services/mlService';
import { fetchProjectsHybrid } from '@/lib/jiraDbClient';

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

  // --- ML ENGINE STATES ---
  const [mlEngineOnline, setMlEngineOnline] = useState<boolean | null>(null);
  const [mlPredictions, setMlPredictions] = useState<any>(null);
  const [bottleneckAnalysis, setBottleneckAnalysis] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // First, try to load from Jira if connected
        const jiraStatusResponse = await fetch('/api/jira/auth/status', { credentials: 'include' });
        const jiraStatus = await jiraStatusResponse.json();
        
        console.log('[ProjectCheckView] Jira status:', jiraStatus);

        if (jiraStatus.connected) {
          // Load projects from Jira
          try {
            const { projects: projectsData } = await fetchProjectsHybrid();
            if (projectsData.length > 0) {
              console.log('[ProjectCheckView] Loaded from Jira projects:', projectsData);
              
              // For now, we'll use the projects as-is
              // The ML integration will use project information when shared
              setIsLoadingData(false);
              setMlEngineOnline(true);
              return;
            }
          } catch (jiraError) {
            console.warn('[ProjectCheckView] Failed to load from Jira, falling back to CSV:', jiraError);
          }
        }

        // Fallback: Load from CSV if Jira not connected or fails
        const csvUrl = new URL('./datasets/master_employee_task_report.csv', import.meta.url).href;
        const data = await parseCSV(csvUrl);
        setDataset(data);

        // Check ML Engine Health
        const isOnline = await mlService.checkMLEngineHealth();
        setMlEngineOnline(isOnline);
        console.log('[ProjectCheckView] ML Engine Status:', isOnline ? 'Online' : 'Offline');

        setIsLoadingData(false);
      } catch (error) {
        console.error("Data Load Error:", error);
        setDataError("Could not load data from Jira or CSV. Please ensure Jira is connected or the CSV file exists.");
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleAnalyze = async (description: string) => {
    if (dataset.length === 0 && !mlEngineOnline) {
      console.error('[ProjectCheckView] No data available');
      return;
    }
    
    setIsAnalyzing(true);
    setProjectDesc(description); 

    setTimeout(async () => {
      try {
        // Get team members - either from Jira or use existing dataset
        let teamMembers = dataset;
        
        try {
          const teamResponse = await fetch('/api/jira/team-members', { credentials: 'include' });
          if (teamResponse.ok) {
            const teamData = await teamResponse.json();
            console.log('[ProjectCheckView] Fetched team members from Jira:', teamData);
            
            // If successfully fetched from Jira, use only that data
            if (teamData.teamMembers && teamData.teamMembers.length > 0) {
              // Convert Jira team format to EmployeeRecord format for local model
              teamMembers = teamData.teamMembers.map((member: any, idx: number) => ({
                id: idx,
                name: member.name,
                role: member.role_level || 'Developer',
                department: member.projects?.[0] || 'Development',
                skills: member.skills || [],
                experience: 5,
                currentLoad: member.current_load || 50,
                efficiency: 85,
                location: 'Remote',
              }));
              setDataset(teamMembers);
              console.log('[ProjectCheckView] Converted Jira team to internal format:', teamMembers.length);
            }
          }
        } catch (jiraTeamError) {
          console.warn('[ProjectCheckView] Failed to fetch from Jira, using existing dataset:', jiraTeamError);
        }

        // Run local recommendation model
        const predictions = runRecommendationModel(description, teamMembers);
        setResults(predictions);

        // If ML engine is online, get predictions from the Python backend
        if (mlEngineOnline && teamMembers.length > 0) {
          try {
            // Transform description to ML task format
            const task: MLTask = {
              title: description.substring(0, 100),
              priority: 'high',
              complexity: 2, // 0=simple, 1=moderate, 2=complex, 3=very_complex
              skills_required: ['backend', 'frontend', 'devops'],
              deadline_hours: 40, // Deadline in hours
            };

            // Convert employees to candidates for ML engine - using actual data
            const candidates: MLCandidate[] = teamMembers.map((emp: any) => ({
              id: String(emp.id), // Ensure string
              current_load: Math.round(emp.currentLoad || emp.current_load || 50), // Must be integer for ML engine
              skills: Array.isArray(emp.skills) ? emp.skills : ['general'],
              role_level: mapExperienceToRole(emp.experience), // Map experience to role level
              name: emp.name,
              availability_hours: 160 - (emp.currentLoad * 1.6), // Inverse of load
              avg_completion_time: estimateCompletionTime(emp.experience, emp.efficiency), // Estimate based on experience
            }));

            console.log('[ProjectCheckView] Sending task and candidates to ML:', { task, candidateSample: candidates[0] });

            // Get availability analysis (filter eligible employees)
            const eligibleTeam = await mlService.analyzeAvailability(task, candidates);
            setMlPredictions(eligibleTeam);
            console.log('[ProjectCheckView] ML Availability Analysis:', eligibleTeam);

            // Get bottleneck analysis (team health) - now pass task as well
            const bottlenecks = await mlService.analyzeBottlenecks(task, candidates);
            setBottleneckAnalysis(bottlenecks);
            console.log('[ProjectCheckView] Bottleneck Analysis:', bottlenecks);
          } catch (mlError) {
            console.error('[ProjectCheckView] ML Engine analysis failed:', mlError);
            // Continue with local predictions even if ML fails
          }
        }

        setViewMode('dashboard');
      } catch (e) {
        console.error("Prediction Failed", e);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);
  };

  // Helper function to map experience years to role level
  const mapExperienceToRole = (experience: number): 'junior' | 'mid' | 'senior' | 'lead' => {
    if (experience < 2) return 'junior';
    if (experience < 5) return 'mid';
    if (experience < 10) return 'senior';
    return 'lead';
  };

  // Helper function to estimate average completion time in hours
  const estimateCompletionTime = (experience: number, efficiency: number): number => {
    // Base: 40 hours for standard task
    // Adjusted by experience: senior finishes faster
    // Adjusted by efficiency: higher efficiency = faster completion
    const experienceMultiplier = Math.max(0.5, 2 - experience * 0.1);
    const efficiencyMultiplier = efficiency > 0 ? 1 / (efficiency / 100) : 1;
    return Math.round(40 * experienceMultiplier * efficiencyMultiplier);
  };

  const handleConfirmProject = async (selectedEmployees: EmployeeRecord[]) => {
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

    // 2. Train ML model if engine is online
    if (mlEngineOnline && mlPredictions && selectedEmployees.length > 0) {
      try {
        // Use first selected employee as the recommendation
        const selectedEmployeeId = selectedEmployees[0].id;
        
        // Calculate reward: 1 = perfect assignment (low load, high skill match)
        // 0 = poor assignment (high load, low skill match)
        const avgLoad = selectedEmployees.reduce((sum, emp) => {
          const mockLoad = Math.random() * 100;
          return sum + mockLoad;
        }, 0) / selectedEmployees.length;
        const reward = Math.max(0, Math.min(1, 1 - (avgLoad / 100)));

        const trainResponse = await mlService.trainModel(
          `recommendation-${Date.now()}`, // Generate unique recommendation ID
          selectedEmployeeId,
          reward
        );
        console.log('[ProjectCheckView] Model training response:', trainResponse);
      } catch (trainError) {
        console.error('[ProjectCheckView] Failed to train model:', trainError);
        // Don't fail the deployment if training fails
      }
    }

    // 3. Set Data and Open Dialog
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
        
        
        <div className="flex items-center gap-4">
          {viewMode === 'dashboard' && (
             <button 
               onClick={handleReset}
               className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-indigo-50"
             >
               <Sparkles className="w-4 h-4" /> New Analysis
             </button>
          )}
        </div>
      </div>

      <div className="min-h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 p-10 md:p-10">
          
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
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
              <ProjectCheckDashboard 
                results={results} 
                fullDataset={dataset} 
                onConfirmProject={handleConfirmProject} 
              />

              {/* ML Predictions Section */}
              {mlPredictions && Array.isArray(mlPredictions) && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bot className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-lg text-gray-900">ML Availability Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    {mlPredictions.slice(0, 5).map((employee: any, idx: number) => (
                      <div key={idx} className={`rounded-lg p-3 flex items-center justify-between ${
                        employee.is_eligible ? 'bg-white border-l-4 border-green-500' : 'bg-gray-50 border-l-4 border-gray-300'
                      }`}>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{employee.employee_id}</p>
                          <p className="text-xs text-gray-500">{employee.match_reason}</p>
                          {employee.matched_skills && employee.matched_skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {employee.matched_skills.map((skill: string, i: number) => (
                                <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${employee.is_eligible ? 'text-green-600' : 'text-gray-400'}`}>
                            {employee.match_score || 0}%
                          </p>
                          <p className="text-xs text-gray-500">{employee.is_eligible ? 'Eligible' : 'Ineligible'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottleneck Analysis Section */}
              {bottleneckAnalysis && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <h3 className="font-bold text-lg text-gray-900">System Health Analysis</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-orange-600">{bottleneckAnalysis.system_strain_score}</p>
                      <p className="text-xs text-gray-600">System Strain Score</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">{bottleneckAnalysis.overloaded_skills?.length || 0}</p>
                      <p className="text-xs text-gray-600">Overloaded Skills</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className={`text-lg font-bold ${
                        bottleneckAnalysis.health_status === 'healthy' ? 'text-green-600' :
                        bottleneckAnalysis.health_status === 'warning' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>{bottleneckAnalysis.health_status?.toUpperCase()}</p>
                      <p className="text-xs text-gray-600">Health Status</p>
                    </div>
                  </div>
                  {bottleneckAnalysis.overloaded_skills?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">Overloaded Skills:</p>
                      {bottleneckAnalysis.overloaded_skills.map((skill: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                          <span className="text-sm text-gray-700">{skill.skill}</span>
                          <span className="text-sm font-bold text-orange-600">{skill.strain_level}% strain</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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