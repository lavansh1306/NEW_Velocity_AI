import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  tasks_assigned: number;
  tasks_completed: number;
  actual_hours: number;
  utilization: number;
  status: 'Healthy' | 'Overloaded' | 'Underutilized';
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
}

interface ProjectData {
  id: string;
  key: string;
  title: string;
  created_at: string;
  team_id?: string;
  team_name?: string;
}

function calculateHealthScore(
  completedTasks: number,
  totalTasks: number,
  estimatedHours: number,
  actualHours: number
): number {
  const taskFactor = totalTasks > 0 ? (completedTasks / totalTasks) : 1;
  const timeFactor = estimatedHours > 0 ? Math.min(1, (estimatedHours / Math.max(actualHours, 1))) : 1;
  return Math.round(((taskFactor * 0.6) + (timeFactor * 0.4)) * 100);
}

export function useProjectAnalytics(projectId: string | undefined) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Project data
  const [project, setProject] = useState<ProjectData | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  
  // Computed metrics
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    totalEstHours: 0,
    actualHours: 0,
    remainingHours: 0,
    completionPct: 0,
    totalTasks: 0,
    tasksCompleted: 0,
    tasksRemaining: 0,
    teamSize: 0,
    healthScore: 0,
    isAtRisk: false,
    feasibility: 0
  });
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allocatedTeamMembers, setAllocatedTeamMembers] = useState<AllocatedTeamMember[]>([]);

  // Calculate metrics from issues
  const calculateMetrics = useCallback((allIssues: JiraIssue[], projData: ProjectData) => {
    console.log('🔄 Calculating metrics for issues:', allIssues.length, 'issues');
    console.log('📋 Issues data:', allIssues.map(i => ({ key: i.issue_key, assignee: i.assignee, status: i.status })));
    
    let totalEstSeconds = 0;
    let totalSpentSeconds = 0;
    let completedCount = 0;
    const memberMap = new Map<string, { assigned: number; completed: number; seconds: number }>();

    allIssues.forEach(issue => {
      totalEstSeconds += issue.original_estimate_seconds || 0;
      totalSpentSeconds += issue.time_spent_seconds || 0;

      const status = issue.status?.toLowerCase() || '';
      const isDone = ['done', 'closed', 'resolved', 'complete', 'completed'].some(s => status.includes(s));
      if (isDone) completedCount++;

      const assignee = issue.assignee || 'Unassigned';
      
      // Count all assignees including "Unassigned" in team metrics
      if (!memberMap.has(assignee)) {
        memberMap.set(assignee, { assigned: 0, completed: 0, seconds: 0 });
      }
      const stats = memberMap.get(assignee)!;
      stats.assigned += 1;
      stats.seconds += (issue.time_spent_seconds || 0);
      if (isDone) stats.completed += 1;
    });

    const totalEstHours = Math.round(totalEstSeconds / 3600);
    const actualHours = Math.round(totalSpentSeconds / 3600);
    const remainingHours = Math.max(totalEstHours - actualHours, 0);
    const totalTasks = allIssues.length;
    const tasksRemaining = totalTasks - completedCount;
    
    const completionPct = totalEstHours > 0
      ? Math.round((actualHours / totalEstHours) * 100)
      : (totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0);

    const healthScore = calculateHealthScore(completedCount, totalTasks, totalEstHours, actualHours);

    // Build team members list (excluding "Unassigned")
    const members: TeamMember[] = Array.from(memberMap.entries())
      .filter(([name]) => name !== 'Unassigned')
      .map(([name, stats]) => {
        const completionRate = stats.assigned > 0 ? stats.completed / stats.assigned : 0;
        const assigned = stats.assigned;
        const incomplete = assigned - stats.completed;

        let status: TeamMember['status'] = 'Healthy';
        if (incomplete > 8) status = 'Overloaded';
        if (assigned < 3) status = 'Underutilized';

        return {
          name,
          role: 'Team Member',
          initials: name.substring(0, 2).toUpperCase(),
          tasks_assigned: assigned,
          tasks_completed: stats.completed,
          actual_hours: Math.round(stats.seconds / 3600),
          utilization: Math.round(completionRate * 100),
          status
        };
      });

    const actualTeamSize = members.length; // Only count actual team members, not "Unassigned"

    console.log('📊 Updated metrics:', { totalTasks, teamSize: actualTeamSize, completionPct, healthScore, memberCount: memberMap.size });
    console.log('👥 Team members:', members.map(m => ({ name: m.name, tasks: m.tasks_assigned, completed: m.tasks_completed })));

    setMetrics({
      totalEstHours,
      actualHours,
      remainingHours,
      completionPct,
      totalTasks,
      tasksCompleted: completedCount,
      tasksRemaining,
      teamSize: actualTeamSize,
      healthScore,
      isAtRisk: healthScore < 50,
      feasibility: Math.min(Math.round(healthScore * 1.1), 100)
    });

    setTeamMembers(members);
  }, []);

  // Initial fetch and subscription setup
  useEffect(() => {
    if (!projectId || !user) return;

    const fetchAndSubscribe = async () => {
      setLoading(true);
      setError(null);

      try {
        // Determine if projectId is UUID or Project Key
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);

        // Fetch Project Meta
        let projData: any = null;
        let isInternal = false;

        // Try 'projects' table first (Internal)
        const { data: internalProj, error: internalError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (internalProj) {
          projData = {
            id: internalProj.id,
            key: internalProj.id.substring(0, 5).toUpperCase(),
            title: internalProj.name,
            created_at: internalProj.created_at,
            team_id: internalProj.team_id,
            organization_id: internalProj.organization_id
          };
          isInternal = true;
        } else {
          // Try 'jira_projects' table
          const { data: jiraProj } = await supabase
            .from('jira_projects')
            .select('*')
            .eq(isUUID ? 'id' : 'project_key', projectId)
            .single();

          if (jiraProj) {
            projData = {
              id: jiraProj.id,
              key: jiraProj.project_key,
              title: jiraProj.name,
              created_at: jiraProj.created_at
            };
            isInternal = false;
          }
        }

        if (!projData) throw new Error("Project not found.");
        setProject(projData);

        // Fetch initial issues
        let initialIssues: JiraIssue[] = [];
        let cleanupFn: (() => void) | null = null;

        if (isInternal) {
          // Fetch tasks
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projData.id);

          if (tasksError) {
            console.error('Task fetch error:', tasksError);
            throw new Error(`Could not load project tasks: ${tasksError.message}`);
          }

          // Fetch assignees (users) for the tasks
          const assigneeIds = Array.from(new Set((tasksData || []).map(t => t.assignee_id).filter(Boolean)));
          let assigneeMap = new Map<string, any>();

          if (assigneeIds.length > 0) {
            const { data: users } = await supabase
              .from('users')
              .select('id, name, email, role')
              .in('id', assigneeIds);

            if (users) {
              assigneeMap = new Map(users.map(u => [u.id, u]));
            }
          }

          // Map tasks to issues format
          initialIssues = (tasksData || []).map(t => {
            const assignee = assigneeMap.get(t.assignee_id);
            return {
              id: t.id,
              issue_key: `TASK-${t.id.substring(0, 4)}`,
              issue_type: 'Task',
              summary: t.name,
              status: t.status || 'not_started',
              assignee: assignee?.name || 'Unassigned',
              time_spent_seconds: (t.actual_hours || 0) * 3600,
              original_estimate_seconds: (t.estimated_hours || 0) * 3600,
              created_date: t.created_at
            };
          });

          // Subscribe to realtime task updates
          const taskSubscription = supabase
            .channel(`tasks:${projData.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'tasks',
                filter: `project_id=eq.${projData.id}`
              },
              async (payload) => {
                console.log('🔔 Task update received:', payload);
                // Refetch tasks
                const { data: updatedTasksData } = await supabase
                  .from('tasks')
                  .select('*')
                  .eq('project_id', projData.id);

                console.log('📥 Refetched tasks:', updatedTasksData?.length);

                const updatedAssigneeIds = Array.from(new Set((updatedTasksData || []).map(t => t.assignee_id).filter(Boolean)));
                let updatedAssigneeMap = new Map<string, any>();

                if (updatedAssigneeIds.length > 0) {
                  const { data: users } = await supabase
                    .from('users')
                    .select('id, name, email, role')
                    .in('id', updatedAssigneeIds);

                  if (users) {
                    updatedAssigneeMap = new Map(users.map(u => [u.id, u]));
                  }
                }

                const updated = (updatedTasksData || []).map(t => {
                  const assignee = updatedAssigneeMap.get(t.assignee_id);
                  return {
                    id: t.id,
                    issue_key: `TASK-${t.id.substring(0, 4)}`,
                    issue_type: 'Task',
                    summary: t.name,
                    status: t.status || 'not_started',
                    assignee: assignee?.name || 'Unassigned',
                    time_spent_seconds: (t.actual_hours || 0) * 3600,
                    original_estimate_seconds: (t.estimated_hours || 0) * 3600,
                    created_date: t.created_at
                  };
                });

                console.log('🎯 Mapped issues with assignees:', updated.map(i => ({ key: i.issue_key, assignee: i.assignee })));

                setIssues(updated);
                calculateMetrics(updated, projData);
              }
            )
            .subscribe();

          // Fetch allocated team members (graceful fallback if table doesn't exist yet)
          let allocSubscription: any = null;
          try {
            const { data: allocations, error: allocError } = await supabase
              .from('project_team_allocations')
              .select('id, user_id, allocated_hours, start_date, end_date, allocation_percentage, users(id, name, email, role)')
              .eq('project_id', projData.id);

            if (!allocError && allocations) {
              const allocated = allocations.map((a: any) => ({
                id: a.id,
                user_id: a.user_id,
                name: a.users?.name || 'Unknown',
                email: a.users?.email,
                role: a.users?.role || 'Team Member',
                allocated_hours: a.allocated_hours || 0,
                start_date: a.start_date,
                end_date: a.end_date,
                allocation_percentage: a.allocation_percentage || 100
              }));
              setAllocatedTeamMembers(allocated);
            } else if (allocError) {
              console.warn('Allocations table not ready yet:', allocError.message);
            }
          } catch (err: any) {
            console.warn('Could not fetch allocations (table may not exist yet):', err.message);
          }

          // Subscribe to allocation changes if table exists
          try {
            allocSubscription = supabase
              .channel(`allocations:${projData.id}`)
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'project_team_allocations',
                  filter: `project_id=eq.${projData.id}`
                },
                async (payload) => {
                  console.log('Allocation update:', payload);
                  const { data: updatedAllocations } = await supabase
                    .from('project_team_allocations')
                    .select('id, user_id, allocated_hours, start_date, end_date, allocation_percentage, users(id, name, email, role)')
                    .eq('project_id', projData.id);

                  if (updatedAllocations) {
                    const allocated = updatedAllocations.map((a: any) => ({
                      id: a.id,
                      user_id: a.user_id,
                      name: a.users?.name || 'Unknown',
                      email: a.users?.email,
                      role: a.users?.role || 'Team Member',
                      allocated_hours: a.allocated_hours || 0,
                      start_date: a.start_date,
                      end_date: a.end_date,
                      allocation_percentage: a.allocation_percentage || 100
                    }));
                    setAllocatedTeamMembers(allocated);
                  }
                }
              )
              .subscribe();
          } catch (err: any) {
            console.warn('Could not subscribe to allocations:', err.message);
          }

          cleanupFn = () => {
            taskSubscription.unsubscribe();
            if (allocSubscription) allocSubscription.unsubscribe();
          };
        } else {
          const { data: issuesData, error: issuesError } = await supabase
            .from('jira_issues')
            .select('*')
            .eq('jira_project_id', projData.id);

          if (issuesError) {
            console.error('Jira issues fetch error:', issuesError);
            throw new Error(`Could not load project issues: ${issuesError.message}`);
          }
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
                calculateMetrics(updated, projData);
              }
            )
            .subscribe();

          cleanupFn = () => {
            issueSubscription.unsubscribe();
          };
        }

        // Set initial data AFTER subscriptions are set up
        setIssues(initialIssues);
        calculateMetrics(initialIssues, projData);

        // Return cleanup function
        return cleanupFn;
      } catch (err: any) {
        console.error('Analytics fetch error:', err);
        setError(err.message || 'Failed to load project analytics');
      } finally {
        setLoading(false);
      }
    };

    // Fire off the async fetch and subscription setup
    fetchAndSubscribe().catch((err) => {
      console.error('Unexpected error in fetchAndSubscribe:', err);
    });
  }, [projectId, user, calculateMetrics]);

  return {
    loading,
    error,
    project,
    issues,
    metrics,
    teamMembers,
    allocatedTeamMembers
  };
}
