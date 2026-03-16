import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getDashboardData } from '@/services/dashboardService';
import { toast } from 'sonner';
import type { KPIData, GanttMember, Deadline } from '../types';

import CalendarToday from '@mui/icons-material/CalendarToday';
import Add from '@mui/icons-material/Add';
import ViewKanban from '@mui/icons-material/ViewKanban';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Close from '@mui/icons-material/Close';
import { Loader2 } from 'lucide-react';

const getCurrentWeekMonday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
};

export const DashboardScreen = () => {
    const navigate = useNavigate();
    const { orgId } = useAuth();
    
    const [isLoading, setIsLoading] = useSimulatedLoading(600);
    const [kpis, setKpis] = useState<KPIData[]>([]);
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [gantt, setGantt] = useState<GanttMember[]>([]);
    const [orgUsers, setOrgUsers] = useState<any[]>([]); 

    const [ganttFilterProject, setGanttFilterProject] = useState<string>('All');
    const [ganttSortBy, setGanttSortBy] = useState<string>('name_asc');
    const [dateRangeParam, setDateRangeParam] = useState<string>('30');
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getCurrentWeekMonday());

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isTaskFetching, setIsTaskFetching] = useState(false);
    const [isTaskSaving, setIsTaskSaving] = useState(false);
    const [taskForm, setTaskForm] = useState({
        id: '', name: '', description: '', status: 'not_started', assignee_id: '',
        estimated_hours: 0, start_date: '', due_date: ''
    });

    const fetchData = async () => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            const endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            let startDate = new Date();

            if (dateRangeParam === 'custom') {
                startDate = customRange?.from ? new Date(customRange.from) : new Date();
                if (customRange?.to) endDate.setTime(customRange.to.getTime());
            } else {
                startDate.setDate(endDate.getDate() - parseInt(dateRangeParam || '30'));
            }
            startDate.setHours(0, 0, 0, 0);

            // FIX: Removed orgId here to resolve the DashboardOptions TypeScript error
            const data = await getDashboardData({ startDate, endDate });
            
            setKpis(data.kpis);
            setDeadlines(data.deadlines);
            setGantt(data.gantt);

            // Fetch the organization users for the Task Edit Assignee Dropdown
            const { data: users } = await supabase.from('users').select('id, name').eq('organization_id', orgId);
            setOrgUsers(users || []);
        } catch (err) {
            toast.error('Failed to load dashboard data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [dateRangeParam, customRange, orgId]);

    useEffect(() => {
        if (!orgId) return;
        const channel = supabase.channel('dashboard-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [orgId]);

    const openTaskModal = async (taskId: string) => {
        setIsTaskModalOpen(true);
        setIsTaskFetching(true);
        try {
            const { data, error } = await supabase.from('tasks').select('*').eq('id', taskId).single();
            if (error) throw error;
            
            setTaskForm({
                id: data.id,
                name: data.name || '',
                description: data.description || '',
                status: data.status || 'not_started',
                assignee_id: data.assignee_id || data.user_id || '', // FIX: Check both columns!
                estimated_hours: data.estimated_hours || 0,
                start_date: data.start_date || '',
                due_date: data.due_date || ''
            });
        } catch (e) {
            toast.error("Could not load task details");
            setIsTaskModalOpen(false);
        } finally {
            setIsTaskFetching(false);
        }
    };

    const handleUpdateTask = async () => {
        if (!taskForm.id) return;
        setIsTaskSaving(true);
        try {
            const targetUserId = taskForm.assignee_id === '' ? null : taskForm.assignee_id;

            const { error } = await supabase.from('tasks').update({
                name: taskForm.name,
                description: taskForm.description,
                status: taskForm.status,
                assignee_id: targetUserId, // FIX: Update both columns!
                user_id: targetUserId,     // FIX: Update both columns!
                estimated_hours: taskForm.estimated_hours,
                start_date: taskForm.start_date === '' ? null : taskForm.start_date,
                due_date: taskForm.due_date === '' ? null : taskForm.due_date
            }).eq('id', taskForm.id);

            if (error) throw error;
            toast.success("Task updated successfully!");
            setIsTaskModalOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to update task");
        } finally {
            setIsTaskSaving(false);
        }
    };

    const weekDays = useMemo(() => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + i);
            dates.push({ date, label: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }), isToday: new Date().toDateString() === date.toDateString() });
        }
        return dates;
    }, [currentWeekStart]);

    const weekLabel = `Week ending ${format(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6), "MMM d, yyyy")}`;

    const uniqueProjects = useMemo(() => {
        const projects = new Set<string>();
        gantt.forEach(m => m.tasks.forEach(t => t.project && projects.add(t.project)));
        return Array.from(projects).sort();
    }, [gantt]);

    const displayGantt = useMemo(() => {
        let filtered = gantt.map(member => ({
            ...member, tasks: ganttFilterProject === 'All' ? member.tasks : member.tasks.filter(t => t.project === ganttFilterProject)
        })).filter(m => m.tasks.length > 0 || ganttFilterProject === 'All');

        return filtered.sort((a, b) => {
            if (ganttSortBy === 'name_asc') return a.name.localeCompare(b.name);
            if (ganttSortBy === 'capacity_desc') return b.tasks.length - a.tasks.length;
            return 0;
        });
    }, [gantt, ganttFilterProject, ganttSortBy]);

    const KPICard = (props: any) => (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
            <p className="text-2xl font-light">{props.value}</p>
            <p className="text-xs text-[#78716C] uppercase tracking-wider mt-1">{props.label}</p>
        </div>
    );

    if (isLoading) return <PageSkeleton />;

    return (
        <div className="p-10 relative max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-medium text-[#1C1917]">Overview</h2>
                    <p className="text-[#78716C] text-sm mt-1">Summary of team capacity and project health.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverAnchor asChild>
                            <div>
                                <Select value={dateRangeParam} onValueChange={(val) => {
                                    setDateRangeParam(val);
                                    if (val === 'custom') setIsCalendarOpen(true);
                                }}>
                                    <SelectTrigger className="w-[220px] h-10 bg-white border-[#E7E5E4] rounded-md shadow-sm">
                                        <CalendarToday style={{ fontSize: 16 }} className="mr-2 text-[#78716C]" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-[#E7E5E4]">
                                        <SelectItem value="30">Last 30 Days</SelectItem>
                                        <SelectItem value="90">Last 90 Days</SelectItem>
                                        <SelectItem value="custom">Custom Date Range</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </PopoverAnchor>
                        <PopoverContent className="w-auto p-0 bg-white" align="start">
                            <Calendar mode="range" selected={customRange} onSelect={setCustomRange} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>
                    <Button className="bg-[#1C1917] text-white h-10 px-4 rounded-md hover:bg-[#292524]" onClick={() => navigate('/projects/create')}>
                        <Add style={{ fontSize: 16 }} className="mr-2" /> New Project
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 space-y-8">
                    <div className="grid grid-cols-4 gap-6">
                        {kpis.map((kpi) => <KPICard key={kpi.label} {...kpi} />)}
                    </div>

                    <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-lg font-medium">Capacity Overview</h2>
                            <div className="flex items-center gap-2">
                                <Select value={ganttFilterProject} onValueChange={setGanttFilterProject}>
                                    <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="All">All Projects</SelectItem>
                                        {uniqueProjects.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1 bg-[#FAFAF9] border rounded-md p-1">
                                    <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => setCurrentWeekStart(new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() - 7)))}>
                                        <ChevronLeftIcon style={{ fontSize: 16 }} />
                                    </Button>
                                    <span className="text-xs font-medium px-2">{weekLabel}</span>
                                    <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => setCurrentWeekStart(new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 7)))}>
                                        <ChevronRightIcon style={{ fontSize: 16 }} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                <div className="flex gap-1 border-b pb-2 mb-2 text-[#78716C] text-xs font-medium uppercase">
                                    <div className="w-56 pl-2">Team Member</div>
                                    <div className="flex flex-1 gap-2">
                                        {weekDays.map((day, i) => (
                                            <div key={i} className={`flex-1 text-center ${day.isToday ? 'text-[#0F766E] bg-[#F0FDFA] rounded' : ''}`}>{day.label}</div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {displayGantt.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-[#78716C] font-light">No team members match criteria.</p>
                                        </div>
                                    ) : (
                                        displayGantt.map((member) => {
                                            const viewStart = new Date(weekDays[0].date); viewStart.setHours(0, 0, 0, 0);
                                            const viewEnd = new Date(weekDays[6].date); viewEnd.setHours(23, 59, 59, 999);

                                            const validTasks = member.tasks.filter(task => {
                                                if (!task.startDate || !task.endDate) return false;
                                                const tStart = new Date(task.startDate); const tEnd = new Date(task.endDate);
                                                tStart.setHours(0, 0, 0, 0); tEnd.setHours(23, 59, 59, 999);
                                                return !(tEnd < viewStart || tStart > viewEnd);
                                            });

                                            const rowHeight = Math.max(64, validTasks.length * 40 + 24);

                                            return (
                                                <div key={member.id} className="flex items-stretch gap-1 group hover:bg-[#FAFAF9] rounded-lg transition-colors p-2 -mx-2" style={{ height: `${rowHeight}px` }}>
                                                    <div className="w-56 flex-shrink-0 flex items-center gap-3 pr-4 border-r border-[#E7E5E4]/50 z-20 bg-white group-hover:bg-[#FAFAF9]">
                                                        <Avatar className="w-8 h-8 border border-[#E7E5E4] transition-transform group-hover:scale-105">
                                                            <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-[10px]">{member.avatar}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold text-[#1C1917] truncate">{member.name}</div>
                                                            <div className="text-[10px] font-normal text-[#78716C] truncate">{member.role}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 ml-2 relative w-full h-full">
                                                        <div className="absolute inset-x-0 inset-y-0 flex gap-2 pointer-events-none z-0">
                                                            {weekDays.map((_, dayIdx) => (
                                                                <div key={dayIdx} className="flex-1 min-w-[100px] h-full relative">
                                                                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#E7E5E4]/30"></div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="absolute inset-0">
                                                            {validTasks.map((task, vIdx) => {
                                                                const tStart = new Date(task.startDate); const tEnd = new Date(task.endDate);
                                                                tStart.setHours(0, 0, 0, 0); tEnd.setHours(23, 59, 59, 999);

                                                                const visibleStart = new Date(Math.max(tStart.getTime(), viewStart.getTime()));
                                                                const visibleEnd = new Date(Math.min(tEnd.getTime(), viewEnd.getTime()));
                                                                const msInDay = 1000 * 60 * 60 * 24;
                                                                
                                                                const offsetDays = Math.floor((visibleStart.getTime() - viewStart.getTime()) / msInDay);
                                                                const durationDays = Math.floor((visibleEnd.getTime() - visibleStart.getTime()) / msInDay) + 1;

                                                                const leftPercent = (offsetDays / 7) * 100;
                                                                const widthPercent = (durationDays / 7) * 100;
                                                                const isTruncatedLeft = tStart < viewStart;
                                                                const isTruncatedRight = tEnd > viewEnd;

                                                                return (
                                                                    <div
                                                                        key={vIdx}
                                                                        onClick={() => openTaskModal(task.id)}
                                                                        className={`absolute h-8 text-[11px] font-medium flex items-center px-4 shadow-sm border cursor-pointer z-10 transition-all duration-200 hover:shadow-md hover:z-30 group/tooltip rounded-[8px]
                                                                        ${isTruncatedLeft ? '!rounded-l-none !border-l-0' : ''}
                                                                        ${isTruncatedRight ? '!rounded-r-none !border-r-0' : ''}
                                                                        ${task.displayStatus === 'track' ? 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1] hover:bg-[#E0F2FE]' : 'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5] hover:bg-[#FFF1F2]'}
                                                                        `}
                                                                        style={{ left: `calc(${leftPercent}%)`, width: `calc(${widthPercent}%)`, top: `${12 + vIdx * 40}px` }}
                                                                    >
                                                                        <span className="truncate w-full relative z-20">{task.name}</span>
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] bg-[#1C1917] text-white text-[11px] font-normal py-2 px-3 rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible z-[100] transition-all whitespace-normal text-left">
                                                                            <div className="font-medium text-white/90 mb-1">{task.project}</div>
                                                                            <div className="text-white/70 line-clamp-2">{task.name}</div>
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-solid border-t-[#1C1917] border-t-[5px] border-x-transparent border-x-[5px] border-b-0"></div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 shadow-sm">
                        <h2 className="text-lg font-medium mb-6">Upcoming Deadlines</h2>
                        <div className="space-y-3">
                            {deadlines.map((item) => (
                                <Link to={`/analytics/${item.id}`} key={item.id} className="flex items-center justify-between py-4 px-5 bg-[#FAFAF9] border rounded-lg hover:bg-white transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border flex items-center justify-center bg-white"><ViewKanban style={{ fontSize: 18 }} /></div>
                                        <div>
                                            <div className="text-sm font-medium">{item.project}</div>
                                            <div className="text-xs text-[#78716C]">{format(new Date(item.deadline), "MMM d, yyyy")}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <div className="text-sm font-medium">{item.daysLeft} days</div>
                                            <div className="text-[10px] text-[#78716C] uppercase">Remaining</div>
                                        </div>
                                        <StatusBadge status={item.status} />
                                        <ChevronRightIcon style={{ fontSize: 16 }} className="text-[#D6D3D1] group-hover:text-[#1C1917]" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {isTaskModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => !isTaskSaving && setIsTaskModalOpen(false)} />
                    <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsTaskModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#F5F5F4] transition-colors" disabled={isTaskSaving}>
                            <Close className="w-5 h-5 text-[#78716C]" />
                        </button>
                        <h2 className="text-2xl font-light text-[#1C1917] mb-6">Edit Task</h2>
                        
                        {isTaskFetching ? (
                            <div className="py-12 flex flex-col items-center justify-center text-[#78716C]">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#0F766E]" />
                                <p>Loading task details...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-[#78716C] mb-1 font-medium">Task Name</label>
                                    <input type="text" value={taskForm.name} onChange={(e) => setTaskForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all" disabled={isTaskSaving} />
                                </div>

                                <div>
                                    <label className="block text-sm text-[#78716C] mb-1 font-medium">Description</label>
                                    <textarea value={taskForm.description} onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all resize-none" disabled={isTaskSaving} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-[#78716C] mb-1 font-medium">Status</label>
                                        <select value={taskForm.status} onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] bg-white focus:ring-2 focus:ring-[#0F766E]/20" disabled={isTaskSaving}>
                                            <option value="not_started">Not Started</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="blocked">Blocked</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[#78716C] mb-1 font-medium">Assignee</label>
                                        <select value={taskForm.assignee_id} onChange={(e) => setTaskForm(prev => ({ ...prev, assignee_id: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] bg-white focus:ring-2 focus:ring-[#0F766E]/20" disabled={isTaskSaving}>
                                            <option value="">Unassigned</option>
                                            {orgUsers.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-[#78716C] mb-1 font-medium">Est. Hours</label>
                                        <input type="number" min="0" value={taskForm.estimated_hours} onChange={(e) => setTaskForm(prev => ({ ...prev, estimated_hours: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" disabled={isTaskSaving} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[#78716C] mb-1 font-medium">Start Date</label>
                                        <input type="date" value={taskForm.start_date} onChange={(e) => setTaskForm(prev => ({ ...prev, start_date: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" disabled={isTaskSaving} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[#78716C] mb-1 font-medium">Due Date</label>
                                        <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" disabled={isTaskSaving} />
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-3">
                                    <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsTaskModalOpen(false)} disabled={isTaskSaving}>Cancel</Button>
                                    <Button className="flex-1 h-12 text-white bg-[#0F766E] hover:bg-[#0D635C] rounded-xl" onClick={handleUpdateTask} disabled={isTaskSaving}>
                                        {isTaskSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Update Task'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};