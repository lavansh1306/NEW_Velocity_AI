import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase'; // Direct Supabase connection
import { 
  ArrowLeft, Plus, Sparkles, LayoutGrid, Users, CheckSquare, 
  Clock, Lightbulb, AlertCircle 
} from 'lucide-react';

// --- Interfaces matching your Supabase Schema ---
interface JiraProject {
  id: string;
  key: string;
  title: string;
  created_at: string;
}

interface JiraIssue {
  id: string;
  issue_key: string;
  issue_type: string;
  summary: string;
  status: string;
  assignee: string;
  time_spent_seconds: number | null;
  original_estimate_seconds: number | null;
}

interface DerivedTeamMember {
  name: string;
  initials: string;
  tasks_assigned: number;
  tasks_completed: number;
  actual_hours: number;
  est_hours: number;
}

export default function ProjectAnalytics() {
  const { id, projectId } = useParams();
  const targetId = projectId || id; 
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'tasks' | 'timeline' | 'insights'>('overview');
  
  // States directly from Supabase
  const [project, setProject] = useState<JiraProject | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [teamMembers, setTeamMembers] = useState<DerivedTeamMember[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetId) return;
    
    const fetchDirectFromSupabase = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 1. Check if the URL parameter is a UUID or a Project Key (like "T3")
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
        
        // 2. Fetch Project using .limit(1) instead of .single() to prevent the 406 JSON Coercion error
        const { data: projectData, error: projError } = await supabase
          .from('jira_projects')
          .select('id, key, title, created_at')
          .eq(isUUID ? 'id' : 'key', targetId)
          .limit(1);

        if (projError) throw projError;
        if (!projectData || projectData.length === 0) throw new Error("Project not found in database.");
        
        const currentProject = projectData[0];
        setProject(currentProject);

        // 3. Fetch Issues tied to this project's key
        const { data: issuesData, error: issuesError } = await supabase
          .from('jira_issues')
          .select('id, issue_key, issue_type, summary, status, assignee, time_spent_seconds, original_estimate_seconds')
          .eq('project_key', currentProject.key);

        if (issuesError) throw issuesError;
        const fetchedIssues = issuesData || [];
        setIssues(fetchedIssues);

        // 4. Dynamically aggregate Team Members from the raw issues
        const teamMap = new Map<string, DerivedTeamMember>();
        
        fetchedIssues.forEach((issue) => {
          const assigneeName = issue.assignee && issue.assignee !== 'Unassigned' ? issue.assignee : 'Unassigned';
          
          if (!teamMap.has(assigneeName)) {
            teamMap.set(assigneeName, {
              name: assigneeName,
              initials: assigneeName === 'Unassigned' ? 'U' : assigneeName.substring(0, 2).toUpperCase(),
              tasks_assigned: 0,
              tasks_completed: 0,
              actual_hours: 0,
              est_hours: 0
            });
          }
          
          const member = teamMap.get(assigneeName)!;
          member.tasks_assigned += 1;
          
          // Check if task is done based on status string
          const isDone = ['Done', 'Closed', 'Resolved'].some(s => issue.status?.toLowerCase().includes(s.toLowerCase()));
          if (isDone) member.tasks_completed += 1;
          
          member.actual_hours += (issue.time_spent_seconds || 0) / 3600;
          member.est_hours += (issue.original_estimate_seconds || 0) / 3600;
        });

        // Filter out "Unassigned" to keep the team tab clean of ghost members
        teamMap.delete('Unassigned');
        setTeamMembers(Array.from(teamMap.values()));

      } catch (err: any) {
        console.error('Supabase direct fetch error:', err);
        setError(err.message || 'Failed to fetch data directly from Supabase.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDirectFromSupabase();
  }, [targetId]);

  // --- Dynamic Core Calculations (Zero Hardcoding) ---
  const totalEstHours = Math.round(issues.reduce((sum, issue) => sum + (issue.original_estimate_seconds || 0), 0) / 3600);
  const actualHours = Math.round(issues.reduce((sum, issue) => sum + (issue.time_spent_seconds || 0), 0) / 3600);
  const remainingHours = Math.max(totalEstHours - actualHours, 0);
  const completionPct = totalEstHours > 0 ? Math.round((actualHours / totalEstHours) * 100) : 0;
  
  const totalTasks = issues.length;
  const tasksCompleted = issues.filter(i => ['Done', 'Closed', 'Resolved'].some(s => i.status?.toLowerCase().includes(s.toLowerCase()))).length;
  const tasksRemaining = Math.max(totalTasks - tasksCompleted, 0);

  // Dynamic Health Score based on actual progress vs time spent
  const healthScore = totalTasks === 0 ? 100 : Math.round(((tasksCompleted / totalTasks) * 0.5 + (actualHours <= totalEstHours ? 1 : totalEstHours / Math.max(actualHours, 1)) * 0.5) * 100);
  const isAtRisk = healthScore < 50;
  const startDate = project?.created_at ? new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown';

  if (loading) {
    return (
      <VelocityAISidebar>
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="w-12 h-12 border-4 border-[#E7E5E4] border-t-[#1C1917] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#78716C] font-light">Querying Supabase Directly...</p>
          </div>
        </div>
      </VelocityAISidebar>
    );
  }

  if (error || !project) {
    return (
      <VelocityAISidebar>
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
          <div className="text-center max-w-md bg-white p-8 rounded-[24px] border border-[#E7E5E4] shadow-sm">
            <AlertCircle className="w-12 h-12 text-[#BE123C] mx-auto mb-4" />
            <h2 className="text-xl font-light text-[#1C1917] mb-2">Supabase Query Failed</h2>
            <p className="text-[#78716C] text-sm mb-6">{error}</p>
            <Button onClick={() => navigate('/projects')} className="bg-[#1C1917] hover:bg-[#292524] text-white rounded-xl">
              Go Back
            </Button>
          </div>
        </div>
      </VelocityAISidebar>
    );
  }

  // --- Reusable Tab Button ---
  const TabButton = ({ tabId, label, icon: Icon }: { tabId: string, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(tabId as any)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
        activeTab === tabId 
          ? 'bg-white shadow-sm text-[#1C1917] font-medium border border-[#E7E5E4]' 
          : 'text-[#78716C] hover:bg-[#F5F5F4] hover:text-[#1C1917]'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <VelocityAISidebar>
      <div className="bg-[#FAFAF9] min-h-screen p-8 md:p-12 font-['Inter',sans-serif]">
        <div className="max-w-[1200px] mx-auto space-y-8">
          
          {/* Header */}
          <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>

          <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${isAtRisk ? 'bg-[#FFF1F2] text-[#BE123C]' : 'bg-[#F0FDFA] text-[#0F766E]'}`}>
                {isAtRisk ? 'At Risk' : 'On Track'}
              </span>
              <h1 className="text-3xl md:text-4xl font-light text-[#1C1917] tracking-tight">
                {project.title || project.key}
              </h1>
              <p className="text-sm text-[#78716C]">
                Started {startDate} &rarr; Active Project
              </p>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs text-[#A8A29E] mb-2 uppercase tracking-wider">Health Score</p>
                <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-2xl font-light mx-auto ${
                  isAtRisk ? 'border-pink-100 bg-pink-50 text-pink-500' : 'border-teal-100 bg-teal-50 text-teal-600'
                }`}>
                  {healthScore}
                </div>
              </div>
              <Button className="bg-[#1C1917] hover:bg-[#292524] text-white rounded-xl px-6 py-6 h-auto font-light">
                Edit Project
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 p-1 bg-[#F5F5F4] rounded-xl w-fit border border-[#E7E5E4]">
            <TabButton tabId="overview" label="Overview" icon={LayoutGrid} />
            <TabButton tabId="team" label="Team" icon={Users} />
            <TabButton tabId="tasks" label="Tasks" icon={CheckSquare} />
            <TabButton tabId="timeline" label="Timeline" icon={Clock} />
            <TabButton tabId="insights" label="AI Insights" icon={Lightbulb} />
          </div>

          {/* ----------------- OVERVIEW TAB ----------------- */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              
              <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 divide-x divide-[#E7E5E4]">
                  <div className="px-4 first:px-0">
                    <p className="text-4xl font-light text-[#1C1917]">{totalEstHours}</p>
                    <p className="text-xs text-[#A8A29E] mt-2 uppercase tracking-wider">Total Est. Hours</p>
                  </div>
                  <div className="px-4">
                    <p className="text-4xl font-light text-[#1C1917]">{actualHours}</p>
                    <p className="text-xs text-[#A8A29E] mt-2 uppercase tracking-wider">Actual Hours</p>
                  </div>
                  <div className="px-4">
                    <p className="text-4xl font-light text-[#1C1917]">{remainingHours}</p>
                    <p className="text-xs text-[#A8A29E] mt-2 uppercase tracking-wider">Remaining</p>
                  </div>
                  <div className="px-4">
                    <p className="text-4xl font-light text-[#1C1917]">{completionPct}%</p>
                    <p className="text-xs text-[#A8A29E] mt-2 uppercase tracking-wider">Completion</p>
                  </div>
                  <div className="px-4">
                    <p className="text-4xl font-light text-[#1C1917]">{teamMembers.length}</p>
                    <p className="text-xs text-[#A8A29E] mt-2 uppercase tracking-wider">Team Size</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Completion Progress */}
                <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm space-y-6">
                  <h3 className="text-[#1C1917] text-lg font-light">Completion Progress</h3>
                  <div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-[#78716C]">Overall</span>
                      <span className="text-[#1C1917]">{completionPct}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#E7E5E4] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1C1917] rounded-full transition-all duration-1000" style={{ width: `${Math.min(completionPct, 100)}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-[#F0FDFA] rounded-xl p-6 border border-teal-100">
                      <p className="text-3xl text-[#0F766E] font-light">{tasksCompleted}</p>
                      <p className="text-xs text-[#0F766E] mt-2">Tasks Completed</p>
                    </div>
                    <div className="bg-[#FFF7ED] rounded-xl p-6 border border-orange-100">
                      <p className="text-3xl text-[#C2410C] font-light">{tasksRemaining}</p>
                      <p className="text-xs text-[#C2410C] mt-2">Tasks Remaining</p>
                    </div>
                  </div>
                </div>

                {/* Hours Breakdown */}
                <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm space-y-6">
                  <h3 className="text-[#1C1917] text-lg font-light">Hours Breakdown</h3>
                  <div className="space-y-8 pt-2">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#78716C]">Estimated</span>
                        <span className="text-[#1C1917]">{totalEstHours}h</span>
                      </div>
                      <div className="h-2 w-full bg-[#E7E5E4] rounded-full overflow-hidden">
                        <div className="h-full bg-[#E7E5E4] rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#78716C]">Logged</span>
                        <span className="text-[#1C1917]">{actualHours}h</span>
                      </div>
                      <div className="h-2 w-full bg-[#E7E5E4] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0F766E] rounded-full transition-all duration-1000" style={{ width: `${(actualHours / Math.max(totalEstHours, 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendation Banner */}
              <div className="bg-[#F0FDFA] border border-teal-100 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-[#CCFBF1] p-3 rounded-xl text-[#0F766E]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-[#0F766E] font-medium uppercase tracking-wider mb-1">AI Health Check</p>
                    <p className="text-[#1C1917] text-sm">
                      {actualHours > totalEstHours && totalEstHours > 0 
                        ? 'Project is running over estimated hours. Recommend reviewing recent task scope.' 
                        : 'Project capacity tracking normally. Team utilization is balanced.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TEAM TAB ----------------- */}
          {activeTab === 'team' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member, idx) => {
                  const assigned = member.tasks_assigned;
                  const completed = member.tasks_completed;
                  const completionRate = assigned > 0 ? (completed / assigned) * 100 : 0;
                  const isOverloaded = (assigned - completed) > 5;

                  return (
                    <div key={idx} className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#F5F5F4] border border-[#E7E5E4] flex items-center justify-center text-sm font-medium text-[#1C1917]">
                            {member.initials}
                          </div>
                          <div>
                            <p className="font-medium text-[#1C1917] text-lg">{member.name}</p>
                            <p className="text-sm text-[#78716C] font-light">Team Member</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                          isOverloaded ? 'text-[#BE123C] bg-[#FFF1F2]' : 'text-[#0F766E] bg-[#F0FDFA]'
                        }`}>
                          {isOverloaded ? 'High Load' : 'Healthy'}
                        </span>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#78716C] font-light">Tasks Assigned</span>
                          <span className="text-[#1C1917] font-medium">{assigned}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#78716C] font-light">Tasks Completed</span>
                          <span className="text-[#0F766E] font-medium">{completed}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#78716C] font-light">Hours Tracked</span>
                          <span className="text-[#1C1917] font-medium">{Math.round(member.actual_hours)}h</span>
                        </div>

                        <div className="pt-4 mt-4 border-t border-[#E7E5E4]">
                          <div className="flex justify-between text-xs text-[#78716C] mb-2 font-light">
                            <span>Task Completion Rate</span>
                            <span>{Math.round(completionRate)}%</span>
                          </div>
                          <div className="w-full bg-[#E7E5E4] rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-1000 ${isOverloaded ? 'bg-[#BE123C]' : 'bg-[#0F766E]'}`}
                              style={{ width: `${Math.min(completionRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {teamMembers.length === 0 && (
                  <div className="col-span-full bg-[#F5F5F4] rounded-[24px] border border-[#E7E5E4] border-dashed p-12 text-center">
                    <Users className="w-10 h-10 text-[#A8A29E] mx-auto mb-3 opacity-50" />
                    <p className="text-[#1C1917] font-medium">No team members mapped</p>
                    <p className="text-[#78716C] text-sm mt-1">Assign Jira issues to individuals to populate this list.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------- TASKS TAB ----------------- */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white p-8 rounded-[24px] shadow-sm border border-[#E7E5E4]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-light text-[#1C1917]">Project Issues ({issues.length})</h3>
                </div>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {issues.map((issue) => (
                    <div key={issue.id} className="border border-[#E7E5E4] rounded-xl p-5 hover:bg-[#FAFAF9] transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-xs font-medium text-[#0F766E] bg-[#F0FDFA] px-2 py-1 rounded-md">
                              {issue.issue_key}
                            </span>
                            <p className="font-medium text-[#1C1917]">{issue.summary}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-[#78716C] mt-3">
                            <span className="bg-[#F5F5F4] px-2 py-1 rounded border border-[#E7E5E4]">Type: {issue.issue_type}</span>
                            <span className={`px-2 py-1 rounded border ${['Done', 'Closed', 'Resolved'].includes(issue.status) ? 'bg-[#F0FDFA] text-[#0F766E] border-teal-100' : 'bg-[#FFF7ED] text-[#C2410C] border-orange-100'}`}>
                              Status: {issue.status}
                            </span>
                            <span>Assignee: <strong className="text-[#1C1917] font-medium">{issue.assignee || 'Unassigned'}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {issues.length === 0 && <p className="text-sm text-[#A8A29E]">No Jira issues found in Supabase.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TIMELINE & INSIGHTS ----------------- */}
          {(activeTab === 'timeline' || activeTab === 'insights') && (
            <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-24 text-center shadow-sm animate-in fade-in duration-500">
              {activeTab === 'insights' ? <Lightbulb className="w-16 h-16 text-[#A8A29E] mx-auto mb-6 opacity-40" /> : <Clock className="w-16 h-16 text-[#A8A29E] mx-auto mb-6 opacity-40" />}
              <h3 className="text-2xl font-light text-[#1C1917] mb-3">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View</h3>
              <p className="text-[#78716C] font-light max-w-md mx-auto">
                {activeTab === 'insights' 
                  ? 'AI recommendations require more extended project history to generate actionable, predictive insights.' 
                  : 'Timeline engine is currently tracking issue dependencies and due dates.'}
              </p>
            </div>
          )}

        </div>
      </div>
    </VelocityAISidebar>
  );
}