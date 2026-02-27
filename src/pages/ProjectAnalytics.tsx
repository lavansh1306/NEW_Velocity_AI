import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, LayoutGrid, Users, CheckSquare, 
  Clock, Lightbulb, AlertCircle, Sparkles, Loader2
} from 'lucide-react';

// --- Helper Function for Health Score Calculation ---
function calculateHealthScore(
  completedTasks: number,
  totalTasks: number,
  estimatedHours: number,
  actualHours: number
): number {
  // 60% based on task completion, 40% based on time budget adherence
  const taskFactor = totalTasks > 0 ? (completedTasks / totalTasks) : 1;
  const timeFactor = estimatedHours > 0 ? Math.min(1, (estimatedHours / Math.max(actualHours, 1))) : 1;
  return Math.round(((taskFactor * 0.6) + (timeFactor * 0.4)) * 100);
}

// --- Interfaces ---
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
  // Supabase returns these as numbers or null
  time_spent_seconds: number | null; 
  original_estimate_seconds: number | null;
  created_date: string;
}

// State for calculated project metrics
interface AnalyticsState {
  totalEstHours: number;
  actualHours: number;
  remainingHours: number;
  completionPct: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksRemaining: number;
  teamSize: number;
  healthScore: number;
  isAtRisk: boolean;
  feasibility: number;
}

interface DerivedTeamMember {
  name: string;
  role: string;
  initials: string;
  tasks_assigned: number;
  tasks_completed: number;
  actual_hours: number;
  utilization: number;
  status: 'Healthy' | 'Overloaded' | 'Underutilized';
}

export default function ProjectAnalytics() {
  const { id, projectId } = useParams();
  const targetId = projectId || id; 
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'tasks' | 'timeline' | 'insights'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw Data from DB
  const [project, setProject] = useState<JiraProject | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  
  // Computed Data for UI
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    totalEstHours: 0, actualHours: 0, remainingHours: 0, completionPct: 0,
    totalTasks: 0, tasksCompleted: 0, tasksRemaining: 0, teamSize: 0, 
    healthScore: 0, isAtRisk: false, feasibility: 0
  });
  const [teamMembers, setTeamMembers] = useState<DerivedTeamMember[]>([]);

  // --- 1. Fetching Logic ---
  useEffect(() => {
    if (!targetId) return;

    const fetchAndCalculate = async () => {
      setLoading(true);
      setError(null);

      try {
        // A. Determine if targetId is UUID or Project Key
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

        // B. Fetch Project Meta
        const { data: projData, error: projError } = await supabase
          .from('jira_projects')
          .select('*')
          .eq(isUUID ? 'id' : 'key', targetId)
          .limit(1)
          .single();

        if (projError) throw new Error("Could not load project details.");
        if (!projData) throw new Error("Project not found.");

        setProject(projData);

        // C. Fetch All Issues (Raw Data)
        const { data: issuesData, error: issuesError } = await supabase
          .from('jira_issues')
          .select('*')
          .eq('project_key', projData.key);

        if (issuesError) throw new Error("Could not load project issues.");
        
        const validIssues = issuesData || [];
        setIssues(validIssues);

        // --- 2. Calculation Logic (The "Brain") ---
        
        // Variables for aggregation
        let totalEstSeconds = 0;
        let totalSpentSeconds = 0;
        let completedCount = 0;
        const memberMap = new Map<string, { assigned: number; completed: number; seconds: number }>();

        validIssues.forEach(issue => {
          // Time Aggregation
          totalEstSeconds += issue.original_estimate_seconds || 0;
          totalSpentSeconds += issue.time_spent_seconds || 0;

          // Status Check
          const status = issue.status?.toLowerCase() || '';
          const isDone = ['done', 'closed', 'resolved', 'complete'].some(s => status.includes(s));
          if (isDone) completedCount++;

          // Team Aggregation
          const assignee = issue.assignee || 'Unassigned';
          if (assignee !== 'Unassigned') {
            if (!memberMap.has(assignee)) {
              memberMap.set(assignee, { assigned: 0, completed: 0, seconds: 0 });
            }
            const stats = memberMap.get(assignee)!;
            stats.assigned += 1;
            stats.seconds += (issue.time_spent_seconds || 0);
            if (isDone) stats.completed += 1;
          }
        });

        // Compute Final Metrics
        const totalEstHours = Math.round(totalEstSeconds / 3600);
        const actualHours = Math.round(totalSpentSeconds / 3600);
        const remainingHours = Math.max(totalEstHours - actualHours, 0);
        const totalTasks = validIssues.length;
        const tasksRemaining = totalTasks - completedCount;

        // Completion %: If we have hours, use hours. Else use task count.
        const completionPct = totalEstHours > 0 
          ? Math.round((actualHours / totalEstHours) * 100) 
          : (totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0);

        // Health Score using shared calculation
        const healthScore = calculateHealthScore(completedCount, totalTasks, totalEstHours, actualHours);

        setAnalytics({
          totalEstHours,
          actualHours,
          remainingHours,
          completionPct,
          totalTasks,
          tasksCompleted: completedCount,
          tasksRemaining,
          teamSize: memberMap.size,
          healthScore,
          isAtRisk: healthScore < 50,
          feasibility: Math.min(Math.round(healthScore * 1.1), 100) // Mock logic for feasibility
        });

        // Compute Team List
        const members: DerivedTeamMember[] = Array.from(memberMap.entries()).map(([name, stats]) => {
          const completionRate = stats.assigned > 0 ? stats.completed / stats.assigned : 0;
          const assigned = stats.assigned;
          const incomplete = assigned - stats.completed;

          // Dynamic Status Logic
          let status: DerivedTeamMember['status'] = 'Healthy';
          if (incomplete > 8) status = 'Overloaded'; // > 8 active tasks
          if (assigned < 3) status = 'Underutilized'; // < 3 total tasks

          return {
            name,
            role: 'Team Member', // Supabase Jira schema usually doesn't have role, defaulting.
            initials: name.substring(0, 2).toUpperCase(),
            tasks_assigned: assigned,
            tasks_completed: stats.completed,
            actual_hours: Math.round(stats.seconds / 3600),
            utilization: Math.round(completionRate * 100), // Using task completion as utilization proxy
            status
          };
        });
        setTeamMembers(members);

      } catch (err: any) {
        console.error('Logic calculation error:', err);
        setError(err.message || 'Failed to process project analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculate();
  }, [targetId]);


  return (
    <VelocityAISidebar>
      <div className="bg-[#FAFAF9] min-h-screen p-8 md:p-12 font-['Inter',sans-serif] animate-in fade-in duration-300">
        <div className="max-w-[1200px] mx-auto space-y-8">
          
          {/* Error State */}
          {error && (
            <div className="bg-white border border-red-200 rounded-[24px] p-6 text-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Unable to Load Project</h3>
                  <p className="text-sm mt-1">{error}</p>
                  <button onClick={() => navigate('/projects')} className="text-sm font-medium mt-3 hover:underline">
                    Return to Projects →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Show empty state while loading or if no project */}
          {!loading && !project && !error && (
            <div className="text-center py-12">
              <p className="text-[#78716C]">Project not found</p>
            </div>
          )}

          {/* Main Content - only show if project loaded */}
          {project && (() => {
            const startDate = new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return (
            <>
          
          {/* Back Nav */}
          <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </button>

          {/* Project Header Card */}
          <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${analytics.isAtRisk ? 'bg-[#FFF1F2] text-[#BE123C]' : 'bg-[#F0FDFA] text-[#0F766E]'}`}>
                {analytics.isAtRisk ? 'At Risk' : 'On Track'}
              </span>
              <h1 className="text-3xl md:text-4xl font-light text-[#1C1917] tracking-tight">
                {project.title || project.key}
              </h1>
              <p className="text-sm text-[#78716C]">
                {startDate} &rarr; Active · <span className="text-[#A8A29E]">{analytics.totalTasks} issues tracked</span>
              </p>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs text-[#A8A29E] mb-2 uppercase tracking-wider">Health Score</p>
                <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-2xl font-light mx-auto ${
                  analytics.isAtRisk ? 'border-pink-100 bg-pink-50 text-pink-500' : 'border-teal-100 bg-teal-50 text-teal-600'
                }`}>
                  {analytics.healthScore}
                </div>
                <p className="text-xs text-[#A8A29E] mt-2">Feasibility {analytics.feasibility}%</p>
              </div>
              <Button className="bg-[#1C1917] hover:bg-[#292524] text-white rounded-xl px-6 py-6 h-auto font-light">
                Edit Project
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 p-1 bg-[#F5F5F4] rounded-xl w-fit border border-[#E7E5E4]">
            {(() => {
              const TabButton = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
                <button
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    activeTab === id 
                      ? 'bg-white shadow-sm text-[#1C1917] font-medium border border-[#E7E5E4]' 
                      : 'text-[#78716C] hover:bg-[#F5F5F4] hover:text-[#1C1917]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
              return (
                <>
                  <TabButton id="overview" label="Overview" icon={LayoutGrid} />
                  <TabButton id="team" label="Team" icon={Users} />
                  <TabButton id="tasks" label="Tasks" icon={CheckSquare} />
                  <TabButton id="timeline" label="Timeline" icon={Clock} />
                  <TabButton id="insights" label="AI Insights" icon={Lightbulb} />
                </>
              );
            })()}
          </div>

          {/* --- TAB CONTENT: OVERVIEW --- */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* 5-Column Stats Grid */}
              <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 divide-x divide-[#E7E5E4]">
                  {[
                    { val: analytics.totalEstHours, label: 'Total Est. Hours' },
                    { val: analytics.actualHours, label: 'Actual Hours' },
                    { val: analytics.remainingHours, label: 'Remaining' },
                    { val: `${analytics.completionPct}%`, label: 'Completion' },
                    { val: analytics.teamSize, label: 'Team Size' },
                  ].map((stat, i) => (
                    <div key={i} className={`px-4 ${i===0 ? 'first:px-0' : ''}`}>
                      <p className="text-4xl font-light text-[#1C1917]">{stat.val}</p>
                      <p className="text-xs text-[#A8A29E] mt-2 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Completion Progress */}
                <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm space-y-6">
                  <h3 className="text-[#1C1917] text-lg font-light">Completion Progress</h3>
                  <div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-[#78716C]">Overall</span>
                      <span className="text-[#1C1917]">{analytics.completionPct}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#E7E5E4] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#1C1917] rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min(analytics.completionPct, 100)}%` }} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                     <div className="bg-[#F0FDFA] rounded-xl p-6 border border-teal-100">
                      <p className="text-3xl text-[#0F766E] font-light">{analytics.tasksCompleted}</p>
                      <p className="text-xs text-[#0F766E] mt-2">Tasks Completed</p>
                    </div>
                    <div className="bg-[#FFF7ED] rounded-xl p-6 border border-orange-100">
                      <p className="text-3xl text-[#C2410C] font-light">{analytics.tasksRemaining}</p>
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
                        <span className="text-[#1C1917]">{analytics.totalEstHours}h</span>
                      </div>
                      <div className="h-2 w-full bg-[#E7E5E4] rounded-full overflow-hidden">
                        <div className="h-full bg-[#E7E5E4] rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#78716C]">Logged</span>
                        <span className="text-[#1C1917]">{analytics.actualHours}h</span>
                      </div>
                      <div className="h-2 w-full bg-[#E7E5E4] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#0F766E] rounded-full transition-all duration-1000" 
                          style={{ width: `${analytics.totalEstHours > 0 ? Math.min((analytics.actualHours / analytics.totalEstHours) * 100, 100) : 0}%` }} 
                        />
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
                      {analytics.actualHours > analytics.totalEstHours 
                        ? 'Project is exceeding estimated hours. Immediate review of scope required.' 
                        : 'Project is tracking within estimated time budget.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB CONTENT: TEAM --- */}
          {activeTab === 'team' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {teamMembers.map((member, i) => (
                <div key={i} className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#F5F5F4] flex items-center justify-center text-[#1C1917] font-medium border border-[#E7E5E4]">
                        {member.initials}
                      </div>
                      <div>
                        <p className="font-medium text-[#1C1917] text-lg">{member.name}</p>
                        <p className="text-sm text-[#78716C]">{member.role}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      member.status === 'Overloaded' ? 'bg-[#FFF1F2] text-[#BE123C] border-pink-100' : 
                      member.status === 'Underutilized' ? 'bg-[#FFF7ED] text-[#C2410C] border-orange-100' :
                      'bg-[#F0FDFA] text-[#0F766E] border-teal-100'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#78716C] font-light">Assigned</span>
                      <span className="text-[#1C1917] font-medium">{member.tasks_assigned} tasks</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#78716C] font-light">Completed</span>
                      <span className="text-[#0F766E] font-medium">{member.tasks_completed} tasks</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#78716C] font-light">Hours</span>
                      <span className="text-[#1C1917] font-medium">{member.actual_hours}h</span>
                    </div>
                    
                    <div className="pt-2 border-t border-[#F5F5F4] mt-2">
                      <div className="flex justify-between text-xs text-[#78716C] mb-2">
                         <span>Utilization</span>
                         <span>{member.utilization}%</span>
                      </div>
                      <div className="w-full bg-[#E7E5E4] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            member.status === 'Overloaded' ? 'bg-[#BE123C]' : 
                            member.status === 'Underutilized' ? 'bg-[#C2410C]' : 'bg-[#0F766E]'
                          }`} 
                          style={{ width: `${Math.min(member.utilization, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <div className="col-span-full text-center py-12 text-[#A8A29E] bg-white rounded-[24px] border border-[#E7E5E4] border-dashed">
                  No team members found with assigned tasks.
                </div>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: TASKS --- */}
          {activeTab === 'tasks' && (
            <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm animate-in fade-in duration-300">
               <div className="space-y-2">
                {issues.map(issue => (
                  <div key={issue.id} className="flex justify-between items-center p-4 hover:bg-[#FAFAF9] rounded-xl border border-transparent hover:border-[#E7E5E4] transition-all">
                    <div>
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-mono text-[#0F766E] bg-[#F0FDFA] px-2 py-1 rounded-md border border-teal-100">
                          {issue.issue_key}
                         </span>
                         <span className="text-[#1C1917] font-medium">{issue.summary}</span>
                      </div>
                      <p className="text-xs text-[#78716C] mt-2 pl-1">
                        {issue.issue_type} · Assigned to <span className="font-medium text-[#1C1917]">{issue.assignee || 'Unassigned'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded border ${
                        ['done', 'resolved', 'closed', 'complete'].some(s => issue.status?.toLowerCase().includes(s)) 
                        ? 'bg-[#F0FDFA] text-[#0F766E] border-teal-100' 
                        : 'bg-[#FFF7ED] text-[#C2410C] border-orange-100'
                      }`}>
                        {issue.status}
                      </span>
                    </div>
                  </div>
                ))}
                {issues.length === 0 && <p className="text-center text-[#A8A29E] py-8">No issues found.</p>}
               </div>
            </div>
          )}
          
          {/* --- TAB CONTENT: PLACEHOLDER --- */}
          {(activeTab === 'timeline' || activeTab === 'insights') && (
             <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-24 text-center shadow-sm">
               <p className="text-[#78716C]">Advanced module loading...</p>
             </div>
          )}
            </>
            );
          })()}

        </div>
      </div>
    </VelocityAISidebar>
  );
}