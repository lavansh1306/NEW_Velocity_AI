import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from './ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from './ui/select';
import AddOutlined from '@mui/icons-material/AddOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import NotificationsActiveOutlined from '@mui/icons-material/NotificationsActiveOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { AISuggestionPanel, type AISuggestion } from './AISuggestionCard';
import { FormError, validators } from './shared/FormError';
import { LoadingButton } from './shared/LoadingButton';
import { PageSkeleton } from './shared/SkeletonLoader';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { peopleService } from '../services/peopleService';
import { teamMembersView, pendingSkillsView, personDetailsMap } from '../data/mockData';
import type { TeamMemberView, PendingSkillView, PersonDetailView } from '../types';

const UtilizationBar = ({ value }: { value: number }) => {
    const color = value > 110 ? 'bg-[#1C1917]/30' : value > 90 ? 'bg-[#1C1917]/20' : 'bg-[#1C1917]/15';
    const width = Math.min(value, 150);

    return (
        <div className="w-full bg-[#F5F5F4] rounded-full h-1.5 overflow-hidden">
            <div
                className={`h-full ${color} transition-all duration-500`}
                style={{ width: `${width}%` }}
            />
        </div>
    );
};

const AddTeamMemberModal = ({ open, onOpenChange, onMemberAdded }: { open: boolean; onOpenChange: (open: boolean) => void; onMemberAdded?: () => void }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const [skills, setSkills] = useState('');
    const [utilization, setUtilization] = useState(85);
    const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});
    const [memberAttempted, setMemberAttempted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateMember = () => {
        const errors: Record<string, string> = {};
        const nameErr = validators.required(name, 'Full name');
        if (nameErr) errors.name = nameErr;
        const emailErr = validators.email(email);
        if (emailErr) errors.email = emailErr;
        if (!role) errors.role = 'Please select a role';
        setMemberErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddMember = async () => {
        setMemberAttempted(true);
        if (!validateMember()) return;

        setIsSubmitting(true);
        try {
            const orgId = getCurrentOrgId();
            if (!orgId) {
                toast.error('Organization not found');
                return;
            }

            // Fetch the default team for the organization
            const { data: teams, error: teamsError } = await supabase
                .from('teams')
                .select('id')
                .eq('organization_id', orgId)
                .limit(1);

            if (teamsError || !teams || teams.length === 0) {
                toast.error('No team found for your organization. Please create a team first.');
                return;
            }

            const teamId = teams[0].id;

            // Add team member
            const result = await peopleService.addTeamMember(orgId, teamId, {
                name,
                email,
                role,
                skills,
                utilizationPercent: utilization,
            });

            console.log('[AddTeamMemberModal] Team member added:', result);
            toast.success('Team member added successfully');
            
            // Reset form
            setName('');
            setEmail('');
            setRole('');
            setSkills('');
            setUtilization(85);
            setMemberErrors({});
            setMemberAttempted(false);
            
            onOpenChange(false);
            onMemberAdded?.();
        } catch (error) {
            console.error('[AddTeamMemberModal] Error adding team member:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to add team member';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent aria-describedby={undefined} className="max-w-2xl bg-[#FDFDFB] p-0 gap-0">
                <DialogHeader className="px-8 py-6 border-b border-[#E5E5E5] bg-white">
                    <DialogTitle className="text-xl font-medium text-[#121212]">Add Team Member</DialogTitle>
                </DialogHeader>

                <div className="p-8 grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Full Name</Label>
                            <Input value={name} onChange={(e) => { setName(e.target.value); if (memberAttempted) setMemberErrors(prev => ({ ...prev, name: validators.required(e.target.value, 'Full name') })); }} className={`h-10 bg-white ${memberErrors.name ? 'border-[#BE123C]' : 'border-[#E5E5E5]'}`} placeholder="e.g. Jane Doe" />
                            <FormError message={memberErrors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Email</Label>
                            <Input value={email} onChange={(e) => { setEmail(e.target.value); if (memberAttempted) setMemberErrors(prev => ({ ...prev, email: validators.email(e.target.value) })); }} className={`h-10 bg-white ${memberErrors.email ? 'border-[#BE123C]' : 'border-[#E5E5E5]'}`} placeholder="jane@example.com" />
                            <FormError message={memberErrors.email} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Role</Label>
                            <Select value={role} onValueChange={(val) => { setRole(val); setMemberErrors(prev => ({ ...prev, role: '' })); }}>
                                <SelectTrigger className="h-10 border-[#E5E5E5] bg-white">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                                    <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                                    <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                                    <SelectItem value="Designer">Product Designer</SelectItem>
                                    <SelectItem value="Product Manager">Product Manager</SelectItem>
                                    <SelectItem value="QA Engineer">QA Engineer</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormError message={memberErrors.role} />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Skills (comma separated)</Label>
                            <Input value={skills} onChange={(e) => setSkills(e.target.value)} className="h-10 border-[#E5E5E5] bg-white" placeholder="React, Node.js, etc." />
                        </div>
                    </div>

                    <div className="col-span-2 space-y-2">
                        <div className="flex justify-between">
                            <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Target Utilization</Label>
                            <span className="text-xs font-medium text-[#121212]">{utilization}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="120"
                            value={utilization}
                            onChange={(e) => setUtilization(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                    </div>
                </div>

                <DialogFooter className="px-8 py-5 border-t border-[#E5E5E5] bg-white flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="border-[#E5E5E5] text-[#737373] hover:text-[#121212]">Cancel</Button>
                    <LoadingButton onClick={handleAddMember} isLoading={isSubmitting} disabled={isSubmitting} className="bg-[#121212] text-white hover:bg-[#262626] shadow-sm px-6">Add Member</LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const PeopleCapacityScreen = () => {
    const { user, orgId, orgRole } = useAuth();
    const [selectedPerson, setSelectedPerson] = useState<TeamMemberView | null>(null);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [showSkillsVerification, setShowSkillsVerification] = useState(false);
    const detailPanelRef = useRef<HTMLDivElement>(null);

    const [teamMembers, setTeamMembers] = useState<TeamMemberView[]>([]);
    const [pendingSkills, setPendingSkills] = useState<PendingSkillView[]>([]);
    const [allPersonDetails, setAllPersonDetails] = useState<Record<string, PersonDetailView>>({});
    const [isLoading, setIsLoading] = useState(true);

    const loadTeamData = useCallback(async () => {
        if (!orgId || !user) return;

        try {
            let teamIds: string[] | undefined = undefined;

            // If manager, only show their teams
            if (orgRole === 'manager') {
                teamIds = await peopleService.fetchUserTeams(user.id);
            }

            const [members, skills] = await Promise.all([
                peopleService.fetchAllTeamMembers(orgId, teamIds),
                peopleService.fetchPendingSkills(orgId, teamIds)
            ]);

            // Exclude current user (manager) from the list
            const filteredMembers = members.filter(m => m.id !== user.id);
            const filteredSkills = skills.filter(s => s.userId !== user.id);

            setTeamMembers(filteredMembers);
            setPendingSkills(filteredSkills);
        } catch (error) {
            toast.error('Failed to load live data. Falling back to mock data.');
            setTeamMembers(teamMembersView);
            setPendingSkills(pendingSkillsView);
        } finally {
            setIsLoading(false);
        }
    }, [orgId, user, orgRole]);

    useEffect(() => {
        loadTeamData();
    }, [loadTeamData]);

    const fetchDetail = async (name: string) => {
        if (allPersonDetails[name]) return;
        try {
            const detail = await peopleService.fetchPersonDetails(name);
            setAllPersonDetails(prev => ({ ...prev, [name]: detail }));
        } catch (error) {
            console.error('Error fetching detail:', error);
            // Fallback
            setAllPersonDetails(prev => ({ ...prev, [name]: personDetailsMap[name] || personDetailsMap[Object.keys(personDetailsMap)[0]] }));
        }
    };

    useEffect(() => {
        if (selectedPerson) {
            fetchDetail(selectedPerson.name);
        }
    }, [selectedPerson]);

    // Smooth scroll-to-top when detail panel opens
    useEffect(() => {
        if (selectedPerson && detailPanelRef.current) {
            setTimeout(() => {
                detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        }
    }, [selectedPerson]);

    const [pendingSkillActions, setPendingSkillActions] = useState<Record<number, string>>({});

    // Default person details structure to prevent undefined errors
    const defaultPersonDetails = {
        capacityTimeline: [],
        projects: [],
        skills: [],
        recommendations: []
    };

    const personDetails = selectedPerson ? {
        name: selectedPerson.name,
        role: selectedPerson.role,
        avatar: selectedPerson.avatar,
        utilization: selectedPerson.utilization,
        ...defaultPersonDetails,
        ...(allPersonDetails[selectedPerson.name] || allPersonDetails[Object.keys(allPersonDetails)[0]] || {}),
    } : null;

    const totalMembers = teamMembers.length;
    const avgUtilization = totalMembers > 0
        ? Math.round(teamMembers.reduce((acc, m) => acc + m.utilization, 0) / totalMembers)
        : 0;
    const overloadedCount = teamMembers.filter(m => m.status === 'overloaded').length;
    const totalAvailableCapacity = teamMembers.reduce((acc, m) => acc + m.availability, 0);

    if (isLoading) return <PageSkeleton />;

    return (
        <div className="p-12 relative min-h-screen bg-[#FAFAF9]">
            <div
                className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none"
                style={{
                    width: '800px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 70%)',
                    filter: 'blur(120px)',
                    opacity: 0.4,
                }}
            />

            <div className="max-w-[1600px] mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">People & Capacity</h1>
                    <Button
                        className="bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md"
                        onClick={() => setIsAddMemberOpen(true)}
                    >
                        <AddOutlined style={{ fontSize: 16 }} className="mr-2" />
                        Add Team Member
                    </Button>
                </div>

                <AddTeamMemberModal open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen} onMemberAdded={loadTeamData} />

                {/* Capacity Summary Strip */}
                <div className="flex items-center gap-0 mb-10">
                    <div className="flex-1 py-8">
                        <div className="text-4xl font-light text-[#1C1917] mb-2">{totalMembers}</div>
                        <div className="text-sm text-[#78716C] font-light">Total Members</div>
                    </div>
                    <div className="w-px h-16 bg-[#E7E5E4]"></div>
                    <div className="flex-1 py-8 px-8">
                        <div className="text-4xl font-light text-[#1C1917] mb-2">{avgUtilization}%</div>
                        <div className="text-sm text-[#78716C] font-light">Avg Utilization</div>
                    </div>
                    <div className="w-px h-16 bg-[#E7E5E4]"></div>
                    <div className="flex-1 py-8 px-8">
                        <div className="text-4xl font-light text-[#1C1917] mb-2">{overloadedCount}</div>
                        <div className="text-sm text-[#78716C] font-light">Overloaded Count</div>
                    </div>
                    <div className="w-px h-16 bg-[#E7E5E4]"></div>
                    <div className="flex-1 py-8 pl-8">
                        <div className="text-4xl font-light text-[#1C1917] mb-2">{totalAvailableCapacity}h</div>
                        <div className="text-sm text-[#78716C] font-light">Available Capacity</div>
                    </div>
                </div>

                {/* Skills Verification Banner */}
                {pendingSkills.length > 0 && !showSkillsVerification && (
                    <div className="mb-8 flex items-center justify-between p-5 bg-white border border-[#E7E5E4] rounded-xl shadow-sm animate-in fade-in duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                                <NotificationsActiveOutlined style={{ fontSize: 20 }} className="text-amber-600" />
                            </div>
                            <div>
                                <div className="text-sm text-[#1C1917] font-medium">{pendingSkills.length} skills pending verification</div>
                                <div className="text-xs text-[#78716C] font-light">Team members have updated their skills profiles — review and verify proficiency levels.</div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowSkillsVerification(true)}
                            className="bg-[#1C1917] hover:bg-[#292524] h-9 px-5 rounded-xl font-light text-white shadow-sm transition-all"
                        >
                            Review Skills
                            <ArrowForwardOutlined style={{ fontSize: 14 }} className="ml-2" />
                        </Button>
                    </div>
                )}

                {/* Skills Verification Panel */}
                {showSkillsVerification && (
                    <div className="mb-8 bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl shadow-sm animate-in fade-in duration-300 overflow-hidden">
                        <div className="px-8 py-5 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <VerifiedOutlined style={{ fontSize: 20 }} className="text-[#0F766E]" />
                                <div>
                                    <h2 className="text-lg font-light text-[#1C1917]">Skills Verification</h2>
                                    <p className="text-xs text-[#78716C] font-light">{pendingSkills.length} pending · Confirm, adjust, or remove reported skills</p>
                                </div>
                            </div>
                            <button onClick={() => setShowSkillsVerification(false)} className="text-[#A8A29E] hover:text-[#78716C] transition-colors">
                                <CloseOutlined style={{ fontSize: 20 }} />
                            </button>
                        </div>
                        <div className="divide-y divide-[#E7E5E4]/50">
                            {pendingSkills.map((item) => {
                                const action = pendingSkillActions[item.id];
                                return (
                                    <div key={item.id} className={`px-8 py-5 flex items-center gap-6 transition-all duration-300 ${action ? 'opacity-50 bg-[#FAFAF9]' : 'hover:bg-[#FAFAF9]/50'}`}>
                                        <div className="flex items-center gap-3 w-48">
                                            <Avatar className="w-9 h-9 border border-white/20 shadow-sm">
                                                <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-xs font-light">{item.avatar}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="text-sm text-[#1C1917] font-light">{item.person}</div>
                                                <div className="text-[10px] text-[#78716C] font-light">
                                                    {item.suggestedBy === 'ai' ? 'AI detected' : 'Self-reported'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex items-center gap-6">
                                            <div className="w-40">
                                                <div className="text-xs text-[#78716C] font-light mb-0.5">Skill</div>
                                                <div className="text-sm text-[#1C1917] font-light flex items-center gap-2">
                                                    {item.skill}
                                                    {item.suggestedBy === 'ai' && (
                                                        <span className="px-1.5 py-0.5 bg-[#F0FDFA] text-[#0F766E] text-[9px] rounded font-medium uppercase tracking-wide">AI</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-28">
                                                <div className="text-xs text-[#78716C] font-light mb-0.5">Self-Rated</div>
                                                <div className="text-sm text-[#1C1917] font-light">{item.selfRated}</div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs text-[#78716C] font-light mb-0.5">Evidence</div>
                                                <div className="text-xs text-[#78716C] font-light">{item.evidence}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-72 justify-end">
                                            {action ? (
                                                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${action === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                                                    action === 'adjusted' ? 'bg-amber-50 text-amber-700' :
                                                        'bg-rose-50 text-rose-700'
                                                    }`}>
                                                    {action === 'confirmed' ? 'Confirmed' : action === 'adjusted' ? 'Adjusted to Mid' : 'Removed'}
                                                </span>
                                            ) : (
                                                <div className="contents">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setPendingSkillActions(prev => ({ ...prev, [item.id]: 'confirmed' }))}
                                                        className="bg-[#1C1917] hover:bg-[#292524] h-8 px-4 rounded-lg font-light text-white text-xs shadow-sm"
                                                    >
                                                        <CheckCircleOutlined style={{ fontSize: 14 }} className="mr-1.5" />
                                                        Confirm
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setPendingSkillActions(prev => ({ ...prev, [item.id]: 'adjusted' }))}
                                                        className="h-8 px-3 border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] hover:bg-white rounded-lg font-light text-xs"
                                                    >
                                                        <TuneOutlined style={{ fontSize: 14 }} className="mr-1.5" />
                                                        Adjust
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setPendingSkillActions(prev => ({ ...prev, [item.id]: 'removed' }))}
                                                        className="h-8 px-3 border-rose-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-light text-xs"
                                                    >
                                                        <DeleteOutlined style={{ fontSize: 14 }} />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {Object.keys(pendingSkillActions).length === pendingSkills.length && (
                            <div className="px-8 py-4 border-t border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-[#0F766E] font-light">
                                    <CheckCircleOutlined style={{ fontSize: 14 }} />
                                    All skills reviewed
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setShowSkillsVerification(false)}
                                    className="bg-[#1C1917] hover:bg-[#292524] h-9 px-5 rounded-xl font-light text-white shadow-sm"
                                >
                                    Done
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Expanded Person Detail */}
                {selectedPerson && personDetails && (
                    <div ref={detailPanelRef} className="mb-6 bg-white border border-[#E7E5E4] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300">
                        {/* Detail Header */}
                        <div className="px-8 pt-8 pb-0">
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-5">
                                    <Avatar className="w-16 h-16 border-2 border-[#2DD4BF]/25 shadow-md">
                                        <AvatarFallback className="bg-[#2DD4BF]/[0.08] text-[#1C1917] text-xl font-light">
                                            {personDetails.avatar}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="text-xl font-light text-[#1C1917] mb-1">{personDetails.name}</div>
                                        <div className="text-sm text-[#57534E] font-light">{personDetails.role}</div>
                                    </div>
                                    <div className={`ml-2 px-3 py-1 rounded-full text-xs font-light ${personDetails.utilization > 110
                                        ? 'bg-[#C2714F]/10 text-[#C2714F] border border-[#C2714F]/20'
                                        : personDetails.utilization > 90
                                            ? 'bg-[#C2714F]/[0.06] text-[#C2714F]/80 border border-[#C2714F]/12'
                                            : 'bg-[#7C9A82]/10 text-[#7C9A82] border border-[#7C9A82]/20'
                                        }`}>
                                        {personDetails.utilization > 110 ? 'Overloaded' : personDetails.utilization > 90 ? 'At Capacity' : 'Healthy'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPerson(null)}
                                    className="text-[#A8A29E] hover:text-[#57534E] transition-colors p-1"
                                >
                                    <CloseOutlined style={{ fontSize: 20 }} />
                                </button>
                            </div>
                        </div>

                        {/* Detail Content - 3 Column Grid */}
                        <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left: Utilization & Timeline */}
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs text-[#78716C] font-light uppercase tracking-wider mb-3">Current Utilization</div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="flex-1">
                                            <UtilizationBar value={personDetails.utilization} />
                                        </div>
                                        <span className={`text-sm font-light ${personDetails.utilization > 100 ? 'text-[#C2714F]/80' :
                                            personDetails.utilization > 85 ? 'text-[#57534E]' :
                                                'text-[#7C9A82]/80'
                                            }`}>{personDetails.utilization}%</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-[#78716C] font-light uppercase tracking-wider mb-3">Capacity Timeline (4 Weeks)</div>
                                    <div className="space-y-3">
                                        {personDetails.capacityTimeline.map((week, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between text-xs text-[#78716C] font-light mb-1.5">
                                                    <span>{week.week}</span>
                                                    <span>{week.allocated}h / {week.available}h</span>
                                                </div>
                                                <div className="w-full bg-[#F5F5F4] rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 rounded-full ${week.allocated > week.available ? 'bg-[#C2714F]/50' : 'bg-[#2DD4BF]/40'
                                                            }`}
                                                        style={{ width: `${Math.min((week.allocated / week.available) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Middle: Projects & Skills */}
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs text-[#78716C] font-light uppercase tracking-wider mb-3">Assigned Projects</div>
                                    <div className="space-y-2">
                                        {personDetails.projects.map((project, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-3 px-4 bg-[#2DD4BF]/[0.04] border border-[#2DD4BF]/10 rounded-xl">
                                                <div className="text-sm text-[#292524] font-light">{project.name}</div>
                                                <div className="text-sm text-[#57534E] font-light">{project.hours}h/wk</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-[#78716C] font-light uppercase tracking-wider mb-3">Skills</div>
                                    <div className="space-y-3">
                                        {personDetails.skills.map((skill, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between text-xs text-[#78716C] font-light mb-1.5">
                                                    <span>{skill.name}</span>
                                                    <span>{skill.proficiency}%</span>
                                                </div>
                                                <div className="w-full bg-[#F5F5F4] rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#7C9A82]/40 transition-all duration-500 rounded-full"
                                                        style={{ width: `${skill.proficiency}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: AI Recommendations */}
                            <div>
                                <AISuggestionPanel suggestions={personDetails.recommendations} title="AI Suggestions" compact />
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Cards */}
                <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 transition-all duration-500 ease-out ${selectedPerson ? 'translate-y-0 opacity-100' : ''}`}>
                    {teamMembers.map((member, idx) => (
                        <div
                            key={idx}
                            onClick={() => setSelectedPerson(member)}
                            style={{ transitionDelay: selectedPerson ? `${idx * 30}ms` : '0ms' }}
                            className={`backdrop-blur-[32px] border rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] cursor-pointer transition-all duration-300 group ${selectedPerson?.name === member.name
                                ? 'bg-white border-[#2DD4BF]/40 ring-1 ring-[#2DD4BF]/20 scale-[0.98]'
                                : selectedPerson
                                    ? 'bg-white border-[#E7E5E4] hover:border-[#2DD4BF]/25 hover:bg-white opacity-75 hover:opacity-100'
                                    : 'bg-white border-[#E7E5E4] hover:border-[#2DD4BF]/25 hover:bg-white'
                                }`}
                        >
                            {/* Top: Avatar, Name, Role, Status */}
                            <div className="flex items-start gap-4 mb-5">
                                <Avatar className="w-11 h-11 border border-[#2DD4BF]/20 shadow-sm">
                                    <AvatarFallback className="bg-[#2DD4BF]/[0.08] text-[#1C1917] text-sm font-light">{member.avatar}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm text-[#1C1917] font-light truncate">{member.name}</div>
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${member.status === 'overloaded' ? 'bg-[#C2714F]/70' :
                                            member.status === 'at-risk' ? 'bg-[#D4A017]/70' :
                                                'bg-[#7C9A82]/70'
                                            }`} />
                                    </div>
                                    <div className="text-xs text-[#57534E] font-light mt-0.5">{member.role}</div>
                                </div>
                                <ArrowForwardOutlined style={{ fontSize: 16 }} className="text-[#D6D3D1] group-hover:text-[#2DD4BF] transition-colors shrink-0 mt-1" />
                            </div>

                            {/* Utilization bar */}
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] text-[#78716C] font-light uppercase tracking-wider">Utilization</span>
                                    <span className={`text-sm font-light ${member.utilization > 90 ? 'text-[#C2714F]/80' :
                                        member.utilization > 70 ? 'text-[#57534E]' :
                                            'text-[#7C9A82]/80'
                                        }`}>
                                        {member.utilization}%
                                    </span>
                                </div>
                                <UtilizationBar value={member.utilization} />
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex-1 bg-[#2DD4BF]/[0.04] rounded-xl px-3 py-2.5 text-center border border-[#2DD4BF]/10">
                                    <div className="text-sm text-[#1C1917] font-light">{member.projects}</div>
                                    <div className="text-[10px] text-[#78716C] font-light mt-0.5">Projects</div>
                                </div>
                                <div className="flex-1 bg-[#7C9A82]/[0.05] rounded-xl px-3 py-2.5 text-center border border-[#7C9A82]/10">
                                    <div className="text-sm text-[#1C1917] font-light">{member.availability}h</div>
                                    <div className="text-[10px] text-[#78716C] font-light mt-0.5">Avail (2wk)</div>
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="flex gap-1.5 flex-wrap">
                                {member.skills.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-[#2DD4BF]/[0.06] border border-[#2DD4BF]/12 text-[#292524] text-[11px] rounded-full font-light">
                                        {skill}
                                    </span>
                                ))}
                                {member.skills.length > 3 && (
                                    <span className="px-2.5 py-1 bg-[#FAFAF9] border border-[#E7E5E4] text-[#57534E] text-[11px] rounded-full font-light">
                                        +{member.skills.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
