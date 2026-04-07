import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { calculateProjectHealthScore } from '@/services/healthService';

export interface ProjectMetrics {
  totalEstHours: number;
  actualHours: number;
  remainingHours: number;
  completionPct: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksRemaining: number;
  teamSize: number;
  healthScore: number;
  isAtRisk: boolean;
  feasibility: number;
}

export interface TaskDetail {
  id: string;
  name: string;
  status: string;
  estimated_hours: number;
  actual_hours: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id?: string;
  name: string;
  role: string;
  initials: string;
  tasks_assigned: number;
  tasks_completed: number;
  actual_hours: number;
  utilization: number;
  status: 'Healthy' | 'Overloaded' | 'Underutilized';
  tasks: TaskDetail[];
}

export interface AllocatedTeamMember {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  role: string;
  allocated_hours: number;
  start_date: string;
  end_date: string;
  allocation_percentage: number;
}

export interface JiraIssue {
  id: string;
  issue_key: string;
  issue_type: string;
  summary: string;
  status: string;
  assignee: string;
  time_spent_seconds: number | null;
  original_estimate_seconds: number | null;
  created_date: string;
  start_date?: string | null;
  due_date?: string | null;
}

interface ProjectData {
  id: string;
  key: string;
  name: string;
  created_at: string;
  status?: string;
  team_id?: string;
  organization_id?: string;
}

// calculateHealthScore replaced by calculateProjectHealthScore from healthService.ts

export function useProjectAnalytics(projectId: string | undefined) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  
  const refetch = useCallback(() => {
    setRefreshSignal(prev => prev + 1);
  }, []);

  // Listen for global refresh events (e.g. from Voice Actions)
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Global refresh event received in useProjectAnalytics');
      refetch();
    };
    window.addEventListener('velo-refresh-data', handleRefresh);
    return () => window.removeEventListener('velo-refresh-data', handleRefresh);
  }, [refetch]);
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allocatedTeamMembers, setAllocatedTeamMembers] = useState<AllocatedTeamMember[]>([]);
  
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    totalEstHours: 0, actualHours: 0, remainingHours: 0, completionPct: 0,
    totalTasks: 0, tasksCompleted: 0, tasksRemaining: 0, teamSize: 0,
    healthScore: 0, isAtRisk: false, feasibility: 0
  });

  // Calculate metrics from issues
  const calculateMetrics = useCallback((allIssues: JiraIssue[], projData: ProjectData, baseTeamMembers: any[] = []) => {
    console.log('🔄 Calculating metrics for issues:', allIssues.length, 'issues with', baseTeamMembers.length, 'base team members');
    console.log('📋 Issues data:', allIssues.map(i => ({ key: i.issue_key, assignee: i.assignee, status: i.status })));
    
    let totalEstSeconds = 0;
    let totalSpentSeconds = 0;
    let completedCount = 0;
    const memberMap = new Map<string, { 
      assigned: number; 
      completed: number; 
      seconds: number;
      tasks: TaskDetail[];
    }>();

    allIssues.forEach(issue => {
      totalEstSeconds += issue.original_estimate_seconds || 0;
      totalSpentSeconds += issue.time_spent_seconds || 0;

      const status = issue.status?.toLowerCase() || '';
      const isDone = ['done', 'closed', 'resolved', 'complete', 'completed'].some(s => status.includes(s));
      if (isDone) completedCount++;

      const assignee = issue.assignee || 'Unassigned';
      if (!memberMap.has(assignee)) {
        memberMap.set(assignee, { assigned: 0, completed: 0, seconds: 0, tasks: [] });
      }
      const stats = memberMap.get(assignee)!;
      stats.assigned += 1;
      stats.seconds += (issue.time_spent_seconds || 0);
      if (isDone) stats.completed += 1;
      
      // Add task detail
      stats.tasks.push({
        id: issue.id,
        name: issue.summary,
        status: issue.status || 'not_started',
        estimated_hours: (issue.original_estimate_seconds || 0) / 3600,
        actual_hours: (issue.time_spent_seconds || 0) / 3600,
        created_at: issue.created_date
      });
    });

    const totalEstHours = Math.round(totalEstSeconds / 3600);
    const actualHours = Math.round(totalSpentSeconds / 3600);
    // Use real health scoring from healthService (schedule 40%, resource 30%, risk 20%, quality 10%)
    const healthMetrics = calculateProjectHealthScore({
      issues: allIssues,
      startDate: projData.start_date ? new Date(projData.start_date) : undefined,
      endDate: projData.end_date ? new Date(projData.end_date) : undefined,
      teamMembers: Array.from(memberMap.keys()),
    });
    const healthScore = healthMetrics.compositeScore;

    const members: TeamMember[] = Array.from(memberMap.entries())
      .filter(([name]) => name !== 'Unassigned')
      .map(([name, stats]) => {
        const incomplete = stats.assigned - stats.completed;
        let status: TeamMember['status'] = 'Healthy';
        if (incomplete > 5) status = 'Overloaded';
        if (stats.assigned < 2) status = 'Underutilized';

        const completionRate = stats.assigned > 0 ? stats.completed / stats.assigned : 0;

        return {
          id: name,
          name,
          role: 'Team Member',
          initials: name.substring(0, 2).toUpperCase(),
          tasks_assigned: stats.assigned,
          tasks_completed: stats.completed,
          actual_hours: Math.round(stats.seconds / 3600),
          utilization: Math.round(completionRate * 100),
          status,
          tasks: stats.tasks
        };
      });

    // Add base team members that don't have tasks assigned yet
    const memberNames = new Set(members.map(m => m.name));
    const additionalMembers: TeamMember[] = baseTeamMembers
      .filter((bt: any) => !memberNames.has(bt.name))
      .map((bt: any) => ({
        id: bt.user_id || bt.id,
        name: bt.name,
        user_id: bt.user_id,
        role: bt.role || 'Team Member',
        initials: bt.name.substring(0, 2).toUpperCase(),
        tasks_assigned: 0,
        tasks_completed: 0,
        actual_hours: 0,
        utilization: 0,
        status: 'Underutilized' as const,
        tasks: []
      }));

    const finalMembers = [...members, ...additionalMembers];
    const actualTeamSize = finalMembers.length; // Count all team members including those without tasks

    const completionPct = allIssues.length > 0 ? Math.round((completedCount / allIssues.length) * 100) : 0;
    console.log('📊 Updated metrics:', { totalTasks: allIssues.length, teamSize: actualTeamSize, completionPct, healthScore, memberCount: memberMap.size });
    console.log('👥 Task-assigned members:', members.map(m => ({ name: m.name, tasks: m.tasks_assigned, completed: m.tasks_completed })));
    console.log('👥 Additional base team members:', additionalMembers.map(m => ({ name: m.name })));

    setMetrics({
      totalEstHours, actualHours, remainingHours: Math.max(totalEstHours - actualHours, 0),
      completionPct: allIssues.length > 0 ? Math.round((completedCount / allIssues.length) * 100) : 0,
      totalTasks: allIssues.length, tasksCompleted: completedCount, tasksRemaining: allIssues.length - completedCount,
      teamSize: members.length, healthScore, isAtRisk: healthScore < 50,
      feasibility: Math.min(Math.round(healthScore * 1.1), 100)
    });

    setTeamMembers(finalMembers);
  }, []);

  useEffect(() => {
    if (!projectId || !user) return;

    const fetchAndSubscribe = async () => {
      setLoading(true);
      setError(null);

      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
        let projData: any = null;
        let isInternal = false;

        // 1. Fetch Project
        const { data: internalProj } = await supabase.from('projects').select('*').eq('id', projectId).single();

        if (internalProj) {
          projData = {
            id: internalProj.id,
            key: internalProj.id.substring(0, 5).toUpperCase(),
            name: internalProj.name,
            created_at: internalProj.created_at,
            team_id: internalProj.team_id,
            organization_id: internalProj.organization_id
          };
          isInternal = true;
        } else {
          const { data: jiraProj } = await supabase.from('jira_projects').select('*').eq(isUUID ? 'id' : 'project_key', projectId).single();
          if (jiraProj) {
            projData = { id: jiraProj.id, key: jiraProj.project_key, name: jiraProj.name, created_at: jiraProj.created_at };
          }
        }

        if (!projData) throw new Error("Project not found.");
        setProject(projData);

        let initialIssues: JiraIssue[] = [];
        let cleanupFn: (() => void) | null = null;
        let allTeamMembers: any[] = [];

        if (isInternal) {
          // --- THE FIX: FETCH ENTIRE ORG DICTIONARY ---
          const { data: allOrgUsers } = await supabase
            .from('users')
            .select('id, name, email, role, capacity_hours_per_week')
            .eq('organization_id', projData.organization_id);

          // Create a bulletproof dictionary to look up names
          const orgUsersMap = new Map(allOrgUsers?.map(u => [u.id, u]) || []);

          // --- FETCH TEAM MEMBERS OR FALLBACK ---
          let fetchedAllocatedMembers: AllocatedTeamMember[] = [];
          
          // First try project_team_allocations
          const { data: allocations } = await supabase
            .from('project_team_allocations')
            .select('id, user_id, allocation_percentage, start_date, end_date, users(id, name, email, is_active)')
            .eq('project_id', projData.id);

          if (allocations && allocations.length > 0) {
            fetchedAllocatedMembers = allocations
              .filter((a: any) => a.users && a.users.is_active !== false)
              .map((a: any) => ({
                id: a.id,
                user_id: a.user_id,
                name: a.users?.name || 'Unknown',
                email: a.users?.email,
                role: 'Team Member',
                allocated_hours: Math.round((40 * a.allocation_percentage) / 100),
                start_date: a.start_date,
                end_date: a.end_date,
                allocation_percentage: a.allocation_percentage
              }));
          }
          
          // Fallback to team_members if no allocations found
          if (fetchedAllocatedMembers.length === 0 && projData.team_id) {
            const { data: memberEntries } = await supabase
              .from('team_members')
              .select('id, user_id, role, status, users(id, name, email, role, capacity_hours_per_week, is_active)')
              .eq('team_id', projData.team_id)
              .eq('status', 'active');

            if (memberEntries && memberEntries.length > 0) {
              fetchedAllocatedMembers = memberEntries
                .filter((m: any) => m.users && m.users.is_active !== false)
                .map((m: any) => ({
                  id: m.id, user_id: m.user_id, name: m.users?.name || 'Unknown',
                  email: m.users?.email, role: m.role || m.users?.role || 'Team Member',
                  allocated_hours: m.users?.capacity_hours_per_week || 40,
                  start_date: projData.created_at, end_date: new Date(Date.now() + 2592000000).toISOString(),
                  allocation_percentage: 100
                }));
            }
          }

          // --- FETCH AND MAP TASKS USING BULLETPROOF DICTIONARY ---
          const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*').eq('project_id', projData.id);
          if (tasksError) throw new Error(`Could not load tasks: ${tasksError.message}`);

          // Fetch assignees (users) for the tasks
          const assigneeIds = Array.from(new Set((tasksData || []).map(t => t.assignee_id).filter(Boolean)));
          console.log('🔍 Assignee IDs found:', assigneeIds);
          
          let assigneeMap = new Map<string, any>();

          if (assigneeIds.length > 0) {
            const { data: users, error: usersError } = await supabase
              .from('users')
              .select('id, name, email, role')
              .in('id', assigneeIds);

            console.log('👥 Users fetched:', users?.length, 'Error:', usersError);
            if (users) {
              assigneeMap = new Map(users.map(u => [u.id, u]));
            }
          }

          setAllocatedTeamMembers(fetchedAllocatedMembers);

          initialIssues = (tasksData || []).map(t => {
            const assignedUser = orgUsersMap.get(t.assignee_id); // Look up directly from org dictionary
            return {
              id: t.id,
              issue_key: `TASK-${t.id.substring(0, 4)}`,
              issue_type: 'Task',
              summary: t.name,
              status: t.status || 'not_started',
              assignee: assignedUser?.name || 'Unassigned', // Will ALWAYS resolve if ID exists
              time_spent_seconds: (t.actual_hours || 0) * 3600,
              original_estimate_seconds: (t.estimated_hours || 0) * 3600,
              created_date: t.created_at,
              start_date: t.start_date || null,
              due_date: t.due_date || null
            };
          });
          
          console.log('📋 Initial issues mapped:', initialIssues.map(i => ({ key: i.issue_key, assignee: i.assignee })));
          
          // Also fetch team members from the team to show team size
          if (projData.team_id) {
            const { data: tmData, error: tmError } = await supabase
              .from('team_members')
              .select('id, user_id, status, users(id, name, email, role, is_active)')
              .eq('team_id', projData.team_id)
              .eq('status', 'active');
              
            console.log('👫 Team members fetched from team_members table:', tmData?.length, 'Error:', tmError);
            if (tmData && tmData.length > 0) {
              allTeamMembers = tmData
                .filter((tm: any) => tm.users && tm.users.is_active !== false)
                .map((tm: any) => ({
                  id: tm.user_id,
                  user_id: tm.user_id,
                  name: tm.users?.name || 'Unknown',
                  email: tm.users?.email,
                  role: tm.users?.role || 'Team Member'
                }));
            }
          }
          
          // Removed fallback to organization members to ensure only team members are shown
          console.log('📊 Total team members available:', allTeamMembers.length, allTeamMembers.map((m: any) => m.name));

          // --- REALTIME SUBSCRIPTION ---
          const taskSubscription = supabase
            .channel(`tasks:${projData.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projData.id}` }, 
              async () => {
                const { data: updatedTasks } = await supabase.from('tasks').select('*').eq('project_id', projData.id);
                const updatedIssues = (updatedTasks || []).map(t => {
                  const assignedUser = orgUsersMap.get(t.assignee_id); // Reuse dictionary
                  return {
                    id: t.id,
                    issue_key: `TASK-${t.id.substring(0, 4)}`,
                    issue_type: 'Task',
                    summary: t.name,
                    status: t.status || 'not_started',
                    assignee: assignedUser?.name || 'Unassigned',
                    time_spent_seconds: (t.actual_hours || 0) * 3600,
                    original_estimate_seconds: (t.estimated_hours || 0) * 3600,
                    created_date: t.created_at,
                    start_date: t.start_date || null,
                    due_date: t.due_date || null
                  };
                });

                console.log('🎯 Mapped issues with assignees:', updatedIssues.map(i => ({ key: i.issue_key, assignee: i.assignee })));

                setIssues(updatedIssues);
                calculateMetrics(updatedIssues, projData, allTeamMembers);
              }
            ).subscribe();

          cleanupFn = () => taskSubscription.unsubscribe();

        } else {
          // JIRA Logic remains identical
          const { data: issuesData } = await supabase.from('jira_issues').select('*').eq('jira_project_id', projData.id);
          initialIssues = issuesData || [];

          // Subscribe to realtime Jira issue updates
          const issueSubscription = supabase
            .channel(`jira_issues:${projData.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'jira_issues',
                filter: `jira_project_id=eq.${projData.id}`
              },
              async (payload) => {
                console.log('Jira issue update:', payload);
                // Refetch issues
                const { data: updatedIssues } = await supabase
                  .from('jira_issues')
                  .select('*')
                  .eq('jira_project_id', projData.id);

                const updated = updatedIssues || [];
                setIssues(updated);
                calculateMetrics(updated, projData, allTeamMembers);
              }
            ).subscribe();
          cleanupFn = () => issueSubscription.unsubscribe();
        }

        setIssues(initialIssues);
        calculateMetrics(initialIssues, projData, allTeamMembers);

        // Return cleanup function
        return cleanupFn;
      } catch (err: any) {
        setError(err.message || 'Failed to load project analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAndSubscribe();
  }, [projectId, user, calculateMetrics, refreshSignal]);

  return { loading, error, project, issues, metrics, teamMembers, allocatedTeamMembers, refetch };
}