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
            // Run searches in parallel for better performance
            const [projectsRes, membersRes, issuesRes] = await Promise.all([
                // 1. Search Projects (Matches 'jira_projects' schema)
                supabase
                    .from('jira_projects')
                    .select('id, project_key, name')
                    .eq('organization_id', orgId)
                    .or(`name.ilike.${searchTerm},project_key.ilike.${searchTerm}`)
                    .limit(5),

                // 2. Search People (Matches 'users' table - more reliable than team_members)
                supabase
                    .from('users')
                    .select('id, email, name, designation')
                    .eq('organization_id', orgId)
                    .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
                    .limit(5),

                // 3. Search Tasks (Matches 'jira_issues' schema)
                supabase
                    .from('jira_issues')
                    .select('issue_key, summary')
                    .eq('organization_id', orgId)
                    .or(`summary.ilike.${searchTerm},issue_key.ilike.${searchTerm}`)
                    .limit(5)
            ]);

            const results: SearchResult[] = [];

            // Map Projects
            projectsRes.data?.forEach(p => {
                results.push({
                    id: p.id,
                    type: 'project',
                    title: p.name || 'Untitled Project',
                    subtitle: p.project_key,
                    path: `/projects/${p.project_key}`
                });
            });

            // Map People
            membersRes.data?.forEach(m => {
                results.push({
                    id: m.id,
                    type: 'people',
                    title: m.name || m.email.split('@')[0],
                    subtitle: m.designation || 'Member',
                    path: `/people/${m.id}`
                });
            });

            // Map Tasks
            issuesRes.data?.forEach(i => {
                results.push({
                    id: i.issue_key,
                    type: 'task',
                    title: i.summary || 'No Summary',
                    subtitle: i.issue_key,
                    path: `/tasks/${i.issue_key}`
                });
            });

            return results;
        } catch (error) {
            console.error('[SearchService] Search failed:', error);
            return [];
        }
    }
};