import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Loader2 } from 'lucide-react';

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
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectsAndStats = async () => {
      setLoading(true);
      
      try {
        // 1. Fetch ALL projects
        const { data: projectsData, error: projError } = await supabase
          .from('jira_projects')
          .select('id, key, title, created_at')
          .order('created_at', { ascending: false });

        if (projError) throw projError;
        if (!projectsData) {
            setProjects([]);
            return;
        }

        // 2. Fetch Aggregated Stats for EACH project
        const summaries = await Promise.all(projectsData.map(async (p) => {
          const { data: issues } = await supabase
            .from('jira_issues')
            .select('status, assignee')
            .eq('project_key', p.key);

          const total = issues?.length || 0;
          
          // Calculate Completed
          const completed = issues?.filter(i => 
            ['done', 'closed', 'resolved', 'complete'].some(s => i.status?.toLowerCase().includes(s))
          ).length || 0;
          
          // Calculate Unique Team Members
          const teamMembers = new Set(
            issues?.map(i => i.assignee).filter(a => a && a !== 'Unassigned')
          );

          // Calculate Health Score
          const health = total === 0 ? 100 : Math.round((completed / total) * 100);

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
        }));

        setProjects(summaries);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectsAndStats();
  }, []);

  return (
    <VelocityAISidebar>
      <div className="bg-[#FAFAF9] min-h-screen p-8 md:p-12 font-['Inter',sans-serif]">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">Projects</h1>
              <p className="text-[#78716C] mt-2 font-light">
                {projects.length} active projects fetched from Jira
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
              <Button className="bg-[#1C1917] hover:bg-[#292524] text-white rounded-xl gap-2 h-11">
                <Plus className="w-4 h-4" /> New Project
              </Button>
            </div>
          </div>

          {/* List View Content */}
          {loading ? (
             <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-12 text-center">
                <Loader2 className="w-8 h-8 text-[#1C1917] animate-spin mx-auto mb-4" />
                <p className="text-[#78716C]">Loading projects...</p>
             </div>
          ) : (
            <div className="bg-white rounded-[24px] border border-[#E7E5E4] overflow-hidden shadow-sm">
              
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

              {/* Table Rows */}
              {projects.length > 0 ? (
                <div>
                  {projects.map((project) => (
                    <div 
                      key={project.id}
                      onClick={() => navigate(`/project-analytics/${project.id}`)}
                      className="grid grid-cols-12 gap-6 px-8 py-6 border-b border-[#E7E5E4] hover:bg-[#FAFAF9] transition-all cursor-pointer items-center last:border-b-0 group"
                    >
                      {/* Project Name & Meta */}
                      <div className="col-span-4">
                        <h3 className="text-sm font-medium text-[#1C1917] mb-1 group-hover:text-[#0F766E] transition-colors truncate">
                          {project.title}
                        </h3>
                        <p className="text-xs text-[#78716C] font-light">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Health Score */}
                      <div className="col-span-2">
                        <span className={`text-lg font-light ${
                          project.health_score >= 80 ? 'text-[#0F766E]' : 
                          project.health_score >= 50 ? 'text-[#C2410C]' : 'text-[#BE123C]'
                        }`}>
                          {project.health_score}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#E7E5E4] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              project.health_score >= 80 ? 'bg-[#0F766E]' : 
                              project.health_score >= 50 ? 'bg-[#C2410C]' : 'bg-[#BE123C]'
                            }`}
                            style={{ width: `${project.health_score}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#78716C] w-8">{project.health_score}%</span>
                      </div>

                      {/* Team */}
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(project.team_size, 4))].map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-[#F5F5F4] border-2 border-white flex items-center justify-center text-[10px] text-[#1C1917] font-medium">
                              M{i+1}
                            </div>
                          ))}
                          {project.team_size > 4 && (
                            <div className="w-8 h-8 rounded-full bg-[#E7E5E4] border-2 border-white flex items-center justify-center text-[10px] text-[#78716C]">
                              +{project.team_size - 4}
                            </div>
                          )}
                        </div>
                        {project.team_size === 0 && <span className="text-xs text-[#A8A29E]">No members</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-[#A8A29E]">
                  No projects found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </VelocityAISidebar>
  );
}