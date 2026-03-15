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
import CalendarToday from '@mui/icons-material/CalendarToday';
import Add from '@mui/icons-material/Add';
import ViewKanban from '@mui/icons-material/ViewKanban';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

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
        </div>
    );
};