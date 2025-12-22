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
  loadAsanaTasksByProject,
  loadJiraIssuesByProject,
  loadZapierWorkflowsByProject,
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
  AsanaTask,
  JiraIssue,
  ZapierWorkflow,
  HubSpotEvent,
  M365Activity,
  ProjectAnalytics,
} from '@/lib/dataService';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, GitBranch, Users, TrendingUp, Clock, CheckCircle, AlertCircle, Activity, Zap, Mail, MessageSquare, FileText, Settings } from 'lucide-react';

// Remove old interfaces - now using exported types from dataService
interface TeamMemberDisplay {
  id: string;
  name: string;
  role: string;
  avatar: string;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksDueToday: number;
  currentTask: string;
  prsPending: number;
  reviewsPending: number;
}

interface PRDisplay {
  id: string;
  title: string;
  author: string;
  status: 'pending-review' | 'approved' | 'changes-requested';
  createdAt: string;
  reviewers: string[];
}

interface CommitLog {
  sha: string;
  message: string;
  author: string;
  date: string;
}

interface WeeklyCommitDisplay {
  week: string;
  commits: number;
}

interface VelocityData {
  sprint: string;
  planned: number;
  completed: number;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingReviewer, setEditingReviewer] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editValues, setEditValues] = useState({ name: '', value: '' });

  // Dynamic data loading
  const [teamMembers, setTeamMembers] = useState<TeamMemberDisplay[]>([]);
  const [pullRequests, setPullRequests] = useState<PRDisplay[]>([]);
  const [recentCommits, setRecentCommits] = useState<CommitLog[]>([]);
  const [weeklyCommits, setWeeklyCommits] = useState<WeeklyCommitDisplay[]>([]);
  const [burndownData, setBurndownData] = useState<{ day: string; remaining: number }[]>([]);
  const [velocityData, setVelocityData] = useState<VelocityData[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await loadProjects();
        if (!mounted) return;
        const found = all.find((p) => p.id === id) ?? null;
        setProject(found);
      } catch (err) {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setMetricsLoading(true);
    loadMetrics(id)
      .then((m) => setMetrics(m))
      .catch(() => setMetrics(null))
      .finally(() => setMetricsLoading(false));
  }, [id]);

  // Load all project-specific data
  useEffect(() => {
    if (!id) return;

    const loadProjectData = async () => {
      try {
        // Load all CSV data in parallel
        const [commits, prs, members, weekly, burndown] = await Promise.all([
          loadCommitsByProject(id),
          loadPullRequestsByProject(id),
          loadTeamMembersByProject(id),
          loadWeeklyCommitsByProject(id),
          loadBurndownByProject(id),
        ]);

        // Transform commits for display (take most recent 4)
        const recentCommitsList = commits
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 4);
        setRecentCommits(recentCommitsList);

        // Transform PRs for display
        const prList = prs.map((pr) => ({
          id: pr.pr_id,
          title: pr.title,
          author: pr.author,
          status: pr.status,
          createdAt: pr.created_at,
          reviewers: pr.reviewers,
        }));
        setPullRequests(prList);

        // Transform team members for display
        const memberList = members.map((m) => ({
          id: m.member_id,
          name: m.name,
          role: m.role,
          avatar: m.avatar,
          tasksAssigned: Number(m.tasks_assigned),
          tasksCompleted: Number(m.tasks_completed),
          tasksDueToday: Number(m.tasks_due_today),
          currentTask: m.current_task,
          prsPending: Number(m.prs_pending),
          reviewsPending: Number(m.reviews_pending),
        }));
        setTeamMembers(memberList);

        // Transform weekly commits for chart
        const weeklyList = weekly.map((w) => {
          const start = new Date(w.week_start);
          const end = new Date(w.week_end);
          const monthStart = start.toLocaleDateString('en-US', { month: 'short' });
          const dayStart = start.getDate();
          const dayEnd = end.getDate();
          return {
            week: `${monthStart} ${dayStart}-${dayEnd}`,
            commits: Number(w.commits_count),
          };
        });
        setWeeklyCommits(weeklyList);

        // Transform burndown data
        const burndownList = burndown.map((b) => ({
          day: b.day,
          remaining: Number(b.remaining_tasks),
        }));
        setBurndownData(burndownList);

        // Mock velocity data (could be computed from sprint data if available)
        setVelocityData([
          { sprint: 'Sprint 1', planned: 20, completed: 18 },
          { sprint: 'Sprint 2', planned: 25, completed: 22 },
          { sprint: 'Sprint 3', planned: 30, completed: 28 },
        ]);
      } catch (error) {
        console.error('Failed to load project data:', error);
      }
    };

    loadProjectData();
  }, [id]);

  const getProgressColor = (completed: number, total: number): string => {
    const percent = (completed / total) * 100;
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 60) return 'bg-blue-500';
    if (percent >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getPRBadgeColor = (status: PRDisplay['status']): string => {
    if (status === 'approved') return 'bg-green-100 text-green-800';
    if (status === 'changes-requested') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getPRBadgeLabel = (status: PRDisplay['status']): string => {
    if (status === 'approved') return 'Approved';
    if (status === 'changes-requested') return 'Changes Requested';
    return 'Pending Review';
  };

  const handleEditTask = (memberId: string, currentTask: string) => {
    setEditingTask(memberId);
    setEditValues({ name: 'currentTask', value: currentTask });
  };

  const handleSaveTask = () => {
    if (editingTask && editValues.value) {
      setTeamMembers((prev) =>
        prev.map((m) =>
          m.id === editingTask ? { ...m, currentTask: editValues.value } : m
        )
      );
      setEditingTask(null);
    }
  };

  const handleEditReviewer = (prId: string, currentReviewers: string[]) => {
    setEditingReviewer(prId);
    setEditValues({ name: 'reviewer', value: currentReviewers.join(', ') });
  };

  const handleSaveReviewer = () => {
    if (editingReviewer && editValues.value) {
      const newReviewers = editValues.value.split(',').map((r) => r.trim());
      setPullRequests((prev) =>
        prev.map((pr) =>
          pr.id === editingReviewer ? { ...pr, reviewers: newReviewers } : pr
        )
      );
      setEditingReviewer(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{project?.title ?? 'Project'}</h1>
            <p className="text-gray-600 mt-2">{project?.category ?? 'Project'}</p>
          </div>
          <Link to="/projects" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            ← Back to Projects
          </Link>
        </div>

        {/* Overview & Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-semibold">TOTAL TEAM</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{teamMembers.length}</div>
            <div className="text-xs text-gray-600 mt-1">people working</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-semibold">TASKS COMPLETED</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {teamMembers.reduce((s, m) => s + m.tasksCompleted, 0)}/
              <span className="text-gray-600">{teamMembers.reduce((s, m) => s + m.tasksAssigned, 0)}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">across team</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-semibold">PRs PENDING</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">
              {pullRequests.filter((pr) => pr.status === 'pending-review').length}
            </div>
            <div className="text-xs text-gray-600 mt-1">code reviews</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-semibold">LAST COMMIT</div>
            {recentCommits.length > 0 ? (
              <>
                <div className="text-sm font-mono text-gray-900 mt-2">{recentCommits[0].sha.slice(0, 7)}</div>
                <div className="text-xs text-gray-600 mt-1">{recentCommits[0].author}</div>
              </>
            ) : (
              <div className="text-xs text-gray-500 mt-2">No commits yet</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Charts Section */}
            {/* Weekly Commits Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Weekly Commits</h3>
                <p className="text-xs text-gray-500">Team code activity over the last 3 weeks</p>
              </div>
              <div className="flex items-end justify-center gap-4" style={{ height: '250px' }}>
                {weeklyCommits.map((w) => {
                  const maxVal = Math.max(...weeklyCommits.map((x) => x.commits));
                  const height = (w.commits / maxVal) * 100;
                  const percentage = Math.round((w.commits / weeklyCommits.reduce((sum, x) => sum + x.commits, 0)) * 100);
                  return (
                    <div key={w.week} className="flex flex-col items-center flex-1">
                      <div className="w-full flex flex-col items-center">
                        {/* Commit count label */}
                        <div className="text-sm font-bold text-gray-900 mb-2">{w.commits}</div>
                        {/* Bar */}
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition hover:shadow-lg hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                          style={{ height: `${height + 50}px`, minHeight: '60px' }}
                          title={`${w.commits} commits (${percentage}% of total)`}
                        />
                        {/* Labels */}
                        <div className="text-xs text-gray-600 mt-3 text-center font-medium">{w.week}</div>
                        <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="mt-6 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span className="text-gray-600">Total Commits: {weeklyCommits.reduce((sum, x) => sum + x.commits, 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded" />
                  <span className="text-gray-600">Avg/Week: {Math.round(weeklyCommits.reduce((sum, x) => sum + x.commits, 0) / weeklyCommits.length)}</span>
                </div>
              </div>
            </div>

            {/* Team Members & Tasks */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Team Members</h2>
              <div className="space-y-4">
                {teamMembers.map((member) => {
                  const completionPercent = (member.tasksCompleted / member.tasksAssigned) * 100;
                  return (
                    <div key={member.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="text-3xl">{member.avatar}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{member.name}</h3>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                        <div className="text-right">
                          {member.prsPending > 0 && (
                            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                              {member.prsPending} PR{member.prsPending > 1 ? 's' : ''}
                            </span>
                          )}
                          {member.reviewsPending > 0 && (
                            <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded">
                              {member.reviewsPending} Review{member.reviewsPending > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Editable Task */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 flex items-center justify-between group">
                        <div>
                          <div className="text-xs text-gray-500 font-semibold">CURRENT TASK</div>
                          {editingTask === member.id ? (
                            <input
                              autoFocus
                              value={editValues.value}
                              onChange={(e) => setEditValues({ ...editValues, value: e.target.value })}
                              onBlur={handleSaveTask}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveTask()}
                              className="text-sm font-medium text-gray-900 border border-blue-300 rounded px-2 py-1 w-full mt-1"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900">{member.currentTask}</div>
                          )}
                        </div>
                        {editingTask !== member.id && (
                          <button
                            onClick={() => handleEditTask(member.id, member.currentTask)}
                            className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">Progress</span>
                          <span className="text-xs font-semibold text-gray-900">
                            {member.tasksCompleted}/{member.tasksAssigned}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(
                              member.tasksCompleted,
                              member.tasksAssigned
                            )}`}
                            style={{ width: `${completionPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Tasks Due Today */}
                      {member.tasksDueToday > 0 && (
                        <div className="text-xs text-orange-600 font-semibold">
                          ⚠️ {member.tasksDueToday} task{member.tasksDueToday > 1 ? 's' : ''} due today
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pull Requests */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Pull Requests & Code Reviews</h2>
              <div className="space-y-4">
                {pullRequests.map((pr) => (
                  <div key={pr.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{pr.title}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500">by {pr.author}</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${getPRBadgeColor(pr.status)}`}>
                            {getPRBadgeLabel(pr.status)}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{pr.id}</span>
                    </div>

                    {/* Editable Reviewers */}
                    <div className="text-xs text-gray-600 group flex items-center justify-between">
                      <div>
                        <span className="font-semibold">Reviewers:</span>{' '}
                        {editingReviewer === pr.id ? (
                          <input
                            autoFocus
                            value={editValues.value}
                            onChange={(e) => setEditValues({ ...editValues, value: e.target.value })}
                            onBlur={handleSaveReviewer}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveReviewer()}
                            className="text-xs border border-blue-300 rounded px-2 py-1 mt-1"
                          />
                        ) : (
                          pr.reviewers.join(', ')
                        )}
                      </div>
                      {editingReviewer !== pr.id && pr.status === 'pending-review' && (
                        <button
                          onClick={() => handleEditReviewer(pr.id, pr.reviewers)}
                          className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          Assign
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mt-2">Created {new Date(pr.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Git Commits */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Commits</h2>
              <div className="space-y-3">
                {recentCommits.map((commit, idx) => (
                  <div
                    key={commit.sha}
                    className={`border-l-2 pl-4 py-2 ${
                      idx === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{commit.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="font-mono">{commit.sha}</span> • {commit.author} •{' '}
                          {new Date(commit.date).toLocaleDateString()}
                        </div>
                      </div>
                      {idx === 0 && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-semibold">Latest</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Project Overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">PROJECT OVERVIEW</h3>
              <p className="text-sm text-gray-700 mb-4">{project?.description ?? 'No description available.'}</p>

              {project?.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">AI IMPACT METRICS</h3>
              {metricsLoading ? (
                <div className="text-sm text-gray-600">Loading…</div>
              ) : metrics ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-600">Hours Saved</div>
                    <div className="font-bold text-lg text-gray-900">{Math.round(metrics.estimatedTimeSavedHours || 0)} hrs</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Cost Saved</div>
                    <div className="font-bold text-lg text-green-600">${Math.round((metrics.estimatedCostSavedUSD ?? 0)).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Hourly Rate</div>
                    <div className="font-semibold text-gray-900">${metrics.hourlyRateUsedUSD ?? 100}/hr</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">No metrics available</div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">QUICK STATS</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Task Completion</span>
                  <span className="font-semibold">
                    {Math.round(
                      (teamMembers.reduce((s, m) => s + m.tasksCompleted, 0) /
                        teamMembers.reduce((s, m) => s + m.tasksAssigned, 0)) *
                        100
                    )}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tasks</span>
                  <span className="font-semibold">{teamMembers.reduce((s, m) => s + m.tasksAssigned, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Open PRs</span>
                  <span className="font-semibold text-yellow-600">
                    {pullRequests.filter((pr) => pr.status === 'pending-review').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Code Reviews Needed</span>
                  <span className="font-semibold text-orange-600">
                    {teamMembers.reduce((s, m) => s + m.reviewsPending, 0)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
