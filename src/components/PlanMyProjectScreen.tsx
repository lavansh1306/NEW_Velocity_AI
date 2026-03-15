import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { toast } from 'sonner';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import SyncOutlined from '@mui/icons-material/SyncOutlined';

// ── SUPABASE & AUTH ──
import { supabase } from '../lib/supabase'; 
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentOrgId } from '@/lib/orgContext';

// ── CHILD COMPONENTS ──
import { PlanHeader } from './planproject/PlanHeader';
import { TaskStats } from './planproject/TaskStats';
import { TaskBreakdown } from './planproject/TaskBreakdown';

// ── TYPES ──
import type { EditableTask } from '../types';

export const PlanMyProjectScreen = () => {
    const navigate = useNavigate();
    const { user, orgId: contextOrgId } = useAuth();

    // ── STATE ──
    const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
    const [projectTitle, setProjectTitle] = useState(''); 
    const [projectDescription, setProjectDescription] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [descriptionError, setDescriptionError] = useState<string | null>(null); // Added missing state
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState('Initializing...'); 
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [thoughtLines, setThoughtLines] = useState<string[]>([]);
    const [tasks, setTasks] = useState<EditableTask[]>([]);

// 2. Add these state variables for the Breakdown Component
const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
const [editForm, setEditForm] = useState({ task: '', estimatedHours: 0 });
const [showAddRow, setShowAddRow] = useState(false);
const [addForm, setAddForm] = useState({ task: '', estimatedHours: 0 });

// 3. Define the Handler Functions
const startEdit = (t: EditableTask) => {
    setEditingTaskId(t.id);
    setEditForm({ task: t.task, estimatedHours: t.estimatedHours });
};

const cancelEdit = () => {
    setEditingTaskId(null);
    setEditForm({ task: '', estimatedHours: 0 });
};

const saveEdit = () => {
    if (!editForm.task.trim()) return;
    setTasks(prev => prev.map(t => 
        t.id === editingTaskId 
        ? { ...t, task: editForm.task, estimatedHours: editForm.estimatedHours } 
        : t
    ));
    setEditingTaskId(null);
    toast.success("Task updated");
};

const handleRemoveTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success("Task removed");
};

const handleAddTask = () => {
    if (!addForm.task.trim()) return;
    const newTask: EditableTask = {
        id: `manual-${Date.now()}`,
        task: addForm.task,
        estimatedHours: addForm.estimatedHours || 0,
        requiredSkills: []
    };
    setTasks(prev => [...prev, newTask]);
    setAddForm({ task: '', estimatedHours: 0 });
    setShowAddRow(false);
    toast.success("Task added");
};
const handleSaveDraft = async () => {
    // 1. Basic Validation
    if (tasks.length === 0) {
        toast.error("Generate tasks before saving a draft.");
        return;
    }

    if (!currentOrgId) {
        toast.error("Organization context missing. Please refresh.");
        return;
    }

    setIsSaving(true);
    try {
        // Prepare the project name
        const fallbackName = uploadedFileName 
            ? `Draft: ${uploadedFileName.replace(/\.[^/.]+$/, "")}` 
            : `AI Draft - ${new Date().toLocaleDateString()}`;
            
        const finalProjectName = projectTitle.trim() !== '' ? projectTitle.trim() : fallbackName;

        // 2. Insert into 'projects' table
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

        // 3. Insert into 'tasks' table
        // Mapping UI state keys to DB column names
        const tasksToInsert = tasks.map(t => ({
            project_id: projectData.id,
            name: t.task,             // DB column is 'name'
            estimated_hours: t.estimatedHours, // DB column is 'estimated_hours'
            status: 'not_started'
        }));

        const { error: tasksError } = await supabase
            .from('tasks')
            .insert(tasksToInsert);

        if (tasksError) throw tasksError;

        toast.success('Draft project and tasks saved successfully!');
        
        // Navigate to the projects overview page
        navigate('/projects'); 
        
    } catch (error: any) {
        console.error("Save Draft Error:", error);
        toast.error(error.message || "Failed to save draft.");
    } finally {
        setIsSaving(false);
    }
};
    const baseUrl = import.meta.env.VITE_LLM_URL || 'http://127.0.0.1:8000';

    // ── CONTEXT FETCHING ──
    useEffect(() => {
        const fetchContext = async () => {
            let orgId = contextOrgId || getCurrentOrgId();
            if (!orgId && user?.email) {
                const { data } = await supabase.from('users').select('organization_id').eq('email', user.email).maybeSingle();
                if (data) orgId = data.organization_id;
            }
            if (orgId) setCurrentOrgId(orgId);
        };
        fetchContext();
    }, [contextOrgId, user]);

    // ── FILE HANDLERS (Required by PlanHeader) ──
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFileName(file.name);
            setDescriptionError(null);
            // In a real app, you'd parse the file here. For now, we set a placeholder.
            setProjectDescription(prev => prev + `\n[Context from attached file: ${file.name}]`);
            toast.info(`File "${file.name}" attached for context.`);
        }
    };

    const clearFileUpload = () => {
        setUploadedFileName(null);
        toast.info("Attachment removed.");
    };

    // ── AI ANALYSIS ──
    const handleAnalyze = async () => {
        if (!projectDescription.trim()) {
            setDescriptionError('Please enter a project description so the AI can generate tasks.');
            return;
        }
        
        setDescriptionError(null);
        setIsAnalyzing(true);
        setThoughtLines([]);
        setAnalysisStatus("Analyzing requirements...");

        const thoughts = ['Analyzing requirements...', 'Structuring tasks...', 'Finalizing plan...'];
        let tIdx = 0;
        const tInterval = setInterval(() => {
            if (tIdx < thoughts.length) {
                setThoughtLines(p => [...p, thoughts[tIdx]]);
                tIdx++;
            }
        }, 800);

        try {
            const response = await fetch(`${baseUrl}/api/v1/planner/decompose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_description: projectDescription }),
            });

            if (!response.ok) throw new Error("Analysis failed.");

            const data = await response.json();
            const generatedTasks = data.suggested_tasks.map((t: any, idx: number) => ({
                id: `task-${idx}-${Date.now()}`,
                task: t.task_name,
                estimatedHours: t.estimated_hours,
                requiredSkills: t.required_skills || []
            }));

            setTasks(generatedTasks);
            setHasAnalyzed(true);
            toast.success('Project tasks generated!');
        } catch (error) {
            toast.error("AI Engine is currently unavailable.");
        } finally {
            clearInterval(tInterval);
            setIsAnalyzing(false);
        }
    };

    // ── NAVIGATION TO NEW SCREEN ──
    const goToAllocation = () => {
        if (!currentOrgId) return toast.error('Organization context missing');
        navigate('/allocate-team', { 
            state: { tasks, projectTitle, projectDescription, currentOrgId } 
        });
    };

    const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);

    return (
        <div className="p-12 relative min-h-screen overflow-hidden" style={{ background: 'linear-gradient(165deg, #FAFAF9 0%, #F5F5F4 40%, #F0FDFA 100%)' }}>
            <div className="max-w-[1400px] mx-auto relative z-10">
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

                {hasAnalyzed && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <TaskStats totalHours={totalHours} taskCount={tasks.length} />
                        
                        {/* Assuming TaskBreakdown handles its own internal state or uses a setTasks prop */}
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
                            handleRemoveTask={handleRemoveTask}
                            handleAddTask={handleAddTask}
                            cancelEdit={cancelEdit}
                        />
                        
                        <div className="flex gap-4">
                            <Button 
                                variant="outline" 
                                className="flex-1 h-11 rounded-xl font-light" 
                                onClick={handleSaveDraft} 
                                disabled={isSaving || isAnalyzing}
                            >
                                {isSaving ? (
                                    <SyncOutlined className="animate-spin mr-2" style={{ fontSize: 16 }} />
                                ) : null}
                                Save Draft
                            </Button>
                            <button 
                                className="flex-1 h-11 rounded-xl text-white font-light flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #1C1917 0%, #0F766E 100%)' }}
                                onClick={goToAllocation}
                            >
                                Continue to Team Allocation <ChevronRightOutlined fontSize="small" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};