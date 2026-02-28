import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Plus, Search, RefreshCw, AlertTriangle, Loader2, FolderOpen, Calendar, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// --- Interfaces ---
interface ProjectSummary {
  id: string;
  key: string;
  title: string;
  description?: string;
  created_at: string;
  // Computed Stats
  issue_count: number;
  completed_count: number;
  health_score: number;
  team_size: number;
  total_est_hours: number;
  total_spent_hours: number;
}

export default function Projects() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // State
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // --- CORE DATA FETCHING ---
  const fetchData = async () => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();

    try {
      console.log('[Projects] 🔐 Starting Secure Fetch...');

      // 1. Resolve Organization ID (Strict Mode)
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile?.organization_id) {
        throw new Error("Could not verify Organization membership.");
      }

      const orgId = userProfile.organization_id;

      // 2. PARALLEL FETCH: Get Projects AND All Issues for this Org
      // We fetch ALL issues at once to avoid the "N+1" loading loop problem
      const [projectsResponse, issuesResponse] = await Promise.all([
        supabase
          .from('jira_projects')
          .select('id, key, title, description, created_at')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('jira_issues')
          .select('project_key, status, assignee, original_estimate_seconds, time_spent_seconds')
          .eq('org_id', orgId)
      ]);

      if (projectsResponse.error) throw projectsResponse.error;
      if (issuesResponse.error) throw issuesResponse.error;

      const rawProjects = projectsResponse.data || [];
      const allIssues = issuesResponse.data || [];

      console.log(`[Projects] Fetched ${rawProjects.length} projects and ${allIssues.length} total issues in ${(performance.now() - startTime).toFixed(0)}ms`);

      // 3. Process & Map Data (In Memory)
      const processedProjects: ProjectSummary[] = rawProjects.map(project => {
        // Filter issues belonging to this project
        const projectIssues = allIssues.filter(i => i.project_key === project.key);
        
        const total = projectIssues.length;
        
        // Calculate Completed
        const completed = projectIssues.filter(i => {
          const s = (i.status || '').toLowerCase();
          return s === 'done' || s === 'closed' || s === 'resolved' || s === 'complete';
        }).length;

        // Calculate Team Size (Unique Assignees)
        const uniqueMembers = new Set(
          projectIssues
            .filter(i => i.assignee && i.assignee !== 'Unassigned')
            .map(i => i.assignee)
        );

        // Calculate Time Metrics
        const totalEstSeconds = projectIssues.reduce((sum, i) => sum + (i.original_estimate_seconds || 0), 0);
        const totalSpentSeconds = projectIssues.reduce((sum, i) => sum + (i.time_spent_seconds || 0), 0);

        // Calculate Health Score
        // Formula: Weighted avg of Task Completion (70%) and Time Budget (30%)
        let health = 100;
        if (total > 0) {
          const completionRate = completed / total;
          
          let budgetHealth = 1;
          if (totalEstSeconds > 0) {
            // If we spent more than estimated, health drops
            budgetHealth = Math.max(0, 1 - Math.max(0, totalSpentSeconds - totalEstSeconds) / totalEstSeconds);
          }
          
          health = Math.round((completionRate * 70) + (budgetHealth * 30));
        }

        return {
          id: project.id,
          key: project.key,
          title: project.title,
          description: project.description,
          created_at: project.created_at,
          issue_count: total,
          completed_count: completed,
          health_score: health,
          team_size: uniqueMembers.size,
          total_est_hours: Math.round(totalEstSeconds / 3600),
          total_spent_hours: Math.round(totalSpentSeconds / 3600)
        };
      });

      setProjects(processedProjects);
      setLastRefreshed(new Date());

    } catch (error: any) {
      console.error('[Projects] Fetch Error:', error);
      toast({
        title: "Data Sync Failed",
        description: error.message || "Could not load projects. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  // --- FILTERING ---
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
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
          
          {/* --- HEADER SECTION --- */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">Projects</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[#78716C] font-light text-sm">
                  {projects.length} Active Projects
                </span>
                {lastRefreshed && (
                  <span className="text-[#A8A29E] text-xs px-2 py-0.5 bg-white border border-[#E7E5E4] rounded-full">
                    Synced {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="relative hidden md:block group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E] group-focus-within:text-[#1C1917] transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..." 
                  className="pl-9 pr-4 py-2.5 bg-white border border-[#E7E5E4] rounded-xl text-sm w-64 focus:outline-none focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] transition-all shadow-sm"
                />
              </div>
              
              <Button 
                onClick={fetchData} 
                variant="outline"
                className="bg-white hover:bg-gray-50 border-[#E7E5E4] text-[#1C1917] rounded-xl h-11 w-11 p-0 flex items-center justify-center shadow-sm"
                title="Force Refresh"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              <Button 
                onClick={() => navigate('/projects/create')} 
                className="bg-[#1C1917] hover:bg-[#292524] text-white rounded-xl gap-2 h-11 shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" /> New Project
              </Button>
            </div>
          </div>

          {/* --- CONTENT SECTION --- */}
          <div className="bg-white rounded-[24px] border border-[#E7E5E4] overflow-hidden shadow-sm min-h-[500px] flex flex-col">
              
              {/* Table Header */}
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

              {/* Table Body */}
              <div className="flex-1">
                {isLoading && projects.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-[#A8A29E]">
                     <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#1C1917]" />
                     <p className="font-light">Syncing your workspace...</p>
                   </div>
                ) : filteredProjects.length > 0 ? (
                  <div>
                    {filteredProjects.map((project) => (
                      <div 
                        key={project.id}
                        onClick={() => navigate(`/project-analytics/${project.id}`)}
                        className="grid grid-cols-12 gap-6 px-8 py-5 border-b border-[#F5F5F4] hover:bg-[#FAFAF9] transition-all cursor-pointer items-center last:border-b-0 group"
                      >
                        {/* Project Name & Meta */}
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

                        {/* Health Score */}
                        <div className="col-span-2 hidden md:flex items-center">
                          <div className={`
                            px-3 py-1 rounded-full text-xs font-medium border
                            ${(project.health_score ?? 0) >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              (project.health_score ?? 0) >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                              'bg-rose-50 text-rose-700 border-rose-100'}
                          `}>
                            {project.health_score}% Healthy
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="col-span-4 md:col-span-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-[#1C1917]">
                              {Math.round((project.completed_count / Math.max(project.issue_count, 1)) * 100)}%
                            </span>
                            <span className="text-[10px] text-[#A8A29E]">
                              {project.completed_count}/{project.issue_count} tasks
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#F5F5F4] rounded-full overflow-hidden w-full max-w-[180px]">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ease-out ${
                                (project.health_score ?? 0) >= 80 ? 'bg-[#10B981]' : 
                                (project.health_score ?? 0) >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                              }`}
                              style={{ width: `${(project.completed_count / Math.max(project.issue_count, 1)) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Team */}
                        <div className="col-span-3 hidden md:flex items-center gap-2">
                          <div className="flex -space-x-2.5">
                            {[...Array(Math.min(project.team_size, 4))].map((_, i) => (
                              <div key={i} className="w-8 h-8 rounded-full bg-white border border-[#E7E5E4] flex items-center justify-center text-[10px] text-[#57534E] font-medium shadow-sm hover:z-10 hover:scale-110 transition-transform">
                                M{i+1}
                              </div>
                            ))}
                            {project.team_size > 4 && (
                              <div className="w-8 h-8 rounded-full bg-[#F5F5F4] border border-white flex items-center justify-center text-[10px] text-[#78716C] font-medium hover:z-10">
                                +{project.team_size - 4}
                              </div>
                            )}
                          </div>
                          {project.team_size === 0 && <span className="text-xs text-[#A8A29E] italic pl-1">No members</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-[#A8A29E]">
                    {searchQuery ? (
                      <>
                        <Search className="w-10 h-10 mb-3 opacity-20" />
                        <p className="font-light mb-1">No projects match "{searchQuery}"</p>
                        <Button variant="link" onClick={() => setSearchQuery('')} className="text-[#1C1917]">Clear Search</Button>
                      </>
                    ) : (
                      <>
                        <FolderOpen className="w-12 h-12 mb-4 opacity-10 text-[#1C1917]" />
                        <h3 className="text-lg font-medium text-[#1C1917] mb-2">No projects yet</h3>
                        <p className="font-light mb-6 max-w-sm text-center">Create your first project to start tracking tasks, managing teams, and analyzing health.</p>
                        <Button 
                          variant="outline" 
                          className="border-[#E7E5E4] text-[#1C1917] hover:bg-[#FAFAF9]"
                          onClick={() => navigate('/projects/create')}
                        >
                          Create Project
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </VelocityAISidebar>
  );
}