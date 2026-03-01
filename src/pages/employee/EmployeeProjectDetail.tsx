import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Issue {
  issue_key: string;
  summary: string;
  status: string;
  priority: string;
  issue_type: string;
  due_date: string | null;
  time_spent_seconds: number;
  story_points: number;
  assignee: string;
}

export default function EmployeeProjectDetail() {
  const navigate = useNavigate();
  const { id: projectKey } = useParams<{ id: string }>();
  const { user, orgId } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user || !orgId || !projectKey) { setLoading(false); return; }
    const email = user.email ?? '';
    supabase
      .from('jira_issues')
      .select('issue_key, summary, status, priority, issue_type, due_date, time_spent_seconds, story_points, assignee, project_name')
      .eq('org_id', orgId)
      .eq('project_key', projectKey)
      .then(({ data, error: err }) => {
        if (err) { setLoading(false); return; }
        const rows = (data ?? []) as any[];
        if (rows.length > 0) setProjectName(rows[0].project_name || projectKey);
        setAllIssues(rows);
        setLoading(false);
      });
  }, [user, orgId, projectKey]);

  const myIssues = allIssues.filter(i => {
    const email = user?.email ?? '';
    return (i as any).assignee_email === email || i.assignee?.toLowerCase().includes(email.split('@')[0]);
  });
  const teamIssues = allIssues;

  const totalIssues = teamIssues.length;
  const doneIssues = teamIssues.filter(i => ['Done', 'Closed', 'Resolved'].includes(i.status)).length;
  const progress = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;
  const totalHours = Math.round(teamIssues.reduce((s, i) => s + (i.time_spent_seconds || 0), 0) / 3600);
  const myHours = Math.round(myIssues.reduce((s, i) => s + (i.time_spent_seconds || 0), 0) / 3600);
  const teamSize = new Set(teamIssues.map(i => i.assignee).filter(Boolean)).size;

  const isCompleted = totalIssues > 0 && doneIssues === totalIssues;
  const statusLabel = isCompleted ? 'Completed' : progress > 70 ? 'On Track' : progress > 40 ? 'In Progress' : 'At Risk';
  const healthScore = isCompleted ? 100 : Math.max(40, Math.round(70 + (progress - 50) * 0.3));

  const filteredMyIssues = (statusFilter === 'all' ? myIssues : myIssues.filter(i => i.status === statusFilter));

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal-400" /></div>;

  return (
    <div className="max-w-[1200px] mx-auto">
      <button
        onClick={() => navigate('/app/employee/my-projects')}
        className="text-sm text-[#78716C] hover:text-[#1C1917] mb-6 flex items-center gap-1 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} /> My Projects
      </button>

      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <h1 className="text-3xl font-light text-[#1C1917] tracking-tight">{projectName || projectKey}</h1>
        <Badge className={`font-medium rounded-full ${
          statusLabel === 'On Track' || statusLabel === 'Completed' ? 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]' :
          statusLabel === 'At Risk' ? 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]' :
          'bg-[#FFFBEB] text-[#B45309] border border-[#FEF3C7]'
        }`}>{statusLabel}</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-10">
        <TabsList className="w-full justify-start border-b border-[#E7E5E4] bg-transparent h-auto p-0 space-x-8 rounded-none">
          {['Overview', 'My Tasks', 'Team'].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab.toLowerCase().replace(' ', '-')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1C1917] data-[state=active]:text-[#1C1917] data-[state=active]:shadow-none px-0 py-4 bg-transparent text-[#78716C] hover:text-[#1C1917] font-light text-sm transition-all"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-10">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="animate-in fade-in duration-300">
              <div className="grid grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'TOTAL ISSUES', value: String(totalIssues) },
                  { label: 'HOURS LOGGED', value: `${totalHours}h` },
                  { label: 'COMPLETION', value: `${progress}%` },
                  { label: 'TEAM SIZE', value: String(teamSize) },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-5 shadow-sm">
                    <div className="text-3xl font-light text-[#1C1917] mb-2">{stat.value}</div>
                    <div className="text-xs text-[#A8A29E] uppercase tracking-wide font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2">
                  <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-medium text-[#1C1917] mb-6">Your Work on This Project</h2>
                    <div className="text-2xl font-light text-[#0F766E] mb-4">{myHours}h logged</div>
                    <div className="flex justify-between text-sm text-[#57534E] mb-2 font-light">
                      <span>{myIssues.filter(i => ['Done','Closed','Resolved'].includes(i.status)).length} issues closed</span>
                      <span>{myIssues.length} total assigned</span>
                    </div>
                    <div className="w-full bg-[#F5F5F4] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#1C1917] h-2 rounded-full" style={{ width: `${myIssues.length > 0 ? Math.round((myIssues.filter(i => ['Done','Closed','Resolved'].includes(i.status)).length / myIssues.length) * 100) : 0}%` }} />
                    </div>
                    <button onClick={() => setActiveTab('my-tasks')} className="mt-4 text-sm text-[#0F766E] hover:underline font-light">
                      View My Tasks →
                    </button>
                  </div>
                </div>

                <div className="col-span-1">
                  <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-6 text-center shadow-sm">
                    <div className="text-xs text-[#A8A29E] uppercase tracking-wide mb-4">Project Health</div>
                    <div className="text-5xl font-light mb-2" style={{ color: healthScore >= 80 ? '#0F766E' : healthScore >= 60 ? '#D97706' : '#BE123C' }}>{healthScore}</div>
                    <div className="text-sm font-medium" style={{ color: healthScore >= 80 ? '#0F766E' : healthScore >= 60 ? '#D97706' : '#BE123C' }}>{statusLabel}</div>
                    <div className="mt-4 text-xs text-[#A8A29E]">{progress}% complete · {doneIssues}/{totalIssues} issues done</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MY TASKS */}
          {activeTab === 'my-tasks' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-light text-[#1C1917]">My Tasks ({myIssues.length})</h2>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] bg-white border-[#E7E5E4] font-light">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredMyIssues.length === 0 ? (
                <div className="text-center py-16 text-[#78716C] font-light">No tasks found.</div>
              ) : (
                <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl overflow-hidden shadow-sm">
                  <div className="grid grid-cols-12 bg-[#FAFAF9] p-3 text-xs font-medium text-[#A8A29E] uppercase border-b border-[#E7E5E4] tracking-wider">
                    <div className="col-span-5 pl-4">Task</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Time Logged</div>
                    <div className="col-span-1">Priority</div>
                    <div className="col-span-2 text-right pr-4">Status</div>
                  </div>
                  {filteredMyIssues.map((issue) => {
                    const isDone = ['Done','Closed','Resolved'].includes(issue.status);
                    const hrs = Math.round((issue.time_spent_seconds || 0) / 3600);
                    return (
                      <div key={issue.issue_key} className="grid grid-cols-12 p-4 items-center border-b border-[#F5F5F4] last:border-0 hover:bg-[#FAFAF9] transition-colors">
                        <div className="col-span-5 flex items-center gap-3 pl-4">
                          <div className={`w-5 h-5 border rounded flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-[#1C1917] border-[#1C1917]' : 'border-[#D6D3D1]'}`}>
                            {isDone && <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
                          </div>
                          <div>
                            <span className="text-xs font-mono text-[#0F766E] mr-1">{issue.issue_key}</span>
                            <span className={`text-sm font-light ${isDone ? 'line-through text-[#A8A29E]' : 'text-[#1C1917]'}`}>{issue.summary.length > 50 ? issue.summary.slice(0, 50) + '…' : issue.summary}</span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="bg-[#F5F5F4] text-[#57534E] text-xs px-2 py-1 rounded-md font-medium border border-[#E7E5E4]">{issue.issue_type || 'Task'}</span>
                        </div>
                        <div className="col-span-2 text-sm text-[#57534E] font-light">{hrs > 0 ? `${hrs}h` : '—'}</div>
                        <div className="col-span-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            issue.priority === 'High' || issue.priority === 'Highest' ? 'bg-rose-50 text-rose-600' :
                            issue.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                          }`}>{issue.priority || '–'}</span>
                        </div>
                        <div className="col-span-2 text-right pr-4">
                          <Badge className="bg-[#FAFAF9] text-[#57534E] border-[#E7E5E4] font-normal">{issue.status}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TEAM */}
          {activeTab === 'team' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-2xl font-light text-[#1C1917] mb-8">Team Members</h2>
              <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl overflow-hidden shadow-sm">
                {[...new Set(teamIssues.map(i => i.assignee).filter(Boolean))].map((member) => {
                  const memberIssues = teamIssues.filter(i => i.assignee === member);
                  const memberDone = memberIssues.filter(i => ['Done','Closed','Resolved'].includes(i.status)).length;
                  const memberHours = Math.round(memberIssues.reduce((s, i) => s + (i.time_spent_seconds || 0), 0) / 3600);
                  const initials = String(member).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={String(member)} className="flex items-center px-6 py-4 border-b border-[#F5F5F4] last:border-0">
                      <div className="w-9 h-9 rounded-full bg-[#F5F5F4] border border-[#E7E5E4] flex items-center justify-center text-xs font-medium text-[#57534E] mr-4">{initials}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#1C1917]">{String(member)}</div>
                        <div className="text-xs text-[#78716C] font-light">{memberIssues.length} issues · {memberDone} done · {memberHours}h</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
