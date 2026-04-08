import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { approveAndPushToLinear, rejectAndLogML } from '@/lib/linearDataService';
import { ArrowRight, RefreshCw, Check, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface RebalanceSuggestion {
  taskId: string;
  taskName: string;
  fromId: string;
  fromName: string;
  fromTasks: number;
  toId: string;
  toName: string;
  toTasks: number;
  reason: string;
}

export const WorkloadRebalancer: React.FC = () => {
  const [suggestions, setSuggestions] = useState<RebalanceSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [pushedToLinear, setPushedToLinear] = useState<Set<string>>(new Set());

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const orgId = getCurrentOrgId();
    if (!orgId) return;
    try {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, name, assignee_id, estimated_hours, users(name)')
        .neq('status', 'completed')
        .not('assignee_id', 'is', null);

      if (!tasks?.length) return;

      const memberTasks: Record<string, { name: string; tasks: any[]; totalHours: number }> = {};
      tasks.forEach((t: any) => {
        const uid = t.assignee_id;
        const name = t.users?.name || 'Unknown';
        if (!memberTasks[uid]) memberTasks[uid] = { name, tasks: [], totalHours: 0 };
        memberTasks[uid].tasks.push(t);
        memberTasks[uid].totalHours += t.estimated_hours || 0;
      });

      const entries = Object.entries(memberTasks);
      if (entries.length < 2) return;

      const sorted = entries.sort((a, b) => b[1].tasks.length - a[1].tasks.length);
      const overloaded = sorted.filter(([, v]) => v.tasks.length >= 6);
      const underloaded = sorted.filter(([, v]) => v.tasks.length <= 3);

      const suggs: RebalanceSuggestion[] = [];
      overloaded.forEach(([fromId, fromData]) => {
        const target = underloaded.find(([toId]) => toId !== fromId);
        if (!target) return;
        const [toId, toData] = target;
        const taskToMove = fromData.tasks[fromData.tasks.length - 1];
        suggs.push({
          taskId: taskToMove.id,
          taskName: taskToMove.name,
          fromId,
          fromName: fromData.name,
          fromTasks: fromData.tasks.length,
          toId,
          toName: toData.name,
          toTasks: toData.tasks.length,
          reason: `${fromData.name} has ${fromData.tasks.length} tasks, ${toData.name} has only ${toData.tasks.length}`,
        });
      });

      setSuggestions(suggs.slice(0, 3));
    } catch (e) {
      console.error('WorkloadRebalancer error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (s: RebalanceSuggestion) => {
    setApplying(s.taskId);
    try {
      // 1. Reassign in Supabase
      await supabase.from('tasks').update({ assignee_id: s.toId }).eq('id', s.taskId);
      toast.success(`Moved "${s.taskName}" to ${s.toName}`);
      setDismissed(prev => new Set([...prev, s.taskId]));

      // 2. Push to Linear + log ML training event (fire-and-forget)
      approveAndPushToLinear({
        taskId: s.taskId,
        taskName: s.taskName,
        taskDescription: s.reason,
        suggestedUserId: s.toId,
        skillMatchScore: 80,
        workloadAtTime: Math.round((s.toTasks / 10) * 100),
      }).then(result => {
        if (result.success && result.issue) {
          setPushedToLinear(prev => new Set([...prev, s.taskId]));
          toast(`Pushed to Linear: ${result.issue.identifier}`, {
            description: 'Task created in Linear workspace',
          });
        } else if (result.queued) {
          console.log('[WorkloadRebalancer] Linear not connected — ML event logged');
        }
      }).catch(err => {
        console.warn('[WorkloadRebalancer] Linear push failed (non-blocking):', err);
      });
    } catch (e) {
      toast.error('Failed to reassign task');
    } finally {
      setApplying(null);
    }
  };

  const handleDismiss = async (s: RebalanceSuggestion) => {
    setDismissed(prev => new Set([...prev, s.taskId]));

    // Log reject signal for ML model (fire-and-forget)
    rejectAndLogML({
      taskId: s.taskId,
      suggestedUserId: s.toId,
      skillMatchScore: 50,
      workloadAtTime: Math.round((s.toTasks / 10) * 100),
    }).catch(() => {});
  };

  const visible = suggestions.filter(s => !dismissed.has(s.taskId));
  if (loading || visible.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Workload Rebalancing</h3>
          <p className="text-xs text-gray-400 mt-0.5">AI suggestions to balance your team</p>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-gray-600">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="divide-y divide-gray-50">
        {visible.map(s => {
          const isPushed = pushedToLinear.has(s.taskId);
          return (
            <div key={s.taskId} className="px-5 py-4">
              <p className="text-sm font-medium text-gray-900 mb-1 truncate">{s.taskName}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full">
                  {s.fromName} ({s.fromTasks} tasks)
                </span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                  {s.toName} ({s.toTasks} tasks)
                </span>
                {isPushed && (
                  <span className="text-xs px-2 py-1 bg-[#5E6AD2]/10 text-[#5E6AD2] rounded-full flex items-center gap-1">
                    <ExternalLink className="w-2.5 h-2.5" />
                    In Linear
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-3">{s.reason}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(s)}
                  disabled={applying === s.taskId}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {applying === s.taskId
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Check className="w-3 h-3" />}
                  Accept
                </button>
                <button
                  onClick={() => handleDismiss(s)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
