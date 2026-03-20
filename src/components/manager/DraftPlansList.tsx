import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, FileText, Trash2, ChevronRight } from 'lucide-react';

interface DraftPlan {
  id: string;
  title: string;
  description: string;
  last_edited_at: string;
  task_count: number;
  total_hours: number;
}

interface LoadedDraft {
  planId: string;
  title: string;
  description: string;
  tasks: Array<{ task: string; estimatedHours: number; requiredSkills: string[] }>;
}

interface Props {
  organizationId: string | null;
  userId: string | null;
  onContinue: (draft: LoadedDraft) => void;
  /** Pass currentPlanId so the active draft isn't shown in the list */
  activePlanId?: string | null;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function DraftPlansList({ organizationId, userId, onContinue, activePlanId }: Props) {
  const [drafts, setDrafts] = useState<DraftPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const loadDrafts = useCallback(async () => {
    if (!organizationId || !userId) { setLoading(false); return; }

    try {
      const { data, error } = await supabase
        .from('project_plans')
        .select(`
          id, title, description, last_edited_at,
          plan_tasks ( id, estimated_hours )
        `)
        .eq('organization_id', organizationId)
        .eq('created_by', userId)
        .eq('status', 'draft')
        .eq('published', false)
        .order('last_edited_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const mapped: DraftPlan[] = (data || [])
        .filter((d: any) => d.id !== activePlanId)
        .map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description || '',
          last_edited_at: d.last_edited_at || d.created_at,
          task_count: (d.plan_tasks || []).length,
          total_hours: (d.plan_tasks || []).reduce((s: number, t: any) => s + (t.estimated_hours || 0), 0),
        }));

      setDrafts(mapped);
    } catch (err) {
      console.error('[DraftPlansList] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, userId, activePlanId]);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  const handleContinue = async (draftId: string) => {
    setLoadingId(draftId);
    try {
      const { data: plan } = await supabase
        .from('project_plans')
        .select('id, title, description')
        .eq('id', draftId)
        .single();

      const { data: planTasks } = await supabase
        .from('plan_tasks')
        .select('task_name, estimated_hours, required_skills, order_index')
        .eq('plan_id', draftId)
        .order('order_index', { ascending: true });

      onContinue({
        planId: plan.id,
        title: plan.title === 'Untitled Plan' ? '' : plan.title,
        description: plan.description || '',
        tasks: (planTasks || []).map((t: any, i: number) => ({
          id: `draft-${i}-${t.task_name}`,
          task: t.task_name,
          estimatedHours: t.estimated_hours || 0,
          requiredSkills: Array.isArray(t.required_skills) ? t.required_skills : [],
        })),
      });
    } catch (err) {
      console.error('[DraftPlansList] continue error:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this draft? This cannot be undone.')) return;
    setDeletingId(draftId);
    try {
      await supabase.from('plan_tasks').delete().eq('plan_id', draftId);
      await supabase.from('project_plans').delete().eq('id', draftId);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (err) {
      console.error('[DraftPlansList] delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || drafts.length === 0) return null;

  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#A8A29E] mb-3">
        Continue planning for...
      </p>

      <div className="grid grid-cols-1 gap-2">
        {drafts.map(draft => (
          <button
            key={draft.id}
            onClick={() => handleContinue(draft.id)}
            disabled={loadingId === draft.id || deletingId === draft.id}
            className="group w-full flex items-center gap-4 bg-white border border-[#E7E5E4] rounded-xl px-5 py-4 hover:border-[#2DD4BF]/40 hover:shadow-[0_2px_12px_rgba(45,212,191,0.08)] transition-all duration-200 text-left disabled:opacity-60 disabled:cursor-wait"
          >
            {/* Icon */}
            <div className="w-9 h-9 rounded-lg bg-[#F0FDFA] flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-[#0F766E]" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1C1917] truncate group-hover:text-[#0F766E] transition-colors">
                {draft.title || 'Untitled Plan'}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-[#A8A29E] font-light flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(draft.last_edited_at)}
                </span>
                {draft.task_count > 0 && (
                  <>
                    <span className="w-1 h-1 bg-[#D6D3D1] rounded-full" />
                    <span className="text-xs text-[#A8A29E] font-light">
                      {draft.task_count} task{draft.task_count !== 1 ? 's' : ''} · {draft.total_hours}h
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => handleDelete(e, draft.id)}
                disabled={deletingId === draft.id}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#D6D3D1] hover:text-[#BE123C] hover:bg-[#FEF2F2] transition-colors"
                title="Delete draft"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ChevronRight className="w-4 h-4 text-[#D6D3D1] group-hover:text-[#0F766E] transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
