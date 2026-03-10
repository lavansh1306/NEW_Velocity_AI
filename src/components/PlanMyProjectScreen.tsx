import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import SyncOutlined from '@mui/icons-material/SyncOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import type { PlanTeamCandidate } from '../types';

type EditableTask = { id: string; task: string; estimatedHours: number };

export const PlanMyProjectScreen = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    
    // Inputs
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);
    const [projectDescription, setProjectDescription] = useState('');

    // Status
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState('Initializing...'); 
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [thoughtLines, setThoughtLines] = useState<string[]>([]);

    // Data
    const [tasks, setTasks] = useState<EditableTask[]>([]);
    
    // Edit/Add logic
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ task: '', estimatedHours: 0 });
    const [showAddRow, setShowAddRow] = useState(false);
    const [addForm, setAddForm] = useState({ task: '', estimatedHours: 0 });

    // Step 2 logic
    const [isMatchingTeam, setIsMatchingTeam] = useState(false);
    const [teamReady, setTeamReady] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
    const [teamThoughts, setTeamThoughts] = useState<string[]>([]);
    
    const recommendedTeam: PlanTeamCandidate[] = []; 
    
    const baseUrl = import.meta.env.VITE_LLM_URL || 'http://127.0.0.1:8000';

    // ── HEALTH CHECK LOGIC ──
    const ensureBackendActive = async () => {
        let attempts = 0;
        const maxAttempts = 15;
        
        while (attempts < maxAttempts) {
            try {
                const res = await fetch(`${baseUrl}/`, { method: 'GET' });
                if (res.ok) return true; 
            } catch (e) {
                // Ignore error, server is booting
            }
            
            attempts++;
            setAnalysisStatus(`Waking up AI Engine (Attempt ${attempts}/${maxAttempts})...`);
            await new Promise(r => setTimeout(r, 2000));
        }
        return false;
    };

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
            if (!isAwake) {
                throw new Error("Server failed to wake up. Please try again in 30s.");
            }

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
            
            if (!data.suggested_tasks) {
                throw new Error("Invalid response format from AI");
            }

            const generatedTasks = data.suggested_tasks.map((t: any, idx: number) => ({
                id: `task-${idx}-${Date.now()}`,
                task: t.task_name,
                estimatedHours: t.estimated_hours
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFileName(file.name);
            setDescriptionError(null);
            setProjectDescription(`[Extracted from ${file.name}] Build an enterprise SaaS platform...`);
        }
    };

    // ── TASK EDITING HANDLERS ──
    const handleRemoveTask = (id: string) => { 
        setTasks(p => p.filter(t => t.id !== id)); 
        toast.success('Task removed');
    };
    
    const startEdit = (t: EditableTask) => { 
        setEditingTaskId(t.id); 
        setEditForm({ task: t.task, estimatedHours: t.estimatedHours }); 
    };
    
    const saveEdit = () => {
        if (!editForm.task.trim()) return;
        setTasks(p => p.map(t => t.id === editingTaskId ? { ...t, task: editForm.task, estimatedHours: editForm.estimatedHours } : t));
        setEditingTaskId(null);
    };
    
    const handleAddTask = () => {
        if (!addForm.task.trim() || addForm.estimatedHours <= 0) return;
        setTasks(p => [...p, { id: `new-${Date.now()}`, task: addForm.task, estimatedHours: addForm.estimatedHours }]);
        setAddForm({ task: '', estimatedHours: 0 });
        setShowAddRow(false);
    };

    const teamMatchThoughts = ['Scanning skills...', 'Checking availability...', 'Optimizing match...'];
    const goToStep2 = () => {
        if (tasks.length === 0) return toast.error('Add a task first');
        setCurrentStep(2); setIsMatchingTeam(true); setTeamThoughts([]); setTeamReady(false);
        teamMatchThoughts.forEach((t, i) => setTimeout(() => {
            setTeamThoughts(p => [...p, t]);
            if (i === teamMatchThoughts.length - 1) setTimeout(() => { setIsMatchingTeam(false); setTeamReady(true); }, 600);
        }, i * 700));
    };
    
    const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);
    const steps = [
        { num: 1, label: 'Define Tasks', icon: <AssignmentOutlined style={{ fontSize: 18 }} /> },
        { num: 2, label: 'Allocate Team', icon: <GroupsOutlined style={{ fontSize: 18 }} /> },
    ];
    
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
                <div className="mb-10">
                    <h1 className="text-4xl font-light tracking-tight mb-2 text-[#1C1917]">Plan My Project</h1>
                    <p className="text-sm text-[#78716C]">AI-Powered Task Decomposition & Resource Allocation</p>
                </div>

                <div className="relative rounded-2xl mb-10 p-[1px]" style={{
                     backgroundImage: isAnalyzing ? 'linear-gradient(135deg, #0F766E, #10B981)' : 'linear-gradient(135deg, #E7E5E4, #CCFBF1)',
                     animation: isAnalyzing ? 'gradientShift 2s ease infinite' : 'none'
                }}>
                    <div className="bg-white/85 backdrop-blur-[40px] rounded-2xl p-10">
                        <Label className="text-sm font-light text-[#78716C] block mb-3">Project Description</Label>
                        <Textarea 
                            value={projectDescription} 
                            onChange={e => setProjectDescription(e.target.value)} 
                            className="min-h-[140px] font-light rounded-xl border-[#E7E5E4]"
                            placeholder="Describe your project..."
                        />
                        
                        {descriptionError && <div className="text-red-500 text-sm mt-2">{descriptionError}</div>}

                        {isAnalyzing && (
                            <div className="mt-4 p-4 bg-[#F5F5F4] rounded-xl space-y-2">
                                <div className="text-[#0F766E] font-medium text-sm flex items-center gap-2">
                                    <SyncOutlined className="animate-spin" style={{ fontSize: 14 }} />
                                    {analysisStatus}
                                </div>
                                {thoughtLines.map((line, i) => (
                                    <div key={i} className="text-xs text-[#78716C] ml-6 animate-in fade-in">{line}</div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6">
                            <Button 
                                onClick={handleAnalyze} 
                                disabled={isAnalyzing}
                                className="w-full h-11 bg-[#1C1917] hover:bg-[#0F766E] transition-colors text-white"
                            >
                                {isAnalyzing ? 'Processing...' : 'Analyze with AI'}
                            </Button>
                        </div>
                    </div>
                </div>

                {hasAnalyzed && currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-6">
                            <div className="p-6 bg-white rounded-2xl border border-[#E7E5E4]">
                                <div className="text-xs text-[#78716C] uppercase">Total Effort</div>
                                <div className="text-2xl text-[#1C1917] font-light">{totalHours}h</div>
                            </div>
                            <div className="p-6 bg-white rounded-2xl border border-[#E7E5E4]">
                                <div className="text-xs text-[#78716C] uppercase">Tasks</div>
                                <div className="text-2xl text-[#1C1917] font-light">{tasks.length}</div>
                            </div>
                            <div className="p-6 bg-white rounded-2xl border border-[#E7E5E4]">
                                <div className="text-xs text-[#78716C] uppercase">Est. Duration</div>
                                <div className="text-2xl text-[#1C1917] font-light">{Math.ceil(totalHours/40)}w</div>
                            </div>
                        </div>

                        {/* ── EDITABLE TASK BREAKDOWN CARD ── */}
                        <div className="relative rounded-2xl mb-10 p-[1px]" style={{ background: 'linear-gradient(135deg, rgba(231,229,228,0.6), rgba(204,251,241,0.3), rgba(231,229,228,0.6))' }}>
                            <div className="bg-white/85 backdrop-blur-[40px] rounded-2xl p-10" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)' }}>
                                
                                {/* Header & Add Button */}
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F0FDFA, #CCFBF1)' }}>
                                            <AutoAwesomeOutlined style={{ fontSize: 16 }} className="text-[#0F766E]" />
                                        </div>
                                        <h2 className="text-xl font-light text-[#1C1917]">Generated Task Breakdown</h2>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="h-9 px-4 rounded-lg border-[#E7E5E4] bg-white/50 hover:bg-white text-[#78716C] hover:text-[#1C1917] font-light text-xs"
                                        onClick={() => setShowAddRow(true)}
                                    >
                                        <AddOutlined style={{ fontSize: 14 }} className="mr-1.5" /> Add Task
                                    </Button>
                                </div>

                                <div className="w-full">
                                    {/* Table Headers */}
                                    <div className="flex items-center pb-4 border-b border-[#E7E5E4] mb-2">
                                        <div className="flex-1 text-xs text-[#78716C] uppercase tracking-wider font-light">Task Name</div>
                                        <div className="w-28 text-right text-xs text-[#78716C] uppercase tracking-wider font-light">Est. Hours</div>
                                        <div className="w-24 text-right text-xs text-[#78716C] uppercase tracking-wider font-light">Actions</div>
                                    </div>

                                    {/* Task List */}
                                    <div className="space-y-0.5">
                                        {tasks.map((task) => (
                                            <div key={task.id} className="flex items-center py-4 border-b border-[#F5F5F4] last:border-0 hover:bg-[#F0FDFA]/30 transition-all px-2 -mx-2 rounded-lg group">
                                                {editingTaskId === task.id ? (
                                                    // Inline Edit Mode
                                                    <div className="contents">
                                                        <div className="flex-1 pr-4">
                                                            <Input className="h-8 text-sm font-light border-[#E7E5E4] bg-white rounded-lg" value={editForm.task} onChange={e => setEditForm(f => ({ ...f, task: e.target.value }))} autoFocus />
                                                        </div>
                                                        <div className="w-28 flex justify-end pr-4">
                                                            <Input type="number" className="h-8 w-20 text-sm font-light border-[#E7E5E4] bg-white rounded-lg text-right" value={editForm.estimatedHours} onChange={e => setEditForm(f => ({ ...f, estimatedHours: Number(e.target.value) }))} />
                                                        </div>
                                                        <div className="w-24 flex justify-end gap-1">
                                                            <button type="button" onClick={saveEdit} className="p-1.5 rounded-md text-[#0F766E] hover:bg-[#CCFBF1] transition-colors"><CheckOutlined style={{ fontSize: 14 }} /></button>
                                                            <button type="button" onClick={() => setEditingTaskId(null)} className="p-1.5 rounded-md bg-[#F5F5F4] text-[#78716C] hover:bg-[#E7E5E4] transition-colors"><CloseOutlined style={{ fontSize: 14 }} /></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // View Mode
                                                    <div className="contents">
                                                        <div className="flex-1 text-sm text-[#1C1917] font-light">{task.task}</div>
                                                        <div className="w-28 text-right text-sm text-[#78716C] font-light">{task.estimatedHours}h</div>
                                                        <div className="w-24 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button type="button" onClick={() => startEdit(task)} className="p-1.5 rounded-md text-[#78716C] hover:bg-[#F5F5F4] hover:text-[#1C1917] transition-colors"><AutoAwesomeOutlined style={{ fontSize: 14 }} /></button>
                                                            <button type="button" onClick={() => handleRemoveTask(task.id)} className="p-1.5 rounded-md text-[#78716C] hover:bg-[#FFF1F2] hover:text-[#BE123C] transition-colors"><CloseOutlined style={{ fontSize: 14 }} /></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add New Task Row */}
                                        {showAddRow && (
                                            <div className="flex items-center py-4 border-b border-[#F5F5F4] px-2 -mx-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #FAFAF9, #F0FDFA)' }}>
                                                <div className="flex-1 pr-4">
                                                    <Input placeholder="New task name..." className="h-8 text-sm font-light border-[#E7E5E4] bg-white rounded-lg" value={addForm.task} onChange={e => setAddForm(f => ({ ...f, task: e.target.value }))} autoFocus />
                                                </div>
                                                <div className="w-28 flex justify-end pr-4">
                                                    <Input type="number" placeholder="Hrs" className="h-8 w-20 text-sm font-light border-[#E7E5E4] bg-white rounded-lg text-right" value={addForm.estimatedHours || ''} onChange={e => setAddForm(f => ({ ...f, estimatedHours: Number(e.target.value) }))} />
                                                </div>
                                                <div className="w-24 flex justify-end gap-1">
                                                    <button type="button" onClick={handleAddTask} className="p-1.5 rounded-md text-[#0F766E] hover:bg-[#CCFBF1] transition-colors"><CheckOutlined style={{ fontSize: 14 }} /></button>
                                                    <button type="button" onClick={() => { setShowAddRow(false); setAddForm({ task: '', estimatedHours: 0 }); }} className="p-1.5 rounded-md bg-[#F5F5F4] text-[#78716C] hover:bg-[#E7E5E4] transition-colors"><CloseOutlined style={{ fontSize: 14 }} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1 h-11 rounded-xl font-light border-[#E7E5E4] bg-white/70 hover:bg-white text-[#292524]" onClick={() => toast.success('Draft saved')}>
                                Save Draft
                            </Button>
                            <button
                                type="button"
                                className="flex-1 h-11 rounded-xl font-light text-white inline-flex items-center justify-center relative overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, #1C1917 0%, #292524 50%, #0F766E 100%)', boxShadow: '0 4px 14px rgba(15,118,110,0.2)' }}
                                onClick={goToStep2}
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