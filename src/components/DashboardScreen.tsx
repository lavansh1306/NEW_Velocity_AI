import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from './ui/popover';
import { Calendar } from './ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from './ui/avatar';
import { StatusBadge } from './shared/StatusBadge';
import { KPICard } from './shared/KPICard';
import { PageHeader } from './shared/PageHeader';
import { PageSkeleton } from './shared/SkeletonLoader';
import { useSimulatedLoading } from '@/hooks/useDashboard';
import { getDashboardData } from '@/services/dashboardService';
import type { KPIData, GanttMember, Deadline } from '../types';
import CalendarToday from '@mui/icons-material/CalendarToday';
import Add from '@mui/icons-material/Add';
import ViewKanban from '@mui/icons-material/ViewKanban';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// Helper to get the Monday of the current week
const getCurrentWeekMonday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
};

export const DashboardScreen = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useSimulatedLoading(600);
    const [kpis, setKpis] = useState<KPIData[]>([]);
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [gantt, setGantt] = useState<GanttMember[]>([]);
    const [dataError, setDataError] = useState<string | null>(null);

    // Filter & Sort State
    const [ganttFilterProject, setGanttFilterProject] = useState<string>('All');
    const [ganttSortBy, setGanttSortBy] = useState<string>('name_asc');

    // Date Range State
    const [dateRangeParam, setDateRangeParam] = useState<string>('30');
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Week Navigation State
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getCurrentWeekMonday());

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
        };

        fetchData();
    }, [dateRangeParam, customRange]);

    // Helper to generate the 7 dates for the currently selected week
    const generateWeekDates = (monday: Date) => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            dates.push({
                date,
                label: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
                isToday: new Date().toDateString() === date.toDateString()
            });
        }
        return dates;
    };

    const weekDays = generateWeekDates(currentWeekStart);

    // Format week header range (e.g. "Week ending Mar 09, 2026")
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    const weekLabel = `Week ending ${weekEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}, ${weekEnd.getFullYear()}`;

    const handlePrevWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(currentWeekStart.getDate() - 7);
        setCurrentWeekStart(newStart);
    };

    const handleNextWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(currentWeekStart.getDate() + 7);
        setCurrentWeekStart(newStart);
    };

    const uniqueProjects = useMemo(() => {
        const projects = new Set<string>();
        gantt.forEach(member => {
            member.tasks.forEach(task => {
                if (task.project) projects.add(task.project);
            });
        });
        return Array.from(projects).sort();
    }, [gantt]);

    const displayGantt = useMemo(() => {
        let filtered = [...gantt];

        // 1. Filter by Project
        if (ganttFilterProject !== 'All') {
            filtered = filtered
                .map(member => ({
                    ...member,
                    tasks: member.tasks.filter(t => t.project === ganttFilterProject)
                }))
                .filter(member => member.tasks.length > 0);
        }

        // 2. Sort
        filtered.sort((a, b) => {
            if (ganttSortBy === 'name_asc') {
                return a.name.localeCompare(b.name);
            } else if (ganttSortBy === 'capacity_desc') {
                return b.tasks.length - a.tasks.length;
            } else if (ganttSortBy === 'capacity_asc') {
                return a.tasks.length - b.tasks.length;
            }
            return 0;
        });

        return filtered;
    }, [gantt, ganttFilterProject, ganttSortBy]);

    if (isLoading) return <PageSkeleton />;

    if (dataError) {
        return (
            <div className="p-10 max-w-[1600px] mx-auto text-center">
                <p className="text-[#78716C] text-sm">{dataError}</p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="p-10 relative max-w-[1600px] mx-auto">
            <PageHeader
                title="Dashboard"
                subtitle="Overview of your team's capacity and project health."
                actions={
                    <div className="flex items-center gap-3">
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverAnchor asChild>
                                <div>
                                    <Select value={dateRangeParam} onValueChange={(val) => {
                                        setDateRangeParam(val);
                                        if (val === 'custom') {
                                            setIsCalendarOpen(true);
                                        }
                                    }}>
                                        <SelectTrigger className="w-[220px] h-10 bg-white border-[#E7E5E4] text-[#1C1917] hover:border-[#D6D3D1] transition-all focus:ring-0 shadow-sm font-medium rounded-md">
                                            <div className="flex items-center">
                                                <CalendarToday style={{ fontSize: 16 }} className="mr-2 text-[#78716C]" />
                                                {dateRangeParam === 'custom' && customRange?.from ? (
                                                    <span className="truncate">
                                                        {format(customRange.from, "MMM d")} {customRange.to ? `- ${format(customRange.to, "MMM d")}` : ''}
                                                    </span>
                                                ) : (
                                                    <SelectValue placeholder="Select Range" />
                                                )}
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-[#E7E5E4] shadow-lg rounded-xl overflow-hidden p-1 z-50">
                                            <SelectItem value="30" className="rounded-md focus:bg-[#F5F5F4] cursor-pointer">Last 30 Days</SelectItem>
                                            <SelectItem value="60" className="rounded-md focus:bg-[#F5F5F4] cursor-pointer">Last 60 Days</SelectItem>
                                            <SelectItem value="90" className="rounded-md focus:bg-[#F5F5F4] cursor-pointer">Last 90 Days</SelectItem>
                                            <div className="h-px bg-[#E7E5E4] my-1 mx-2" />
                                            <SelectItem value="custom" className="rounded-md focus:bg-[#F5F5F4] cursor-pointer">Custom Date Range</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </PopoverAnchor>

                            <PopoverContent className="w-auto p-0 bg-white border-[#E7E5E4] rounded-xl shadow-xl z-50 mt-1" align="start" sideOffset={8}>
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={customRange?.from}
                                    selected={customRange}
                                    onSelect={(range) => setCustomRange(range)}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>

                        <Button
                            className="bg-[#1C1917] text-white hover:bg-[#292524] shadow-md hover:shadow-lg transition-all h-10"
                            onClick={() => navigate('/projects/create')}
                        >
                            <Add style={{ fontSize: 16 }} className="mr-2" />
                            New Project
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-12 gap-8">
                {/* Main Content */}
                <div className="col-span-12 space-y-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-6">
                        {kpis.map((kpi) => (
                            <KPICard key={kpi.label} {...kpi} />
                        ))}
                    </div>

                    {/* Capacity Overview Chart - 7 DAY VIEW */}
                    <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 shadow-sm">
                        <div className="flex flex-col gap-6 mb-8">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-medium text-[#1C1917]">Team Capacity & Allocation</h2>
                                <div className="flex items-center gap-3">
                                    <Select value={ganttFilterProject} onValueChange={setGanttFilterProject}>
                                        <SelectTrigger className="h-8 w-[140px] text-xs border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] hover:bg-white transition-colors bg-white focus:ring-0">
                                            <SelectValue placeholder="Filter" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-[#E7E5E4] shadow-lg rounded-xl z-50">
                                            <SelectItem value="All" className="text-xs cursor-pointer">All Projects</SelectItem>
                                            <div className="h-px bg-[#E7E5E4] my-1 mx-2" />
                                            {uniqueProjects.map(proj => (
                                                <SelectItem key={proj} value={proj} className="text-xs cursor-pointer">{proj}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={ganttSortBy} onValueChange={setGanttSortBy}>
                                        <SelectTrigger className="h-8 w-[140px] text-xs border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] hover:bg-white transition-colors bg-white focus:ring-0">
                                            <SelectValue placeholder="Sort" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-[#E7E5E4] shadow-lg rounded-xl z-50">
                                            <SelectItem value="name_asc" className="text-xs cursor-pointer">Name (A-Z)</SelectItem>
                                            <SelectItem value="capacity_desc" className="text-xs cursor-pointer">Busiest First</SelectItem>
                                            <SelectItem value="capacity_asc" className="text-xs cursor-pointer">Most Available</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="h-4 w-px bg-[#E7E5E4] mx-1"></div>
                                    <div className="flex items-center gap-1 bg-[#FAFAF9] rounded-md p-0.5 border border-[#E7E5E4]">
                                        <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-white text-[#78716C]" onClick={handlePrevWeek}>
                                            <ChevronLeftIcon style={{ fontSize: 16 }} />
                                        </Button>
                                        <span className="text-xs font-medium text-[#1C1917] px-2">{weekLabel}</span>
                                        <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-white text-[#78716C]" onClick={handleNextWeek}>
                                            <ChevronRightIcon style={{ fontSize: 16 }} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-[#0F766E] rounded-full"></div>
                                    <span className="text-xs text-[#78716C]">On Track</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-[#F59E0B] rounded-full"></div>
                                    <span className="text-xs text-[#78716C]">At Risk</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-[#F5F5F4] border border-[#E7E5E4] rounded-full"></div>
                                    <span className="text-xs text-[#78716C]">Available</span>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="min-w-[800px] pb-4">
                                {/* Timeline Header */}
                                <div className="flex gap-1 border-b border-[#E7E5E4] pb-2 mb-2">
                                    <div className="w-56 flex-shrink-0 text-xs font-medium text-[#78716C] uppercase tracking-wide pl-2 flex items-end pb-1">
                                        Team Member
                                    </div>

                                    <div className="flex gap-2 flex-1 relative">
                                        {weekDays.map((day, i) => (
                                            <div key={i} className="flex-1 min-w-[100px] text-center relative z-10">
                                                <div className={`text-xs font-medium inline-block px-2 ${day.isToday ? 'text-[#0F766E] font-bold bg-[#F0FDFA] rounded-md py-1' : 'text-[#78716C] py-1'}`}>
                                                    {day.label}
                                                    {day.isToday && <span className="ml-1 text-[10px] uppercase font-bold text-[#0F766E]">(Today)</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Team Rows */}
                                <div className="space-y-4">
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
                                                <div key={idx} className="flex items-stretch gap-1 group hover:bg-[#FAFAF9] rounded-lg transition-colors p-2 -mx-2" style={{ height: `${rowHeight}px` }}>
                                                    {/* Member Info */}
                                                    <div className="w-56 flex-shrink-0 flex items-center gap-3 pr-4 border-r border-[#E7E5E4]/50 z-20 bg-white group-hover:bg-[#FAFAF9]">
                                                        <Avatar className="w-8 h-8 border border-[#E7E5E4] transition-transform group-hover:scale-105">
                                                            <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-[10px]">{member.avatar}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-[#1C1917] truncate">{member.name}</div>
                                                            <div className="text-[10px] text-[#78716C] truncate">{member.role}</div>
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
                                                                        onClick={() => navigate(`/projects`)} // Navigate to projects list
                                                                        className={`absolute h-8 text-[11px] font-medium flex items-center px-4 shadow-sm border cursor-pointer z-10 transition-all duration-200 hover:shadow-md hover:z-30 group/tooltip rounded-[8px]
                                                                        ${isTruncatedLeft ? '!rounded-l-none !border-l-0' : ''}
                                                                        ${isTruncatedRight ? '!rounded-r-none !border-r-0' : ''}
                                                                        ${task.status === 'track'
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
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-medium text-[#1C1917]">Upcoming Deadlines</h2>
                            <Button variant="ghost" className="text-xs text-[#78716C] hover:text-[#1C1917]" onClick={() => navigate('/projects')}>View All</Button>
                        </div>

                        <div className="space-y-3">
                            {deadlines.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-[#78716C] font-light">No upcoming deadlines</p>
                                </div>
                            ) : (
                                deadlines.map((item, idx) => {
                                    const isDelayed = item.daysLeft < 0;
                                    const displayDays = Math.abs(item.daysLeft);

                                    return (
                                        <Link to="/projects" key={idx} className="flex items-center justify-between py-4 px-5 bg-[#FAFAF9] border border-[#E7E5E4]/50 rounded-lg hover:border-[#D6D3D1] hover:bg-white transition-all duration-200 cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white border border-[#E7E5E4] flex items-center justify-center text-[#78716C] group-hover:text-[#0F766E] group-hover:border-[#CCFBF1] transition-colors">
                                                    <ViewKanban style={{ fontSize: 18 }} />
                                                </div>
                                                <div>
                                                    <div className="text-[#1C1917] text-sm font-medium mb-0.5">{item.project}</div>
                                                    <div className="text-xs text-[#78716C]">{item.deadline}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <div className="text-sm text-[#1C1917] font-medium">{displayDays} days</div>
                                                    <div className="text-[10px] text-[#78716C] uppercase tracking-wide">{isDelayed ? 'Delayed' : 'Remaining'}</div>
                                                </div>
                                                <StatusBadge status={item.status} />
                                                <ChevronRightIcon style={{ fontSize: 16 }} className="text-[#D6D3D1] group-hover:text-[#78716C] transition-colors" />
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
