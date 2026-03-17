import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import type { KPIData, Deadline, GanttMember } from '@/types';

interface DashboardOptions {
    startDate?: Date;
    endDate?: Date;
}

export const getDashboardData = async (options?: DashboardOptions) => {
    try {
        const orgId = getCurrentOrgId();
        if (!orgId) throw new Error("No organization ID found");

        const { data: { user: authUser } } = await supabase.auth.getUser();

        // --- FETCH ALL DATA ---
        // Added fetching organization settings for the dynamic target utilization
        const { data: orgSettings } = await supabase
            .from('organizations')
            .select('target_utilization, work_hours_per_week')
            .eq('id', orgId)
            .single();

        const { data: projects } = await supabase.from('projects').select('*').eq('organization_id', orgId);
        const { data: allTasks } = await supabase.from('tasks').select('*').in('project_id', projects?.map(p => p.id) || []);
        const { data: teams } = await supabase.from('teams').select('*').eq('organization_id', orgId);
        const { data: teamMembers } = await supabase.from('team_members').select('*').in('team_id', teams?.map(t => t.id) || []).eq('status', 'active');
        const { data: users } = await supabase.from('users').select('*').in('id', teamMembers?.map(m => m.user_id).filter(Boolean) || []);

        let myProjectIds: string[] = [];
        if (authUser?.id) {
            const { data: allocations } = await supabase
                .from('project_team_allocations')
                .select('project_id')
                .eq('user_id', authUser.id);
            myProjectIds = allocations?.map(a => a.project_id) || [];
        }

        const { data: leaves } = await supabase
            .from('leave_requests')
            .select('*, leave_types(name)')
            .in('user_id', users?.map(u => u.id) || []);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // --- 1. DYNAMIC KPIs ---
        // ... (preserving existing kpi logic)
        const activeProjectsCount = projects?.filter(p => p.status === 'active').length || 0;
        const projectsAtRiskCount = projects?.filter(p => p.status === 'draft' || p.status === 'archived').length || 0;

        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const totalWeeklyCapacity = users?.reduce((sum, u) => 
            sum + (u.capacity_hours_per_week || orgSettings?.work_hours_per_week || 40), 0) || 0;

        const totalAllocatedHours = allTasks?.reduce((sum, task) => {
            if (!task.estimated_hours || !task.start_date || !task.due_date) return sum;
            const taskStart = new Date(task.start_date);
            const taskDue = new Date(task.due_date);
            const isActiveThisWeek = (taskStart <= sevenDaysFromNow && taskDue >= today);
            return isActiveThisWeek ? sum + Number(task.estimated_hours) : sum;
        }, 0) || 0;

        const utilizationPercent = totalWeeklyCapacity > 0 
            ? Math.round((totalAllocatedHours / totalWeeklyCapacity) * 100) 
            : 0;

        const target = orgSettings?.target_utilization || 85;
        const availableCapacity = Math.max(0, totalWeeklyCapacity - totalAllocatedHours);

        const kpis = [
            { label: 'ACTIVE PROJECTS', value: activeProjectsCount, trend: activeProjectsCount > 0 ? 'up' : 'down' },
            { 
                label: 'TEAM UTILIZATION', 
                value: `${utilizationPercent}%`, 
                sublabel: `Target: ${target}%`, 
                trend: utilizationPercent >= target ? 'up' : 'down' 
            },
            { label: 'AVAILABLE CAPACITY', value: `${availableCapacity}h`, sublabel: 'Next 7 days', trend: 'down' },
            { label: 'PROJECTS AT RISK', value: projectsAtRiskCount, trend: projectsAtRiskCount > 0 ? 'down' : 'up' }
        ];

        // --- 2. Deadlines ---
        const deadlines = (projects || [])
            .filter(p => p.status !== 'completed' && p.status !== 'archived' && p.end_date)
            .filter(p => myProjectIds.includes(p.id)) 
            .map(p => {
                const endDate = new Date(p.end_date!);
                endDate.setHours(0, 0, 0, 0);
                const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                let urgency = 'green';
                if (daysLeft < 3 || daysLeft < 0) urgency = 'red';
                else if (daysLeft <= 7) urgency = 'yellow';

                return {
                    id: p.id,
                    project: p.name,
                    deadline: endDate.toISOString(),
                    daysLeft,
                    urgency,
                    status: daysLeft < 0 ? 'At Risk' : daysLeft <= 7 ? 'Active' : 'On Track'
                };
            })
            .filter(d => d.daysLeft >= 0 && d.daysLeft <= 30)
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 5);

        // --- 3. Gantt Chart Data ---
        const seenEmails = new Set<string>();
        const gantt = (teamMembers || [])
            .map(member => {
                const userData = users?.find(u => u.id === member.user_id);
                const memberEmail = userData?.email || member.email || '';
                const memberName = userData?.name || member.display_name || member.email || 'Unknown';
                
                const memberLeaves = (leaves || [])
                    .filter(l => l.user_id === member.user_id && l.status !== 'rejected')
                    .map(l => ({
                        id: l.id,
                        name: 'Leave',
                        project: `Leave (${(l.leave_types as any)?.name || 'Vacation'})`,
                        startDate: new Date(l.start_date).toISOString(),
                        endDate: new Date(l.end_date).toISOString(),
                        status: l.status,
                        displayStatus: 'leave'
                    }));

                const memberTasks = (allTasks || [])
                    .filter(task => {
                        return (
                            task.assignee_id === member.user_id || 
                            task.user_id === member.user_id
                        );
                    })
                    .filter(task => task.start_date && task.due_date)
                    .map(task => ({
                        id: task.id,
                        name: task.name,
                        project: projects?.find(p => p.id === task.project_id)?.name || 'Unknown',
                        startDate: new Date(task.start_date!).toISOString(),
                        endDate: new Date(task.due_date!).toISOString(),
                        status: task.status || 'not_started',
                        displayStatus: task.status === 'completed' ? 'track' : 'risk',
                    }));

                return {
                    id: member.id,
                    email: memberEmail,
                    name: memberName,
                    role: userData?.designation || userData?.role || member.role || 'Team Member',
                    avatar: memberName.charAt(0).toUpperCase(),
                    tasks: [...memberTasks, ...memberLeaves]
                };
            })
            .filter(member => {
                if (!member.email || seenEmails.has(member.email)) return false;
                seenEmails.add(member.email);
                return true;
            });

        return { kpis, deadlines, gantt };

    } catch (error) {
        console.error('[dashboardService] Failed to fetch dashboard data:', error);
        return { kpis: [], deadlines: [], gantt: [] };
    }
};

export const getGlobalSearchResults = async (query: string) => {
    const orgId = getCurrentOrgId();
    if (!orgId || !query) return { projects: [], users: [], tasks: [] };

    const [projectsRes, usersRes] = await Promise.all([
        supabase.from('projects').select('id, name, status').eq('organization_id', orgId).ilike('name', `%${query}%`).limit(3),
        supabase.from('users').select('id, name, email').eq('organization_id', orgId).ilike('name', `%${query}%`).limit(3)
    ]);

    return {
        projects: projectsRes.data || [],
        users: usersRes.data || [],
        tasks: []
    };
};

export const getNotifications = async () => {
    const orgId = getCurrentOrgId();
    if (!orgId) return [];

    const { data: leaves } = await supabase
        .from('leave_requests')
        .select(`id, start_date, end_date, status, users(name)`)
        .eq('organization_id', orgId)
        .eq('status', 'pending');

    return (leaves || []).map(l => ({
        id: l.id,
        type: 'approval',
        message: `${(l.users as any)?.name} requested leave`,
        date: l.start_date,
        isRead: false
    }));
};