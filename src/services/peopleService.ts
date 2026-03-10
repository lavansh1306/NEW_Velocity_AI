import { supabase } from '../lib/supabase';
import { normalizeTeamMember, normalizePersonDetail } from '../lib/normalizers/people';
import { TeamMemberView, PendingSkillView, PersonDetailView } from '../types';

export const peopleService = {
    async fetchAllTeamMembers(orgId: string, teamIds?: string[]): Promise<TeamMemberView[]> {
        let query = supabase
            .from('users')
            .select(`
                *,
                task_assignments (
                    allocated_hours_per_week,
                    tasks (
                        project_id
                    )
                ),
                user_skills (
                    skill_name
                ),
                team_members!inner (
                    team_id
                )
            `)
            .eq('organization_id', orgId)
            .eq('is_active', true);

        if (teamIds && teamIds.length > 0) {
            query = query.in('team_members.team_id', teamIds);
        }

        const { data: users, error: userError } = await query;

        if (userError) {
            console.error('Error fetching team members:', userError);
            throw userError;
        }

        return (users || []).map(u => normalizeTeamMember(u, u.task_assignments || [], u.user_skills || []));
    },

    async fetchUserTeams(userId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching user teams:', error);
            throw error;
        }

        return (data || []).map(tm => tm.team_id);
    },

    async fetchPendingSkills(orgId: string, teamIds?: string[]): Promise<PendingSkillView[]> {
        let query = supabase
            .from('user_skills')
            .select(`
                *,
                users!inner (
                    name,
                    email,
                    organization_id,
                    team_members!inner (
                        team_id
                    )
                )
            `)
            .eq('users.organization_id', orgId)
            .neq('source', 'manual');

        if (teamIds && teamIds.length > 0) {
            query = query.in('users.team_members.team_id', teamIds);
        }

        const { data: skills, error } = await query;

        if (error) {
            console.error('Error fetching pending skills:', error);
            throw error;
        }

        return (skills || []).map((s, idx) => ({
            id: idx,
            userId: s.user_id,
            person: s.users?.name || s.users?.email || 'Unknown',
            avatar: (s.users?.name || s.users?.email || 'U').substring(0, 1).toUpperCase(),
            skill: s.skill_name,
            selfRated: s.proficiency_level,
            evidence: 'Detected from project activity', // Placeholder
            suggestedBy: s.source === 'llm_inferred' ? 'ai' : 'user'
        }));
    },

    async fetchPersonDetails(userName: string): Promise<PersonDetailView> {
        // First find user by name or email
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .or(`name.eq."${userName}",email.eq."${userName}"`)
            .single();

        if (userError || !user) {
            throw userError || new Error('User not found');
        }

        const { data: details, error: detailsError } = await supabase
            .from('users')
            .select(`
        *,
        task_assignments (
          allocated_hours_per_week,
          tasks (
            project_id,
            projects (
              name
            )
          )
        ),
        user_skills (
          skill_name,
          proficiency_level
        )
      `)
            .eq('id', user.id)
            .single();

        if (detailsError) {
            console.error('Error fetching person details:', detailsError);
            throw detailsError;
        }

        return normalizePersonDetail(details, details.task_assignments || [], details.user_skills || []);
    }
};
