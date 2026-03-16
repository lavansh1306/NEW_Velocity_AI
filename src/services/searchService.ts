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
        const lowerQuery = query.toLowerCase();

        try {
            // Run searches in parallel for better performance
            const [projectsRes, membersRes, tasksRes] = await Promise.all([
                // 1. Search Projects
                supabase
                    .from('projects')
                    .select('id, name')
                    .eq('organization_id', orgId)
                    .ilike('name', searchTerm)
                    .limit(5),

                // 2. Search People
                supabase
                    .from('users')
                    .select('id, email, name, designation')
                    .eq('organization_id', orgId)
                    .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
                    .limit(5),

                // 3. Search Tasks
                supabase
                    .from('tasks')
                    .select(`
                        id, 
                        name, 
                        projects!inner(organization_id, id)
                    `)
                    .eq('projects.organization_id', orgId)
                    .ilike('name', searchTerm)
                    .limit(5)
            ]);

            const results: SearchResult[] = [];

            // Add static directory links if the query matches them
            if ('projects'.includes(lowerQuery) || 'directory'.includes(lowerQuery)) {
                results.push({
                    id: 'dir-projects',
                    type: 'project',
                    title: 'Projects Directory',
                    subtitle: 'Directory',
                    path: '/projects'
                });
            }
            if ('people'.includes(lowerQuery) || 'directory'.includes(lowerQuery) || 'team'.includes(lowerQuery)) {
                results.push({
                    id: 'dir-people',
                    type: 'people',
                    title: 'People Directory',
                    subtitle: 'Directory',
                    path: '/people'
                });
            }
            if ('tasks'.includes(lowerQuery) || 'plan'.includes(lowerQuery)) {
                results.push({
                    id: 'dir-tasks',
                    type: 'task',
                    title: 'Tasks & Planning',
                    subtitle: 'Directory',
                    path: '/plan'
                });
            }

            // Map Projects
            projectsRes.data?.forEach(p => {
                results.push({
                    id: p.id,
                    type: 'project',
                    title: p.name || 'Untitled Project',
                    subtitle: 'Project',
                    path: `/projects/${p.id}`
                });
            });

            // Map People (Navigates to People Directory because no individual profile page exists)
            membersRes.data?.forEach(m => {
                results.push({
                    id: m.id,
                    type: 'people',
                    title: m.name || m.email.split('@')[0],
                    subtitle: 'People',
                    path: `/people`
                });
            });

            // Map Tasks
            tasksRes.data?.forEach((t: any) => {
                // Ensure projects array or object is handled correctly 
                // Using any to avoid type issues with joined table
                const projectId = Array.isArray(t.projects) ? t.projects[0]?.id : t.projects?.id;
                results.push({
                    id: t.id,
                    type: 'task',
                    title: t.name || 'Untitled Task',
                    subtitle: 'Task',
                    path: projectId ? `/projects/${projectId}` : `/projects`
                });
            });

            return results;
        } catch (error) {
            console.error('[SearchService] Search failed:', error);
            return [];
        }
    }
};