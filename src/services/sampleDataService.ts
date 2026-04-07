import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';

export const hasSampleData = async (): Promise<boolean> => {
  const orgId = getCurrentOrgId();
  if (!orgId) return false;
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('organization_id', orgId)
    .eq('source', 'sample')
    .limit(1);
  return (data?.length || 0) > 0;
};

export const createSampleData = async (): Promise<void> => {
  const orgId = getCurrentOrgId();
  if (!orgId) throw new Error('No org');

  // 1. Create sample team
  const { data: team } = await supabase
    .from('teams')
    .insert({ organization_id: orgId, name: 'Demo Engineering Team' })
    .select().single();
  if (!team) throw new Error('Failed to create team');

  // 2. Create sample users (invite placeholders)
  const sampleMembers = [
    { name: 'Alex Chen', email: `alex.chen.demo+${orgId.slice(0,8)}@velocity.ai`, role: 'Frontend Developer' },
    { name: 'Sarah Kim', email: `sarah.kim.demo+${orgId.slice(0,8)}@velocity.ai`, role: 'Backend Developer' },
    { name: 'Marcus Lee', email: `marcus.lee.demo+${orgId.slice(0,8)}@velocity.ai`, role: 'Full Stack Developer' },
    { name: 'Priya Patel', email: `priya.patel.demo+${orgId.slice(0,8)}@velocity.ai`, role: 'Designer' },
  ];

  const { data: users } = await supabase
    .from('users')
    .insert(sampleMembers.map(m => ({
      name: m.name,
      email: m.email,
      organization_id: orgId,
      role: 'employee',
      is_sample: true,
    })))
    .select();

  const userIds = (users || []).map(u => u.id);

  // 3. Add to team_members
  if (userIds.length > 0) {
    await supabase.from('team_members').insert(
      userIds.map(uid => ({ team_id: team.id, user_id: uid, role: 'member' }))
    );
  }

  // 4. Create sample project
  const { data: project } = await supabase
    .from('projects')
    .insert({
      organization_id: orgId,
      team_id: team.id,
      name: 'Mobile App Redesign',
      description: 'Complete redesign of the iOS and Android apps with new design system, improved performance, and better accessibility.',
      status: 'active',
      source: 'sample',
      start_date: new Date().toISOString().split('T')[0],
      allocated_team_members: userIds,
    })
    .select().single();

  if (!project) throw new Error('Failed to create project');

  // 5. Create sample tasks
  const tasks = [
    { name: 'Design system audit', estimated_hours: 8, status: 'completed', assignee_id: userIds[3] || null },
    { name: 'New component library setup', estimated_hours: 16, status: 'completed', assignee_id: userIds[0] || null },
    { name: 'iOS navigation redesign', estimated_hours: 24, status: 'in_progress', assignee_id: userIds[0] || null },
    { name: 'Android navigation redesign', estimated_hours: 24, status: 'in_progress', assignee_id: userIds[2] || null },
    { name: 'API performance optimization', estimated_hours: 20, status: 'in_progress', assignee_id: userIds[1] || null },
    { name: 'Accessibility audit', estimated_hours: 12, status: 'not_started', assignee_id: userIds[3] || null },
    { name: 'Push notification system', estimated_hours: 16, status: 'not_started', assignee_id: userIds[1] || null },
    { name: 'App store submission', estimated_hours: 4, status: 'not_started', assignee_id: userIds[2] || null },
  ];

  await supabase.from('tasks').insert(
    tasks.map(t => ({ ...t, project_id: project.id }))
  );

  // 6. Create sample leave requests
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 3);

  if (userIds[0]) {
    await supabase.from('leave_requests').insert({
      user_id: userIds[0],
      organization_id: orgId,
      start_date: nextWeek.toISOString().split('T')[0],
      end_date: nextWeekEnd.toISOString().split('T')[0],
      reason: 'Family vacation',
      status: 'pending',
    });
  }
};
