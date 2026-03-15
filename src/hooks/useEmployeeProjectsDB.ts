import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInDays } from 'date-fns';

export function useEmployeeProjectsDB() {
  const { user, orgId } = useAuth();
  const [projectsView, setProjectsView] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.email || !orgId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);

      try {
        // 1. Fetch all projects for the org
        const { data: projectsData, error: projError } = await supabase
          .from('jira_projects')
          .select('*')
          .eq('organization_id', orgId);
          
        if (projError || !projectsData) {
          console.error('Error fetching projects', projError);
          setIsLoading(false);
          return;
        }

        // 2. Fetch all issues for the org to calculate team and progress
        const { data: issuesData, error: issuesError } = await supabase
          .from('jira_issues')
          .select('*')
          .eq('organization_id', orgId);

        if (issuesError || !issuesData) {
          console.error('Error fetching issues', issuesError);
          setIsLoading(false);
          return;
        }

        // Filter to find projects the user is involved in
        const userIssues = issuesData.filter(i => i.assignee_email === user.email);
        const userProjectIds = new Set(userIssues.map(i => i.jira_project_id));
        
        const mappedProjects = Array.from(userProjectIds).filter(Boolean).map(projectId => {
          const proj = projectsData.find(p => p.id === projectId);
          const projIssues = issuesData.filter(i => i.jira_project_id === projectId);
          
          const myIssues = projIssues.filter(i => i.assignee_email === user.email);
          
          // Calculate totals
          const totalEstSeconds = projIssues.reduce((sum, i) => sum + (i.original_estimate_seconds || 0), 0);
          const totalSpentSeconds = projIssues.reduce((sum, i) => sum + (i.time_spent_seconds || 0), 0);
          const mySpentSeconds = myIssues.reduce((sum, i) => sum + (i.time_spent_seconds || 0), 0);
          
          const totalHoursEstimated = Math.round(totalEstSeconds / 3600);
          const totalHoursLogged = Math.round(totalSpentSeconds / 3600);
          const yourHours = Math.round(mySpentSeconds / 3600) + 'h';
          
          const progress = totalHoursEstimated > 0 ? Math.min(100, Math.round((totalHoursLogged / totalHoursEstimated) * 100)) : (totalHoursLogged > 0 ? 100 : 0);
          
          // Team initials
          const distinctEmails = new Set(projIssues.map(i => i.assignee_email).filter(Boolean));
          const team = Array.from(distinctEmails).slice(0, 3).map(email => (email as string).substring(0, 2).toUpperCase());
          
          // Dates
          const dueDates = projIssues.map(i => i.due_date).filter(Boolean).map(d => new Date(d as string).getTime());
          const createdMs = new Date(proj?.created_at || Date.now()).getTime();
          const maxDue = dueDates.length > 0 ? new Date(Math.max(...dueDates)) : new Date(Date.now() + 30 * 86400000); // add 30 days if no due date
          
          const remainingDays = differenceInDays(maxDue, new Date());
          let remainingStr = remainingDays > 0 ? `${remainingDays}d` : 'Completed';
          
          let status = 'In Progress';
          let statusColor = 'text-[#0F766E]';
          let health = Math.max(60, progress); // Mock health score based on progress
          let healthColor = 'text-[#1C1917] border-[#E7E5E4]';
          
          const isActuallyCompleted = progress >= 100 || projIssues.every(i => i.status === 'Done' || i.status === 'Completed');
          
          if (isActuallyCompleted) {
            status = 'Completed';
            statusColor = 'text-[#78716C]';
            healthColor = 'text-[#78716C] border-[#E7E5E4]';
            remainingStr = 'Completed';
            health = 100;
          } else if (remainingDays <= 5 && progress < 80) {
            status = 'At Risk';
            statusColor = 'text-[#BE123C]';
            healthColor = 'text-[#BE123C] border-[#FECDD3]';
            health = Math.max(20, health - 20); // reduce health if at risk
          }

          return {
            id: proj?.id || projectId,
            name: proj?.name || `Project ${proj?.project_key || projectId}`,
            dates: `${format(createdMs, 'MMM d')} - ${format(maxDue, 'MMM d')}`,
            remaining: remainingStr,
            status,
            statusColor,
            health,
            healthColor,
            team,
            yourHours,
            progress,
            totalHoursLogged,
            totalHoursEstimated,
            insight: (status === 'At Risk') ? { text: 'Nearing deadline with pending tasks.' } : null
          };
        });

        setProjectsView(mappedProjects);
      } catch (err) {
        console.error('Unexpected error fetching employee projects:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    load();
  }, [user?.email, orgId]);

  return { projectsView, isLoading };
}

export function useEmployeeProjectDetailDB(projectId: string | undefined) {
  const { user, orgId } = useAuth();
  const [projectData, setProjectData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.email || !orgId || !projectId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);

      try {
        const { data: proj, error: projError } = await supabase
          .from('jira_projects')
          .select('*')
          .eq('id', projectId)
          .single();
          
        if (projError || !proj) {
          console.error('Project not found', projError);
          setIsLoading(false);
          return;
        }

        const { data: issuesData, error: issuesError } = await supabase
          .from('jira_issues')
          .select('*')
          .eq('jira_project_id', projectId);

        if (issuesError || !issuesData) {
          console.error('Error fetching issues for project', issuesError);
          setIsLoading(false);
          return;
        }
        
        const myIssues = issuesData.filter(i => i.assignee_email === user.email);

        // Calculate Project Stats
        const actCount = issuesData.filter(i => i.status !== 'Done' && i.status !== 'Completed').length;
        const totalEstSeconds = issuesData.reduce((sum, i) => sum + (i.original_estimate_seconds || 0), 0);
        const totalSpentSeconds = issuesData.reduce((sum, i) => sum + (i.time_spent_seconds || 0), 0);
        
        const totalHoursEstimated = Math.round(totalEstSeconds / 3600);
        const totalHoursLogged = Math.round(totalSpentSeconds / 3600);
        const progress = totalHoursEstimated > 0 ? Math.round((totalHoursLogged / totalHoursEstimated) * 100) : (totalHoursLogged > 0 ? 100 : 0);
        
        const myEstSeconds = myIssues.reduce((sum, i) => sum + (i.original_estimate_seconds || 0), 0);
        const mySpentSeconds = myIssues.reduce((sum, i) => sum + (i.time_spent_seconds || 0), 0);
        const myTotalHoursEstimated = Math.round(myEstSeconds / 3600);
        const myTotalHoursLogged = Math.round(mySpentSeconds / 3600);

        // Stats array
        const stats = [
          { label: 'Completion', value: `${progress}%` },
          { label: 'Active Tasks', value: actCount.toString() },
          { label: 'Time Logged', value: `${totalHoursLogged}h` },
          { label: 'Est. Remaining', value: `${Math.max(0, totalHoursEstimated - totalHoursLogged)}h` }
        ];

        // Overview Tasks (Recent or all user issues)
        const overviewTasks = myIssues.slice(0, 5).map(i => {
          const taskProgress = (i.original_estimate_seconds && i.original_estimate_seconds > 0) ? 
             Math.min(100, Math.round(((i.time_spent_seconds || 0) / i.original_estimate_seconds) * 100)) : 
             (i.status === 'Done' ? 100 : 0);
          
          return {
            name: i.summary || i.issue_key,
            status: i.status || 'To Do',
            progress: taskProgress
          };
        });

        // My Tasks Tab
        const myTasksList = myIssues.map(i => {
          const taskProgress = (i.original_estimate_seconds && i.original_estimate_seconds > 0) ? 
             Math.min(100, Math.round(((i.time_spent_seconds || 0) / i.original_estimate_seconds) * 100)) : 
             (i.status === 'Done' ? 100 : 0);

          return {
            name: i.summary || i.issue_key,
            phase: 'Development', // placeholder as phase isn't in db natively
            hours: `${Math.round((i.time_spent_seconds || 0) / 3600)}h / ${Math.round((i.original_estimate_seconds || 0) / 3600)}h`,
            status: i.status || 'To Do',
            progress: taskProgress,
            checked: i.status === 'Done' || i.status === 'Completed'
          };
        });
        
        // Dates
        const dueDates = issuesData.map(i => i.due_date).filter(Boolean).map(d => new Date(d as string).getTime());
        const createdMs = new Date(proj.created_at || Date.now()).getTime();
        const maxDue = dueDates.length > 0 ? new Date(Math.max(...dueDates)) : new Date(Date.now() + 30 * 86400000);
        const remainingDays = Math.max(0, differenceInDays(maxDue, new Date()));

        setProjectData({
          project: {
            name: proj.name || `Project ${proj.project_key}`,
            dates: `${format(createdMs, 'MMM d, yyyy')} → ${format(maxDue, 'MMM d, yyyy')} • ${remainingDays} days remaining`
          },
          stats,
          overviewTasks,
          myTasks: myTasksList,
          myWork: {
            logged: myTotalHoursLogged,
            estimated: Math.max(myTotalHoursEstimated, myTotalHoursLogged), // prevent >100% physically if we don't want
            percent: Math.max(1, myTotalHoursEstimated > 0 ? Math.min(100, Math.round((myTotalHoursLogged / myTotalHoursEstimated) * 100)) : (myTotalHoursLogged > 0 ? 100 : 0))
          }
        });
        
      } catch (err) {
        console.error('Unexpected error fetching project details', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    load();
  }, [user?.email, orgId, projectId]);

  return { projectData, isLoading };
}
