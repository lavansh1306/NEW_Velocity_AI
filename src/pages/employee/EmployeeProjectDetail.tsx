import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Check,
  AlertTriangle,
  Flag,
  Clock,
  Users,
  CalendarDays,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployeeProjectDetailDB } from '@/hooks/useEmployeeProjectsDB';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];

type Tab = 'overview' | 'my-work' | 'plan';

// ─── UrgencyBadge ─────────────────────────────────────────────────────────────

function UrgencyBadge({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.ceil((new Date(dueDate).getTime() - today.getTime()) / 86400000);
  if (days < 0) return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#BE123C] border border-[#FECDD3]">Overdue</span>;
  if (days === 0) return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#BE123C] border border-[#FECDD3]">Due today</span>;
  if (days <= 3) return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">Due in {days}d</span>;
  return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD]">Due in {days}d</span>;
}

// ─── TaskCard (My Work tab) ───────────────────────────────────────────────────

function TaskCard({
  task,
  onStatusChange,
  onMarkComplete,
  onAddBlocker,
  onResolveBlocker,
  isUpdating,
}: {
  task: any;
  onStatusChange: (taskId: string, status: string) => void;
  onMarkComplete: (taskId: string) => void;
  onAddBlocker: (taskId: string, desc: string, user?: string) => void;
  onResolveBlocker: (taskId: string, blockerId: string) => void;
  isUpdating: string | null;
}) {
  const [showBlockerForm, setShowBlockerForm] = useState(false);
  const [blockerDesc, setBlockerDesc] = useState('');
  const [blockerUser, setBlockerUser] = useState('');
  const isDone = /^(completed|done)$/i.test(task.status || '');
  const isLoading = isUpdating === task.id;

  const submitBlocker = () => {
    if (!blockerDesc.trim()) return;
    onAddBlocker(task.id, blockerDesc.trim(), blockerUser.trim() || undefined);
    setBlockerDesc('');
    setBlockerUser('');
    setShowBlockerForm(false);
  };

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${task.is_blocked ? 'border-[#FECDD3]' : 'border-[#E7E5E4]'} shadow-[0_1px_4px_rgba(0,0,0,0.04)]`}>
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Complete checkbox */}
          <button
            onClick={() => !isDone && onMarkComplete(task.id)}
            disabled={isDone || isLoading}
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isDone
                ? 'bg-[#0F766E] border-[#0F766E]'
                : 'border-[#D6D3D1] hover:border-[#0F766E]'
            } disabled:cursor-not-allowed`}
          >
            {isDone && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            {isLoading && !isDone && <Loader2 className="w-3 h-3 text-[#D6D3D1] animate-spin" />}
          </button>

          {/* Task name + badges */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-[#A8A29E]' : task.is_blocked ? 'text-[#BE123C]' : 'text-[#1C1917]'}`}>
              {task.name}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {task.due_date && (
                <span className="text-[11px] text-[#78716C] font-light flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(task.due_date), 'MMM d')}
                </span>
              )}
              <UrgencyBadge dueDate={task.due_date} />
              {task.estimated_hours > 0 && (
                <span className="text-[11px] text-[#A8A29E] font-light">{task.estimated_hours}h est.</span>
              )}
            </div>
          </div>

          {/* Status + actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isDone && (
              <>
                <Select
                  value={task.status || 'Not Started'}
                  onValueChange={(val) => onStatusChange(task.id, val)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-7 text-xs w-[120px] border-[#E7E5E4] bg-white font-light focus:ring-[#2DD4BF]/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E7E5E4]">
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  onClick={() => setShowBlockerForm(v => !v)}
                  title="Flag blocker"
                  className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors ${
                    showBlockerForm
                      ? 'bg-[#FEF2F2] border-[#FECDD3] text-[#BE123C]'
                      : 'border-[#E7E5E4] text-[#A8A29E] hover:text-[#BE123C] hover:border-[#FECDD3]'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Active blockers */}
        {(task.active_blockers || []).length > 0 && (
          <div className="mt-3 space-y-2">
            {task.active_blockers.map((b: any) => (
              <div key={b.id} className="flex items-start gap-2 bg-[#FEF2F2] border border-[#FECDD3] rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#BE123C] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#BE123C] font-medium">{b.blocker_description}</p>
                  {b.blocking_user_name && (
                    <p className="text-[11px] text-[#BE123C]/70 font-light mt-0.5">Waiting on: {b.blocking_user_name}</p>
                  )}
                </div>
                <button
                  onClick={() => onResolveBlocker(task.id, b.id)}
                  className="flex-shrink-0 text-[11px] text-[#0F766E] hover:underline font-medium"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add blocker inline form */}
        {showBlockerForm && (
          <div className="mt-3 border border-[#E7E5E4] rounded-lg p-3 bg-[#FAFAF9] space-y-2">
            <p className="text-xs font-medium text-[#1C1917] mb-2">Describe the blocker</p>
            <input
              value={blockerDesc}
              onChange={e => setBlockerDesc(e.target.value)}
              placeholder="What's blocking this task?"
              className="w-full text-xs border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#2DD4BF]/50"
            />
            <input
              value={blockerUser}
              onChange={e => setBlockerUser(e.target.value)}
              placeholder="Waiting on (optional)"
              className="w-full text-xs border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#2DD4BF]/50"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowBlockerForm(false); setBlockerDesc(''); setBlockerUser(''); }}
                className="text-xs text-[#78716C] hover:text-[#1C1917] px-3 py-1.5 rounded-lg border border-[#E7E5E4] bg-white"
              >
                Cancel
              </button>
              <button
                onClick={submitBlocker}
                disabled={!blockerDesc.trim()}
                className="text-xs font-medium bg-[#FEF2F2] text-[#BE123C] border border-[#FECDD3] px-3 py-1.5 rounded-lg hover:bg-[#FECDD3] transition-colors disabled:opacity-40"
              >
                Flag Blocker
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TaskGroup (My Work tab section) ─────────────────────────────────────────

const GROUP_CONFIG: Record<string, { label: string; accent: string; icon: React.ReactNode; empty: string }> = {
  overdue:    { label: 'Overdue',    accent: 'text-[#BE123C]',  icon: <AlertTriangle className="w-4 h-4 text-[#BE123C]" />, empty: 'No overdue tasks' },
  urgent:     { label: 'Urgent',     accent: 'text-[#D97706]',  icon: <Clock className="w-4 h-4 text-[#D97706]" />,         empty: 'No urgent tasks' },
  this_week:  { label: 'This Week',  accent: 'text-[#0369A1]',  icon: <CalendarDays className="w-4 h-4 text-[#0369A1]" />, empty: 'Nothing due this week' },
  later:      { label: 'Later',      accent: 'text-[#57534E]',  icon: <Circle className="w-4 h-4 text-[#57534E]" />,        empty: 'No upcoming tasks' },
  completed:  { label: 'Completed',  accent: 'text-[#0F766E]',  icon: <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />, empty: 'No completed tasks yet' },
};

function TaskGroup({
  groupKey,
  tasks,
  taskProps,
}: {
  groupKey: string;
  tasks: any[];
  taskProps: Omit<Parameters<typeof TaskCard>[0], 'task'>;
}) {
  const [collapsed, setCollapsed] = useState(groupKey === 'completed');
  const cfg = GROUP_CONFIG[groupKey];

  return (
    <div>
      <button
        onClick={() => setCollapsed(v => !v)}
        className="flex items-center gap-2 mb-3 w-full text-left group"
      >
        {cfg.icon}
        <span className={`text-sm font-semibold ${cfg.accent}`}>{cfg.label}</span>
        <span className="text-xs text-[#A8A29E] font-light">({tasks.length})</span>
        <ChevronRight className={`w-4 h-4 text-[#D6D3D1] ml-auto transition-transform ${collapsed ? '' : 'rotate-90'}`} />
      </button>

      {!collapsed && (
        <div className="space-y-2 mb-6">
          {tasks.length === 0 ? (
            <p className="text-xs text-[#A8A29E] pl-6 pb-4 font-light">{cfg.empty}</p>
          ) : (
            tasks.map((task: any) => (
              <TaskCard key={task.id} task={task} {...taskProps} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmployeeProjectDetailScreen() {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  const { projectData, isLoading, refresh } = useEmployeeProjectDetailDB(projectId);

  // ── API Helpers ────────────────────────────────────────────────────────────

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingTask(taskId);
    try {
      const res = await fetch(`/api/employee/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Task updated');
      await refresh();
    } catch (err: any) {
      toast.error('Failed to update task', { description: err.message });
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    setUpdatingTask(taskId);
    try {
      const res = await fetch(`/api/employee/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Task completed');
      await refresh();
    } catch (err: any) {
      toast.error('Failed to complete task', { description: err.message });
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleAddBlocker = async (taskId: string, desc: string, blockerUser?: string) => {
    setUpdatingTask(taskId);
    try {
      const res = await fetch(`/api/employee/tasks/${taskId}/blockers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ blocker_description: desc, blocking_user_name: blockerUser }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Blocker flagged');
      await refresh();
    } catch (err: any) {
      toast.error('Failed to add blocker', { description: err.message });
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleResolveBlocker = async (taskId: string, blockerId: string) => {
    try {
      const res = await fetch(`/api/employee/tasks/${taskId}/blockers/${blockerId}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Blocker resolved');
      await refresh();
    } catch (err: any) {
      toast.error('Failed to resolve blocker', { description: err.message });
    }
  };

  // ── Loading / no data ──────────────────────────────────────────────────────

  if (isLoading || !projectData) {
    return (
      <div className="max-w-[1200px] mx-auto pb-10 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#2DD4BF]/30 border-t-[#2DD4BF] rounded-full animate-spin" />
      </div>
    );
  }

  const { project, stats, overviewTasks, groupedTasks, teamCapacity, timeline, myWork, _isInternal } = projectData;

  const taskCardProps = {
    onStatusChange: handleStatusChange,
    onMarkComplete: handleMarkComplete,
    onAddBlocker: handleAddBlocker,
    onResolveBlocker: handleResolveBlocker,
    isUpdating: updatingTask,
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'my-work', label: 'My Work' },
    { key: 'plan', label: 'Plan' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      {/* Back */}
      <button
        onClick={() => navigate('/app/employee/my-projects')}
        className="text-sm text-[#78716C] hover:text-[#1C1917] mb-6 flex items-center gap-1 transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" /> My Projects
      </button>

      {/* Title */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-[#1C1917] tracking-tight">{project.name}</h1>
          <p className="text-sm text-[#78716C] mt-1 font-light">{project.dates}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-[#E7E5E4] mb-10">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-4 text-sm font-light border-b-2 transition-all -mb-px ${
              activeTab === t.key
                ? 'border-[#1C1917] text-[#1C1917] font-medium'
                : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="animate-in fade-in duration-300">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map((stat: any, i: number) => (
              <div key={i} className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="text-3xl font-light text-[#1C1917] mb-1">{stat.value}</div>
                <div className="text-xs text-[#78716C] font-light uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* My contribution + recent tasks */}
            <div className="col-span-2 space-y-6">
              {/* Capacity card */}
              <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h2 className="text-base font-medium text-[#1C1917] mb-4">Your Contribution</h2>
                <div className="flex justify-between text-sm text-[#57534E] mb-2 font-light">
                  <span>{myWork.logged}h logged</span>
                  <span>{myWork.estimated}h estimated</span>
                </div>
                <div className="w-full bg-[#F5F5F4] h-2 rounded-full mb-4 overflow-hidden">
                  <div
                    className="bg-[#0F766E] h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, myWork.percent)}%` }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-light text-[#0F766E]">{myWork.percent}%</div>
                  <div className="text-xs text-[#78716C] font-light">capacity utilized</div>
                </div>
              </div>

              {/* Recent tasks */}
              <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-base font-medium text-[#1C1917]">Recent Tasks</h2>
                  <button
                    onClick={() => setActiveTab('my-work')}
                    className="text-xs text-[#0F766E] hover:underline font-light"
                  >
                    View all →
                  </button>
                </div>
                <div className="space-y-1">
                  {overviewTasks.map((task: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-[#F5F5F4] last:border-0">
                      <span className={`text-sm font-light ${/completed|done/i.test(task.status) ? 'line-through text-[#A8A29E]' : 'text-[#1C1917]'}`}>
                        {task.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border font-light ${/completed|done/i.test(task.status) ? 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]' : 'bg-white text-[#78716C] border-[#E7E5E4]'}`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                  {overviewTasks.length === 0 && (
                    <p className="text-xs text-[#A8A29E] font-light py-4 text-center">No tasks assigned yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="col-span-1 space-y-6">
              {/* Quick actions */}
              <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h3 className="text-sm font-medium text-[#1C1917] mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('my-work')}
                    className="w-full text-sm text-left px-3 py-2.5 rounded-lg border border-[#E7E5E4] text-[#1C1917] font-light hover:bg-[#FAFAF9] transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Update task status
                  </button>
                  <button
                    onClick={() => setActiveTab('plan')}
                    className="w-full text-sm text-left px-3 py-2.5 rounded-lg border border-[#E7E5E4] text-[#1C1917] font-light hover:bg-[#FAFAF9] transition-colors flex items-center gap-2"
                  >
                    <Users className="w-4 h-4 text-[#78716C]" /> View team capacity
                  </button>
                </div>
              </div>

              {/* Project health indicator */}
              {(() => {
                const total = stats.find((s: any) => s.label === 'Completion')?.value || '0%';
                const pct = parseInt(total);
                const isAtRisk = pct < 50 && stats.find((s: any) => s.label === 'Active Tasks')?.value !== '0';
                return (
                  <div className={`border rounded-xl p-5 ${isAtRisk ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-[#F0FDFA] border-[#CCFBF1]'}`}>
                    <div className={`text-3xl font-light mb-1 ${isAtRisk ? 'text-[#D97706]' : 'text-[#0F766E]'}`}>{total}</div>
                    <div className={`text-xs font-light ${isAtRisk ? 'text-[#92400E]' : 'text-[#0F766E]'}`}>
                      {isAtRisk ? 'Needs attention' : 'On track'}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── My Work tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'my-work' && (
        <div className="animate-in fade-in duration-300">
          {_isInternal && groupedTasks ? (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-6 mb-8 px-1 text-sm text-[#78716C] font-light">
                {groupedTasks.overdue.length > 0 && (
                  <span className="text-[#BE123C] font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {groupedTasks.overdue.length} overdue
                  </span>
                )}
                {groupedTasks.urgent.length > 0 && (
                  <span className="text-[#D97706] font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {groupedTasks.urgent.length} urgent
                  </span>
                )}
                <span>{groupedTasks.completed.length} completed</span>
              </div>

              {/* Task groups */}
              {(['overdue', 'urgent', 'this_week', 'later', 'completed'] as const).map(grp => (
                groupedTasks[grp].length > 0 && (
                  <TaskGroup
                    key={grp}
                    groupKey={grp}
                    tasks={groupedTasks[grp]}
                    taskProps={taskCardProps}
                  />
                )
              ))}

              {/* All groups empty */}
              {Object.values(groupedTasks).every((g: any) => g.length === 0) && (
                <div className="text-center py-16 text-[#A8A29E]">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-[#0F766E] opacity-50" />
                  <p className="text-sm font-light">No tasks assigned to you on this project.</p>
                </div>
              )}
            </>
          ) : (
            // Jira fallback — simple read-only list
            <div className="space-y-2">
              {projectData.myTasks.map((task: any) => (
                <div key={task.id} className="bg-white border border-[#E7E5E4] rounded-xl p-4 flex items-center justify-between">
                  <span className={`text-sm font-light ${/completed|done/i.test(task.status) ? 'line-through text-[#A8A29E]' : 'text-[#1C1917]'}`}>
                    {task.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded border border-[#E7E5E4] text-[#78716C] font-light">{task.status}</span>
                </div>
              ))}
              {projectData.myTasks.length === 0 && (
                <div className="text-center py-16 text-[#A8A29E]">
                  <p className="text-sm font-light">No issues assigned to you.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Plan tab (Team + Timeline) ───────────────────────────────────────── */}
      {activeTab === 'plan' && (
        <div className="animate-in fade-in duration-300 space-y-10">
          {/* Team capacity */}
          {teamCapacity && teamCapacity.length > 0 ? (
            <section>
              <h2 className="text-base font-medium text-[#1C1917] mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#78716C]" /> Team Capacity
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {teamCapacity.map((member: any) => {
                  const utilColor =
                    member.utilizationStatus === 'at-capacity'
                      ? 'bg-[#FEF2F2] border-[#FECDD3]'
                      : member.utilizationStatus === 'under'
                      ? 'bg-[#F5F5F4] border-[#E7E5E4]'
                      : 'bg-white border-[#E7E5E4]';
                  const barColor =
                    member.utilizationStatus === 'at-capacity'
                      ? 'bg-[#BE123C]'
                      : member.utilizationStatus === 'under'
                      ? 'bg-[#A8A29E]'
                      : 'bg-[#0F766E]';

                  return (
                    <div key={member.id} className={`rounded-xl border p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] ${utilColor}`}>
                      {/* Name row */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#F5F5F4] border border-[#E7E5E4] flex items-center justify-center text-xs font-medium text-[#57534E]">
                              {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#1C1917]">
                                {member.name}
                                {member.isYou && <span className="ml-1.5 text-[10px] bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] px-1.5 py-0.5 rounded font-medium">You</span>}
                              </p>
                              {member.role && <p className="text-xs text-[#A8A29E] font-light">{member.role}</p>}
                            </div>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                          member.utilizationStatus === 'at-capacity'
                            ? 'bg-[#FEF2F2] text-[#BE123C] border-[#FECDD3]'
                            : member.utilizationStatus === 'under'
                            ? 'bg-[#F5F5F4] text-[#78716C] border-[#E7E5E4]'
                            : 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]'
                        }`}>
                          {member.utilizationLabel}
                        </span>
                      </div>

                      {/* Utilization bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-[#78716C] mb-1 font-light">
                          <span>{member.done_hours}h done</span>
                          <span>{member.allocated_hours}h total · {member.utilization}%</span>
                        </div>
                        <div className="w-full bg-[#F5F5F4] h-1.5 rounded-full overflow-hidden">
                          <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, member.utilization)}%` }} />
                        </div>
                      </div>

                      {/* Task stats */}
                      <div className="flex items-center gap-3 text-xs text-[#78716C] font-light">
                        <span>{member.task_count} tasks</span>
                        {member.overdue_count > 0 && <span className="text-[#BE123C]">{member.overdue_count} overdue</span>}
                        {member.urgent_count > 0 && <span className="text-[#D97706]">{member.urgent_count} urgent</span>}
                        {member.next_task && (
                          <span className="ml-auto truncate max-w-[160px] text-[11px]" title={member.next_task.name}>
                            Next: {member.next_task.name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <div className="text-center py-10 text-[#A8A29E]">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-light">Team capacity data unavailable.</p>
            </div>
          )}

          {/* Timeline */}
          {timeline && timeline.length > 0 ? (
            <section>
              <h2 className="text-base font-medium text-[#1C1917] mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#78716C]" /> Weekly Timeline
              </h2>
              <div className="space-y-4">
                {timeline.map((week: any) => (
                  <div key={week.weekStart} className={`border rounded-xl overflow-hidden ${week.isCurrentWeek ? 'border-[#2DD4BF]/40' : 'border-[#E7E5E4]'}`}>
                    <div className={`px-5 py-3 flex items-center gap-3 ${week.isCurrentWeek ? 'bg-[#F0FDFA]' : 'bg-[#FAFAF9]'}`}>
                      <span className={`text-sm font-medium ${week.isCurrentWeek ? 'text-[#0F766E]' : 'text-[#1C1917]'}`}>{week.label}</span>
                      {week.isCurrentWeek && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#CCFBF1] text-[#0F766E] border border-[#CCFBF1]">Current week</span>
                      )}
                      <span className="text-xs text-[#A8A29E] ml-auto font-light">{week.tasks.length} tasks due</span>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {week.tasks.map((task: any) => {
                        const isDoneTask = /completed|done/i.test(task.status || '');
                        return (
                          <div
                            key={task.id}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-light flex items-center gap-1.5 ${
                              isDoneTask
                                ? 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]'
                                : task.is_blocked
                                ? 'bg-[#FEF2F2] text-[#BE123C] border-[#FECDD3]'
                                : 'bg-white text-[#57534E] border-[#E7E5E4]'
                            }`}
                          >
                            {isDoneTask && <Check className="w-3 h-3" />}
                            {task.is_blocked && <AlertTriangle className="w-3 h-3" />}
                            <span className="truncate max-w-[200px]">{task.name}</span>
                            <span className="text-[10px] opacity-60">· {task.assignee_name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="text-center py-10 text-[#A8A29E]">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-light">No timeline data available — tasks may not have due dates.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
