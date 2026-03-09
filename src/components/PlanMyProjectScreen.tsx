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
// import { planRecommendedTeam } from '../data/mockData'; // Removed mock data
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
    
    // Placeholder for recommended team until Step 2 is fully wired
    const recommendedTeam: PlanTeamCandidate[] = []; 
    
    const baseUrl = import.meta.env.VITE_LLM_URL || '[http://127.0.0.1:8000](http://127.0.0.1:8000)';

    // ── HEALTH CHECK LOGIC (The "Wake Up" Function) ──
    const ensureBackendActive = async () => {
        let attempts = 0;
        const maxAttempts = 15; // Try for ~30 seconds
        
        while (attempts < maxAttempts) {
            try {
                // Ping the root "/" endpoint
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

        // Start visual loop
        const analyzeThoughts = ['Analyzing requirements...', 'Structuring tasks...', 'Estimating hours...', 'Finalizing plan...'];
        let tIdx = 0;
        const tInterval = setInterval(() => {
            if (tIdx < analyzeThoughts.length) {
                setThoughtLines(p => [...p, analyzeThoughts[tIdx]]);
                tIdx++;
            }
        }, 800);

        try {
            // 1. WAKE UP CHECK
            const isAwake = await ensureBackendActive();
            if (!isAwake) {
                throw new Error("Server failed to wake up. Please try again in 30s.");
            }

            // 2. REAL REQUEST
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
    const handleRemoveTask = (id: string) => { setTasks(p => p.filter(t => t.id !== id)); };
    const startEdit = (t: EditableTask) => { setEditingTaskId(t.id); setEditForm({ task: t.task, estimatedHours: t.estimatedHours }); };
    const saveEdit = () => {
        if (!editForm.task.trim()) return;
        setTasks(p => p.map(t => t.id === editingTaskId ? { ...t, task: editForm.task, estimatedHours: editForm.estimatedHours } : t));
        setEditingTaskId(null);
    };
    const handleAddTask = () => {
        if (!addForm.task.trim()) return;
        setTasks(p => [...p, { id: `new-${Date.now()}`, task: addForm.task, estimatedHours: addForm.estimatedHours }]);
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

                {hasAnalyzed && (
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

                        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-8">
                            <h2 className="text-xl font-light mb-6">Task Breakdown</h2>
                            {tasks.map(t => (
                                <div key={t.id} className="flex justify-between py-3 border-b border-[#F5F5F4]">
                                    <span>{t.task}</span>
                                    <span className="text-[#78716C]">{t.estimatedHours}h</span>
                                </div>
                            ))}
                            <div className="mt-6 flex justify-end">
                                <Button onClick={goToStep2} className="bg-[#0F766E] text-white">
                                    Proceed to Allocation <ChevronRightOutlined className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};