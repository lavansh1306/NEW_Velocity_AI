import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import SyncOutlined from '@mui/icons-material/SyncOutlined';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';

// --- TYPES FOR TYPE SAFETY ---
interface AllocatedMember {
    id: string;
    name: string;
    role: string;
    match_percentage: number;
    availability: number;
    task_fit: string[];
    justification: string;
    avatar: string;
}

export const AllocateTeamScreen = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    
    // Data passed from PlanMyProjectScreen
    const { tasks, projectTitle, projectDescription, currentOrgId } = state || {};

    const [isMatchingTeam, setIsMatchingTeam] = useState(true);
    const [recommendedTeam, setRecommendedTeam] = useState<AllocatedMember[]>([]);
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [teamThoughts, setTeamThoughts] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const baseUrl = import.meta.env.VITE_LLM_URL || 'http://127.0.0.1:8000';

    useEffect(() => {
        if (!state?.tasks || !currentOrgId) {
            toast.error("No project context found. Returning to Step 1.");
            navigate(-1);
            return;
        }
        performAllocation();
    }, []);

    const performAllocation = async () => {
        setIsMatchingTeam(true);
        setTeamThoughts(['Analyzing skills...', 'Querying team availability...', 'Balancing workload...']);

        try {
            // Calculate default 30-day window for the Python ML Engine
            const startStr = new Date().toISOString().split('T')[0];
            const endStr = new Date(Date.now() + 2592000000).toISOString().split('T')[0];

            // ── FASTAPI FETCH LOGIC ──
            const response = await fetch(`${baseUrl}/api/v1/planner/allocate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' 
                },
                body: JSON.stringify({ 
                    org_id: currentOrgId,
                    start_date: startStr,
                    end_date: endStr,
                    // Mapping local state to the EXACT schema required by FastAPI
                    tasks: tasks.map((t: any) => ({
                        task_name: t.task,
                        estimated_hours: t.estimatedHours || 0,
                        required_skills: t.requiredSkills || [],
                        task_description: t.description || t.task
                    }))
                }),
            });

            // ── DECLINE / ERROR LOGIC ──
            if (!response.ok) {
                const errorData = await response.json();
                // Check for FastAPI 422 Validation Errors
                if (response.status === 422) {
                    console.error("Validation Error:", errorData.detail);
                    throw new Error("Data format mismatch with AI Engine.");
                }
                throw new Error(errorData.detail || "The AI Matchmaker is busy. Please try again.");
            }

            const data = await response.json();
            
            // Expected backend key is 'recommended_team'
            const team = data.recommended_team || [];
            setRecommendedTeam(team);
            
            // Auto-select everyone recommended by default
            setSelectedTeamIds(team.map((m: AllocatedMember) => m.id));

        } catch (err: any) {
            console.error("Allocation failed:", err);
            toast.error(err.message);
            // Optional: navigate(-1) if you want to force them back on error
        } finally {
            setIsMatchingTeam(false);
        }
    };

    const handleCommit = async () => {
        if (selectedTeamIds.length === 0) return toast.error("Please select at least one member.");
        setIsSaving(true);
        try {
            // 1. Create a dynamic team name
            const teamName = `${projectTitle || 'AI Plan'} Team - ${new Date().toLocaleDateString()}`;

            const { data: team, error: teamErr } = await supabase.from('teams')
                .insert({ organization_id: currentOrgId, name: teamName })
                .select().single();
            if (teamErr) throw teamErr;

            // 2. Create the project and link it to the newly created team
            const { data: proj, error: projErr } = await supabase.from('projects').insert({
                organization_id: currentOrgId, 
                team_id: team.id,
                name: projectTitle || "New AI Project", 
                description: projectDescription, 
                status: 'active'
            }).select().single();
            if (projErr) throw projErr;

            // 3. Insert all tasks linked to this project
            const tasksToInsert = tasks.map((t: any) => ({
                project_id: proj.id, 
                name: t.task, 
                estimated_hours: t.estimatedHours, 
                status: 'not_started'
            }));
            const { error: taskErr } = await supabase.from('tasks').insert(tasksToInsert);
            if (taskErr) throw taskErr;

            toast.success("Project launched and team synced!");
            navigate('/projects');
        } catch (e: any) {
            toast.error(e.message || "Failed to launch project");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-12 min-h-screen bg-[#FAFAF9]" style={{ background: 'linear-gradient(165deg, #FAFAF9 0%, #F5F5F4 40%, #F0FDFA 100%)' }}>
            <div className="max-w-[1200px] mx-auto">
                <div className="mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
                            <ArrowBackOutlined style={{ fontSize: 20 }} />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-light text-[#1C1917]">Team Allocation</h1>
                            <p className="text-sm text-[#78716C] font-light">AI-Optimized resource matching for: <span className="font-medium text-[#0F766E]">{projectTitle || 'Untitled Project'}</span></p>
                        </div>
                    </div>
                </div>

                {isMatchingTeam ? (
                    <div className="p-20 text-center bg-white/80 backdrop-blur-xl rounded-3xl border border-dashed border-[#E7E5E4] shadow-sm">
                        <SyncOutlined className="animate-spin mb-6 text-[#0F766E]" style={{ fontSize: 32 }} />
                        <div className="space-y-3">
                            {teamThoughts.map((t, i) => (
                                <p key={i} className="text-sm text-[#78716C] animate-pulse font-light italic">● {t}</p>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* LEFT: ROSTER CARDS */}
                        <div className="col-span-8 grid grid-cols-2 gap-6">
                            {recommendedTeam.map((m) => {
                                const isSelected = selectedTeamIds.includes(m.id);
                                return (
                                    <div 
                                        key={m.id} 
                                        onClick={() => setSelectedTeamIds(p => isSelected ? p.filter(id => id !== m.id) : [...p, m.id])}
                                        className={`group p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${isSelected ? 'bg-white border-[#0F766E] shadow-xl ring-1 ring-[#0F766E]' : 'bg-white/50 border-[#E7E5E4] hover:border-[#D6D3D1]'}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                                    <AvatarFallback className="bg-[#F5F5F4] text-[#44403C] font-light">{m.avatar}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="text-sm font-medium text-[#1C1917]">{m.name}</h4>
                                                    <p className="text-[10px] text-[#78716C] uppercase tracking-wider font-bold">{m.role}</p>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#0F766E] border-[#0F766E]' : 'border-[#E7E5E4]'}`}>
                                                {isSelected && <CheckCircleOutlined style={{ fontSize: 16, color: '#fff' }} />}
                                            </div>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <p className="text-[10px] text-[#A8A29E] font-bold mb-2 uppercase tracking-tighter">Matched Tasks</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {m.task_fit.map((t: string, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] rounded text-[9px] font-medium">{t}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                                            <p className="text-[11px] text-[#334155] leading-relaxed italic font-light">"{m.justification}"</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* RIGHT: SUMMARY STICKER */}
                        <div className="col-span-4">
                            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl border border-[#E7E5E4] sticky top-24 shadow-sm">
                                <h3 className="text-xs font-bold mb-6 text-[#A8A29E] uppercase tracking-[0.2em]">Project Summary</h3>
                                <div className="space-y-6 mb-10">
                                    <div className="flex items-end justify-between border-b border-[#F5F5F4] pb-4">
                                        <p className="text-xs text-[#78716C] font-light">Selected Roster</p>
                                        <p className="text-2xl font-light text-[#1C1917]">{selectedTeamIds.length} <span className="text-xs text-[#A8A29E]">ppl</span></p>
                                    </div>
                                    <div className="flex items-end justify-between border-b border-[#F5F5F4] pb-4">
                                        <p className="text-xs text-[#78716C] font-light">Tasks Coverage</p>
                                        <p className="text-2xl font-light text-[#1C1917]">{tasks?.length} <span className="text-xs text-[#A8A29E]">units</span></p>
                                    </div>
                                </div>
                                
                                <Button 
                                    className="w-full h-12 text-white font-light rounded-xl transition-all shadow-lg hover:shadow-[#0F766E]/20" 
                                    style={{ background: 'linear-gradient(135deg, #1C1917, #0F766E)' }} 
                                    onClick={handleCommit} 
                                    disabled={isSaving || selectedTeamIds.length === 0}
                                >
                                    {isSaving ? (
                                        <><SyncOutlined className="animate-spin mr-2" /> Finalizing...</>
                                    ) : (
                                        'Launch Project'
                                    )}
                                </Button>
                                <p className="text-[10px] text-center text-[#A8A29E] mt-4 font-light">
                                    By clicking launch, this team will be synced to Supabase.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};