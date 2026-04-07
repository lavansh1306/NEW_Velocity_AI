import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { toast } from 'sonner';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import SyncOutlined from '@mui/icons-material/SyncOutlined';
import { Cloud, CloudOff, Rocket } from 'lucide-react';

// ── SUPABASE & AUTH ──
import { supabase } from '../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentOrgId } from '@/lib/orgContext';

// ── CHILD COMPONENTS ──
import { PlanHeader } from './planproject/PlanHeader';
import { ScopeEstimator } from '@/components/ScopeEstimator';
import { TaskStats } from './planproject/TaskStats';
import { TaskBreakdown } from './planproject/TaskBreakdown';
import { DraftPlansList } from './manager/DraftPlansList';
import { PublishPlanModal } from './manager/PublishPlanModal';
import { PlanEmptyState } from './planproject/PlanEmptyState';
import { ML_ENGINE_URL } from '@/lib/api-config';

// ── HOOKS ──
import { useAutoSavePlan } from '@/hooks/useAutoSavePlan';

// ── TYPES ──
import type { EditableTask } from '../types';

// ─── Save Status Indicator ────────────────────────────────────────────────────

function SaveStatus({ isSaving, lastSaved, error }: { isSaving: boolean; lastSaved: Date | null; error: string | null }) {
  if (isSaving) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-[#A8A29E] font-light">
        <SyncOutlined style={{ fontSize: 12 }} className="animate-spin" />
        Saving...
      </span>
    );
  }
  if (error) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-[#BE123C] font-light">
        <CloudOff className="w-3.5 h-3.5" />
        Auto-save failed
      </span>
    );
  }
  if (lastSaved) {
    const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    const label = seconds < 5 ? 'just now' : seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`;
    return (
      <span className="flex items-center gap-1.5 text-xs text-[#0F766E] font-light">
        <Cloud className="w-3.5 h-3.5" />
        Saved {label}
      </span>
    );
  }
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const PlanMyProjectScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, orgId: contextOrgId } = useAuth();
    const taskSectionRef = useRef<HTMLDivElement>(null);
    const hasAutoAnalyzed = useRef(false);

    // ── STATE ──
    const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
    const [projectTitle, setProjectTitle] = useState(() => localStorage.getItem('v_plan_title') || '');
    const [projectDescription, setProjectDescription] = useState(() => localStorage.getItem('v_plan_description') || '');
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState('Initializing...');
    const [hasAnalyzed, setHasAnalyzed] = useState(() => localStorage.getItem('v_plan_has_analyzed') === 'true');
    const [thoughtLines, setThoughtLines] = useState<string[]>([]);
    const [tasks, setTasks] = useState<EditableTask[]>(() => {
        const saved = localStorage.getItem('v_plan_tasks');
        if (saved) {
            try { return JSON.parse(saved); } catch { return []; }
        }
        return [];
    });

    const [showPublishModal, setShowPublishModal] = useState(false);

    // Task editing state
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ task: '', estimatedHours: 0 });
    const [showAddRow, setShowAddRow] = useState(false);
    const [addForm, setAddForm] = useState({ task: '', estimatedHours: 0 });

    // ── AUTO-SAVE HOOK ──
    const {
      planId,
      setPlanId,
      isSaving: isAutoSaving,
      lastSaved,
      saveError,
      autoSave,
      flushSave,
    } = useAutoSavePlan({
      organizationId: currentOrgId,
      userId: user?.id ?? null,
    });

    // ── LOCAL STORAGE SYNC ──
    useEffect(() => {
        const savedPlanId = localStorage.getItem('v_plan_id');
        if (savedPlanId && setPlanId) {
            setPlanId(savedPlanId);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    useEffect(() => {
        if (planId) localStorage.setItem('v_plan_id', planId);
        else localStorage.removeItem('v_plan_id');
    }, [planId]);

    useEffect(() => {
        localStorage.setItem('v_plan_title', projectTitle);
    }, [projectTitle]);

    useEffect(() => {
        localStorage.setItem('v_plan_description', projectDescription);
    }, [projectDescription]);

    useEffect(() => {
        localStorage.setItem('v_plan_tasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem('v_plan_has_analyzed', String(hasAnalyzed));
    }, [hasAnalyzed]);

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

    // ── AUTO-SAVE TRIGGER ──
    // Fires whenever title, description, or tasks change — debounced 2s inside hook
    useEffect(() => {
      if (!currentOrgId || !user?.id) return;
      // Only auto-save if there's something worth saving
      if (!projectTitle.trim() && !projectDescription.trim() && tasks.length === 0) return;
      autoSave({ title: projectTitle, description: projectDescription, tasks });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectTitle, projectDescription, tasks, currentOrgId, user?.id, autoSave]);

    // ── VOICE AGENT INTEGRATION ──
    const handleAnalyze = async () => {
        if (!projectDescription.trim()) {
            setDescriptionError('Please enter a project description so the AI can generate tasks.');
            return;
        }

        setDescriptionError(null);
        setIsAnalyzing(true);
        setThoughtLines([]);
        setAnalysisStatus("Saving draft...");

        const thoughts = ['Analyzing requirements...', 'Structuring tasks...', 'Finalizing plan...'];
        let tIdx = 0;
        const tInterval = setInterval(() => {
            if (tIdx < thoughts.length) {
                setThoughtLines(p => [...p, thoughts[tIdx]]);
                tIdx++;
            }
        }, 800);

        try {
            // Save current typed data immediately before analysis starts
            await flushSave({ title: projectTitle, description: projectDescription, tasks });
            setAnalysisStatus("Analyzing requirements...");

            if (!ML_ENGINE_URL) {
                throw new Error("ML Engine URL is not configured.");
            }

            console.log(`[PlanMyProject] Connecting to: ${ML_ENGINE_URL}/api/v1/planner/decompose`);
            const response = await fetch(`${ML_ENGINE_URL}/api/v1/planner/decompose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_description: projectDescription }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[PlanMyProject] Decomposition failed:', response.status, errorData);
                throw new Error(errorData.detail || `HTTP ${response.status}: Analysis failed`);
            }

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

            // Scroll to task section
            setTimeout(() => taskSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        } catch (error) {
            toast.error("AI Engine is currently unavailable.");
        } finally {
            clearInterval(tInterval);
            setIsAnalyzing(false);
        }
    };

    const handleSaveDraft = async () => {
        if (tasks.length === 0) {
            toast.error("Generate tasks before saving a draft.");
            return;
        }
        if (!currentOrgId || !user?.id) {
            toast.error("Organization context missing. Please refresh.");
            return;
        }

        setIsSaving(true);
        try {
            await flushSave({ title: projectTitle, description: projectDescription, tasks });
            toast.success('Draft saved!');
        } catch (err: any) {
            toast.error(err.message || "Failed to save draft.");
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
      const { voiceTitle, voiceDescription, autoAnalyze } = (location.state as any) || {};
      
      if (voiceTitle || voiceDescription) {
        console.log('[PlanMyProject] Processing voice data:', { voiceTitle, voiceDescription });
        if (voiceTitle) setProjectTitle(voiceTitle);
        if (voiceDescription) setProjectDescription(voiceDescription);
        
        if (autoAnalyze && !hasAutoAnalyzed.current) {
          hasAutoAnalyzed.current = true;
          // Small delay to ensure state updates are visible before analysis
          setTimeout(() => {
            handleAnalyze();
          }, 500);
        }
        
        // Clear state to prevent re-triggering on manual navigation back
        window.history.replaceState({}, document.title);
      }
    }, [location.state, handleAnalyze]);

    // ── TASK EDITING HANDLERS ── (all preserved from original)
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

    // ── FILE HANDLERS ──
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFileName(file.name);
            setDescriptionError(null);
            setProjectDescription(prev => prev + `\n[Context from attached file: ${file.name}]`);
            toast.info(`File "${file.name}" attached for context.`);
        }
    };

    const clearFileUpload = () => {
        setUploadedFileName(null);
        toast.info("Attachment removed.");
    };

    // ── NAVIGATE TO ALLOCATION (preserved) ──
    const goToAllocation = () => {
        if (!currentOrgId) return toast.error('Organization context missing');
        navigate('/allocate-team', {
            state: { tasks, projectTitle, projectDescription, currentOrgId }
        });
    };

    // ── LOAD DRAFT ──
    const handleContinueDraft = (draft: {
      planId: string;
      title: string;
      description: string;
      tasks: Array<{ task: string; estimatedHours: number; requiredSkills: string[] }>;
    }) => {
      setPlanId(draft.planId);
      setProjectTitle(draft.title);
      setProjectDescription(draft.description);
      if (draft.tasks.length > 0) {
        setTasks(draft.tasks.map((t, i) => ({
          id: `draft-${i}-${Date.now()}`,
          task: t.task,
          estimatedHours: t.estimatedHours,
          requiredSkills: t.requiredSkills,
        })));
        setHasAnalyzed(true);
      }
      toast.success(`Resumed: ${draft.title || 'Untitled Plan'}`);
      setTimeout(() => taskSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    };

    // ── PUBLISH COMPLETE ──
    const handlePublished = (projectId: string) => {
      setShowPublishModal(false);
      
      // Clear local storage on publish
      localStorage.removeItem('v_plan_id');
      localStorage.removeItem('v_plan_title');
      localStorage.removeItem('v_plan_description');
      localStorage.removeItem('v_plan_tasks');
      localStorage.removeItem('v_plan_has_analyzed');

      navigate('/projects');
    };

    const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);
    const canPublish = planId && tasks.length > 0 && currentOrgId;

    return (
        <div className="p-12 relative min-h-screen overflow-hidden" style={{ background: 'linear-gradient(165deg, #FAFAF9 0%, #F5F5F4 40%, #F0FDFA 100%)' }}>
            <div className="max-w-[1400px] mx-auto relative z-10">

                {/* Draft plans list — shown above everything when no draft is loaded */}
                {!planId && (
                  <DraftPlansList
                    organizationId={currentOrgId}
                    userId={user?.id ?? null}
                    onContinue={handleContinueDraft}
                    activePlanId={planId}
                  />
                )}

                {/* Welcome guidance when no active plan */}
                {!planId && (
                  <PlanEmptyState onSelectPrompt={(prompt) => setProjectDescription(prompt)} />
                )}

                {/* Back button when inside a plan */}
                {planId && (
                  <button 
                    onClick={() => {
                        setPlanId(null);
                        setProjectTitle('');
                        setProjectDescription('');
                        setTasks([]);
                        setHasAnalyzed(false);
                        localStorage.removeItem('v_plan_id');
                        localStorage.removeItem('v_plan_title');
                        localStorage.removeItem('v_plan_description');
                        localStorage.removeItem('v_plan_tasks');
                        localStorage.removeItem('v_plan_has_analyzed');
                    }}
                    className="flex items-center gap-1.5 text-sm text-[#0F766E] hover:text-[#0D9488] mb-6 font-light group"
                  >
                    <ChevronRightOutlined style={{ transform: 'rotate(180deg)', fontSize: 16 }} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to All Drafts / Start New
                  </button>
                )}

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

                {/* Scope Estimator — wire below Plan header */}
                <ScopeEstimator
                    projectTitle={projectTitle}
                    projectDescription={projectDescription}
                />

                {hasAnalyzed && (
                    <div ref={taskSectionRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <TaskStats totalHours={totalHours} taskCount={tasks.length} />

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

                        {/* Action bar */}
                        <div className="flex items-center gap-4">
                            {/* Save status */}
                            <div className="min-w-[120px]">
                              <SaveStatus isSaving={isAutoSaving} lastSaved={lastSaved} error={saveError} />
                            </div>

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

                            {/* Publish button — only shown when plan is auto-saved */}
                            {canPublish && (
                              <button
                                onClick={() => setShowPublishModal(true)}
                                disabled={isAnalyzing}
                                className="flex-1 h-11 rounded-xl text-white font-light flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)' }}
                              >
                                <Rocket className="w-4 h-4" />
                                Publish Project
                              </button>
                            )}

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

            {/* Publish modal */}
            {showPublishModal && planId && currentOrgId && (
              <PublishPlanModal
                planId={planId}
                planTitle={projectTitle || 'Untitled Plan'}
                tasks={tasks}
                organizationId={currentOrgId}
                onClose={() => setShowPublishModal(false)}
                onPublished={handlePublished}
              />
            )}
        </div>
    );
};
