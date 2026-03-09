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
import { planSeedTasks, planRecommendedTeam } from '../data/mockData';
import type { PlanTask, PlanTeamCandidate } from '../types';

// ── Local UI type for editable task rows ───────────────────────
type EditableTask = { id: string; task: string; estimatedHours: number };

export const PlanMyProjectScreen = () => {
    const navigate = useNavigate();

    // ── Wizard state ─────────────────────────────────────────────
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    // Step 0 — Description input
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);

    // Step 1 — AI analysis
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [thoughtLines, setThoughtLines] = useState<string[]>([]);
    const [projectDescription, setProjectDescription] = useState('');

    // Tasks (editable after AI generates them)
    const [tasks, setTasks] = useState<EditableTask[]>([]);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ task: '', estimatedHours: 0 });
    const [showAddRow, setShowAddRow] = useState(false);
    const [addForm, setAddForm] = useState({ task: '', estimatedHours: 0 });

    // Step 2 — Team allocation
    const [isMatchingTeam, setIsMatchingTeam] = useState(false);
    const [teamReady, setTeamReady] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
    const [teamThoughts, setTeamThoughts] = useState<string[]>([]);

    // ── Seed data (mapped from centralized mock data) ────────────
    const seedTasks: EditableTask[] = planSeedTasks.map(t => ({
        id: t.id,
        task: t.task_name,
        estimatedHours: t.estimated_hours,
    }));

    const recommendedTeam: PlanTeamCandidate[] = planRecommendedTeam;

    // ── Handlers ─────────────────────────────────────────────────
    const analyzeThoughts = [
        'Analyzing similar projects\u2026',
        'Mapping task structure\u2026',
        'Simulating capacity constraints\u2026',
        'Evaluating feasibility\u2026',
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFileName(file.name);
            setDescriptionError(null);
            // Simulate extracting text from uploaded document
            setProjectDescription(`[Extracted from ${file.name}] Build an enterprise SaaS platform with user authentication, role-based dashboards, real-time analytics, API integrations, and a design system. Target audience: mid-to-large enterprises. Key goals: improve operational efficiency and team collaboration.`);
        }
    };

    const handleAnalyze = () => {
        const text = projectDescription.trim();
        if (!text && !uploadedFileName) {
            setDescriptionError('Please enter a project description or upload a requirements document.');
            return;
        }
        if (text.length < 50 && !uploadedFileName) {
            setDescriptionError('Need more data to run this request. Please provide a more detailed description or upload a requirements document.');
            return;
        }
        setDescriptionError(null);
        setIsAnalyzing(true);
        setThoughtLines([]);
        analyzeThoughts.forEach((thought, idx) => {
            setTimeout(() => {
                setThoughtLines(prev => [...prev, thought]);
                if (idx === analyzeThoughts.length - 1) {
                    setTimeout(() => {
                        setIsAnalyzing(false);
                        setHasAnalyzed(true);
                        setTasks(seedTasks);
                    }, 600);
                }
            }, idx * 800);
        });
    };

    const handleRemoveTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        toast.success('Task removed');
    };

    const startEdit = (t: EditableTask) => {
        setEditingTaskId(t.id);
        setEditForm({ task: t.task, estimatedHours: t.estimatedHours });
    };

    const saveEdit = () => {
        if (!editForm.task.trim()) return;
        setTasks(prev => prev.map(t =>
            t.id === editingTaskId ? { ...t, task: editForm.task, estimatedHours: editForm.estimatedHours } : t
        ));
        setEditingTaskId(null);
    };

    const handleAddTask = () => {
        if (!addForm.task.trim() || addForm.estimatedHours <= 0) return;
        setTasks(prev => [...prev, {
            id: `t-custom-${Date.now()}`,
            task: addForm.task,
            estimatedHours: addForm.estimatedHours,
        }]);
        setAddForm({ task: '', estimatedHours: 0 });
        setShowAddRow(false);
        toast.success('Task added');
    };

    const teamMatchThoughts = [
        'Scanning team skill profiles\u2026',
        'Cross-referencing task requirements\u2026',
        'Checking capacity for next 8 weeks\u2026',
        'Ranking best-fit allocations\u2026',
    ];

    const goToStep2 = () => {
        if (tasks.length === 0) {
            toast.error('Add at least one task before proceeding');
            return;
        }
        setCurrentStep(2);
        setIsMatchingTeam(true);
        setTeamThoughts([]);
        setTeamReady(false);
        teamMatchThoughts.forEach((thought, idx) => {
            setTimeout(() => {
                setTeamThoughts(prev => [...prev, thought]);
                if (idx === teamMatchThoughts.length - 1) {
                    setTimeout(() => {
                        setIsMatchingTeam(false);
                        setTeamReady(true);
                    }, 600);
                }
            }, idx * 700);
        });
    };

    const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);

    const steps = [
        { num: 1, label: 'Define Tasks', icon: <AssignmentOutlined style={{ fontSize: 18 }} /> },
        { num: 2, label: 'Allocate Team', icon: <GroupsOutlined style={{ fontSize: 18 }} /> },
    ];

    /* ── inline keyframes for AI shimmer / pulse ─── */
    const shimmerKeyframes = `
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes aiBreathe { 0%,100% { opacity:.45; transform:scale(1); } 50% { opacity:1; transform:scale(1.15); } }
    @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-12px) scale(1.05); } }
    @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  `;

    return (
        <div className="p-12 relative min-h-screen overflow-hidden" style={{ background: 'linear-gradient(165deg, #FAFAF9 0%, #F5F5F4 40%, #F0FDFA 100%)' }}>
            <style>{shimmerKeyframes}</style>

            {/* ── Layered ambient background ─────────────────────── */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse 60% 50% at 20% 10%, rgba(15,118,110,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(168,162,158,0.05) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 50% 0%, rgba(15,118,110,0.04) 0%, transparent 40%)',
            }} />
            <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full pointer-events-none" style={{
                background: 'radial-gradient(circle, rgba(15,118,110,0.06) 0%, transparent 70%)',
                animation: 'orbFloat 8s ease-in-out infinite',
            }} />
            <div className="absolute bottom-[-150px] left-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none" style={{
                background: 'radial-gradient(circle, rgba(168,162,158,0.06) 0%, transparent 70%)',
                animation: 'orbFloat 10s ease-in-out infinite 2s',
            }} />

            <div className="max-w-[1400px] mx-auto relative z-10">

                {/* ── Hero header ──────────────────────────────────────── */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                                background: 'linear-gradient(135deg, #0F766E 0%, #134E4A 100%)',
                                boxShadow: '0 4px 14px rgba(15,118,110,0.25)',
                            }}>
                                <AutoAwesomeOutlined style={{ fontSize: 20, color: '#fff' }} />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#FAFAF9]" style={{ animation: 'aiBreathe 2s ease-in-out infinite' }} />
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-light border" style={{
                            background: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)',
                            borderColor: '#99F6E4',
                            color: '#0F766E',
                        }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" style={{ animation: 'aiBreathe 2s ease-in-out infinite' }} />
                            AI-Powered
                        </span>
                    </div>
                    <h1 className="text-4xl font-light tracking-tight mb-2 text-[#1C1917]">
                        Plan My Project
                    </h1>
                    <p className="text-sm text-[#78716C] font-light max-w-xl">
                        Describe your project and let Velocity AI decompose it into tasks, estimate effort, and match the optimal team — all in seconds.
                    </p>
                </div>

                {/* ── Description Input Card ───────────────────────────── */}
                <div className="relative rounded-2xl mb-10 p-[1px] [background-size:300%_300%]" style={{
                    backgroundImage: isAnalyzing
                        ? 'linear-gradient(135deg, #0F766E, #10B981, #A8A29E, #0F766E)'
                        : 'linear-gradient(135deg, rgba(231,229,228,0.8), rgba(204,251,241,0.5), rgba(231,229,228,0.8))',
                    animation: isAnalyzing ? 'gradientShift 2s ease infinite' : 'gradientShift 8s ease infinite',
                }}>
                    <div className="bg-white/85 backdrop-blur-[40px] rounded-2xl p-10" style={{
                        boxShadow: '0 8px 32px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
                    }}>
                        <Label className="text-sm font-light text-[#78716C] block mb-3">Project Description</Label>

                        <div className="relative mb-5 rounded-xl overflow-hidden" style={{ border: '1px solid #E7E5E4', background: 'rgba(255,255,255,0.6)' }}>
                            <Textarea
                                placeholder="Describe your project in detail\u2026 What are the goals? What features do you need? Who is the target audience?"
                                className="min-h-[140px] font-light rounded-xl border-none focus:bg-white transition-all duration-300 resize-y pb-12"
                                style={{ background: 'transparent' }}
                                value={projectDescription}
                                onChange={e => { setProjectDescription(e.target.value); setDescriptionError(null); }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2.5" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0.7))' }}>
                                {uploadedFileName ? (
                                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{
                                        background: 'linear-gradient(135deg, #F0FDFA, #CCFBF1)',
                                        border: '1px solid #99F6E4',
                                    }}>
                                        <DescriptionOutlined style={{ fontSize: 14 }} className="text-[#0F766E]" />
                                        <span className="text-xs text-[#1C1917] font-light max-w-[180px] truncate">{uploadedFileName}</span>
                                        <button
                                            type="button"
                                            onClick={() => { setUploadedFileName(null); setProjectDescription(''); }}
                                            className="p-0.5 rounded text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                                        >
                                            <CloseOutlined style={{ fontSize: 12 }} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#78716C] hover:text-[#0F766E] hover:bg-[#F0FDFA] transition-all duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-[#0F766E] focus-within:rounded-lg">
                                        <CloudUploadOutlined style={{ fontSize: 16 }} />
                                        <span className="text-xs font-light">Upload document</span>
                                        <input type="file" className="hidden" accept=".pdf,.docx,.doc,.txt" onChange={handleFileUpload} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {descriptionError && (
                            <div className="flex items-start gap-2.5 mb-5 p-4 rounded-xl" style={{
                                background: 'linear-gradient(135deg, #FFF1F2, #FFE4E6)',
                                border: '1px solid #FECDD3',
                            }}>
                                <ErrorOutlineOutlined style={{ fontSize: 18 }} className="text-[#BE123C] mt-0.5 shrink-0" />
                                <span className="text-sm text-[#BE123C] font-light">{descriptionError}</span>
                            </div>
                        )}

                        {isAnalyzing && (
                            <div className="mb-5 p-5 rounded-2xl space-y-3 relative overflow-hidden" style={{
                                background: 'linear-gradient(135deg, #F5F5F4, #F0FDFA)',
                            }}>
                                <div className="absolute inset-0 pointer-events-none [background-size:200%_100%]" style={{
                                    backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(15,118,110,0.04) 50%, transparent 100%)',
                                    animation: 'shimmer 2s linear infinite',
                                }} />
                                {thoughtLines.map((line, idx) => (
                                    <div key={idx} className="text-sm text-[#1C1917] font-light flex items-center gap-3 relative z-10 animate-in fade-in slide-in-from-left-2 duration-500">
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{
                                            background: 'linear-gradient(135deg, #0F766E, #10B981)',
                                        }}>
                                            <SyncOutlined style={{ fontSize: 11, color: '#fff' }} className="animate-spin" />
                                        </div>
                                        {line}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            className="relative h-11 px-7 rounded-xl font-light transition-all duration-300 text-white overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed [background-size:200%_200%]"
                            style={{
                                backgroundImage: isAnalyzing
                                    ? 'linear-gradient(135deg, #0F766E 0%, #10B981 50%, #0F766E 100%)'
                                    : 'linear-gradient(135deg, #1C1917 0%, #292524 50%, #0F766E 100%)',
                                animation: isAnalyzing ? 'gradientShift 2s ease infinite' : undefined,
                                boxShadow: '0 4px 14px rgba(28,25,23,0.2), 0 1px 3px rgba(0,0,0,0.1)',
                            }}
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                        >
                            <div className="absolute inset-0 pointer-events-none [background-size:200%_100%]" style={{
                                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                                animation: 'shimmer 3s linear infinite',
                            }} />
                            {isAnalyzing ? (
                                <span className="inline-flex items-center relative z-10"><SyncOutlined style={{ fontSize: 16 }} className="mr-2 animate-spin" />Analyzing\u2026</span>
                            ) : hasAnalyzed ? (
                                <span className="inline-flex items-center relative z-10"><SyncOutlined style={{ fontSize: 16 }} className="mr-2" />Re-analyze</span>
                            ) : (
                                <span className="inline-flex items-center relative z-10"><AutoAwesomeOutlined style={{ fontSize: 16 }} className="mr-2" />Analyze with AI</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Stepper (visible after analysis) ─────────────────── */}
                {hasAnalyzed && (
                    <div className="flex items-center gap-0 mb-8 max-w-[380px]">
                        {steps.map((s, idx) => (
                            <div key={s.num} className="contents">
                                <button
                                    type="button"
                                    onClick={() => { if (s.num === 1 && currentStep === 2) setCurrentStep(1); }}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 ${currentStep > s.num
                                        ? 'text-[#0F766E] border border-[#CCFBF1]'
                                        : currentStep < s.num
                                            ? 'bg-white/60 text-[#A8A29E] border border-[#E7E5E4]'
                                            : ''
                                        }`}
                                    style={currentStep === s.num ? {
                                        background: 'linear-gradient(135deg, #1C1917 0%, #0F766E 100%)',
                                        color: '#fff',
                                        boxShadow: '0 4px 14px rgba(15,118,110,0.25)',
                                    } : currentStep > s.num ? {
                                        background: 'linear-gradient(135deg, #F0FDFA, #CCFBF1)',
                                    } : {}}
                                >
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === s.num
                                        ? 'bg-white/20 text-white'
                                        : currentStep > s.num
                                            ? 'bg-[#0F766E] text-white'
                                            : 'bg-[#F5F5F4] text-[#A8A29E]'
                                        }`}>
                                        {currentStep > s.num ? <CheckOutlined style={{ fontSize: 11 }} /> : s.num}
                                    </div>
                                    <span className="text-xs font-light whitespace-nowrap">{s.label}</span>
                                </button>
                                {idx < steps.length - 1 && (
                                    <div className="w-8 mx-1.5 rounded-full transition-colors duration-300" style={{
                                        background: currentStep > 1
                                            ? 'linear-gradient(90deg, #0F766E, #10B981)'
                                            : '#E7E5E4',
                                        height: currentStep > 1 ? '2px' : '1px',
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ══════════════ STEP 1 — DEFINE TASKS ══════════════ */}
                {hasAnalyzed && currentStep === 1 && (
                    <div className="contents">
                        {/* KPI summary */}
                        <div className="grid grid-cols-3 gap-6 mb-10">
                            {[
                                { label: 'Feasibility Score', value: '87', sub: 'High feasibility with current team capacity', footnote: 'Model confidence: 91%', accent: true },
                                { label: 'Est. Duration', value: '8w', sub: 'Estimated completion: Apr 24, 2026', footnote: null, accent: false },
                                { label: 'Total Effort', value: `${totalHours}h`, sub: `Across ${tasks.length} tasks`, footnote: null, accent: false },
                            ].map((kpi) => (
                                <div key={kpi.label} className="relative group h-full">
                                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                                        background: kpi.accent
                                            ? 'linear-gradient(135deg, rgba(15,118,110,0.08) 0%, transparent 100%)'
                                            : 'linear-gradient(135deg, rgba(168,162,158,0.06) 0%, transparent 100%)',
                                    }} />
                                    <div className="relative bg-white/80 backdrop-blur-[40px] rounded-2xl p-8 border-[0.5px] border-[#E7E5E4] transition-all duration-300 group-hover:shadow-lg group-hover:border-transparent h-full flex flex-col" style={{
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                                    }}>
                                        <div className="text-xs text-[#78716C] font-light mb-4 uppercase tracking-wider">{kpi.label}</div>
                                        <div className="flex items-center gap-5 flex-1">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{
                                                background: kpi.accent
                                                    ? 'linear-gradient(135deg, #F0FDFA, #CCFBF1)'
                                                    : 'linear-gradient(135deg, #FAFAF9, #F5F5F4)',
                                                boxShadow: kpi.accent ? '0 2px 8px rgba(15,118,110,0.1)' : 'none',
                                            }}>
                                                <span className={`text-2xl font-light ${kpi.accent ? 'text-[#0F766E]' : 'text-[#1C1917]'}`}>{kpi.value}</span>
                                            </div>
                                            <div className="text-sm text-[#78716C] font-light flex-1 leading-relaxed">{kpi.sub}</div>
                                        </div>
                                        {kpi.footnote && <div className="text-xs text-[#A8A29E] font-light mt-3">{kpi.footnote}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Editable task breakdown */}
                        <div className="relative rounded-2xl mb-10 p-[1px]" style={{
                            background: 'linear-gradient(135deg, rgba(231,229,228,0.6), rgba(204,251,241,0.3), rgba(231,229,228,0.6))',
                        }}>
                            <div className="bg-white/85 backdrop-blur-[40px] rounded-2xl p-10" style={{
                                boxShadow: '0 8px 32px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
                            }}>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                                            background: 'linear-gradient(135deg, #F0FDFA, #CCFBF1)',
                                        }}>
                                            <AutoAwesomeOutlined style={{ fontSize: 16 }} className="text-[#0F766E]" />
                                        </div>
                                        <h2 className="text-xl font-light text-[#1C1917]">Generated Task Breakdown</h2>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="h-9 px-4 rounded-lg border-[#E7E5E4] bg-white/50 hover:bg-white text-[#78716C] hover:text-[#1C1917] font-light text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
                                        onClick={() => setShowAddRow(true)}
                                    >
                                        <AddOutlined style={{ fontSize: 14 }} className="mr-1.5" />
                                        Add Task
                                    </Button>
                                </div>

                                <div className="w-full">
                                    <div className="flex items-center pb-4 border-b border-[#E7E5E4] mb-2">
                                        <div className="flex-1 text-xs text-[#78716C] uppercase tracking-wider font-light">Task Name</div>
                                        <div className="w-28 text-right text-xs text-[#78716C] uppercase tracking-wider font-light">Est. Hours</div>
                                        <div className="w-24 text-right text-xs text-[#78716C] uppercase tracking-wider font-light">Actions</div>
                                    </div>

                                    <div className="space-y-0.5">
                                        {tasks.map((task) => (
                                            <div key={task.id} className="flex items-center py-4 border-b border-[#F5F5F4] last:border-0 hover:bg-[#F0FDFA]/30 transition-all px-2 -mx-2 rounded-lg group">
                                                {editingTaskId === task.id ? (
                                                    <div className="contents">
                                                        <div className="flex-1 pr-4">
                                                            <Input className="h-8 text-sm font-light border-[#E7E5E4] bg-white rounded-lg" value={editForm.task} onChange={e => setEditForm(f => ({ ...f, task: e.target.value }))} autoFocus />
                                                        </div>
                                                        <div className="w-28 flex justify-end pr-4">
                                                            <Input type="number" className="h-8 w-20 text-sm font-light border-[#E7E5E4] bg-white rounded-lg text-right" value={editForm.estimatedHours} onChange={e => setEditForm(f => ({ ...f, estimatedHours: Number(e.target.value) }))} />
                                                        </div>
                                                        <div className="w-24 flex justify-end gap-1">
                                                            <button type="button" onClick={saveEdit} className="p-1.5 rounded-md text-[#0F766E] hover:bg-[#CCFBF1] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]" style={{ background: 'linear-gradient(135deg, #F0FDFA, #CCFBF1)' }}><CheckOutlined style={{ fontSize: 14 }} /></button>
                                                            <button type="button" onClick={() => setEditingTaskId(null)} className="p-1.5 rounded-md bg-[#F5F5F4] text-[#78716C] hover:bg-[#E7E5E4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"><CloseOutlined style={{ fontSize: 14 }} /></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="contents">
                                                        <div className="flex-1 text-sm text-[#1C1917] font-light">{task.task}</div>
                                                        <div className="w-28 text-right text-sm text-[#78716C] font-light">{task.estimatedHours}h</div>
                                                        <div className="w-24 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button type="button" onClick={() => startEdit(task)} className="p-1.5 rounded-md text-[#78716C] hover:bg-[#F5F5F4] hover:text-[#1C1917] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]" aria-label={`Edit ${task.task}`}><AutoAwesomeOutlined style={{ fontSize: 14 }} /></button>
                                                            <button type="button" onClick={() => handleRemoveTask(task.id)} className="p-1.5 rounded-md text-[#78716C] hover:bg-[#FFF1F2] hover:text-[#BE123C] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]" aria-label={`Remove ${task.task}`}><CloseOutlined style={{ fontSize: 14 }} /></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {showAddRow && (
                                            <div className="flex items-center py-4 border-b border-[#F5F5F4] px-2 -mx-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #FAFAF9, #F0FDFA)' }}>
                                                <div className="flex-1 pr-4">
                                                    <Input placeholder="New task name\u2026" className="h-8 text-sm font-light border-[#E7E5E4] bg-white rounded-lg" value={addForm.task} onChange={e => setAddForm(f => ({ ...f, task: e.target.value }))} autoFocus />
                                                </div>
                                                <div className="w-28 flex justify-end pr-4">
                                                    <Input type="number" placeholder="Hrs" className="h-8 w-20 text-sm font-light border-[#E7E5E4] bg-white rounded-lg text-right" value={addForm.estimatedHours || ''} onChange={e => setAddForm(f => ({ ...f, estimatedHours: Number(e.target.value) }))} />
                                                </div>
                                                <div className="w-24 flex justify-end gap-1">
                                                    <button type="button" onClick={handleAddTask} className="p-1.5 rounded-md text-[#0F766E] hover:bg-[#CCFBF1] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]" style={{ background: 'linear-gradient(135deg, #F0FDFA, #CCFBF1)' }}><CheckOutlined style={{ fontSize: 14 }} /></button>
                                                    <button type="button" onClick={() => { setShowAddRow(false); setAddForm({ task: '', estimatedHours: 0 }); }} className="p-1.5 rounded-md bg-[#F5F5F4] text-[#78716C] hover:bg-[#E7E5E4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"><CloseOutlined style={{ fontSize: 14 }} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#E7E5E4]">
                                        <span className="text-sm text-[#78716C] font-light">{tasks.length} tasks</span>
                                        <span className="text-sm text-[#1C1917] font-medium">{totalHours}h total estimated effort</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 1 actions */}
                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1 h-11 rounded-xl font-light border-[#E7E5E4] bg-white/70 backdrop-blur-sm hover:bg-white transition-all duration-300 text-[#292524] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2" onClick={() => toast.success('Draft saved')}>
                                Save Draft
                            </Button>
                            <button
                                type="button"
                                className="flex-1 h-11 rounded-xl font-light transition-all duration-300 text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 inline-flex items-center justify-center relative overflow-hidden [background-size:200%_200%]"
                                style={{
                                    backgroundImage: 'linear-gradient(135deg, #1C1917 0%, #292524 50%, #0F766E 100%)',
                                    boxShadow: '0 4px 14px rgba(15,118,110,0.2)',
                                }}
                                onClick={goToStep2}
                            >
                                <div className="absolute inset-0 pointer-events-none [background-size:200%_100%]" style={{
                                    backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                                    animation: 'shimmer 3s linear infinite',
                                }} />
                                <span className="relative z-10 inline-flex items-center">
                                    Continue to Team Allocation
                                    <ChevronRightOutlined style={{ fontSize: 18 }} className="ml-1" />
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ══════════════ STEP 2 — ALLOCATE TEAM ══════════════ */}
                {hasAnalyzed && currentStep === 2 && (
                    <div className="contents">
                        {isMatchingTeam && (
                            <div className="relative rounded-2xl mb-10 p-[1px] [background-size:300%_300%]" style={{
                                backgroundImage: 'linear-gradient(135deg, #0F766E, #10B981, #A8A29E, #0F766E)',
                                animation: 'gradientShift 2s ease infinite',
                            }}>
                                <div className="bg-white/90 backdrop-blur-[40px] rounded-2xl p-10" style={{
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
                                }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                                            background: 'linear-gradient(135deg, #0F766E, #10B981)',
                                            boxShadow: '0 4px 12px rgba(15,118,110,0.25)',
                                        }}>
                                            <AutoAwesomeOutlined style={{ fontSize: 16, color: '#fff' }} />
                                        </div>
                                        <span className="text-sm text-[#1C1917] font-light">Matching team members to your {tasks.length} tasks\u2026</span>
                                    </div>
                                    <div className="space-y-3 pl-12">
                                        {teamThoughts.map((line, idx) => (
                                            <div key={idx} className="text-sm text-[#78716C] font-light flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{
                                                    background: 'linear-gradient(135deg, #0F766E, #10B981)',
                                                }}>
                                                    <SyncOutlined style={{ fontSize: 11, color: '#fff' }} className="animate-spin" />
                                                </div>
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {teamReady && (
                            <div className="contents">
                                <div className="grid grid-cols-12 gap-8 mb-10">
                                    {/* Left — Task summary sidebar */}
                                    <div className="col-span-4">
                                        <div className="relative rounded-2xl p-[1px] sticky top-24" style={{
                                            background: 'linear-gradient(135deg, rgba(231,229,228,0.6), rgba(204,251,241,0.3), rgba(231,229,228,0.6))',
                                        }}>
                                            <div className="bg-white/85 backdrop-blur-[40px] rounded-2xl p-8" style={{
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                                            }}>
                                                <h3 className="text-sm text-[#78716C] uppercase tracking-wider font-light mb-5">Task Summary</h3>
                                                <div className="space-y-3 mb-6">
                                                    {tasks.map(t => (
                                                        <div key={t.id} className="flex items-center justify-between py-2">
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
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                                                    background: 'linear-gradient(135deg, #F0FDFA, #CCFBF1)',
                                                }}>
                                                    <GroupsOutlined style={{ fontSize: 16 }} className="text-[#0F766E]" />
                                                </div>
                                                <h2 className="text-xl font-light text-[#1C1917]">Recommended Team</h2>
                                            </div>
                                            <span className="text-xs text-[#78716C] font-light">{selectedTeam.length} of {recommendedTeam.length} selected</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            {recommendedTeam.map((member) => {
                                                const isSelected = selectedTeam.includes(member.name);
                                                const matchedTasks = member.task_fit.filter(tf => tasks.some(t => t.task === tf));
                                                return (
                                                    <div
                                                        key={member.name}
                                                        onClick={() => {
                                                            if (isSelected) setSelectedTeam(prev => prev.filter(n => n !== member.name));
                                                            else setSelectedTeam(prev => [...prev, member.name]);
                                                        }}
                                                        className="relative rounded-2xl p-[1px] cursor-pointer group transition-all duration-300"
                                                        style={{
                                                            background: isSelected
                                                                ? 'linear-gradient(135deg, #1C1917, #0F766E)'
                                                                : 'linear-gradient(135deg, rgba(231,229,228,0.6), rgba(204,251,241,0.3))',
                                                            boxShadow: isSelected
                                                                ? '0 8px 24px rgba(15,118,110,0.15)'
                                                                : '0 4px 12px rgba(0,0,0,0.03)',
                                                        }}
                                                    >
                                                        <div className={`bg-white/90 backdrop-blur-[40px] rounded-2xl p-6 transition-all duration-300 ${!isSelected ? 'group-hover:bg-white' : ''}`}>
                                                            {isSelected && (
                                                                <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-200">
                                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{
                                                                        background: 'linear-gradient(135deg, #0F766E, #10B981)',
                                                                        boxShadow: '0 2px 6px rgba(15,118,110,0.3)',
                                                                    }}>
                                                                        <CheckOutlined style={{ fontSize: 12, color: '#fff' }} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-4 mb-4">
                                                                <Avatar className="w-12 h-12 shadow-sm">
                                                                    <AvatarFallback className="text-[#1C1917] text-sm font-light" style={{ background: 'linear-gradient(135deg, #F5F5F4, #E7E5E4)' }}>{member.avatar}</AvatarFallback>
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
                                                                        <span className={`text-xs font-medium ${member.availability >= 80 ? 'text-[#0F766E]' :
                                                                            member.availability >= 50 ? 'text-[#D97706]' : 'text-[#BE123C]'
                                                                            }`}>{member.availability}%</span>
                                                                    </div>
                                                                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, #F5F5F4, #E7E5E4)' }}>
                                                                        <div
                                                                            className="h-full rounded-full transition-all duration-500"
                                                                            style={{
                                                                                width: `${member.availability}%`,
                                                                                background: member.availability >= 80
                                                                                    ? 'linear-gradient(90deg, #0F766E, #10B981)'
                                                                                    : member.availability >= 50
                                                                                        ? 'linear-gradient(90deg, #D97706, #F59E0B)'
                                                                                        : 'linear-gradient(90deg, #BE123C, #F43F5E)',
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {matchedTasks.length > 0 && (
                                                                    <div className="pt-3 border-t border-[#F5F5F4]">
                                                                        <span className="text-[10px] text-[#78716C] uppercase tracking-wider font-light block mb-2">Best fit for</span>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {matchedTasks.map(tf => (
                                                                                <span key={tf} className="text-[10px] px-2 py-0.5 text-[#78716C] rounded-md font-light" style={{ background: 'linear-gradient(135deg, #F5F5F4, #F0FDFA)' }}>{tf}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 actions */}
                                <div className="flex gap-4">
                                    <Button variant="outline" className="h-11 px-8 rounded-xl font-light border-[#E7E5E4] bg-white/70 backdrop-blur-sm hover:bg-white transition-all duration-300 text-[#292524] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2" onClick={() => setCurrentStep(1)}>
                                        <ArrowBackOutlined style={{ fontSize: 16 }} className="mr-2" />
                                        Back to Tasks
                                    </Button>
                                    <Button variant="outline" className="flex-1 h-11 rounded-xl font-light border-[#E7E5E4] bg-white/70 backdrop-blur-sm hover:bg-white transition-all duration-300 text-[#292524] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2" onClick={() => toast.success('Draft saved')}>
                                        Save Draft
                                    </Button>
                                    <button
                                        type="button"
                                        className="flex-1 h-11 rounded-xl font-light transition-all duration-300 text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 inline-flex items-center justify-center relative overflow-hidden"
                                        style={{
                                            background: 'linear-gradient(135deg, #1C1917 0%, #0F766E 100%)',
                                            boxShadow: '0 4px 14px rgba(15,118,110,0.25)',
                                        }}
                                        onClick={() => {
                                            if (selectedTeam.length === 0) { toast.error('Select at least one team member'); return; }
                                            toast.success(`Project committed with ${tasks.length} tasks and ${selectedTeam.length} team members`);
                                            navigate('/projects');
                                        }}
                                    >
                                        <div className="absolute inset-0 pointer-events-none [background-size:200%_100%]" style={{
                                            backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                                            animation: 'shimmer 3s linear infinite',
                                        }} />
                                        <span className="relative z-10 inline-flex items-center">
                                            <CheckCircleOutlined style={{ fontSize: 16 }} className="mr-2" />
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
