import { supabase } from '@/lib/supabase';

export const getDashboardData = async ({ startDate, endDate, orgId }: { startDate: Date, endDate: Date, orgId: string }) => {
  // 1. Fetch Active Projects Count
  const { data: projectsRes } = await supabase
    .from('projects')
    .select('id')
    .eq('organization_id', orgId)
    .neq('status', 'completed')
    .neq('status', 'archived');

  // 2. Fetch Project Deadlines
  const { data: projectDeadlines } = await supabase
    .from('projects')
    .select('id, name, end_date, status')
    .eq('organization_id', orgId)
    .neq('status', 'completed')
    .order('end_date', { ascending: true })
    .limit(5);

  // 3. Fetch Users + Tasks + Projects (Gantt Data)
  // We use tasks!tasks_user_id_fkey to specify which foreign key to join on 
  // since your schema has both assignee_id and user_id on the tasks table.
  const { data: teamData, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      role,
      tasks!tasks_user_id_fkey (
        id,
        name,
        start_date,
        due_date,
        status,
        projects ( name )
      )
    `)
    .eq('organization_id', orgId);

  if (error) {
    console.error("[Dashboard Service] Error fetching Gantt data:", error);
  }

  let activeTaskCount = 0;

  // Transform Deadlines
  const deadlines = (projectDeadlines || []).map(p => ({
    id: p.id,
    project: p.name,
    deadline: p.end_date || new Date().toISOString(),
    daysLeft: p.end_date ? Math.ceil((new Date(p.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0,
    status: p.status || 'active'
  }));

  // Transform Gantt Data
  const gantt = (teamData || []).map((user: any) => {
    const userTasks = user.tasks || [];
    
    // Count active tasks while we iterate
    activeTaskCount += userTasks.filter((t: any) => t.status === 'in_progress').length;

    return {
      id: user.id,
      name: user.name || 'Unknown User',
      role: user.role || 'Employee',
      avatar: user.name ? user.name.charAt(0).toUpperCase() : '?',
      tasks: userTasks.map((t: any) => ({
        id: t.id,
        name: t.name || 'Untitled Task',
        project: t.projects?.name || 'Internal',
        startDate: t.start_date || new Date().toISOString(),
        endDate: t.due_date || new Date().toISOString(), // Mapped due_date to endDate for UI
        status: t.status === 'blocked' ? 'risk' : 'track'
      }))
    };
  });

  return {
    kpis: [
      { label: 'Active Projects', value: projectsRes?.length || 0, change: '+2', trend: 'up' },
      { label: 'Tasks in Progress', value: activeTaskCount, change: '-4', trend: 'down' },
      { label: 'Team Utilization', value: '82%', change: '+5%', trend: 'up' },
      { label: 'AI Confidence', value: '94%', change: '+1%', trend: 'up' }
    ],
    deadlines,
    gantt
  };
};