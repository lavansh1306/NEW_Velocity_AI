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

        // Get unique team members by email (not by team_member ID)
        const uniqueMemberEmails = new Set(
            teamMembers
                ?.map(m => {
                    const userData = users?.find(u => u.id === m.user_id);
                    return userData?.email || m.email || '';
                })
                .filter(email => email !== '') || []
        );

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
                value: uniqueMemberEmails.size,
                sublabel: 'With assignments',
                trend: 'up',
            },
        ];

        console.log('[dashboardService] KPI Calculations:', {
            activeProjects: activeProjects.length,
            projectsAtRisk: projectsAtRisk.length,
            uniqueMembers: uniqueMemberEmails.size,
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
        const seenEmails = new Set<string>(); // Track unique emails
        
        const gantt: GanttMember[] = (teamMembers || [])
            .map(member => {
                // Find user data for this team member from the users table
                const userData = users?.find(u => u.id === member.user_id);
                const memberEmail = userData?.email || member.email || '';
                const memberName = userData?.display_name || userData?.email || member.display_name || member.email || 'Unknown';
                
                return {
                    id: member.id, // Use team_member ID as unique identifier
                    email: memberEmail, // Include email for uniqueness check
                    name: memberName,
                    role: member.role || 'Team Member',
                    avatar: memberName.charAt(0).toUpperCase(),
                    // Filter tasks assigned to THIS specific team member
                    tasks: (allTasks || [])
                        .filter(task => {
                            // Check various assignment field possibilities
                            const isAssignedToMember = task.assigned_to === member.user_id || 
                                                      task.assigned_team_member_id === member.id ||
                                                      task.assigned_to === member.id ||
                                                      (task as any).assignee_id === member.user_id ||
                                                      (task as any).assignee_id === member.id ||
                                                      task.user_id === member.user_id;
                            
                            // If no assignment field exists, log for debugging
                            if (!isAssignedToMember && !task.assigned_to && !(task as any).assignee_id && !(task as any).assigned_team_member_id && !task.user_id) {
                                console.log('[dashboardService] Task missing assignment fields:', {
                                    taskId: task.id,
                                    taskName: task.name,
                                    taskFields: Object.keys(task)
                                });
                            }
                            
                            // Also must have valid dates
                            return isAssignedToMember && task.start_date && task.due_date;
                        })
                        .map(task => ({
                            id: task.id,
                            name: task.name,
                            project: projects?.find(p => p.id === task.project_id)?.name || 'Unknown',
                            startDate: new Date(task.start_date).toISOString(),
                            endDate: new Date(task.due_date).toISOString(),
                            status: (task.status as 'not_started' | 'in_progress' | 'blocked' | 'completed') || 'not_started',
                            displayStatus: task.status === 'completed' || task.status === 'in_progress' ? ('track' as const) : ('risk' as const),
                        })) || [],
                };
            })
            .filter(member => {
                // Only include unique emails - include members regardless of task count
                if (!member.email || seenEmails.has(member.email)) {
                    return false;
                }
                seenEmails.add(member.email);
                return true; // Show all team members, even those without assigned tasks
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