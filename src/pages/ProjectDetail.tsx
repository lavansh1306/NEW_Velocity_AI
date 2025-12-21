import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadProjects, loadMetrics } from '@/lib/dataService';
import type { ProjectItem } from '@/lib/dataService';

interface TeamMember {
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

interface PR {
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

interface WeeklyCommit {
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

  // Hardcoded team members with realistic data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Doe',
      role: 'Lead Engineer',
      avatar: '👨‍💼',
      tasksAssigned: 12,
      tasksCompleted: 8,
      tasksDueToday: 3,
      currentTask: 'Integrate inventory sync with ERP',
      prsPending: 2,
      reviewsPending: 1,
    },
    {
      id: '2',
      name: 'Alice Smith',
      role: 'Backend Engineer',
      avatar: '👩‍💻',
      tasksAssigned: 10,
      tasksCompleted: 7,
      tasksDueToday: 2,
      currentTask: 'Add retry logic to webhook handler',
      prsPending: 1,
      reviewsPending: 0,
    },
    {
      id: '3',
      name: 'Bob Johnson',
      role: 'Frontend Engineer',
      avatar: '👨‍💻',
      tasksAssigned: 14,
      tasksCompleted: 11,
      tasksDueToday: 1,
      currentTask: 'Build inventory dashboard UI',
      prsPending: 0,
      reviewsPending: 2,
    },
    {
      id: '4',
      name: 'Carol Davis',
      role: 'QA Engineer',
      avatar: '👩‍🔬',
      tasksAssigned: 16,
      tasksCompleted: 13,
      tasksDueToday: 2,
      currentTask: 'Test sync module for edge cases',
      prsPending: 0,
      reviewsPending: 0,
    },
    {
      id: '5',
      name: 'David Lee',
      role: 'DevOps Engineer',
      avatar: '👨‍🔧',
      tasksAssigned: 8,
      tasksCompleted: 6,
      tasksDueToday: 1,
      currentTask: 'Deploy staging environment',
      prsPending: 1,
      reviewsPending: 0,
    },
  ]);

  // Pull requests and code reviews
  const [pullRequests, setPullRequests] = useState<PR[]>([
    {
      id: 'PR-1',
      title: 'Fix: handle null product ids in sync worker',
      author: 'John Doe',
      status: 'pending-review',
      createdAt: '2025-12-18T14:23:00Z',
      reviewers: ['Alice Smith', 'Bob Johnson'],
    },
    {
      id: 'PR-2',
      title: 'Feat: add backoff and retry for webhook',
      author: 'Alice Smith',
      status: 'approved',
      createdAt: '2025-12-17T09:15:00Z',
      reviewers: ['John Doe'],
    },
    {
      id: 'PR-3',
      title: 'UI: Inventory dashboard redesign',
      author: 'Bob Johnson',
      status: 'changes-requested',
      createdAt: '2025-12-16T11:30:00Z',
      reviewers: ['Carol Davis'],
    },
    {
      id: 'PR-4',
      title: 'Infra: Update CI/CD pipeline',
      author: 'David Lee',
      status: 'pending-review',
      createdAt: '2025-12-15T16:45:00Z',
      reviewers: ['John Doe'],
    },
  ]);

  // Recent commits
  const recentCommits: CommitLog[] = [
    {
      sha: 'a1b2c3d',
      message: 'Fix: handle null product ids in sync worker',
      author: 'John Doe',
      date: '2025-12-18T14:23:00Z',
    },
    {
      sha: 'd4e5f6a',
      message: 'Feat: add backoff and retry for webhook',
      author: 'Alice Smith',
      date: '2025-12-17T09:15:00Z',
    },
    {
      sha: 'b7c8d9e',
      message: 'Chore: bump deps and update CI',
      author: 'David Lee',
      date: '2025-12-16T08:00:00Z',
    },
    {
      sha: 'c8d9e0f',
      message: 'Feat: inventory dashboard v1',
      author: 'Bob Johnson',
      date: '2025-12-15T15:30:00Z',
    },
  ];

  // Weekly commit data for chart
  const weeklyCommits: WeeklyCommit[] = [
    { week: 'Dec 2-8', commits: 4 },
    { week: 'Dec 9-15', commits: 7 },
    { week: 'Dec 16-22', commits: 9 },
  ];

  // Velocity trend data
  const velocityData: VelocityData[] = [
    { sprint: 'Sprint 1', planned: 20, completed: 18 },
    { sprint: 'Sprint 2', planned: 25, completed: 22 },
    { sprint: 'Sprint 3', planned: 30, completed: 28 },
  ];

  // Burndown data (days vs tasks remaining)
  const burndownData = [
    { day: 'Day 1', remaining: 30 },
    { day: 'Day 3', remaining: 25 },
    { day: 'Day 5', remaining: 18 },
    { day: 'Day 7', remaining: 12 },
    { day: 'Day 9', remaining: 6 },
    { day: 'Day 10', remaining: 3 },
  ];

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

  const getProgressColor = (completed: number, total: number): string => {
    const percent = (completed / total) * 100;
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 60) return 'bg-blue-500';
    if (percent >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getPRBadgeColor = (status: PR['status']): string => {
    if (status === 'approved') return 'bg-green-100 text-green-800';
    if (status === 'changes-requested') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getPRBadgeLabel = (status: PR['status']): string => {
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
            <div className="text-sm font-mono text-gray-900 mt-2">{recentCommits[0].sha.slice(0, 7)}</div>
            <div className="text-xs text-gray-600 mt-1">{recentCommits[0].author}</div>
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
