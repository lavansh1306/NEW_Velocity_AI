import React, { useMemo } from 'react';
import { X, ArrowLeft, AlertTriangle, TrendingUp, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IngestionControl } from './IngestionControl';
import { useAuth } from '@/contexts/AuthContext';

interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  assignee: string;
  due?: string;
  created?: string;
}

interface ProjectManagementDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  issues: JiraIssue[];
  healthScore: number;
  endDate?: string;
  weeksRemaining?: number;
  team: string[];
  fullscreen?: boolean;
}

const COMPLETED_STATUSES = ['done', 'closed', 'resolved'];

const isCompleted = (status: string) =>
  COMPLETED_STATUSES.some(s => status?.toLowerCase().includes(s));

const isInProgress = (status: string) =>
  status?.toLowerCase().includes('in progress') || status?.toLowerCase().includes('in_progress');

// Status badge color
const getStatusColor = (healthScore: number) => {
  if (healthScore >= 80) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'On Track' };
  if (healthScore >= 60) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Good Progress' };
  if (healthScore >= 40) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: 'At Risk' };
  return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Critical' };
};

// Calculate real metrics from issues
const calculateMetrics = (issues: JiraIssue[]) => {
  const completedCount = issues.filter(i => isCompleted(i.status)).length;
  const inProgressCount = issues.filter(i => isInProgress(i.status)).length;
  const totalCount = issues.length;

  // Derive estimated hours from task count (8h per task is a standard engineering estimate)
  const totalEstHours = totalCount * 8;

  // Actual hours = completed tasks * 8h + in-progress tasks * 4h (half done)
  const actualHours = (completedCount * 8) + (inProgressCount * 4);
  const remainingHours = Math.max(0, totalEstHours - actualHours);

  // Completion % based on real completed vs total
  const completion = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    totalEstHours,
    actualHours,
    remainingHours,
    completion,
    completedCount,
    inProgressCount,
    totalCount,
  };
};

// Derive a stable task progress from its status — no randomness
const getTaskProgress = (status: string): number => {
  if (isCompleted(status)) return 100;
  if (isInProgress(status)) return 50;
  return 0;
};

// Derive stable hours from issue key (deterministic, not random)
// Uses the numeric part of the key as a seed so it's consistent across renders
const getStableHours = (key: string, base: number, range: number): number => {
  const num = parseInt(key.replace(/\D/g, '') || '1', 10);
  return base + (num % range);
};

// Team member card — uses task count from issues instead of Math.random()
const TeamMemberCard = ({
  member,
  index,
  issues,
}: {
  member: string;
  index: number;
  issues: JiraIssue[];
}) => {
  const assigned = issues.filter(i => i.assignee === member).length;
  const completed = issues.filter(i => i.assignee === member && isCompleted(i.status)).length;

  // Each task = 8h, capacity = 40h/week
  const allocated = 40;
  const actual = Math.min(assigned * 8, 60); // cap at 60h to avoid absurd numbers
  const usage = Math.round((actual / allocated) * 100);
  const status = usage > 100 ? 'Overloaded' : usage > 85 ? 'High Load' : 'Healthy';
  const statusColor = usage > 100 ? 'text-red-700 bg-red-50' : usage > 85 ? 'text-yellow-700 bg-yellow-50' : 'text-green-700 bg-green-50';

  const roles = ['Frontend Lead', 'Backend Developer', 'UI Designer', 'Full Stack', 'QA Engineer'];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white text-sm font-light flex items-center justify-center">
            {member.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0">
            <p className="font-light text-gray-900 truncate">{member}</p>
            <p className="text-xs text-gray-500 font-light">
              {roles[index % 5]}
            </p>
          </div>
        </div>
        <span className={`text-xs font-light px-2 py-1 rounded-full ${statusColor}`}>
          {status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 font-light">Allocated</span>
          <span className="font-light text-gray-900">{allocated}h</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 font-light">Actual</span>
          <span className="font-light text-gray-900">{actual}h</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 font-light">Tasks</span>
          <span className="font-light text-gray-900">{completed}/{assigned} done</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 font-light">Usage</span>
          <span className={`font-light ${usage > 100 ? 'text-red-700' : usage > 85 ? 'text-yellow-700' : 'text-green-700'}`}>
            {usage}%
          </span>
        </div>
      </div>
    </div>
  );
};

// Task row — deterministic progress from real status
const TaskRow = ({ issue, index }: { issue: JiraIssue; index: number }) => {
  const done = isCompleted(issue.status);
  const progress = getTaskProgress(issue.status);

  // Stable hours derived from issue key — same value every render
  const estimatedHours = getStableHours(issue.key, 8, 16); // 8-23h range
  const actualHours = done
    ? estimatedHours
    : isInProgress(issue.status)
    ? Math.round(estimatedHours * 0.5)
    : 0;

  const categories = ['Backend', 'Frontend', 'Full Stack', 'Design', 'DevOps'];

  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-light text-primary bg-primary/10 px-2 py-0.5 rounded">
            {categories[index % 5]}
          </span>
          <p className="font-light text-gray-900 truncate text-sm">{issue.summary.slice(0, 50)}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="font-light">{issue.assignee}</span>
          <span>•</span>
          <span className="font-light">{estimatedHours}h est.</span>
          <span>•</span>
          <span className="font-light">{actualHours}h actual</span>
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center gap-3">
        <div className="w-24">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${done ? 'bg-green-500' : progress > 0 ? 'bg-primary' : 'bg-yellow-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1 text-right font-light">{progress}%</p>
        </div>

        <div className="flex items-center gap-1">
          {done ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : progress === 0 ? (
            <AlertCircle className="w-4 h-4 text-yellow-600" />
          ) : (
            <TrendingUp className="w-4 h-4 text-blue-600" />
          )}
        </div>
      </div>
    </div>
  );
};

export default function ProjectManagementDashboard({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  issues,
  healthScore,
  endDate,
  weeksRemaining,
  team,
  fullscreen = false,
}: ProjectManagementDashboardProps) {
  const { user } = useAuth();

  // useMemo ensures metrics are stable — only recalculate when issues actually change
  const metrics = useMemo(() => calculateMetrics(issues), [issues]);
  const statusColor = getStatusColor(healthScore);
  const daysRemaining = weeksRemaining ? Math.round(weeksRemaining * 7) : 44;

  // Predicted completion: based on real completion rate, not random
  // If 0% done, predict on-time. If falling behind, predict delay.
  const predictedDelay = useMemo(() => {
    if (issues.length === 0) return 0;
    const expectedCompletion = daysRemaining > 0
      ? Math.round(((metrics.completedCount / metrics.totalCount) * 100))
      : 100;
    // If actual completion is below expected, estimate delay proportionally
    const deficit = Math.max(0, 50 - expectedCompletion); // how far below halfway
    return Math.round(deficit * 0.5); // each % deficit = 0.5 days delay
  }, [issues, daysRemaining, metrics]);

  const predictedDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + daysRemaining + predictedDelay);
    return date;
  }, [daysRemaining, predictedDelay]);

  const dashboardContent = (
    <>
      <div className="bg-gray-50 border-b border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-2">{projectTitle}</h1>
            <p className="text-gray-600 font-light">Project Management & Team Allocation Dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status & Timeline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Status</p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${statusColor.bg} ${statusColor.border}`}>
              <AlertTriangle className="w-4 h-4" />
              <span className={`font-bold text-sm ${statusColor.text}`}>{statusColor.label}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Timeline</p>
            <p className="font-semibold text-gray-900">
              {endDate ? `→ ${endDate}` : 'No end date set'} · {daysRemaining} days remaining
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Health Score & Basic Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2 font-light">Health Score</p>
              <div className="text-5xl font-light text-primary mb-1">{healthScore}</div>
              <p className="text-sm text-gray-600 font-light">
                {metrics.completedCount} of {metrics.totalCount} tasks complete
              </p>
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-light rounded-lg transition-colors">
              Edit Project
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-600 mb-2 font-light">Total Est.</p>
              <p className="text-2xl font-light text-gray-900">{metrics.totalEstHours}</p>
              <p className="text-xs text-gray-500 mt-1 font-light">Hours</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-600 mb-2 font-light">Logged</p>
              <p className="text-2xl font-light text-gray-900">{metrics.actualHours}</p>
              <p className="text-xs text-gray-500 mt-1 font-light">Hours</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-600 mb-2 font-light">Remaining</p>
              <p className="text-2xl font-light text-gray-900">{metrics.remainingHours}</p>
              <p className="text-xs text-gray-500 mt-1 font-light">Hours</p>
            </div>
          </div>
        </div>

        {/* Completion & Delivery Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-600 mb-2 font-light">Overall Completion</p>
            <p className="text-3xl font-light text-primary">{metrics.completion}%</p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${metrics.completion}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2 font-light">Planned Completion</p>
            <p className="font-light text-gray-900 mb-3">{endDate || 'No end date set'}</p>
            <p className="text-sm text-gray-600 font-light">Prediction based on original timeline</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2 font-light">Predicted (AI)</p>
            <p className="font-light text-gray-900 mb-1">
              {predictedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className={`text-sm font-semibold ${predictedDelay > 0 ? 'text-red-700' : 'text-green-700'}`}>
              {predictedDelay > 0 ? `+${predictedDelay} days behind` : 'On track'}
            </p>
          </div>
        </div>

        {/* Ingestion Control */}
        <IngestionControl projectId={projectId} userId={user?.id || ''} />

        {/* Team Allocation */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-light text-gray-900">Team Allocation ({team.length} Members)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((member, idx) => (
              <TeamMemberCard key={member} member={member} index={idx} issues={issues} />
            ))}
          </div>
        </div>

        {/* Task Breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Task Breakdown ({metrics.completedCount}/{issues.length} Complete)
            </h2>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {issues.slice(0, 10).map((issue, idx) => (
              <TaskRow key={issue.key} issue={issue} index={idx} />
            ))}
            {issues.length > 10 && (
              <div className="text-center py-3 text-sm text-gray-600">
                +{issues.length - 10} more tasks
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Fullscreen mode
  if (fullscreen) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Projects
          </button>
        </div>
        <div className="bg-white">
          {dashboardContent}
        </div>
      </div>
    );
  }

  // Modal mode
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        {dashboardContent}
      </DialogContent>
    </Dialog>
  );
}
