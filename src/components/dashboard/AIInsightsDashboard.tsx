import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Zap,
  BarChart3,
  Target,
  Activity,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { KPICard } from '@/components/shared/KPICard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';

// ==================== SHARED COMPONENTS ====================

const UtilizationBar = ({ value }: { value: number }) => {
  const color = value > 110 ? 'bg-rose-400' : value > 90 ? 'bg-amber-400' : 'bg-blue-400';
  const width = Math.min(value, 150);

  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

const HealthIndicator = ({ score }: { score: number }) => {
  const color = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600';
  const bgColor = score >= 80 ? 'bg-emerald-50' : score >= 60 ? 'bg-amber-50' : 'bg-rose-50';

  return (
    <div className="flex items-center gap-3">
      <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center`}>
        <span className={`text-xl font-light ${color}`}>{score}</span>
      </div>
    </div>
  );
};

const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="bg-blue-600 rounded-xl p-2">
        <Zap className="w-5 h-5 text-white" />
      </div>
      <span className={`font-medium text-gray-900 ${sizes[size]}`}>Velocity AI</span>
    </div>
  );
};

// ==================== MAIN DASHBOARD COMPONENT ====================

export const AIInsightsDashboard = () => {
  const [timeframe, setTimeframe] = useState<'1' | '2' | '4' | '8'>('8');
  const [tasksData, setTasksData] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Fetch tasks with user data
  useEffect(() => {
    const fetchTasksData = async () => {
      setIsLoadingTasks(true);
      try {
        const orgId = getCurrentOrgId();
        if (!orgId) return;

        // Fetch projects for this org
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id')
          .eq('organization_id', orgId);

        if (projectsError) throw projectsError;

        const projectIds = (projects || []).map(p => p.id);
        if (projectIds.length === 0) {
          setTasksData([]);
          return;
        }

        // Fetch tasks for these projects
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, name, user_id, start_date, due_date, estimated_hours')
          .in('project_id', projectIds);

        if (tasksError) throw tasksError;

        // Only fetch users that are actually assigned to tasks
        const userIds = [...new Set((tasks || []).filter(t => t.user_id).map((t: any) => t.user_id))];
        
        let userMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', userIds);

          if (usersError) throw usersError;

          (users || []).forEach(u => {
            userMap[u.id] = u;
          });
        }

        console.log('=== TASK FETCH DEBUG ===');
        console.log('Fetched tasks:', tasks?.length ?? 0);
        console.log('Tasks with assigned users:', tasks?.filter((t: any) => t.user_id).length ?? 0);
        console.log('Users fetched:', Object.keys(userMap).length);
        console.log('Tasks data:', tasks);
        console.log('User map:', userMap);

        setUsersMap(userMap);
        setTasksData(tasks || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasksData([]);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchTasksData();
  }, []);

  // Generate capacity data based on tasks and timeframe
  const generateCapacityData = (weeks: number) => {
    const data = [];
    const today = new Date();
    
    console.log('[CHART DEBUG] Generating data for', weeks, 'weeks');
    console.log('[CHART DEBUG] Tasks available:', tasksData.length);
    
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Calculate utilization for this week from tasks
      let weekHours = 0;
      tasksData.forEach(task => {
        if (task.start_date && task.due_date) {
          const taskStart = new Date(task.start_date);
          const taskEnd = new Date(task.due_date);
          
          // Check if task overlaps with this week
          if (taskStart <= weekEnd && taskEnd >= weekStart) {
            weekHours += task.estimated_hours || 0;
            console.log(`[CHART DEBUG] Week ${i+1}: Task "${task.name}" overlaps - adding ${task.estimated_hours}h`);
          }
        }
      });

      const weekData = {
        week: `Week ${i + 1}`,
        weekDate: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        utilization: weekHours,
        available: Math.max(160 - weekHours, 0),
      };
      
      console.log(`[CHART DEBUG] Week ${i+1}:`, weekData);
      data.push(weekData);
    }
    
    console.log('[CHART DEBUG] Final chart data:', data);
    return data;
  };

  const capacityData = generateCapacityData(parseInt(timeframe));

  // Group tasks by assigned user
  const tasksByUser: Record<string, any[]> = tasksData.reduce((acc, task) => {
    if (task.user_id) {
      if (!acc[task.user_id]) {
        acc[task.user_id] = [];
      }
      acc[task.user_id].push(task);
    }
    return acc;
  }, {} as Record<string, any[]>);

  const upcomingDeadlines = [
    { project: 'Velocity AI Platform Redesign', deadline: 'Mar 30, 2026', daysLeft: 44, status: 'At Risk' },
    { project: 'Mobile App MVP', deadline: 'Mar 15, 2026', daysLeft: 29, status: 'Active' },
    { project: 'API Documentation', deadline: 'Feb 28, 2026', daysLeft: 14, status: 'Active' },
  ];

  const aiRecommendations = [
    {
      severity: 'rose',
      title: 'Frontend capacity requires attention',
      description: 'Sarah Chen at 120% utilization. Review task distribution.',
    },
    {
      severity: 'amber',
      title: 'Timeline adjustment suggested',
      description: 'Platform Redesign shows 13-day delay pattern.',
    },
    {
      severity: 'emerald',
      title: 'Resource opportunity identified',
      description: '168 hours available Week 3 for strategic allocation.',
    },
  ];

  return (
    <div className="p-12 bg-gray-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-4xl font-light text-gray-900 mb-12 tracking-tight">Dashboard</h1>

        <div className="grid grid-cols-12 gap-10">
          {/* Main Content - Full Width */}
          <div className="col-span-12 space-y-12">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-6">
              <KPICard label="Active Projects" value="12" />
              <KPICard label="Team Utilization" value="87%" sublabel="Within target" />
              <KPICard label="Available Capacity" value="312h" sublabel="Next 2 weeks" />
              <KPICard label="Projects at Risk" value="3" />
            </div>

            {/* Capacity Overview Chart - MAIN FOCUS */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-light text-gray-900">Capacity Overview</h2>
                  <p className="text-sm text-gray-500 font-light mt-1">Team hours allocated vs available capacity</p>
                </div>
                <div className="flex gap-2">
                  {(['1', '2', '4', '8'] as const).map((weeks) => (
                    <button
                      key={weeks}
                      onClick={() => setTimeframe(weeks)}
                      className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${timeframe === weeks
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {weeks}W
                    </button>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={capacityData} margin={{ top: 20, right: 30, left: 60, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 13, fill: '#9ca3af' }} 
                    axisLine={false} 
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    tick={{ fontSize: 13, fill: '#9ca3af' }} 
                    axisLine={false} 
                    tickLine={false}
                    width={60}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontWeight: '300',
                      padding: '12px',
                    }}
                    formatter={(value) => `${value}h`}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="utilization" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Hours Allocated" />
                  <Bar dataKey="available" fill="#d1d5db" radius={[8, 8, 0, 0]} name="Hours Available" />
                </BarChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-12 mt-8 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600 font-light">Hours Allocated</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded"></div>
                  <span className="text-sm text-gray-600 font-light">Hours Available</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-10">
              {/* Left Section - 8 columns */}
              <div className="col-span-8 space-y-12">

            {/* Tasks by User Gantt View */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-light text-gray-900">Task Timeline by Assignee</h2>
                {isLoadingTasks && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
              </div>

              {isLoadingTasks ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading tasks...
                </div>
              ) : Object.keys(tasksByUser).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(tasksByUser).map(([userId, userTasks]) => {
                    const user = usersMap[userId];
                    if (!user) return null;

                    const initials = (user.name || user.email).substring(0, 2).toUpperCase();

                    return (
                      <div key={userId} className="border-b border-gray-100 pb-6 last:border-b-0">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                            {initials}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-light text-gray-900">{user.name || user.email}</div>
                          </div>
                          <div className="text-xs text-gray-500 font-light">{userTasks.length} task{userTasks.length !== 1 ? 's' : ''}</div>
                        </div>

                        <div className="space-y-2">
                          {userTasks.map((task) => {
                            const hasStartDate = task.start_date;
                            const hasDueDate = task.due_date;
                            const isComplete = task.status === 'completed';

                            return (
                              <div key={task.id} className="flex items-center gap-3 py-2">
                                <div className="w-32 text-xs text-gray-700 font-light truncate">{task.name}</div>
                                <div className="flex-1 flex items-center gap-1">
                                  {hasStartDate && (
                                    <div className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded whitespace-nowrap">
                                      Start: {new Date(task.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                  )}
                                  {hasDueDate && (
                                    <div className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded whitespace-nowrap">
                                      Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 font-light min-w-fit">
                                  {task.estimated_hours}h
                                </div>
                                <div className={`text-[10px] px-2 py-1 rounded font-light ${
                                  isComplete ? 'bg-emerald-50 text-emerald-600' :
                                  task.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                                  'bg-gray-50 text-gray-600'
                                }`}>
                                  {task.status || 'not_started'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-center">
                  <div>
                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-light">No tasks assigned yet</p>
                    <p className="text-xs text-gray-400 font-light mt-1">Create a project and assign tasks to team members to see them here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
              <h2 className="text-xl font-light text-gray-900 mb-8">Upcoming Deadlines</h2>

              <div className="space-y-4">
                {upcomingDeadlines.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-5 px-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="text-gray-900 text-sm mb-1.5 font-light">{item.project}</div>
                      <div className="text-xs text-gray-400 font-light">{item.deadline}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-900 font-light">{item.daysLeft} days</div>
                        <div className="text-xs text-gray-400 font-light">remaining</div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>

            {/* AI Recommendations Panel - 4 columns */}
            <div className="col-span-4">
                <div className="bg-white rounded-2xl p-8 shadow-sm sticky top-28 border border-gray-100">
                  <h2 className="text-xl font-light text-gray-900 mb-8">AI Insights</h2>

                  <div className="space-y-4">
                    {aiRecommendations.map((rec, idx) => {
                      const dotColors: Record<string, string> = {
                        rose: 'bg-rose-400',
                        amber: 'bg-amber-400',
                        emerald: 'bg-emerald-400',
                      };

                      return (
                        <div key={idx} className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-400">
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`w-1.5 h-1.5 rounded-full mt-2 ${dotColors[rec.severity]}`} />
                            <div className="flex-1">
                              <div className="text-gray-900 text-sm mb-2 font-light">{rec.title}</div>
                              <div className="text-sm text-gray-500 font-light leading-relaxed">{rec.description}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full text-xs h-9 rounded-xl font-light text-gray-600 hover:text-gray-900 hover:bg-white"
                          >
                            Review
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsDashboard;
