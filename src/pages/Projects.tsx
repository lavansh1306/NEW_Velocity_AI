import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Plus, Search, RefreshCw, AlertTriangle, Loader2, FolderOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// --- Interfaces ---
interface ProjectSummary {
  id: string;
  key: string;
  title: string;
  created_at: string;
  issue_count: number;
  completed_count: number;
  health_score: number;
  team_size: number;
}

export default function Projects() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); 
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orgIdDebug, setOrgIdDebug] = useState<string | null>(null);

  const fetchProjectsAndStats = async () => {
    // 1. Safety Check: Don't fetch if auth is still initializing
    if (authLoading) return;
    
    // 2. Safety Check: If not logged in, stop loading and redirect (optional)
    if (!user) {
      console.log('[Projects] No user found, stopping load.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('[Projects] Starting fetch for user:', user.id);

      // 3. SECURE ID RESOLUTION: Fetch the Organization ID from public.users
      // We do NOT rely on local storage or stale context. We ask the DB "Who is this user?"
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id) // Match Auth ID to Public User ID
        .single();

      if (profileError || !userProfile?.organization_id) {
        console.error("[Projects] Critical: User has no organization linked.", profileError);
        toast({
          title: "Account Error",
          description: "Your account is not linked to an organization. Please contact support.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const orgId = userProfile.organization_id;
      setOrgIdDebug(orgId); // Keep track for debugging if needed

      // 4. DATA ISOLATION: Fetch Projects strictly for this Org ID
      const { data: projectsData, error: projError } = await supabase
        .from('jira_projects')
        .select('id, key, title, created_at')
        .eq('org_id', orgId) // <--- THE SECURITY LOCK
        .order('created_at', { ascending: false });

      if (projError) throw projError;

      // Handle Empty State immediately
      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      // 5. Deduplicate Projects (in case of bad data imports)
      const seenKeys = new Set<string>();
      const dedupedProjects = projectsData.filter((p: any) => {
        if (seenKeys.has(p.key)) return false;
        seenKeys.add(p.key);
        return true;
      });

      // 6. Fetch Statistics (Aggregated)
      // We run these in parallel for speed
      const summaries = await Promise.all(dedupedProjects.map(async (p: any) => {
        try {
          const { data: issues } = await supabase
            .from('jira_issues')
            .select('status, original_estimate_seconds, time_spent_seconds, assignee')
            .eq('project_key', p.key)
            .eq('org_id', orgId); // Double-lock security
          
          const total = issues?.length || 0;
          
          // Count completed tasks (flexible matching)
          const completed = issues?.filter(i => {
            const status = (i.status || '').toLowerCase();
            return status.includes('done') || status.includes('closed') || status.includes('resolved') || status.includes('complete');
          }).length || 0;
          
          // Calculate Metrics
          let totalEstSeconds = 0;
          let totalSpentSeconds = 0;
          const teamMembers = new Set(); // Use Set for unique member count

          issues?.forEach((issue: any) => {
            totalEstSeconds += issue.original_estimate_seconds || 0;
            totalSpentSeconds += issue.time_spent_seconds || 0;
            if (issue.assignee && issue.assignee !== 'Unassigned') {
              teamMembers.add(issue.assignee);
            }
          });
          
          // Calculate Health Score (Simple algorithm)
          // 100% if empty, otherwise based on completion rate
          const completionRate = total > 0 ? (completed / total) : 0;
          const health = total === 0 ? 100 : Math.round(completionRate * 100); 

          return {
            id: p.id,
            key: p.key,
            title: p.title || p.key,
            created_at: p.created_at,
            issue_count: total,
            completed_count: completed,
            team_size: teamMembers.size,
            health_score: health
          };
        } catch (err) {
          console.error(`[Projects] Stats error for ${p.key}:`, err);
          // Return valid object with zero stats on error to prevent crash
          return { 
            id: p.id, key: p.key, title: p.title || p.key, created_at: p.created_at, 
            issue_count: 0, completed_count: 0, health_score: 0, team_size: 0 
          };
        }
      }));

      setProjects(summaries);

    } catch (error: any) {
      console.error('[Projects] Fatal Error:', error);
      toast({ 
        title: "Error Loading Projects", 
        description: error.message || "Please refresh the page.", 
        variant: "destructive" 
      });
    } finally {
      // 7. GUARANTEED EXIT: This ensures the spinner ALWAYS stops
      setIsLoading(false);
    }
  };

  // Trigger fetch when User Auth is ready
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchProjectsAndStats();
      } else {
        // Not logged in
        setIsLoading(false);
      }
    }
  }, [user, authLoading]);

  return (
    <VelocityAISidebar>
      <div className="bg-[#FAFAF9] min-h-screen p-8 md:p-12 font-['Inter',sans-serif]">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">Projects</h1>
              <p className="text-[#78716C] mt-2 font-light flex items-center gap-2">
                {isLoading ? 'Syncing data...' : `${projects.length} active projects`}
                {isLoading && <RefreshCw className="w-3 h-3 animate-spin text-[#A8A29E]" />}
              </p>
            </div>
            
            <div className="flex gap-3">
               <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
                <input 
                  type="text" 
                  placeholder="Search projects..." 
                  className="pl-9 pr-4 py-2.5 bg-white border border-[#E7E5E4] rounded-xl text-sm w-64 focus:outline-none focus:ring-1 focus:ring-[#1C1917]"
                />
              </div>
              
              <Button 
                onClick={fetchProjectsAndStats} 
                variant="outline"
                className="bg-white hover:bg-gray-50 border-[#E7E5E4] text-[#1C1917] rounded-xl h-11 w-11 p-0 flex items-center justify-center"
                title="Force Refresh"
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

          {/* Main Content Area */}
          <div className="bg-white rounded-[24px] border border-[#E7E5E4] overflow-hidden shadow-sm animate-in fade-in duration-300 min-h-[400px]">
              
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-6 px-8 py-5 border-b border-[#E7E5E4] bg-[#FAFAF9]">
                <div className="col-span-4">
                  <p className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">Project</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">Health</p>
                </div>
                <div className="col-span-3">
                  <p className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">Progress</p>
                </div>
                <div className="col-span-3">
                  <p className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">Team</p>
                </div>
              </div>

              {/* Table Body - Loading State */}
              {isLoading && projects.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-[#A8A29E]">
                   <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#1C1917]" />
                   <p className="font-light">Loading your projects...</p>
                 </div>
              ) : projects.length > 0 ? (
                /* Table Body - Data State */
                <div>
                  {projects.map((project) => (
                    <div 
                      key={project.id}
                      onClick={() => navigate(`/project-analytics/${project.id}`)}
                      className="grid grid-cols-12 gap-6 px-8 py-6 border-b border-[#E7E5E4] hover:bg-[#FAFAF9] transition-all cursor-pointer items-center last:border-b-0 group"
                    >
                      {/* Project Name */}
                      <div className="col-span-4">
                        <h3 className="text-sm font-medium text-[#1C1917] mb-1 group-hover:text-[#0F766E] transition-colors truncate">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#78716C] font-light">
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">{project.key}</span>
                          <span>•</span>
                          <span>{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Health Score */}
                      <div className="col-span-2">
                        <span className={`text-lg font-light ${
                          (project.health_score ?? 0) >= 80 ? 'text-[#0F766E]' : 
                          (project.health_score ?? 0) >= 50 ? 'text-[#C2410C]' : 'text-[#BE123C]'
                        }`}>
                          {typeof project.health_score === 'number' ? `${project.health_score}%` : '-'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#E7E5E4] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              (project.health_score ?? 0) >= 80 ? 'bg-[#0F766E]' : 
                              (project.health_score ?? 0) >= 50 ? 'bg-[#C2410C]' : 'bg-[#BE123C]'
                            }`}
                            style={{ width: `${project.health_score ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#78716C] w-16 text-right">
                          {project.completed_count}/{project.issue_count} tasks
                        </span>
                      </div>

                      {/* Team */}
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(project.team_size, 4))].map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-[#F5F5F4] border-2 border-white flex items-center justify-center text-[10px] text-[#1C1917] font-medium shadow-sm">
                              M{i+1}
                            </div>
                          ))}
                          {project.team_size > 4 && (
                            <div className="w-8 h-8 rounded-full bg-[#E7E5E4] border-2 border-white flex items-center justify-center text-[10px] text-[#78716C] shadow-sm">
                              +{project.team_size - 4}
                            </div>
                          )}
                        </div>
                        {project.team_size === 0 && <span className="text-xs text-[#A8A29E] italic">No members</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table Body - Empty State */
                <div className="flex flex-col items-center justify-center h-64 text-[#A8A29E]">
                  <FolderOpen className="w-10 h-10 mb-3 opacity-20" />
                  <p className="font-light mb-4">No projects found in this organization.</p>
                  <Button 
                    variant="outline" 
                    className="border-[#E7E5E4] text-[#1C1917]"
                    onClick={() => navigate('/projects/create')}
                  >
                    Create your first project
                  </Button>
                </div>
              )}
            </div>
        </div>
      </div>
    </VelocityAISidebar>
  );
}