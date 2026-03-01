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
  // Note: These fields will now show 0 or default values since the secondary fetch is removed
  issue_count: number;
  completed_count: number;
  health_score: number;
  team_size: number;
  team_initials: string[];
}

function getHealthBadgeClass(score: number): string {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-rose-50 text-rose-700 border-rose-100';
}

function getProgressBarClass(score: number): string {
  if (score >= 80) return 'bg-[#10B981]';
  if (score >= 50) return 'bg-[#F59E0B]';
  return 'bg-[#EF4444]';
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
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Resolve Organization ID
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

      // 2. PRIMARY FETCH ONLY: Fetch from jira_projects
      const { data: rawProjects, error } = await supabase
        .from('jira_projects')
        .select('id, key, title, description, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 3. Format data (Stats default to 0 as secondary fetch is removed)
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
        title: 'Data Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, contextOrgId, toast]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

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
      <div className="bg-[#FAFAF9] min-h-screen p-8 md:p-12 font-['Inter',sans-serif]">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">Projects</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[#78716C] font-light text-sm">
                  {filteredProjects.length}{searchQuery ? ` of ${projects.length}` : ''} Project{filteredProjects.length !== 1 ? 's' : ''}
                </span>
                {lastRefreshed && (
                  <span className="text-[#A8A29E] text-xs px-2 py-0.5 bg-white border border-[#E7E5E4] rounded-full">
                    Synced {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="pl-9 pr-4 py-2.5 bg-white border border-[#E7E5E4] rounded-xl text-sm w-64 focus:outline-none focus:ring-1 focus:ring-[#1C1917]"
                />
              </div>
              <Button
                onClick={fetchData}
                variant="outline"
                disabled={isLoading}
                className="bg-white border-[#E7E5E4] text-[#1C1917] rounded-xl h-11 w-11 p-0 flex items-center justify-center"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => navigate('/projects/create')}
                className="bg-[#1C1917] hover:bg-[#292524] text-white rounded-xl gap-2 h-11"
              >
                <Plus className="w-4 h-4" /> New Project
              </Button>
            </div>
          </div>

          {/* Project List Content */}
          <div className="bg-white rounded-[24px] border border-[#E7E5E4] overflow-hidden shadow-sm min-h-[500px] flex flex-col">
            <div className="grid grid-cols-12 gap-6 px-8 py-5 border-b border-[#E7E5E4] bg-[#FAFAF9]">
              <div className="col-span-5 md:col-span-4">
                <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider flex items-center gap-2">
                  <FolderOpen className="w-3 h-3" /> Project
                </p>
              </div>
              <div className="col-span-2 hidden md:block">
                <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" /> Health
                </p>
              </div>
              <div className="col-span-4 md:col-span-3">
                <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Progress
                </p>
              </div>
              <div className="col-span-3 hidden md:block">
                <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-3 h-3" /> Team
                </p>
              </div>
            </div>

            <div className="flex-1">
              {isLoading && projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-[#A8A29E]">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#1C1917]" />
                  <p className="font-light">Fetching projects...</p>
                </div>
              ) : filteredProjects.length > 0 ? (
                <div>
                  {filteredProjects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/project-analytics/${project.id}`)}
                      className="grid grid-cols-12 gap-6 px-8 py-5 border-b border-[#F5F5F4] hover:bg-[#FAFAF9] transition-all cursor-pointer items-center last:border-b-0 group"
                    >
                      <div className="col-span-5 md:col-span-4">
                        <h3 className="text-sm font-medium text-[#1C1917] mb-1.5 group-hover:text-[#0F766E] transition-colors truncate pr-4">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#78716C] font-light">
                          <span className="font-mono bg-[#F5F5F4] text-[#57534E] border border-[#E7E5E4] px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                            {project.key}
                          </span>
                          <span className="text-[#D6D3D1]">•</span>
                          <span>{new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>

                      <div className="col-span-2 hidden md:flex items-center">
                        <div className="px-3 py-1 rounded-full text-xs font-medium border bg-stone-50 text-stone-400 border-stone-100">
                          Metadata only
                        </div>
                      </div>

                      <div className="col-span-4 md:col-span-3">
                        <div className="h-1.5 bg-[#F5F5F4] rounded-full overflow-hidden w-full max-w-[180px]">
                          <div className="h-full bg-[#E7E5E4] w-0" />
                        </div>
                      </div>

                      <div className="col-span-3 hidden md:flex items-center gap-2">
                        <span className="text-xs text-[#A8A29E] italic pl-1">Sync tasks to see team</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-[#A8A29E]">
                  <FolderOpen className="w-12 h-12 mb-4 opacity-10 text-[#1C1917]" />
                  <h3 className="text-lg font-medium text-[#1C1917] mb-2">No projects yet</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </VelocityAISidebar>
  );
}