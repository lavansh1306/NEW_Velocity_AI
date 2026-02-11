import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  loadProjects, 
  loadMetrics, 
  loadCommitsByProject, 
  loadPullRequestsByProject, 
  loadTeamMembersByProject, 
  loadWeeklyCommitsByProject, 
  loadBurndownByProject,
  loadJiraIssuesByProject,
  loadHubSpotEventsByProject,
  loadM365ActivitiesByProject,
  loadProjectAnalytics,
} from '@/lib/dataService';
import type { 
  ProjectItem, 
  Commit, 
  PullRequest, 
  TeamMember, 
  WeeklyCommit, 
  BurndownData,
  JiraIssue,
  HubSpotEvent,
  M365Activity,
  ProjectAnalytics,
} from '@/lib/dataService';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, GitBranch, Users, TrendingUp, Clock, CheckCircle, AlertCircle, Activity, Mail, MessageSquare, FileText, Settings, ArrowLeft } from 'lucide-react';
import CapacityLedgerTab from '@/components/demo2/CapacityLedgerTab';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ProjectDetailNew() {
  const { id } = useParams();
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  
  // All data states
  const [commits, setCommits] = useState<Commit[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [weeklyCommits, setWeeklyCommits] = useState<WeeklyCommit[]>([]);
  const [burndownData, setBurndownData] = useState<BurndownData[]>([]);
  
  const [jiraIssues, setJiraIssues] = useState<JiraIssue[]>([]);
  const [hubspotEvents, setHubspotEvents] = useState<HubSpotEvent[]>([]);
  const [m365Activities, setM365Activities] = useState<M365Activity[]>([]);
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'github' | 'tasks' | 'issues' | 'automations' | 'integrations' | 'ledger'>('overview');

  useEffect(() => {
    if (!id) return;
    
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Load project info
        const projects = await loadProjects();
        const found = projects.find((p) => p.id === id);
        setProject(found || null);
        
        // Load metrics
        const metricsData = await loadMetrics(id);
        setMetrics(metricsData);
        
        // Load ALL data sources in parallel
        const [
          commitsData,
          prsData,
          membersData,
          weeklyData,
          burndownDataRaw,
          asanaData,
          jiraData,
          hubspotData,
          m365Data,
          analyticsData,
        ] = await Promise.all([
          loadCommitsByProject(id),
          loadPullRequestsByProject(id),
          loadTeamMembersByProject(id),
          loadWeeklyCommitsByProject(id),
          loadBurndownByProject(id),
          loadJiraIssuesByProject(id),
          loadHubSpotEventsByProject(id),
          loadM365ActivitiesByProject(id),
          loadProjectAnalytics(id),
        ]);
        
        setCommits(commitsData);
        setPullRequests(prsData);
        setTeamMembers(membersData);
        setWeeklyCommits(weeklyData);
        setBurndownData(burndownDataRaw);
        setJiraIssues(jiraData);
        setHubspotEvents(hubspotData);
        setM365Activities(m365Data);
        setProjectAnalytics(analyticsData);
        
      } catch (error) {
        console.error('Failed to load project data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading comprehensive project data...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          <Link to="/use-cases" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // Calculate comprehensive metrics
  const totalCommits = commits.length;
  const totalPRs = pullRequests.length;
  const totalJiraIssues = jiraIssues.length;
  const totalHubSpotEvents = hubspotEvents.length;
  const totalM365Activities = m365Activities.length;
  
  const jiraAutomationRate = jiraIssues.length > 0
    ? ((jiraIssues.filter(i => i.is_automation).length / jiraIssues.length) * 100).toFixed(1)
    : '0';
  
  const hubspotWorkflowRate = hubspotEvents.length > 0
    ? ((hubspotEvents.filter(e => e.source === 'workflow').length / hubspotEvents.length) * 100).toFixed(1)
    : '0';
  
  const m365ServiceRate = m365Activities.length > 0
    ? ((m365Activities.filter(a => a.user_type === 'service').length / m365Activities.length) * 100).toFixed(1)
    : '0';

  // Prepare chart data
  const weeklyCommitsChartData = weeklyCommits.map(w => ({
    week: new Date(w.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    commits: w.commits_count,
  }));

  const aiToolUsageData = projectAnalytics?.ai_tool_usage.map(tool => ({
    name: tool.tool,
    hours: tool.hours,
  })) || [];

  const integrationSavingsData = projectAnalytics ? [
    { name: 'HubSpot', hours: projectAnalytics.integration_savings.hubspot },
    { name: 'Asana', hours: projectAnalytics.integration_savings.asana },
    { name: 'Microsoft365', hours: projectAnalytics.integration_savings.microsoft365 },
  ] : [];

  const timeLogsChartData = projectAnalytics?.time_logs.map(log => ({
    date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours: log.hours_logged,
  })) || [];

  const jiraTicketDistribution = projectAnalytics ? [
    { name: 'Bugs', value: projectAnalytics.jira_tickets.filter(t => t.type === 'bug').length },
    { name: 'Non-Bugs', value: projectAnalytics.jira_tickets.filter(t => t.type === 'non-bug').length },
  ] : [];

  const burndownChartData = burndownData.map(b => ({
    day: b.day,
    remaining: b.remaining_tasks,
    total: b.total_tasks,
  }));

  // Activity Timeline - unified view of all events
  const allActivities = [
    ...commits.map(c => ({ id: `commit-${c.sha}`, type: 'commit', time: c.date, description: `Commit: ${c.message}`, source: 'GitHub', actor: c.author })),
    ...asanaTasks.map(t => ({ id: `asana-${t.gid}`, type: 'task', time: t.created_at, description: `${t.action}: ${t.task_name || 'Task'}`, source: 'Asana', actor: t.created_by })),
    ...jiraIssues.map(i => ({ id: `jira-${i.issue_id}`, type: 'issue', time: i.created_at, description: `${i.event_type}: ${i.issue_key} - ${i.summary || 'Issue'}`, source: 'Jira', actor: i.actor })),
    ...hubspotEvents.map(h => ({ id: `hubspot-${h.event_id}`, type: 'hubspot', time: h.occurred_at, description: `${h.object_type} ${h.event_action}`, source: 'HubSpot', actor: h.source })),
    ...m365Activities.map(m => ({ id: `m365-${m.activity_id}`, type: 'm365', time: m.activity_time, description: `${m.workload}: ${m.activity_type}`, source: 'M365', actor: m.user_type })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 50);

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'GitHub': 'bg-gray-800 text-white',
      'Asana': 'bg-pink-600 text-white',
      'Jira': 'bg-blue-600 text-white',
      'HubSpot': 'bg-orange-600 text-white',
      'M365': 'bg-blue-500 text-white',
    };
    return colors[source] || 'bg-gray-500 text-white';
  };

  const getSourceIcon = (source: string) => {
    const icons: Record<string, any> = {
      'GitHub': GitBranch,
      'Asana': CheckCircle,
      'Jira': AlertCircle,
      'HubSpot': Mail,
      'M365': MessageSquare,
    };
    const Icon = icons[source] || Activity;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-full mx-auto px-4 md:px-6 py-6">
          <Link to="/" className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-600 mt-2">{project.category}</p>
              <div className="flex gap-2 mt-3">
                {project.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-full mx-auto px-4 md:px-6">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'tasks', label: 'Team & Tasks', icon: CheckCircle },
              { id: 'ledger', label: 'Capacity Ledger', icon: Clock },
              { id: 'github', label: 'Development', icon: GitBranch },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-full mx-auto px-4 md:px-6 py-8">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Project Health - Key Metrics */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-6">Project Health Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5" />
                    <p className="text-sm opacity-90">Timeline Status</p>
                  </div>
                  {projectAnalytics && (
                    <div>
                      <p className="text-3xl font-bold">{projectAnalytics.actual_hours}/{projectAnalytics.planned_hours}h</p>
                      <p className="text-sm opacity-75 mt-1">
                        {((projectAnalytics.actual_hours / projectAnalytics.planned_hours) * 100).toFixed(0)}% Complete
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <p className="text-sm opacity-90">Tasks Progress</p>
                  </div>
                  <p className="text-3xl font-bold">{totalAsanaTasks + totalJiraIssues}</p>
                  <p className="text-sm opacity-75 mt-1">Total Tasks Tracked</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5" />
                    <p className="text-sm opacity-90">Team Size</p>
                  </div>
                  <p className="text-3xl font-bold">{teamMembers.length}</p>
                  <p className="text-sm opacity-75 mt-1">Active Members</p>
                </div>
              </div>
            </div>

            {/* Sprint Progress & Burndown */}
            {burndownChartData.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sprint Progress</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={burndownChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="remaining" stroke="#ef4444" strokeWidth={2} name="Remaining Tasks" />
                    <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} name="Total Tasks" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent Activity Feed */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity Feed</h3>
              <p className="text-sm text-gray-600 mb-4">Latest updates from all team activities</p>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {allActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors border">
                    <div className={`p-2 rounded-lg ${getSourceColor(activity.source)}`}>
                      {getSourceIcon(activity.source)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSourceColor(activity.source)}`}>
                          {activity.source}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.time).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-600 mt-1">by {activity.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CAPACITY LEDGER TAB */}
        {activeTab === 'ledger' && (
          <div className="space-y-8">
            <CapacityLedgerTab
              projectId={id}
              asanaTasks={asanaTasks}
              teamMembers={teamMembers}
              projectAnalytics={projectAnalytics}
            />
          </div>
        )}

        {/* GITHUB TAB */}
        {activeTab === 'github' && (
          <div className="space-y-8">
            {/* Weekly Commits Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Commits</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyCommitsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="commits" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Burndown Chart */}
            {burndownChartData.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Sprint Burndown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={burndownChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="remaining" stroke="#ef4444" strokeWidth={2} name="Remaining Tasks" />
                    <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} name="Total Tasks" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Team Members */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Team Members</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((member) => (
                  <div key={member.member_id} className="flex items-center gap-3 p-4 border rounded-lg">
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.role}</p>
                      <div className="flex gap-2 mt-1 text-xs text-gray-500">
                        <span>{member.tasks_completed}/{member.tasks_assigned} tasks</span>
                        <span>•</span>
                        <span>{member.prs_pending} PRs</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pull Requests */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pull Requests</h3>
              <div className="space-y-3">
                {pullRequests.map((pr) => (
                  <div key={pr.pr_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{pr.title}</p>
                      <p className="text-sm text-gray-600 mt-1">by {pr.author} • {new Date(pr.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      pr.status === 'approved' ? 'bg-green-100 text-green-800' :
                      pr.status === 'changes-requested' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pr.status.replace('-', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Commits */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Commits</h3>
              <div className="space-y-3">
                {commits.slice(0, 10).map((commit) => (
                  <div key={commit.sha} className="flex items-start gap-3 p-3 border rounded-lg">
                    <GitBranch className="w-5 h-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{commit.message}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{commit.author}</span>
                        <span>•</span>
                        <span>{new Date(commit.date).toLocaleString()}</span>
                        {commit.files_changed && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">+{commit.additions}</span>
                            <span className="text-red-600">-{commit.deletions}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TEAM & TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="space-y-8">
            {/* Team Members Overview */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Team Members ({teamMembers.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((member) => (
                  <div key={member.member_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={member.avatar} alt={member.name} className="w-14 h-14 rounded-full border-2 border-gray-200" />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Tasks Assigned:</span>
                        <span className="font-bold text-gray-900">{member.tasks_assigned}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Tasks Completed:</span>
                        <span className="font-bold text-green-600">{member.tasks_completed}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Pending PRs:</span>
                        <span className="font-bold text-orange-600">{member.prs_pending}</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Completion Rate</span>
                          <span>{member.tasks_assigned > 0 ? Math.round((member.tasks_completed / member.tasks_assigned) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${member.tasks_assigned > 0 ? (member.tasks_completed / member.tasks_assigned) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Asana Tasks */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Asana Tasks ({totalAsanaTasks})</h3>
                  <p className="text-sm text-gray-600 mt-1">Track all tasks and their assignments</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Automation Rate</p>
                  <p className="text-2xl font-bold text-pink-600">{asanaAutomationRate}%</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {asanaTasks.map((task) => (
                  <div key={task.gid} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-gray-900">{task.task_name || 'Unnamed Task'}</p>
                          {task.is_automation && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">Automated</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Status:</span>
                            <span className="font-medium text-gray-900">{task.action}</span>
                          </div>
                          {task.assignee && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Assignee:</span>
                              <span className="font-medium text-gray-900">{task.assignee}</span>
                            </div>
                          )}
                          {task.status && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Progress:</span>
                              <span className={`font-medium ${
                                task.status.toLowerCase().includes('done') || task.status.toLowerCase().includes('complete') 
                                  ? 'text-green-600' 
                                  : 'text-orange-600'
                              }`}>{task.status}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Created:</span>
                            <span className="text-xs text-gray-600">{new Date(task.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Jira Issues */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Jira Issues ({totalJiraIssues})</h3>
                  <p className="text-sm text-gray-600 mt-1">Bug tracking and issue management</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Automation Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{jiraAutomationRate}%</p>
                </div>
              </div>

              {/* Issue Distribution */}
              {jiraTicketDistribution.length > 0 && (
                <div className="mb-6 flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <ResponsiveContainer width={200} height={150}>
                      <PieChart>
                        <Pie
                          data={jiraTicketDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {jiraTicketDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#10b981'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 bg-red-50">
                      <p className="text-3xl font-bold text-red-600">{jiraTicketDistribution[0]?.value || 0}</p>
                      <p className="text-sm text-gray-600 mt-1">Bugs</p>
                    </div>
                    <div className="border rounded-lg p-4 bg-green-50">
                      <p className="text-3xl font-bold text-green-600">{jiraTicketDistribution[1]?.value || 0}</p>
                      <p className="text-sm text-gray-600 mt-1">Features/Tasks</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {jiraIssues.map((issue) => (
                  <div key={issue.issue_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{issue.issue_key}</span>
                          <p className="font-semibold text-gray-900">{issue.summary || 'No summary'}</p>
                          {issue.is_automation && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">Auto</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Type:</span>
                            <span className="font-medium text-gray-900">{issue.event_type}</span>
                          </div>
                          {issue.severity && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Severity:</span>
                              <span className={`font-medium ${
                                issue.severity === 'Critical' || issue.severity === 'High' 
                                  ? 'text-red-600' 
                                  : issue.severity === 'Medium'
                                  ? 'text-orange-600'
                                  : 'text-gray-600'
                              }`}>{issue.severity}</span>
                            </div>
                          )}
                          {issue.from_status && issue.to_status && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Transition:</span>
                              <span className="text-xs text-gray-900">{issue.from_status} → {issue.to_status}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Updated by:</span>
                            <span className="text-xs text-gray-600">{issue.actor}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
