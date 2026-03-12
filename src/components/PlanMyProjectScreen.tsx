import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from './ui/avatar';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import SyncOutlined from '@mui/icons-material/SyncOutlined';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';

// ── SUPABASE & AUTH IMPORTS ──
import { supabase } from '../lib/supabase'; 
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentOrgId } from '@/lib/orgContext';

// ── CHILD COMPONENTS ──
import { PlanHeader } from './planproject/PlanHeader';
import { TaskStats } from './planproject/TaskStats';
import { TaskBreakdown } from './planproject/TaskBreakdown';

// ── TYPES ──
import type { PlanTeamCandidate, EditableTask } from '../types';

export const PlanMyProjectScreen = () => {
    const navigate = useNavigate();
    const { user, orgId: contextOrgId } = useAuth(); // ADDED: to get secure context

    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    
    // Dynamic Context State
    const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

    // Inputs State
    const [projectTitle, setProjectTitle] = useState(''); 
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);
    const [projectDescription, setProjectDescription] = useState('');

    // Status State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState('Initializing...'); 
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [thoughtLines, setThoughtLines] = useState<string[]>([]);

    // Data State
    const [tasks, setTasks] = useState<EditableTask[]>([]);
    
    // Editing State
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ task: '', estimatedHours: 0 });
    const [showAddRow, setShowAddRow] = useState(false);
    const [addForm, setAddForm] = useState({ task: '', estimatedHours: 0 });

    // Step 2 Logic (Team Allocation)
    const [isMatchingTeam, setIsMatchingTeam] = useState(false);
    const [teamReady, setTeamReady] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
    const [teamThoughts, setTeamThoughts] = useState<string[]>([]);
    
    // Placeholder for recommended team (Will be wired to API next)
    const recommendedTeam: PlanTeamCandidate[] = []; 

    const baseUrl = import.meta.env.VITE_LLM_URL || 'http://127.0.0.1:8000';

    // ── FETCH DYNAMIC CONTEXT ON MOUNT (FIXED DISCREPANCY) ──
    useEffect(() => {
        const fetchContext = async () => {
            try {
                // Use the secure context from Auth instead of randomly picking an active org
                let orgId = contextOrgId || getCurrentOrgId();

                // Fallback: If not in local context, fetch specifically for this user
                if (!orgId && user?.email) {
                    const { data, error } = await supabase
                        .from('users')
                        .select('organization_id')
                        .eq('email', user.email)
                        .maybeSingle();

                    if (!error && data) {
                        orgId = data.organization_id;
                    }
                }

                if (orgId) {
                    setCurrentOrgId(orgId);
                } else {
                    console.warn("Could not resolve Organization ID for user.");
                }
            } catch (err) {
                console.error("Error fetching organization context:", err);
                toast.error("Failed to load organization context. Some features may not work.");
            }
        };

        fetchContext();
    }, [contextOrgId, user]);

    // ── HEALTH CHECK LOGIC ──
    const ensureBackendActive = async () => {
        let attempts = 0;
        const maxAttempts = 15;
        while (attempts < maxAttempts) {
            try {
                const res = await fetch(`${baseUrl}/`, { method: 'GET' });
                if (res.ok) return true; 
            } catch (e) {
                // Server booting
            }
            attempts++;
            setAnalysisStatus(`Waking up AI Engine (Attempt ${attempts}/${maxAttempts})...`);
            await new Promise(r => setTimeout(r, 2000));
        }
        return false;
    };

    // ── GENERATE AI PLAN ──
    const handleAnalyze = async () => {
        const text = projectDescription.trim();
        if (!text && !uploadedFileName) {
            setDescriptionError('Please enter a project description.');
            return;
        }
        
        setDescriptionError(null);
        setIsAnalyzing(true);
        setThoughtLines([]);
        setAnalysisStatus("Analyzing project requirements...");

        const analyzeThoughts = ['Analyzing requirements...', 'Structuring tasks...', 'Estimating hours...', 'Finalizing plan...'];
        let tIdx = 0;
        const tInterval = setInterval(() => {
            if (tIdx < analyzeThoughts.length) {
                setThoughtLines(p => [...p, analyzeThoughts[tIdx]]);
                tIdx++;
            }
        }, 800);

        try {
            const isAwake = await ensureBackendActive();
            if (!isAwake) throw new Error("Server failed to wake up. Please try again in 30s.");

            setAnalysisStatus("Generating breakdown...");
            const response = await fetch(`${baseUrl}/api/v1/planner/decompose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_description: text }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Analysis failed');
            }

            const data = await response.json();
            
            if (!data.suggested_tasks) throw new Error("Invalid response format from AI");

            const generatedTasks = data.suggested_tasks.map((t: any, idx: number) => ({
                id: `task-${idx}-${Date.now()}`,
                task: t.task_name,
                estimatedHours: t.estimated_hours,
                requiredSkills: t.required_skills || []
            }));

            clearInterval(tInterval);
            setTasks(generatedTasks);
            setHasAnalyzed(true);
            toast.success('Plan generated successfully!');

        } catch (error: any) {
            clearInterval(tInterval);
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ── SAVE DRAFT TO DATABASE (DYNAMIC) ──
    const handleSaveDraft = async () => {
        if (tasks.length === 0) {
            toast.error("Generate tasks before saving a draft.");
            return;
        }

        if (!currentOrgId) {
            toast.error("Organization context missing. Cannot save.");
            return;
        }

        setIsSaving(true);
        try {
            const fallbackName = uploadedFileName 
                ? `Draft: ${uploadedFileName.replace(/\.[^/.]+$/, "")}` 
                : `AI Draft - ${new Date().toLocaleDateString()}`;
                
            const finalProjectName = projectTitle.trim() !== '' ? projectTitle.trim() : fallbackName;

            // 1. Insert Parent Project using Dynamic DB Data
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .insert({
                    organization_id: currentOrgId,
                    name: finalProjectName,
                    description: projectDescription,
                    source: 'internal',
                    status: 'draft' 
                })
                .select()
                .single();

            if (projectError) throw projectError;

            // 2. Format Tasks
            const tasksToInsert = tasks.map(t => ({
                project_id: projectData.id,
                name: t.task,
                estimated_hours: t.estimatedHours,
                status: 'not_started'
            }));

            // 3. Bulk Insert Tasks
            const { error: tasksError } = await supabase
                .from('tasks')
                .insert(tasksToInsert);

            if (tasksError) throw tasksError;

            toast.success('Draft project saved successfully!');
            navigate('/projects'); 
            
        } catch (error: any) {
            console.error("Save Draft Error:", error);
            toast.error(error.message || "Failed to save draft.");
        } finally {
            setIsSaving(false);
        }
    };

    // ── UI ACTION HANDLERS ──
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFileName(file.name);
            setDescriptionError(null);
            setProjectDescription(`[Extracted from ${file.name}] Build an enterprise SaaS platform...`);
        }
    };
    
    const clearFileUpload = () => {
        setUploadedFileName(null);
        setProjectDescription('');
    }

    const handleRemoveTask = (id: string) => { setTasks(p => p.filter(t => t.id !== id)); toast.success('Task removed'); };
    const startEdit = (t: EditableTask) => { setEditingTaskId(t.id); setEditForm({ task: t.task, estimatedHours: t.estimatedHours }); };
    const saveEdit = () => {
        if (!editForm.task.trim()) return;
        setTasks(p => p.map(t => t.id === editingTaskId ? { ...t, task: editForm.task, estimatedHours: editForm.estimatedHours } : t));
        setEditingTaskId(null);
    };
    const handleAddTask = () => {
        if (!addForm.task.trim() || addForm.estimatedHours <= 0) return;
        setTasks(p => [...p, { id: `new-${Date.now()}`, task: addForm.task, estimatedHours: addForm.estimatedHours, requiredSkills: [] }]);
        setAddForm({ task: '', estimatedHours: 0 });
        setShowAddRow(false);
    };

    // ── STEP 2 NAVIGATION ──
    const teamMatchThoughts = ['Scanning skills...', 'Checking availability...', 'Optimizing match...'];
    const goToStep2 = () => {
        if (tasks.length === 0) return toast.error('Add a task first');
        setCurrentStep(2); 
        setIsMatchingTeam(true); 
        setTeamThoughts([]); 
        setTeamReady(false);
        
        teamMatchThoughts.forEach((t, i) => setTimeout(() => {
            setTeamThoughts(p => [...p, t]);
            if (i === teamMatchThoughts.length - 1) setTimeout(() => { setIsMatchingTeam(false); setTeamReady(true); }, 600);
        }, i * 700));
    };

    const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);
    
    // Keyframes
    const shimmerKeyframes = `
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes aiBreathe { 0%,100% { opacity:.45; transform:scale(1); } 50% { opacity:1; transform:scale(1.15); } }
    @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-12px) scale(1.05); } }
    @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    `;

    return (
        <div className="p-12 relative min-h-screen overflow-hidden" style={{ background: 'linear-gradient(165deg, #FAFAF9 0%, #F5F5F4 40%, #F0FDFA 100%)' }}>
            <style>{shimmerKeyframes}</style>
            <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(15,118,110,0.06) 0%, transparent 70%)', animation: 'orbFloat 8s ease-in-out infinite' }} />
            
            <div className="max-w-[1400px] mx-auto relative z-10">
                
                {/* 1. HEADER COMPONENT */}
                <PlanHeader 
                    projectTitle={projectTitle}
                    setProjectTitle={setProjectTitle}
                    projectDescription={projectDescription}
                    setProjectDescription={setProjectDescription}
                    uploadedFileName={uploadedFileName}
                    handleFileUpload={handleFileUpload}
                    clearFileUpload={clearFileUpload}
                    descriptionError={descriptionError}
                    isAnalyzing={isAnalyzing}
                    analysisStatus={analysisStatus}
                    thoughtLines={thoughtLines}
                    handleAnalyze={handleAnalyze}
                />

                {/* 2. STEP 1: RESULTS COMPONENTS */}
                {hasAnalyzed && currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        
                        <TaskStats 
                            totalHours={totalHours} 
                            taskCount={tasks.length} 
                        />

                        <TaskBreakdown 
                            tasks={tasks}
                            editingTaskId={editingTaskId}
                            editForm={editForm}
                            showAddRow={showAddRow}
                            addForm={addForm}
                            setEditForm={setEditForm}
                            setAddForm={setAddForm}
                            setShowAddRow={setShowAddRow}
                            startEdit={startEdit}
                            saveEdit={saveEdit}
                            cancelEdit={() => setEditingTaskId(null)}
                            handleRemoveTask={handleRemoveTask}
                            handleAddTask={handleAddTask}
                        />

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button 
                                variant="outline" 
                                className="flex-1 h-11 rounded-xl font-light border-[#E7E5E4] bg-white/70 hover:bg-white text-[#292524] transition-all" 
                                onClick={handleSaveDraft} 
                                disabled={isSaving || !currentOrgId}
                            >
                                {isSaving ? <SyncOutlined className="animate-spin mr-2" style={{fontSize: 16}} /> : null}
                                Save Draft
                            </Button>
                            <button
                                type="button"
                                className="flex-1 h-11 rounded-xl font-light text-white inline-flex items-center justify-center relative overflow-hidden disabled:opacity-50 transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #1C1917 0%, #292524 50%, #0F766E 100%)', boxShadow: '0 4px 14px rgba(15,118,110,0.2)' }}
                                onClick={goToStep2}
                                disabled={!currentOrgId}
                            >
                                <span className="relative z-10 inline-flex items-center">
                                    Continue to Team Allocation
                                    <ChevronRightOutlined style={{ fontSize: 18 }} className="ml-1" />
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. STEP 2: TEAM ALLOCATION */}
                {hasAnalyzed && currentStep === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        {isMatchingTeam ? (
                            <div className="relative rounded-2xl mb-10 p-[1px] [background-size:300%_300%]" style={{ backgroundImage: 'linear-gradient(135deg, #0F766E, #10B981, #A8A29E, #0F766E)', animation: 'gradientShift 2s ease infinite' }}>
                                <div className="bg-white/90 backdrop-blur-[40px] rounded-2xl p-10" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0F766E, #10B981)', boxShadow: '0 4px 12px rgba(15,118,110,0.25)' }}>
                                            <SyncOutlined style={{ fontSize: 16, color: '#fff' }} className="animate-spin" />
                                        </div>
                                        <span className="text-sm text-[#1C1917] font-light">Matching team members to your {tasks.length} tasks...</span>
                                    </div>
                                    <div className="space-y-3 pl-12">
                                        {teamThoughts.map((line, idx) => (
                                            <div key={idx} className="text-sm text-[#78716C] font-light flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : teamReady && (
                            <div className="contents">
                                <div className="grid grid-cols-12 gap-8 mb-10">
                                    {/* Left — Task summary sidebar */}
                                    <div className="col-span-4">
                                        <div className="relative rounded-2xl p-[1px] sticky top-24" style={{ background: 'linear-gradient(135deg, rgba(231,229,228,0.6), rgba(204,251,241,0.3), rgba(231,229,228,0.6))' }}>
                                            <div className="bg-white/85 backdrop-blur-[40px] rounded-2xl p-8" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                                                <h3 className="text-sm text-[#78716C] uppercase tracking-wider font-light mb-5">Task Summary</h3>
                                                <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {tasks.map(t => (
                                                        <div key={t.id} className="flex items-center justify-between py-2 border-b border-[#F5F5F4] last:border-0">
                                                            <span className="text-sm text-[#1C1917] font-light truncate flex-1 mr-3">{t.task}</span>
                                                            <span className="text-xs text-[#78716C] font-light whitespace-nowrap">{t.estimatedHours}h</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="pt-4 border-t border-[#E7E5E4] flex justify-between">
                                                    <span className="text-sm text-[#78716C] font-light">{tasks.length} tasks</span>
                                                    <span className="text-sm text-[#1C1917] font-medium">{totalHours}h</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right — Recommended team */}
                                    <div className="col-span-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-xl font-light text-[#1C1917]">Recommended Team</h2>
                                            <span className="text-xs text-[#78716C] font-light">{selectedTeam.length} selected</span>
                                        </div>
                                        
                                        {recommendedTeam.length === 0 ? (
                                            <div className="p-10 border border-dashed border-[#E7E5E4] rounded-2xl flex flex-col items-center justify-center text-center bg-white/50">
                                                <span className="text-sm text-[#78716C] font-light">API integration pending...<br/>This will show dynamic AI allocations shortly.</span>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-6">
                                                {recommendedTeam.map((member) => {
                                                    const isSelected = selectedTeam.includes(member.name);
                                                    return (
                                                        <div
                                                            key={member.name}
                                                            onClick={() => {
                                                                if (isSelected) setSelectedTeam(prev => prev.filter(n => n !== member.name));
                                                                else setSelectedTeam(prev => [...prev, member.name]);
                                                            }}
                                                            className="relative rounded-2xl p-[1px] cursor-pointer group transition-all duration-300"
                                                            style={{
                                                                background: isSelected ? 'linear-gradient(135deg, #1C1917, #0F766E)' : 'linear-gradient(135deg, #E7E5E4, #F0FDFA)',
                                                                boxShadow: isSelected ? '0 8px 24px rgba(15,118,110,0.15)' : 'none',
                                                            }}
                                                        >
                                                            <div className="bg-white rounded-2xl p-6 h-full transition-all">
                                                                {isSelected && (
                                                                    <div className="absolute top-4 right-4 text-[#0F766E]">
                                                                        <CheckCircleOutlined style={{ fontSize: 20 }} />
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-4 mb-4">
                                                                    <Avatar className="w-12 h-12 shadow-sm">
                                                                        <AvatarFallback className="text-[#1C1917] text-sm font-light bg-[#F5F5F4]">{member.avatar}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="text-[#1C1917] font-medium text-sm">{member.name}</div>
                                                                        <div className="text-[#78716C] text-xs font-light">{member.role}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-4 pt-4 border-t border-[#F5F5F4]">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs text-[#78716C] font-light">Skill Match</span>
                                                                        <span className="text-sm font-light" style={{ color: '#0F766E' }}>{member.match_percentage}%</span>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-xs text-[#78716C] font-light">Availability</span>
                                                                            <span className={`text-xs font-medium ${member.availability >= 80 ? 'text-[#0F766E]' : member.availability >= 50 ? 'text-[#D97706]' : 'text-[#BE123C]'}`}>{member.availability}%</span>
                                                                        </div>
                                                                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, #F5F5F4, #E7E5E4)' }}>
                                                                            <div
                                                                                className="h-full rounded-full transition-all duration-500"
                                                                                style={{
                                                                                    width: `${member.availability}%`,
                                                                                    background: member.availability >= 80 ? 'linear-gradient(90deg, #0F766E, #10B981)' : member.availability >= 50 ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #BE123C, #F43F5E)',
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2 Actions */}
                                <div className="flex gap-4">
                                    <Button variant="outline" className="h-11 px-8 rounded-xl font-light border-[#E7E5E4] bg-white/70 hover:bg-white text-[#292524]" onClick={() => setCurrentStep(1)}>
                                        <ArrowBackOutlined style={{ fontSize: 16 }} className="mr-2" /> Back to Tasks
                                    </Button>
                                    <Button variant="outline" className="flex-1 h-11 rounded-xl font-light border-[#E7E5E4] bg-white/70 hover:bg-white text-[#292524]" onClick={handleSaveDraft} disabled={isSaving || !currentOrgId}>
                                        {isSaving ? <SyncOutlined className="animate-spin mr-2" style={{fontSize: 16}} /> : 'Save Draft'}
                                    </Button>
                                    <button
                                        type="button"
                                        className="flex-1 h-11 rounded-xl font-light text-white inline-flex items-center justify-center relative overflow-hidden"
                                        style={{ background: 'linear-gradient(135deg, #1C1917 0%, #0F766E 100%)', boxShadow: '0 4px 14px rgba(15,118,110,0.25)' }}
                                        onClick={() => {
                                            toast.success(`Project committed with ${tasks.length} tasks`);
                                            navigate('/projects');
                                        }}
                                    >
                                        <span className="relative z-10 inline-flex items-center">
                                            <CheckOutlined style={{ fontSize: 18 }} className="mr-2" />
                                            Commit Project
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};