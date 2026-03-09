import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Project, DraftProjectState } from '@/components/projects/types';
import { toast } from 'sonner';

export function useProjects() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  // 1. Fetch Projects List
  const fetchProjects = useCallback(async (orgId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          teams ( name )
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data.map((p: any) => ({
        ...p,
        team_name: p.teams?.name
      })));
    } catch (err: any) {
      toast.error('Failed to load projects: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Commit Logic: The "Auto-Magic" Button
  const commitProject = useCallback(async (
    orgId: string, 
    draft: DraftProjectState
  ) => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Step A: Create a Team for this project
      // (In a real app, you might select an existing team, but here we create one for the project)
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert([{ 
          organization_id: orgId, 
          name: `Team: ${draft.description.substring(0, 20)}...` 
        }])
        .select()
        .single();

      if (teamError) throw teamError;

      // Step B: Add Members to the Team
      if (draft.selectedTeamIds.length > 0) {
        const teamMembers = draft.selectedTeamIds.map(userId => ({
          team_id: teamData.id,
          user_id: userId,
          role: 'member'
        }));
        
        const { error: memberError } = await supabase
          .from('team_members')
          .insert(teamMembers);
          
        if (memberError) throw memberError;
      }

      // Step C: Create the Project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert([{
          organization_id: orgId,
          team_id: teamData.id,
          name: draft.description.split('.')[0].substring(0, 50), // Use first sentence as title
          description: draft.description,
          status: 'active',
          source: 'internal',
          start_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // Step D: Create Tasks
      const tasksPayload = draft.tasks.map(t => ({
        project_id: projectData.id,
        name: t.task,
        estimated_hours: t.estimatedHours,
        status: 'not_started',
        // We can optionally assign tasks round-robin style here if needed
      }));

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksPayload);

      if (tasksError) throw tasksError;

      toast.success('Project created successfully!');
      return projectData.id; // Return ID to navigate to details

    } catch (err: any) {
      console.error(err);
      toast.error('Failed to commit project: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isLoading,
    projects,
    fetchProjects,
    commitProject
  };
}