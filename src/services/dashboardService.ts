import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import type { KPIData, Deadline, GanttMember, DashboardData, GanttTask } from '@/types';

/**
 * Main dashboard data fetcher
 * Aggregates all dashboard data from Supabase DB only (no Jira API)
 */
interface DashboardOptions {
    startDate?: Date;
    endDate?: Date;
}

export async function getDashboardData(options?: DashboardOptions): Promise<DashboardData> {
    try {
        console.log('[dashboardService] Fetching dashboard data from Supabase (projects/tasks table)...');
        
        // Check organization ID
        const orgId = getCurrentOrgId();
        console.log('[dashboardService] Current org ID:', orgId);
        
        if (!orgId) {
            console.warn('[dashboardService] No organization ID set! Cannot fetch data.');
            return { kpis: [], deadlines: [], gantt: [], weekDates: [] };
        }

        // Fetch projects for the organization
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('organization_id', orgId);

        if (projectsError) throw projectsError;

        console.log('[dashboardService] Loaded', projects?.length, 'projects');

        // Fetch tasks for these projects
        const { data: allTasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .in('project_id', projects?.map(p => p.id) || []);

        if (tasksError) throw tasksError;

        console.log('[dashboardService] Loaded', allTasks?.length, 'tasks');

        // Fetch teams for this organization
        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('*')
            .eq('organization_id', orgId);

        if (teamsError) throw teamsError;

        console.log('[dashboardService] Loaded', teams?.length, 'teams');

        // Fetch team members for these teams
        const { data: teamMembers, error: membersError } = await supabase
            .from('team_members')
            .select('*')
            .in('team_id', teams?.map(t => t.id) || [])
            .eq('status', 'active');

        if (membersError) throw membersError;

        console.log('[dashboardService] Loaded', teamMembers?.length, 'team members');

        // Fetch users for active team members
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in('id', teamMembers?.map(m => m.user_id).filter(Boolean) || []);

        if (usersError) throw usersError;

        console.log('[dashboardService] Loaded', users?.length, 'users for team members');

        // Parse today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Calculate KPIs
        const activeProjects = projects?.filter(p => p.status === 'active') || [];
        const projectsAtRisk = projects?.filter(p => {
            if (p.status === 'completed' || p.status === 'archived') return false;
            if (p.end_date) {
                const endDate = new Date(p.end_date);
                endDate.setHours(0, 0, 0, 0);
                return endDate < today;
            }
            return false;
        }) || [];

        // Calculate utilization: sum of actual_hours / sum of estimated_hours
        let totalEstimatedHours = 0;
        let totalActualHours = 0;

        allTasks?.forEach(task => {
            totalEstimatedHours += task.estimated_hours || 0;
            totalActualHours += task.actual_hours || 0;
        });

        const utilizationPercent = totalEstimatedHours > 0 
            ? Math.round((totalActualHours / totalEstimatedHours) * 100) 
            : 0;

        // Get unique team members
        const uniqueMembers = new Set(teamMembers?.map(m => m.id) || []);

        const kpis: KPIData[] = [
            {
                label: 'Active Projects',
                value: activeProjects.length,
                trend: activeProjects.length > 0 ? 'up' : 'down',
            },
            {
                label: 'Team Utilization',
                value: `${utilizationPercent}%`,
                sublabel: 'Target: 85%',
                trend: utilizationPercent >= 80 ? 'up' : 'down',
            },
            {
                label: 'Projects at Risk',
                value: projectsAtRisk.length,
                trend: projectsAtRisk.length > 0 ? 'down' : 'up',
            },
            {
                label: 'Active Team Members',
                value: uniqueMembers.size,
                sublabel: 'With assignments',
                trend: 'up',
            },
        ];

        console.log('[dashboardService] KPI Calculations:', {
            activeProjects: activeProjects.length,
            projectsAtRisk: projectsAtRisk.length,
            uniqueMembers: uniqueMembers.size,
            utilizationPercent,
        });

        // 2. Calculate Deadlines (upcoming project end dates)
        const deadlines = (projects || [])
            .filter(p => p.status !== 'completed' && p.status !== 'archived' && p.end_date)
            .map(p => {
                const endDate = new Date(p.end_date);
                endDate.setHours(0, 0, 0, 0);
                const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                return {
                    project: p.name,
                    deadline: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    daysLeft: daysRemaining,
                    status: daysRemaining < 0 ? 'At Risk' as const : daysRemaining <= 7 ? 'Active' as const : 'Completed' as const,
                };
            })
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 5);

        // 3. Build Gantt Chart data from team members and their tasks
        const gantt: GanttMember[] = (teamMembers || [])
            .map(member => {
                // Find user data for this team member from the users table
                const userData = users?.find(u => u.id === member.user_id);
                const memberName = userData?.display_name || userData?.email || member.display_name || member.email || 'Unknown';
                
                return {
                    name: memberName,
                    role: member.role || 'Team Member',
                    avatar: memberName.charAt(0).toUpperCase(),
                    tasks: (allTasks || [])
                        .filter(task => {
                            // Filter tasks that start and end within a reasonable range
                            return task.start_date && task.due_date;
                        })
                        .map(task => ({
                            name: task.name,
                            project: projects?.find(p => p.id === task.project_id)?.name || 'Unknown',
                            startDate: new Date(task.start_date).toISOString(),
                            endDate: new Date(task.due_date).toISOString(),
                            status: task.status === 'completed' || task.status === 'in_progress' ? ('track' as const) : ('risk' as const),
                        })) || [],
                };
            })
            .slice(0, 10);

        return {
            kpis,
            deadlines,
            gantt,
            weekDates: [],
        };
    } catch (error) {
        console.error('[dashboardService] Failed to fetch dashboard data:', error);
        console.error('[dashboardService] Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
        });
        // Return empty data instead of throwing to prevent UI crash
        return { kpis: [], deadlines: [], gantt: [], weekDates: [] };
    }
}