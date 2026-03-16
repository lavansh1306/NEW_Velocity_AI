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
import { KPICard } from '@/components/shared/KPICard';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getDashboardData } from '@/services/dashboardService';
import type { KPIData, GanttMember, Deadline } from '@/types';
import { toast } from 'sonner';
import type { KPIData, GanttMember, Deadline } from '../types';
import CalendarToday from '@mui/icons-material/CalendarToday';
import Add from '@mui/icons-material/Add';
import ViewKanban from '@mui/icons-material/ViewKanban';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Close from '@mui/icons-material/Close';

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
    const [dataError, setDataError] = useState<string | null>(null);

    const [ganttFilterProject, setGanttFilterProject] = useState<string>('All');
    const [ganttSortBy, setGanttSortBy] = useState<string>('name_asc');
    const [dateRangeParam, setDateRangeParam] = useState<string>('30');
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getCurrentWeekMonday());

    const fetchData = async () => {
        if (!orgId) return;
        try {
            const endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            let startDate = new Date();

            if (dateRangeParam === 'custom') {
                startDate = customRange?.from ? new Date(customRange.from) : new Date();
                if (customRange?.to) endDate.setTime(customRange.to.getTime());
            } else {
                startDate.setDate(endDate.getDate() - parseInt(dateRangeParam || '30'));
    // Task Detail Popup State
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Task Status Constants
    const TASK_STATUSES = ['not_started', 'in_progress', 'blocked', 'completed'];
    const STATUS_COLORS: { [key: string]: string } = {
        'not_started': 'bg-[#F5F5F4] text-[#57534E]',
        'in_progress': 'bg-[#DBEAFE] text-[#1E40AF]',
        'blocked': 'bg-[#FEE2E2] text-[#991B1B]',
        'completed': 'bg-[#DCFCE7] text-[#15803D]'
    };

    const getStatusColor = (status: string) => {
        const normalizedStatus = status.toLowerCase().replace(' ', '_');
        return STATUS_COLORS[normalizedStatus] || STATUS_COLORS['not_started'];
    };

    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        setIsUpdatingStatus(true);
        try {
            if (!taskId) {
                throw new Error('Task ID is missing');
            }
            
            console.log('[DashboardScreen] Updating task:', { taskId, newStatus });
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId);

            if (error) throw error;
            toast.success(`Task status updated to ${newStatus.replace('_', ' ')}`);
            setSelectedTask({ ...selectedTask, status: newStatus });
        } catch (err: any) {
            console.error('Error updating task status:', err);
            toast.error('Failed to update task status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Calculate date range bounds
                const endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                let startDate = new Date();

                if (dateRangeParam === 'custom') {
                    startDate = customRange?.from ? new Date(customRange.from) : new Date();
                    if (customRange?.to) endDate.setTime(customRange.to.getTime());
                } else {
                    startDate.setDate(endDate.getDate() - parseInt(dateRangeParam || '30'));
                }

                // Important: clear time for uniform comparison bounds
                startDate.setHours(0, 0, 0, 0);

                const data = await getDashboardData({ startDate, endDate });
                setKpis(data.kpis);
                setDeadlines(data.deadlines);
                setGantt(data.gantt);
            } catch (err) {
                console.error('[DashboardScreen] Failed to load dashboard data:', err);
                setDataError('Failed to load dashboard data.');
            } finally {
                setIsLoading(false);
            }
            startDate.setHours(0, 0, 0, 0);

            const data = await getDashboardData({ startDate, endDate, orgId });
            setKpis(data.kpis);
            setDeadlines(data.deadlines);
            setGantt(data.gantt);
        } catch (err) {
            setDataError('Failed to load dashboard data.');
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRangeParam, customRange, orgId]);

    // Real-time listener for core tables
    useEffect(() => {
        if (!orgId) return;
        const channel = supabase.channel('dashboard-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [orgId]);

    const weekDays = useMemo(() => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + i);
            dates.push({
                date,
                label: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
                isToday: new Date().toDateString() === date.toDateString()
            });
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
            ...member,
            tasks: ganttFilterProject === 'All' ? member.tasks : member.tasks.filter(t => t.project === ganttFilterProject)
        })).filter(m => m.tasks.length > 0 || ganttFilterProject === 'All');

        return filtered.sort((a, b) => {
            if (ganttSortBy === 'name_asc') return a.name.localeCompare(b.name);
            if (ganttSortBy === 'capacity_desc') return b.tasks.length - a.tasks.length;
            return 0;
        });
    }, [gantt, ganttFilterProject, ganttSortBy]);

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
                        </PopoverAnchor>
                        <PopoverContent className="w-auto p-0 bg-white" align="start">
                            <Calendar mode="range" selected={customRange} onSelect={setCustomRange} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>
                    <Button className="bg-[#1C1917] text-white h-10 px-4 rounded-md" onClick={() => navigate('/projects/create')}>
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
                                    {displayGantt.map((member) => (
                                        <div key={member.id} className="flex items-stretch gap-1 group hover:bg-[#FAFAF9] p-2 -mx-2">
                                            <div className="w-56 flex items-center gap-3 pr-4 border-r">
                                                <Avatar className="w-8 h-8"><AvatarFallback>{member.avatar}</AvatarFallback></Avatar>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium truncate">{member.name}</div>
                                                    <div className="text-[10px] text-[#78716C] capitalize">{member.role}</div>
                                    {displayGantt.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-[#78716C] font-light">No team members with assignments matching criteria.</p>
                                        </div>
                                    ) : (
                                        displayGantt.map((member, idx) => {
                                            const viewStart = new Date(weekDays[0].date);
                                            viewStart.setHours(0, 0, 0, 0);
                                            const viewEnd = new Date(weekDays[6].date);
                                            viewEnd.setHours(23, 59, 59, 999);

                                            // Pre-filter valid tasks for this week to calculate row height
                                            const validTasks = member.tasks.filter(task => {
                                                const tStart = new Date(task.startDate);
                                                const tEnd = new Date(task.endDate);
                                                tStart.setHours(0, 0, 0, 0);
                                                tEnd.setHours(23, 59, 59, 999);
                                                return !(tEnd < viewStart || tStart > viewEnd);
                                            });

                                            // Base height 64px (h-16), add 40px per task if more than 1
                                            const rowHeight = Math.max(64, validTasks.length * 40 + 24);

                                            return (
                                                <div key={member.id} className="flex items-stretch gap-1 group hover:bg-[#FAFAF9] rounded-lg transition-colors p-2 -mx-2" style={{ height: `${rowHeight}px` }}>
                                                    {/* Member Info */}
                                                    <div className="w-56 flex-shrink-0 flex items-center gap-3 pr-4 border-r border-[#E7E5E4]/50 z-20 bg-white group-hover:bg-[#FAFAF9]">
                                                        <Avatar className="w-8 h-8 border border-[#E7E5E4] transition-transform group-hover:scale-105">
                                                            <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-[10px]">{member.avatar}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold text-[#1C1917] truncate">{member.name}</div>
                                                            <div className="text-[10px] font-normal text-[#78716C] truncate">{member.email}</div>
                                                        </div>
                                                    </div>

                                                    {/* Continuous Pill Gantt Area */}
                                                    <div className="flex-1 ml-2 relative w-full h-full">
                                                        {/* Vertical Grid Lines (Background only) */}
                                                        <div className="absolute inset-x-0 inset-y-0 flex gap-2 pointer-events-none z-0">
                                                            {weekDays.map((_, dayIdx) => (
                                                                <div key={dayIdx} className="flex-1 min-w-[100px] h-full relative">
                                                                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#E7E5E4]/30"></div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Task Pills (Absolute Positioning) */}
                                                        <div className="absolute inset-0">
                                                            {validTasks.map((task, vIdx) => {
                                                                const tStart = new Date(task.startDate);
                                                                const tEnd = new Date(task.endDate);
                                                                tStart.setHours(0, 0, 0, 0);
                                                                tEnd.setHours(23, 59, 59, 999);

                                                                // Calculate intersection for this week
                                                                const visibleStart = new Date(Math.max(tStart.getTime(), viewStart.getTime()));
                                                                const visibleEnd = new Date(Math.min(tEnd.getTime(), viewEnd.getTime()));

                                                                // Calculate Left % and Width %
                                                                const msInDay = 1000 * 60 * 60 * 24;
                                                                const totalViewDays = 7;

                                                                // Use 0-based day indexing for positioning. 
                                                                const offsetDays = Math.floor((visibleStart.getTime() - viewStart.getTime()) / msInDay);
                                                                // Duration includes the end day
                                                                const durationDays = Math.floor((visibleEnd.getTime() - visibleStart.getTime()) / msInDay) + 1;

                                                                const leftPercent = (offsetDays / totalViewDays) * 100;
                                                                const widthPercent = (durationDays / totalViewDays) * 100;

                                                                const isTruncatedLeft = tStart < viewStart;
                                                                const isTruncatedRight = tEnd > viewEnd;

                                                                return (
                                                                    <div
                                                                        key={vIdx}
                                                                        onClick={() => setSelectedTask(task)}
                                                                        className={`absolute h-8 text-[11px] font-medium flex items-center px-4 shadow-sm border cursor-pointer z-10 transition-all duration-200 hover:shadow-md hover:z-30 group/tooltip rounded-[8px]
                                                                        ${isTruncatedLeft ? '!rounded-l-none !border-l-0' : ''}
                                                                        ${isTruncatedRight ? '!rounded-r-none !border-r-0' : ''}
                                                                        ${task.displayStatus === 'track'
                                                                                ? 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1] hover:bg-[#E0F2FE] hover:border-[#BAE6FD]' // Lighter teal
                                                                                : 'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5] hover:bg-[#FFF1F2] hover:border-[#FECDD3]' // Orange
                                                                            }
                                                                    `}
                                                                        style={{
                                                                            left: `calc(${leftPercent}%)`,
                                                                            width: `calc(${widthPercent}%)`,
                                                                            top: `${12 + vIdx * 40}px` // Stack vertically: start at 12px down, add 40px each
                                                                        }}
                                                                    >
                                                                        <span className="truncate w-full relative z-20">
                                                                            {task.name}
                                                                        </span>

                                                                        {/* Hover Tooltip - Positioned centered above the pill */}
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] bg-[#1C1917] text-white text-[11px] font-normal py-2 px-3 rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible z-[100] transition-all whitespace-normal text-left">
                                                                            <div className="font-medium text-white/90 mb-1">{task.project}</div>
                                                                            <div className="text-white/70 line-clamp-2">{task.name}</div>
                                                                            {/* Pointer triangle */}
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-solid border-t-[#1C1917] border-t-[5px] border-x-transparent border-x-[5px] border-b-0"></div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 relative">
                                                {member.tasks.map((task, vIdx) => (
                                                    <div key={task.id} 
                                                        className={`absolute h-8 text-[11px] font-medium flex items-center px-4 rounded-[8px] border shadow-sm ${task.status === 'track' ? 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]' : 'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]'}`}
                                                        style={{ left: '0%', width: '100%', top: `${vIdx * 40}px` }}>
                                                        <span className="truncate">{task.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 shadow-sm">
                        <h2 className="text-lg font-medium mb-6">Upcoming Deadlines</h2>
                        <div className="space-y-3">
                            {deadlines.map((item) => (
                                <Link to="/projects" key={item.id} className="flex items-center justify-between py-4 px-5 bg-[#FAFAF9] border rounded-lg hover:bg-white transition-all group">
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
                                        <ChevronRightIcon style={{ fontSize: 16 }} className="text-[#D6D3D1]" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Detail Popup Modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center" onClick={() => setSelectedTask(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="border-b border-[#E7E5E4] p-6 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-[#1C1917]">Task Details</h3>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="text-[#A8A29E] hover:text-[#57534E] transition-colors p-1"
                            >
                                <Close style={{ fontSize: 20 }} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs text-[#78716C] font-light uppercase tracking-wider mb-1">Task Name</p>
                                <p className="text-sm font-medium text-[#1C1917]">{selectedTask.name}</p>
                            </div>

                            <div>
                                <p className="text-xs text-[#78716C] font-light uppercase tracking-wider mb-1">Project</p>
                                <p className="text-sm font-medium text-[#1C1917]">{selectedTask.project}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-[#78716C] font-light uppercase tracking-wider mb-1">Start Date</p>
                                    <p className="text-sm font-medium text-[#1C1917]">
                                        {new Date(selectedTask.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#78716C] font-light uppercase tracking-wider mb-1">End Date</p>
                                    <p className="text-sm font-medium text-[#1C1917]">
                                        {new Date(selectedTask.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-[#78716C] font-light uppercase tracking-wider mb-2">Status</p>
                                <div className="relative">
                                    <button
                                        onClick={() => setSelectedTask({ ...selectedTask, statusDropdownOpen: !selectedTask.statusDropdownOpen })}
                                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer hover:opacity-80 ${getStatusColor(selectedTask.status)}`}
                                        disabled={isUpdatingStatus}
                                    >
                                        {selectedTask.status.replace('_', ' ')}
                                    </button>
                                    {selectedTask.statusDropdownOpen && (
                                        <div className="absolute top-full mt-2 left-0 bg-white border border-[#E7E5E4] rounded-lg shadow-lg z-50 min-w-[160px]">
                                            {TASK_STATUSES.map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => {
                                                        updateTaskStatus(selectedTask.id, status);
                                                        setSelectedTask({ ...selectedTask, statusDropdownOpen: false });
                                                    }}
                                                    disabled={isUpdatingStatus}
                                                    className={`w-full text-left px-4 py-2 text-xs first:rounded-t-lg last:rounded-b-lg transition-colors ${getStatusColor(status)} hover:opacity-80 ${selectedTask.status === status ? 'border-l-4 border-l-[#0F766E]' : ''}`}
                                                >
                                                    {status.replace('_', ' ').toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedTask.assignee && (
                                <div>
                                    <p className="text-xs text-[#78716C] font-light uppercase tracking-wider mb-1">Assigned To</p>
                                    <p className="text-sm font-medium text-[#1C1917]">{selectedTask.assignee}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-[#E7E5E4] p-6 flex gap-3">
                            <Button
                                onClick={() => setSelectedTask(null)}
                                variant="outline"
                                className="flex-1 border-[#E7E5E4] text-[#1C1917] hover:bg-[#FAFAF9]"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={() => {
                                    setSelectedTask(null);
                                    navigate('/projects');
                                }}
                                className="flex-1 bg-[#0F766E] hover:bg-[#0D6B65] text-white"
                            >
                                View Project
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};