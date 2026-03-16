import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { useDashboard } from '@/hooks/useDashboard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Icons
import CalendarToday from '@mui/icons-material/CalendarToday';
import Add from '@mui/icons-material/Add';
import ViewKanban from '@mui/icons-material/ViewKanban';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Close from '@mui/icons-material/Close';
import { ArrowUpRight, ArrowDownRight, Sparkles, Loader2 } from 'lucide-react';

const getCurrentWeekMonday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
};

export const DashboardScreen = () => {
    const navigate = useNavigate();
    const {
        kpis, deadlines, gantt, isLoading,
        dateRangeParam, setDateRangeParam,
        tempCustomRange, setTempCustomRange,
        appliedCustomRange, setAppliedCustomRange,
        isCalendarOpen, setIsCalendarOpen,
    } = useDashboard();

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getCurrentWeekMonday());
    const [ganttFilterProject, setGanttFilterProject] = useState<string>('All');
    
    // Task Modal States
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isTaskFetching, setIsTaskFetching] = useState(false);
    const [isTaskSaving, setIsTaskSaving] = useState(false);
    const [orgUsers, setOrgUsers] = useState<any[]>([]);
    const [taskForm, setTaskForm] = useState({
        id: '', name: '', description: '', status: 'not_started', assignee_id: '',
        estimated_hours: 0, start_date: '', due_date: ''
    });

    const weekDays = useMemo(() => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + i);
            dates.push({ date, label: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }), isToday: new Date().toDateString() === date.toDateString() });
        }
        return dates;
    }, [currentWeekStart]);

    const weekLabel = `Week ending ${format(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6), "MMM d, yyyy")}`;

    const uniqueProjects = useMemo(() => {
        const projects = new Set<string>();
        gantt.forEach((m: any) => m.tasks.forEach((t: any) => t.project && projects.add(t.project)));
        return Array.from(projects).sort();
    }, [gantt]);

    const displayGantt = useMemo(() => {
        return gantt.map((member: any) => ({
            ...member, tasks: ganttFilterProject === 'All' ? member.tasks : member.tasks.filter((t: any) => t.project === ganttFilterProject)
        })).filter((m: any) => m.tasks.length > 0 || ganttFilterProject === 'All');
    }, [gantt, ganttFilterProject]);

    // UI Component for the 4 Square KPI Boxes
    const KPICard = ({ label, value, trend, sublabel }: any) => (
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">{label}</p>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${trend === 'up' ? 'bg-[#F0FDFA] text-[#0F766E]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                    {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
            </div>
            <h3 className="text-4xl font-light text-[#1C1917]">{value}</h3>
            {sublabel ? (
                <p className="text-xs font-medium text-[#A8A29E] mt-3">{sublabel}</p>
            ) : (
                <div className="h-4 mt-3"></div> // Spacer to keep heights consistent
            )}
        </div>
    );

    if (isLoading) return <PageSkeleton />;

    return (
        <div className="p-8 relative max-w-[1600px] mx-auto">
            
            {/* Header section matching Figma */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-light text-[#1C1917]">Dashboard</h2>
                    <p className="text-[#78716C] text-sm mt-1">Overview of your team's capacity and project health.</p>
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
                        <PopoverContent className="w-auto p-4 bg-white shadow-xl rounded-2xl border-[#E7E5E4]" align="end">
                            <Calendar mode="range" selected={tempCustomRange} onSelect={setTempCustomRange} numberOfMonths={2} className="mb-4" />
                            <div className="flex justify-end gap-2 pt-4 border-t border-[#E7E5E4]">
                                <Button variant="ghost" onClick={() => setIsCalendarOpen(false)}>Cancel</Button>
                                <Button 
                                    className="bg-[#1C1917] text-white hover:bg-[#292524] rounded-lg"
                                    onClick={() => { setAppliedCustomRange(tempCustomRange); setIsCalendarOpen(false); }}
                                >
                                    Apply
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button className="bg-[#1C1917] text-white h-10 px-4 rounded-lg shadow-sm font-medium hover:bg-[#292524]" onClick={() => navigate('/projects/create')}>
                        <Add style={{ fontSize: 18 }} className="mr-1.5" /> New Project
                    </Button>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-12 gap-6">
                
                {/* Left Column (Main Content) */}
                <div className="col-span-12 xl:col-span-8 space-y-6">
                    
                    {/* The 4 Square KPI Boxes */}
                    <div className="grid grid-cols-4 gap-4">
                        {kpis.map((kpi: any, i: number) => <KPICard key={i} {...kpi} />)}
                    </div>

                    {/* Team Capacity & Allocation */}
                    <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-[#1C1917]">Team Capacity & Allocation</h2>
                            <div className="flex items-center gap-3">
                                <Select value={ganttFilterProject} onValueChange={setGanttFilterProject}>
                                    <SelectTrigger className="h-8 w-[140px] text-xs font-medium bg-[#FAFAF9] border-[#E7E5E4] rounded-md">
                                        <SelectValue placeholder="Filter..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-md">
                                        <SelectItem value="All">All Projects</SelectItem>
                                        {uniqueProjects.map(p => <SelectItem key={p as string} value={p as string}>{p as string}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1 bg-white border border-[#E7E5E4] rounded-md p-1 shadow-sm">
                                    <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-[#F5F5F4] rounded" onClick={() => setCurrentWeekStart(new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() - 7)))}>
                                        <ChevronLeftIcon style={{ fontSize: 16 }} />
                                    </Button>
                                    <span className="text-[11px] font-bold px-3 text-[#1C1917] uppercase">{weekLabel}</span>
                                    <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-[#F5F5F4] rounded" onClick={() => setCurrentWeekStart(new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 7)))}>
                                        <ChevronRightIcon style={{ fontSize: 16 }} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Gantt Chart Implementation */}
                        <div className="overflow-x-auto">
                            <div className="min-w-[700px]">
                                <div className="flex gap-1 border-b border-[#E7E5E4] pb-3 mb-3 text-[#78716C] text-[10px] font-bold uppercase tracking-wider">
                                    <div className="w-56 pl-2">Team Member</div>
                                    <div className="flex flex-1 gap-2">
                                        {weekDays.map((day, i) => (
                                            <div key={i} className={`flex-1 text-center py-1 ${day.isToday ? 'text-[#0F766E] bg-[#F0FDFA] rounded-md font-bold' : ''}`}>
                                                {day.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    {displayGantt.length === 0 ? (
                                        <div className="text-center py-12 text-sm text-[#78716C]">No team members match criteria.</div>
                                    ) : (
                                        displayGantt.map((member: any) => {
                                            const viewStart = new Date(weekDays[0].date); viewStart.setHours(0, 0, 0, 0);
                                            const viewEnd = new Date(weekDays[6].date); viewEnd.setHours(23, 59, 59, 999);

                                            const validTasks = member.tasks.filter((task: any) => {
                                                if (!task.startDate || !task.endDate) return false;
                                                const tStart = new Date(task.startDate); const tEnd = new Date(task.endDate);
                                                tStart.setHours(0, 0, 0, 0); tEnd.setHours(23, 59, 59, 999);
                                                return !(tEnd < viewStart || tStart > viewEnd);
                                            });

                                            const rowHeight = Math.max(56, validTasks.length * 36 + 20);

                                            return (
                                                <div key={member.id} className="flex items-stretch gap-1 group hover:bg-[#FAFAF9] rounded-xl transition-colors p-2 -mx-2" style={{ height: `${rowHeight}px` }}>
                                                    <div className="w-56 flex-shrink-0 flex items-center gap-3 pr-4 border-r border-[#E7E5E4]/50 z-20 bg-white group-hover:bg-[#FAFAF9] transition-colors">
                                                        <Avatar className="w-9 h-9 border border-[#E7E5E4]">
                                                            <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-xs font-medium">{member.avatar}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold text-[#1C1917] truncate">{member.name}</div>
                                                            <div className="text-[10px] font-normal text-[#78716C] truncate">{member.email}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 ml-2 relative w-full h-full">
                                                        <div className="absolute inset-x-0 inset-y-0 flex gap-2 pointer-events-none z-0">
                                                            {weekDays.map((_, dayIdx) => (
                                                                <div key={dayIdx} className="flex-1 min-w-[100px] h-full relative">
                                                                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#E7E5E4]/40"></div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="absolute inset-0">
                                                            {validTasks.map((task: any, vIdx: number) => {
                                                                const tStart = new Date(task.startDate); const tEnd = new Date(task.endDate);
                                                                tStart.setHours(0, 0, 0, 0); tEnd.setHours(23, 59, 59, 999);

                                                                const visibleStart = new Date(Math.max(tStart.getTime(), viewStart.getTime()));
                                                                const visibleEnd = new Date(Math.min(tEnd.getTime(), viewEnd.getTime()));
                                                                const msInDay = 1000 * 60 * 60 * 24;
                                                                
                                                                const offsetDays = Math.floor((visibleStart.getTime() - viewStart.getTime()) / msInDay);
                                                                const durationDays = Math.floor((visibleEnd.getTime() - visibleStart.getTime()) / msInDay) + 1;

                                                                const leftPercent = (offsetDays / 7) * 100;
                                                                const widthPercent = (durationDays / 7) * 100;

                                                                return (
                                                                    <div
                                                                        key={vIdx}
                                                                        className={`absolute h-7 text-[11px] font-semibold flex items-center px-3 shadow-sm border cursor-pointer z-10 transition-all rounded-full
                                                                        ${task.displayStatus === 'track' ? 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]' : 'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]'}
                                                                        `}
                                                                        style={{ left: `calc(${leftPercent}%)`, width: `calc(${widthPercent}%)`, top: `${10 + vIdx * 36}px` }}
                                                                    >
                                                                        <span className="truncate w-full relative z-20">{task.project}</span>
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
                    <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-[#1C1917]">Upcoming Deadlines</h2>
                            <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider cursor-pointer hover:text-[#1C1917] transition-colors">View All</span>
                        </div>
                        <div className="space-y-3">
                            {deadlines.length === 0 ? (
                                <div className="text-center py-8 text-sm text-[#78716C]">No upcoming deadlines in the next 30 days.</div>
                            ) : deadlines.map((item: any) => (
                                <Link to={`/projects/${item.id}`} key={item.id} className="flex items-center justify-between py-4 px-5 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl hover:bg-white hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border border-[#E7E5E4] flex items-center justify-center bg-white text-[#78716C] group-hover:text-[#1C1917] transition-colors">
                                            <ViewKanban style={{ fontSize: 18 }} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-[#1C1917]">{item.project}</div>
                                            <div className="text-xs font-medium text-[#A8A29E] mt-0.5">{format(new Date(item.deadline), "MMM d, yyyy")}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-[#1C1917]">{item.daysLeft} days</div>
                                            <div className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider">Remaining</div>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider
                                            ${item.status === 'At Risk' ? 'bg-[#FEF2F2] text-[#DC2626]' : 
                                              item.status === 'Active' ? 'bg-[#F0FDFA] text-[#0F766E]' : 
                                              'bg-[#F1F5F9] text-[#64748B]'}`}>
                                            {item.status}
                                        </div>
                                        <ChevronRightIcon style={{ fontSize: 18 }} className="text-[#D6D3D1] group-hover:text-[#1C1917] transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column (AI Insights to match Figma Layout) */}
                <div className="col-span-12 xl:col-span-4">
                    <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-2xl p-6 shadow-sm h-full">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="text-[#0F766E]" size={20} />
                            <h2 className="text-lg font-semibold text-[#1C1917]">AI Insights</h2>
                        </div>
                        
                        {/* Static Placeholder Insights matching your Figma screenshot */}
                        <div className="space-y-4">
                            <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-[#FEF2F2] text-[#DC2626] text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Overload</span>
                                </div>
                                <h3 className="text-sm font-bold text-[#1C1917] mb-2">Frontend capacity overload — immediate action needed</h3>
                                <p className="text-xs text-[#78716C] mb-4 leading-relaxed">Sarah Chen is at 120% utilization and David Kim at 112%. Both have sustained overload for 3+ weeks.</p>
                                <div className="flex gap-2">
                                    <Button className="flex-1 bg-[#1C1917] hover:bg-[#292524] text-white h-8 text-xs rounded-lg">Review</Button>
                                    <Button variant="outline" className="flex-1 h-8 text-xs rounded-lg">Ignore</Button>
                                </div>
                            </div>

                            <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-[#FEFCE8] text-[#CA8A04] text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Risk Management</span>
                                </div>
                                <h3 className="text-sm font-bold text-[#1C1917] mb-2">Timeline optimization opportunity</h3>
                                <p className="text-xs text-[#78716C] mb-4 leading-relaxed">Platform Redesign is trending behind schedule at 69% with 36 days remaining.</p>
                                <div className="flex gap-2">
                                    <Button className="flex-1 bg-[#1C1917] hover:bg-[#292524] text-white h-8 text-xs rounded-lg">Review</Button>
                                    <Button variant="outline" className="flex-1 h-8 text-xs rounded-lg">Ignore</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};