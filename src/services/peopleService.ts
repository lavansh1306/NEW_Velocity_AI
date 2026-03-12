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
                        id,
                        name,
                        project_id,
                        start_date,
                        due_date
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

        // Now fetch tasks directly assigned via user_id for each user
        const userIds = (users || []).map(u => u.id);
        let tasksData: any[] = [];
        
        if (userIds.length > 0) {
            const { data: directTasks, error: tasksError } = await supabase
                .from('tasks')
                .select('id, name, start_date, due_date, user_id')
                .in('user_id', userIds);
            
            if (tasksError) {
                console.error('Error fetching direct tasks:', tasksError);
            } else {
                tasksData = directTasks || [];
            }
        }

        return (users || []).map(u => normalizeTeamMember(u, u.task_assignments || [], u.user_skills || [], tasksData));
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
    },

    async addTeamMember(organizationId: string, teamId: string, member: { name: string; email: string; role: string; skills?: string; utilizationPercent?: number }): Promise<{ userId: string; teamMemberId: string }> {
        if (!organizationId || !teamId) {
            throw new Error('Organization ID and Team ID are required');
        }

        // 1. Create user record
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([
                {
                    organization_id: organizationId,
                    email: member.email,
                    name: member.name,
                    role: 'employee',
                    capacity_hours_per_week: 40,
                    is_active: true,
                }
            ])
            .select('id')
            .single();

        if (userError || !newUser) {
            console.error('Error creating user:', userError);
            throw userError || new Error('Failed to create user');
        }

        console.log('[peopleService] Created user:', newUser.id);

        // 2. Create team member record
        const { data: newTeamMember, error: teamMemberError } = await supabase
            .from('team_members')
            .insert([
                {
                    team_id: teamId,
                    user_id: newUser.id,
                    role: member.role || 'member',
                    email: member.email,
                    display_name: member.name,
                    status: 'active',
                }
            ])
            .select('id')
            .single();

        if (teamMemberError || !newTeamMember) {
            console.error('Error creating team member:', teamMemberError);
            // Clean up the user record if team member creation fails
            try {
                await supabase.from('users').delete().eq('id', newUser.id);
            } catch (cleanupError) {
                console.warn('[peopleService] Cleanup error:', cleanupError);
            }
            throw teamMemberError || new Error('Failed to create team member');
        }

        console.log('[peopleService] Created team member:', newTeamMember.id);

        // 3. Add skills if provided
        if (member.skills) {
            const skillList = member.skills.split(',').map(s => s.trim()).filter(Boolean);
            if (skillList.length > 0) {
                const skillsToInsert = skillList.map(skill => ({
                    user_id: newUser.id,
                    skill_name: skill,
                    proficiency_level: 'mid',
                    source: 'manual',
                    confidence_score: 1.0,
                }));

                const { error: skillsError } = await supabase
                    .from('user_skills')
                    .insert(skillsToInsert);

                if (skillsError) {
                    console.warn('[peopleService] Warning: Failed to add skills:', skillsError);
                    // Don't throw error, user and team member are already created
                }
            }
        }

        return {
            userId: newUser.id,
            teamMemberId: newTeamMember.id,
        };
    }
};
