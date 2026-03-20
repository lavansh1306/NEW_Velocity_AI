import { supabase } from '../lib/supabase';

export const SETUP_STEPS = [
  {
    key: 'team_members_added',
    label: 'Add your team members',
    route: '/people',
    icon: 'Users',
  },
  {
    key: 'first_project_created',
    label: 'Create your first project',
    route: '/projects',
    icon: 'FolderPlus',
  },
  {
    key: 'working_hours_configured',
    label: 'Configure working hours',
    route: '/settings',
    icon: 'Clock',
  },
  {
    key: 'holidays_configured',
    label: 'Set up holiday calendar',
    route: '/settings?tab=holidays',
    icon: 'CalendarDays',
  },
] as const;

export const TOTAL_STEPS = SETUP_STEPS.length;

export type StepKey = (typeof SETUP_STEPS)[number]['key'];

export const setupProgressService = {
  /**
   * Get completed step IDs for an organization
   */
  async getProgress(organizationId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('organization_setup_progress')
      .select('completed_steps')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      // If no row exists yet, create one
      if (error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('organization_setup_progress')
          .insert({ organization_id: organizationId, completed_steps: [] });

        if (insertError) {
          console.error('Error creating setup progress:', insertError);
        }
        return [];
      }
      console.error('Error fetching setup progress:', error);
      return [];
    }

    return data?.completed_steps ?? [];
  },

  /**
   * Mark a setup step as complete (idempotent — safe to call multiple times)
   */
  async markStepComplete(organizationId: string, stepKey: StepKey): Promise<void> {
    try {
      // First get current steps
      const { data, error: fetchError } = await supabase
        .from('organization_setup_progress')
        .select('completed_steps')
        .eq('organization_id', organizationId)
        .single();

      if (fetchError) {
        // Row doesn't exist — create with this step
        if (fetchError.code === 'PGRST116') {
          await supabase
            .from('organization_setup_progress')
            .insert({
              organization_id: organizationId,
              completed_steps: [stepKey],
            });
          return;
        }
        console.error('Error fetching setup progress:', fetchError);
        return;
      }

      const current: string[] = data?.completed_steps ?? [];

      // Already marked — no-op
      if (current.includes(stepKey)) return;

      const { error: updateError } = await supabase
        .from('organization_setup_progress')
        .update({
          completed_steps: [...current, stepKey],
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId);

      if (updateError) {
        console.error('Error marking step complete:', updateError);
      }
    } catch (err) {
      console.error('Error in markStepComplete:', err);
    }
  },

  /**
   * Get the list of incomplete step definitions
   */
  getIncompleteItems(completedSteps: string[]) {
    return SETUP_STEPS.filter((step) => !completedSteps.includes(step.key));
  },

  /**
   * Compute completion percentage
   */
  getPercentage(completedSteps: string[]): number {
    return Math.round((completedSteps.length / TOTAL_STEPS) * 100);
  },

  /**
   * Check if all steps are complete
   */
  isComplete(completedSteps: string[]): boolean {
    return completedSteps.length >= TOTAL_STEPS;
  },
};
