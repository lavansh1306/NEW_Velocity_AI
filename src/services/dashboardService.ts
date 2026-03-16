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

        // Get the current logged-in user to filter upcoming deadlines
        const { data: { user: authUser } } = await supabase.auth.getUser();

        // --- FETCH ALL DATA (Safe Manual Method to avoid foreign key errors) ---
        const { data: projects } = await supabase.from('projects').select('*').eq('organization_id', orgId);
        const { data: allTasks } = await supabase.from('tasks').select('*').in('project_id', projects?.map(p => p.id) || []);
        const { data: teams } = await supabase.from('teams').select('*').eq('organization_id', orgId);
        const { data: teamMembers } = await supabase.from('team_members').select('*').in('team_id', teams?.map(t => t.id) || []).eq('status', 'active');
        const { data: users } = await supabase.from('users').select('*').in('id', teamMembers?.map(m => m.user_id).filter(Boolean) || []);

        // Fetch allocations specifically for the logged-in user
        let myProjectIds: string[] = [];
        if (authUser?.id) {
            const { data: allocations } = await supabase
                .from('project_team_allocations')
                .select('project_id')
                .eq('user_id', authUser.id);
            myProjectIds = allocations?.map(a => a.project_id) || [];
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // --- 1. KPIs (Matched to Figma UI - Org Wide) ---
        const activeProjectsCount = projects?.filter(p => p.status === 'active').length || 0;
        const projectsAtRiskCount = projects?.filter(p => p.status === 'draft' || p.status === 'archived').length || 0;

        // Calculate Capacity & Utilization safely
        const totalCapacity = users?.reduce((sum, u) => sum + (u.capacity_hours_per_week || 40), 0) || 0;
        let totalEstimatedHours = 0;
        let totalActualHours = 0;
        
        allTasks?.forEach(task => {
            totalEstimatedHours += task.estimated_hours || 0;
            totalActualHours += task.actual_hours || 0;
        });

        const utilizationPercent = totalEstimatedHours > 0 ? Math.round((totalActualHours / totalEstimatedHours) * 100) : 0;
        const availableCapacity = Math.max(0, totalCapacity - totalActualHours);

        const kpis = [
            { label: 'ACTIVE PROJECTS', value: activeProjectsCount, trend: activeProjectsCount > 0 ? 'up' : 'down' },
            { label: 'TEAM UTILIZATION', value: `${utilizationPercent}%`, sublabel: 'Target: 85%', trend: utilizationPercent >= 80 ? 'up' : 'down' },
            { label: 'AVAILABLE CAPACITY', value: `${availableCapacity}h`, sublabel: 'Next 2 weeks', trend: 'down' },
            { label: 'PROJECTS AT RISK', value: projectsAtRiskCount, trend: projectsAtRiskCount > 0 ? 'down' : 'up' }
        ];

        // --- 2. Deadlines (Filtered strictly for logged-in user's projects) ---
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const deadlines = (projects || [])
            .filter(p => p.status !== 'completed' && p.status !== 'archived' && p.end_date)
            // THE FIX: Only include projects where the logged-in user is explicitly allocated
            .filter(p => myProjectIds.includes(p.id)) 
            .map(p => {
                const endDate = new Date(p.end_date);
                endDate.setHours(0, 0, 0, 0);
                const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                // Set urgency flag for the UI colors
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
            .filter(d => d.daysLeft >= 0 && d.daysLeft <= 30) // Only next 30 days
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 5); // Limit to top 5 upcoming deadlines

        // --- 3. Gantt Chart Data (Org Wide for Managers) ---
        const seenEmails = new Set<string>();
        const gantt = (teamMembers || [])
            .map(member => {
                const userData = users?.find(u => u.id === member.user_id);
                const memberEmail = userData?.email || member.email || '';
                const memberName = userData?.name || userData?.email || member.email || 'Unknown';
                
                return {
                    id: member.id,
                    email: memberEmail,
                    name: memberName,
                    role: userData?.designation || userData?.role || member.role || 'Team Member',
                    avatar: memberName.charAt(0).toUpperCase(),
                    tasks: (allTasks || [])
                        .filter(task => {
                            // Account for various assignment field possibilities
                            const isAssigned = task.assigned_to === member.user_id || 
                                task.assigned_team_member_id === member.id ||
                                task.assigned_to === member.id ||
                                (task as any).assignee_id === member.user_id ||
                                (task as any).assignee_id === member.id ||
                                task.user_id === member.user_id;
                            
                            return isAssigned && task.start_date && task.due_date;
                        })
                        .map(task => ({
                            id: task.id,
                            name: task.name,
                            project: projects?.find(p => p.id === task.project_id)?.name || 'Unknown',
                            startDate: new Date(task.start_date).toISOString(),
                            endDate: new Date(task.due_date).toISOString(),
                            status: task.status || 'not_started',
                            displayStatus: task.status === 'completed' || task.status === 'in_progress' ? 'track' : 'risk',
                        }))
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

// --- Add-on Functions for Sidebar/Header ---

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