import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Plus, Search, RefreshCw, Loader2, FolderOpen, Calendar, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCurrentOrgId } from '@/lib/orgContext';

interface ProjectSummary {
  id: string;
  key: string;
  title: string;
  description?: string;
  created_at: string;
  issue_count: number;
  completed_count: number;
  health_score: number;
  team_size: number;
  team_initials: string[];
}

export default function Projects() {
  const navigate = useNavigate();
  const { user, loading: authLoading, orgId: contextOrgId } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    // Prevent fetching if auth is still processing or user is logged out
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      let orgId: string | null = contextOrgId || getCurrentOrgId();

      if (!orgId && user) {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (membership) {
          orgId = membership.org_id;
        } else {
          const { data: userByEmail } = await supabase
            .from('users')
            .select('organization_id')
            .eq('email', user.email)
            .maybeSingle();
          orgId = userByEmail?.organization_id ?? null;
        }
      }

      if (!orgId) {
        setIsLoading(false);
        return;
      }

      const { data: rawProjects, error } = await supabase
        .from('jira_projects')
        .select('id, key, title, description, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedProjects: ProjectSummary[] = (rawProjects || []).map(project => ({
        id: project.id,
        key: project.key,
        title: project.title,
        description: project.description || '',
        created_at: project.created_at || new Date().toISOString(),
        issue_count: 0,
        completed_count: 0,
        health_score: 0,
        team_size: 0,
        team_initials: [],
      }));

      setProjects(processedProjects);
      setLastRefreshed(new Date());
    } catch (error: any) {
      console.error('[Projects] Fetch Error:', error);
      toast({
        title: 'Fetch Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, contextOrgId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const lowerQuery = searchQuery.toLowerCase();
    return projects.filter(p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.key.toLowerCase().includes(lowerQuery)
    );
  }, [projects, searchQuery]);

  return (
    <VelocityAISidebar>
      <div className="bg-[#FAFAF9] min-h-screen p-8 md:p-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-medium text-[#1C1917]">All Projects</h2>
              <p className="text-[#78716C] text-sm mt-1">{filteredProjects.length} Projects found</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => navigate('/projects/create')} className="bg-[#1C1917] text-white gap-2">
                <Plus className="w-4 h-4" /> New Project
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E7E5E4] overflow-hidden min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#1C1917]" />
                <p className="mt-4 text-[#A8A29E]">Loading workspace...</p>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="divide-y divide-[#F5F5F4]">
                {filteredProjects.map(project => (
                  <div
                    key={project.id}
                    className="p-6 hover:bg-[#FAFAF9] cursor-pointer transition-colors"
                    onClick={() => navigate(`/project-analytics/${project.id}`)}
                  >
                    <h3 className="font-medium text-[#1C1917]">{project.title}</h3>
                    <p className="text-xs text-[#78716C] mt-1 uppercase font-mono">{project.key}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-[#A8A29E]">
                <FolderOpen className="w-12 h-12 opacity-10 mb-4" />
                <p>No projects found in this organization.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </VelocityAISidebar>
  );
}