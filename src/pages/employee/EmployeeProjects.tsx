import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KanbanSquare,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { useEmployeeProjectsDB } from '@/hooks/useEmployeeProjectsDB';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];

function UrgencyBadge({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((new Date(dueDate).getTime() - today.getTime()) / 86400000);
  if (days < 0) return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#BE123C] border border-[#FECDD3]">Overdue</span>;
  if (days === 0) return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#BE123C] border border-[#FECDD3]">Due today</span>;
  if (days <= 3) return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">Due in {days}d</span>;
  return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">Due in {days}d</span>;
}

export default function EmployeeProjects() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [filter, setFilter] = useState('active');
  const { projectsView, isLoading, refresh } = useEmployeeProjectsDB();
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    if (filter === 'active') return projectsView.filter(p => p.status !== 'Completed');
    if (filter === 'completed') return projectsView.filter(p => p.status === 'Completed');
    return projectsView;
  }, [filter, projectsView]);

  const activeCount = projectsView.filter(p => p.status !== 'Completed').length;
  const completedCount = projectsView.filter(p => p.status === 'Completed').length;
  const totalAllocated = projectsView
    .filter(p => p.status !== 'Completed')
    .reduce((sum, p) => sum + (p.capacity?.allocated_hours || 0), 0);

  const handleStatusUpdate = async (e: React.MouseEvent, taskId: string, newStatus: string) => {
    e.stopPropagation();
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

  const handleMarkComplete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
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

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto pb-10 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#2DD4BF]/30 border-t-[#2DD4BF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">My Projects</h1>
          <p className="text-base text-[#78716C] mt-1 font-light">Track active assignments, priorities, and capacity</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] h-[40px] border-[#E7E5E4] bg-white font-light focus:ring-[#2DD4BF]/50">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#E7E5E4]">
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="all">All Projects</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F0FDFA] flex items-center justify-center flex-shrink-0">
              <KanbanSquare className="w-5 h-5 text-[#0F766E]" />
            </div>
            <div>
              <div className="text-2xl font-light text-[#1C1917]">{activeCount}</div>
              <div className="text-xs text-[#78716C] font-light">Active Projects</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5F5F4] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#78716C]" />
            </div>
            <div>
              <div className="text-2xl font-light text-[#1C1917]">{completedCount}</div>
              <div className="text-xs text-[#78716C] font-light">Completed</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <div className="text-2xl font-light text-[#1C1917]">{totalAllocated}h</div>
              <div className="text-xs text-[#78716C] font-light">Total Allocated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Cards */}
      <div className="space-y-5">
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={<KanbanSquare className="w-10 h-10 text-[#A8A29E]" />}
            title={filter === 'active' ? 'No Active Projects' : filter === 'completed' ? 'No Completed Projects' : 'No Projects Found'}
            description="Your project assignments will appear here."
          />
        ) : (
          filteredProjects.map((project) => {
            const nextTask = project.next_task;
            const tasks = project.your_tasks;
            const cap = project.capacity;
            const isCompleted = project.status === 'Completed';

            return (
              <div
                key={project.id}
                className="bg-white border border-[#E7E5E4] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden"
              >
                {/* Card top — clickable for navigation */}
                <div
                  onClick={() => navigate(`/app/employee/projects/${project.id}`)}
                  className="p-6 cursor-pointer group"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-medium text-[#1C1917] mb-1 group-hover:text-[#0F766E] transition-colors">{project.name}</h2>
                      <div className="flex items-center gap-2 text-sm text-[#78716C] font-light">
                        <span>{project.dates}</span>
                        <span className="w-1 h-1 bg-[#D6D3D1] rounded-full" />
                        <span>{project.remaining}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      {/* Health circle */}
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center mb-1 ${project.healthColor}`}>
                          <span className="text-base font-light">{project.health}</span>
                        </div>
                        <span className={`text-[10px] font-medium ${project.statusColor}`}>{project.status}</span>
                      </div>
                      {/* Team */}
                      <div className="flex -space-x-2">
                        {project.team.map((init: string, i: number) => (
                          <div key={i} className="w-7 h-7 rounded-full bg-[#FAFAF9] border border-[#E7E5E4] flex items-center justify-center text-[10px] font-medium text-[#57534E]">{init}</div>
                        ))}
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#D6D3D1] group-hover:text-[#78716C] transition-colors" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-[#78716C] mb-1.5 font-light">
                      <span>{project.progress}% Complete</span>
                      <span>{cap.logged_hours}h / {cap.allocated_hours}h allocated</span>
                    </div>
                    <div className="w-full bg-[#F5F5F4] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${isCompleted ? 'bg-[#0F766E]' : project.health < 75 ? 'bg-[#BE123C]' : 'bg-[#1C1917]'}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Task summary row */}
                  {tasks && (
                    <div className="flex items-center gap-4 text-xs text-[#78716C] font-light">
                      <span>{tasks.completed}/{tasks.total} tasks done</span>
                      {tasks.in_progress > 0 && <><span className="w-1 h-1 bg-[#D6D3D1] rounded-full" /><span className="text-[#0F766E]">{tasks.in_progress} in progress</span></>}
                      {tasks.blocked > 0 && <><span className="w-1 h-1 bg-[#D6D3D1] rounded-full" /><span className="text-[#BE123C] flex items-center gap-1"><AlertCircle className="w-3 h-3" />{tasks.blocked} blocked</span></>}
                      {cap.utilization_percentage > 0 && <><span className="w-1 h-1 bg-[#D6D3D1] rounded-full" /><span>{cap.utilization_percentage}% utilized</span></>}
                    </div>
                  )}
                </div>

                {/* Next priority task — inline section */}
                {nextTask && !isCompleted && (
                  <div className="border-t border-[#F5F5F4] px-6 py-4 bg-[#FAFAF9]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-[#A8A29E] uppercase font-semibold tracking-wide">Next Priority</span>
                          <UrgencyBadge dueDate={nextTask.due_date} />
                        </div>
                        <p className={`text-sm font-medium truncate ${nextTask.is_blocked ? 'text-[#BE123C]' : 'text-[#1C1917]'}`}>
                          {nextTask.name}
                        </p>
                        {nextTask.is_blocked && nextTask.blocker_description && (
                          <p className="text-xs text-[#BE123C] font-light mt-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            {nextTask.blocker_description}
                            {nextTask.blocking_user && ` · Waiting on: ${nextTask.blocking_user}`}
                          </p>
                        )}
                      </div>

                      {/* Quick actions */}
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <Select
                          value={nextTask.status}
                          onValueChange={(val) => handleStatusUpdate({ stopPropagation: () => {} } as React.MouseEvent, nextTask.id, val)}
                          disabled={updatingTask === nextTask.id}
                        >
                          <SelectTrigger className="h-8 text-xs w-[130px] border-[#E7E5E4] bg-white font-light focus:ring-[#2DD4BF]/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#E7E5E4]">
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <button
                          onClick={(e) => handleMarkComplete(e, nextTask.id)}
                          disabled={nextTask.status === 'Completed' || updatingTask === nextTask.id}
                          className="h-8 px-3 text-xs font-medium bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] rounded-lg hover:bg-[#CCFBF1] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* At-risk insight */}
                {project.insight && (
                  <div className="border-t border-[#F5F5F4] px-6 py-3 bg-[#FFFBEB] flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] flex-shrink-0" />
                    <span className="text-xs text-[#78716C] font-light">{project.insight.text}</span>
                    <button
                      onClick={() => navigate(`/app/employee/projects/${project.id}`)}
                      className="text-xs text-[#0F766E] hover:underline font-medium ml-auto flex-shrink-0"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
