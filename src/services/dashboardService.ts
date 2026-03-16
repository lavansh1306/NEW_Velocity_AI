import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import type { KPIData, Deadline, GanttMember } from '@/types';

interface DashboardOptions {
    startDate: Date;
    endDate: Date;
}

export const getDashboardData = async ({ startDate, endDate }: DashboardOptions) => {
    const orgId = getCurrentOrgId();
    if (!orgId) throw new Error("No organization ID found");

    // 1. KPIs: Active Projects & Projects at Risk
    const { data: projects } = await supabase
        .from('projects')
        .select('id, status, end_date, name')
        .eq('organization_id', orgId)
        .neq('status', 'completed')
        .neq('status', 'archived');

    const activeProjects = projects?.filter(p => p.status === 'active') || [];
    const projectsAtRisk = projects?.filter(p => p.status === 'draft') || [];

    // 2. KPIs: Utilization & Capacity
    const { data: users } = await supabase
        .from('users')
        .select('id, capacity_hours_per_week')
        .eq('organization_id', orgId)
        .eq('is_active', true);

    const totalCapacity = users?.reduce((sum, u) => sum + (u.capacity_hours_per_week || 40), 0) || 0;

    const { data: assignments } = await supabase
        .from('task_assignments')
        .select('allocated_hours_per_week')
        .lte('start_date', endDate.toISOString())
        .gte('end_date', startDate.toISOString());

    const totalAllocated = assignments?.reduce((sum, a) => sum + Number(a.allocated_hours_per_week || 0), 0) || 0;
    const utilizationPercent = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;
    const availableCapacity = Math.max(0, totalCapacity - totalAllocated);

    // 3. Deadlines (Next 30 Days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDays = new Date(today);
    thirtyDays.setDate(today.getDate() + 30);

    const deadlines = (projects || [])
        .filter(p => p.end_date)
        .map(p => {
            const end = new Date(p.end_date!);
            const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            let urgency = 'green';
            if (daysLeft < 3 || daysLeft < 0) urgency = 'red';
            else if (daysLeft <= 7) urgency = 'yellow';

            return {
                id: p.id,
                project: p.name,
                deadline: p.end_date!,
                daysLeft,
                urgency,
                status: p.status || 'active'
            };
        })
        .filter(d => d.daysLeft >= 0 && d.daysLeft <= 30)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5);

    // 4. Gantt Chart Data
    const { data: teamData } = await supabase
        .from('users')
        .select(`
            id, name, role, email,
            tasks!tasks_user_id_fkey (
                id, name, start_date, due_date, status,
                projects ( name )
            )
        `)
        .eq('organization_id', orgId);

    const gantt = (teamData || []).map((user: any) => ({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email || '',
        role: user.role || 'employee',
        avatar: user.name ? user.name.substring(0, 2).toUpperCase() : '??',
        tasks: (user.tasks || []).map((t: any) => ({
            id: t.id,
            name: t.name || 'Untitled',
            project: t.projects?.name || 'Internal',
            startDate: t.start_date,
            endDate: t.due_date,
            displayStatus: t.status === 'blocked' ? 'risk' : 'track'
        }))
    }));

    return {
        kpis: [
            { label: 'ACTIVE PROJECTS', value: activeProjects.length },
            { label: 'TEAM UTILIZATION', value: `${utilizationPercent}%`, subtext: 'Target: 85%' },
            { label: 'AVAILABLE CAPACITY', value: `${availableCapacity}h`, subtext: 'Next 2 weeks' },
            { label: 'PROJECTS AT RISK', value: projectsAtRisk.length }
        ],
        deadlines,
        gantt
    };
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
        tasks: [] // Tasks require complex joining to filter by org_id securely
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