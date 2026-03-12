import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { toast } from 'sonner';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import SyncOutlined from '@mui/icons-material/SyncOutlined';

// ── SUPABASE IMPORT (Adjust path as needed) ──
import { supabase } from '../lib/supabase'; 

// ── CHILD COMPONENTS ──
import { PlanHeader } from './planproject/PlanHeader';
import { TaskStats } from './planproject/TaskStats';
import { TaskBreakdown } from './planproject/TaskBreakdown';

// ── TYPES ──
import type { PlanTeamCandidate } from '../types'; 
export type EditableTask = { id: string; task: string; estimatedHours: number; requiredSkills?: string[] };

export const PlanMyProjectScreen = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    
    // Dynamic Context State
    const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

    // Inputs State
    const [projectTitle, setProjectTitle] = useState('New AI Project'); 
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

    const baseUrl = import.meta.env.VITE_LLM_URL || 'http://127.0.0.1:8000';

    // ── FETCH DYNAMIC CONTEXT ON MOUNT ──
    useEffect(() => {
        const fetchContext = async () => {
            try {
                // Fetch the first active organization. 
                // In a production app, this would come from your Auth Provider (e.g., supabase.auth.getUser())
                const { data, error } = await supabase
                    .from('organizations')
                    .select('id')
                    .eq('status', 'active')
                    .limit(1)
                    .single();

                if (error) throw error;
                if (data) {
                    setCurrentOrgId(data.id);
                }
            } catch (err) {
                console.error("Error fetching organization context:", err);
                toast.error("Failed to load organization context. Some features may not work.");
            }
        };

        fetchContext();
    }, []);

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
            const generatedName = uploadedFileName 
                ? `Draft: ${uploadedFileName.replace(/\.[^/.]+$/, "")}` 
                : `AI Draft - ${new Date().toLocaleDateString()}`;

            // 1. Insert Parent Project using Dynamic DB Data
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .insert({
                    organization_id: currentOrgId, // Using the ID fetched from the DB
                    name: generatedName,
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

                {/* 2. RESULTS COMPONENTS */}
                {hasAnalyzed && currentStep === 1 && (
                    <div className="space-y-6">
                        
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
                                className="flex-1 h-11 rounded-xl font-light border-[#E7E5E4] bg-white/70 hover:bg-white text-[#292524]" 
                                onClick={handleSaveDraft} 
                                disabled={isSaving || !currentOrgId} // Disable if no DB context
                            >
                                {isSaving ? <SyncOutlined className="animate-spin mr-2" style={{fontSize: 16}} /> : null}
                                {isSaving ? 'Saving...' : 'Save Draft'}
                            </Button>
                            <button
                                type="button"
                                className="flex-1 h-11 rounded-xl font-light text-white inline-flex items-center justify-center relative overflow-hidden disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #1C1917 0%, #292524 50%, #0F766E 100%)', boxShadow: '0 4px 14px rgba(15,118,110,0.2)' }}
                                onClick={() => setCurrentStep(2)}
                                disabled={!currentOrgId} // Disable if no DB context
                            >
                                <span className="relative z-10 inline-flex items-center">
                                    Continue to Team Allocation
                                    <ChevronRightOutlined style={{ fontSize: 18 }} className="ml-1" />
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};