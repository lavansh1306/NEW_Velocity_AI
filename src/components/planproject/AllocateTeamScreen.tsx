import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button } from '../ui/button'; // Adjusted path
import { Avatar, AvatarFallback } from '../ui/avatar'; // Adjusted path
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase'; // Adjusted path (assuming lib is 2 levels up)
import SyncOutlined from '@mui/icons-material/SyncOutlined';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';

export const AllocateTeamScreen = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    
    const { tasks, projectTitle, projectDescription, currentOrgId } = state || {};
    const [isMatchingTeam, setIsMatchingTeam] = useState(true);
    const [recommendedTeam, setRecommendedTeam] = useState<any[]>([]);
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [teamThoughts, setTeamThoughts] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const baseUrl = import.meta.env.VITE_LLM_URL || 'http://127.0.0.1:8000';

    useEffect(() => {
        if (!state?.tasks) {
            toast.error("No project context found");
            navigate(-1);
            return;
        }
        performAllocation();
    }, []);

    const performAllocation = async () => {
        setTeamThoughts(['Analyzing skills...', 'Balancing workload...']);
        try {
            const response = await fetch(`${baseUrl}/api/v1/planner/allocate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    org_id: currentOrgId,
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date(Date.now() + 2592000000).toISOString().split('T')[0],
                    tasks: tasks.map((t: any) => ({
                        task_name: t.task,
                        estimated_hours: t.estimatedHours,
                        required_skills: t.requiredSkills || []
                    }))
                }),
            });

            const data = await response.json();
            setRecommendedTeam(data.recommended_team);
            setSelectedTeamIds(data.recommended_team.map((m: any) => m.id));
        } catch (err) {
            toast.error("Allocation engine failed");
        } finally {
            setIsMatchingTeam(false);
        }
    };

    const handleCommit = async () => {
        setIsSaving(true);
        try {
            const { data: team } = await supabase.from('teams')
                .insert({ organization_id: currentOrgId, name: `${projectTitle || 'AI'} Team` })
                .select().single();

            const { data: proj } = await supabase.from('projects').insert({
                organization_id: currentOrgId, team_id: team.id,
                name: projectTitle || "New Project", description: projectDescription, status: 'active'
            }).select().single();

            const tasksToInsert = tasks.map((t: any) => ({
                project_id: proj.id, name: t.task, estimated_hours: t.estimatedHours, status: 'not_started'
            }));
            await supabase.from('tasks').insert(tasksToInsert);

            toast.success("Project launched successfully!");
            navigate('/projects');
        } catch (e) {
            toast.error("Failed to launch project");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-12 min-h-screen bg-[#FAFAF9]">
            <div className="max-w-[1200px] mx-auto">
                <div className="mb-10 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowBackOutlined /></Button>
                    <h1 className="text-3xl font-light">Resource Allocation</h1>
                </div>

                {isMatchingTeam ? (
                    <div className="p-20 text-center bg-white rounded-3xl border border-dashed border-[#E7E5E4]">
                        <SyncOutlined className="animate-spin mb-4 text-[#0F766E]" />
                        <p className="text-[#78716C]">Optimizing your team based on Jira history and availability...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-8 grid grid-cols-2 gap-6">
                            {recommendedTeam.map((m) => {
                                const isSelected = selectedTeamIds.includes(m.id);
                                return (
                                    <div key={m.id} onClick={() => setSelectedTeamIds(p => isSelected ? p.filter(id => id !== m.id) : [...p, m.id])}
                                        className={`p-6 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'bg-white border-[#0F766E] shadow-lg' : 'bg-white/50 border-[#E7E5E4]'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar><AvatarFallback>{m.avatar}</AvatarFallback></Avatar>
                                                <div><h4 className="text-sm font-medium">{m.name}</h4><p className="text-[10px] text-[#78716C] uppercase">{m.role}</p></div>
                                            </div>
                                            {isSelected && <CheckCircleOutlined className="text-[#0F766E]" />}
                                        </div>
                                        <div className="mb-4 flex flex-wrap gap-1">
                                            {m.task_fit.map((t: string, i: number) => <span key={i} className="px-2 py-0.5 bg-[#F5F5F4] rounded text-[9px]">{t}</span>)}
                                        </div>
                                        <div className="p-3 bg-emerald-50 rounded-xl text-[11px] italic text-[#44403C]">"{m.justification}"</div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="col-span-4">
                            <div className="bg-white p-6 rounded-2xl border border-[#E7E5E4] sticky top-24">
                                <h3 className="text-xs font-bold mb-4 text-[#A8A29E]">PROJECT SUMMARY</h3>
                                <div className="space-y-4 mb-8">
                                    <div><p className="text-2xl font-light">{selectedTeamIds.length}</p><p className="text-xs text-[#78716C]">Selected Resources</p></div>
                                    <div><p className="text-2xl font-light">{tasks.length}</p><p className="text-xs text-[#78716C]">Total Tasks</p></div>
                                </div>
                                <Button className="w-full text-white" style={{ background: 'linear-gradient(135deg, #1C1917, #0F766E)' }} onClick={handleCommit} disabled={isSaving}>
                                    {isSaving ? 'Launching...' : 'Confirm & Launch'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};