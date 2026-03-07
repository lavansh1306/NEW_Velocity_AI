import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';

export interface SearchResult {
    id: string;
    type: 'project' | 'people' | 'task';
    title: string;
    subtitle: string;
    path: string;
}

export const searchService = {
    async searchAll(query: string): Promise<SearchResult[]> {
        if (!query || query.length < 2) return [];

        const orgId = getCurrentOrgId();
        if (!orgId) return [];

        const searchTerm = `%${query}%`;

        try {
            // 1. Search Projects
            const { data: projects } = await supabase
                .from('jira_projects')
                .select('key, title, jira_project_id')
                .eq('org_id', orgId)
                .or(`title.ilike.${searchTerm},key.ilike.${searchTerm}`)
                .limit(5);

            // 2. Search People (Organization Members + Jira Assignees)
            const [membersRes, assigneesRes] = await Promise.all([
                supabase
                    .from('organization_members')
                    .select('id, email, display_name, role')
                    .eq('org_id', orgId)
                    .or(`display_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
                    .limit(5),
                supabase
                    .from('jira_issues')
                    .select('assignee')
                    .eq('org_id', orgId)
                    .ilike('assignee', searchTerm)
                    .limit(20)
            ]);

            const members = membersRes.data || [];
            const assigneeIssues = assigneesRes.data || [];

            // 3. Search Tasks (Jira Issues)
            const { data: issues } = await supabase
                .from('jira_issues')
                .select('issue_key, summary, project_key')
                .eq('org_id', orgId)
                .or(`summary.ilike.${searchTerm},issue_key.ilike.${searchTerm}`)
                .limit(5);

            const results: SearchResult[] = [];
            const seenPeople = new Set<string>();

            // Map Projects
            projects?.forEach(p => {
                results.push({
                    id: p.jira_project_id || p.key,
                    type: 'project',
                    title: p.title || p.key,
                    subtitle: p.key,
                    path: `/projects/${p.key}` // Adjust based on routing
                });
            });

            // Map People (Members)
            members.forEach(m => {
                const name = m.display_name || m.email.split('@')[0];
                seenPeople.add(name.toLowerCase());
                results.push({
                    id: m.id,
                    type: 'people',
                    title: name,
                    subtitle: m.role || 'Member',
                    path: '/people'
                });
            });

            // Map People (Assignees from Jira)
            assigneeIssues.forEach(i => {
                if (i.assignee && !seenPeople.has(i.assignee.toLowerCase())) {
                    seenPeople.add(i.assignee.toLowerCase());
                    results.push({
                        id: `assignee-${i.assignee}`,
                        type: 'people',
                        title: i.assignee,
                        subtitle: 'Team Member',
                        path: '/people'
                    });
                }
            });

            // Map Tasks
            issues?.forEach(i => {
                results.push({
                    id: i.issue_key,
                    type: 'task',
                    title: i.summary,
                    subtitle: i.issue_key,
                    path: '/dashboard' // Could navigate to a detail view if it exists
                });
            });

            return results;
        } catch (error) {
            console.error('[SearchService] Search failed:', error);
            return [];
        }
    }
};
