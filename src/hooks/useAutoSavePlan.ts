import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface AutoSavePlanData {
  title: string;
  description: string;
  tasks: Array<{
    task: string;
    estimatedHours: number;
    requiredSkills: string[];
  }>;
}

interface UseAutoSavePlanOptions {
  organizationId: string | null;
  userId: string | null;
  debounceMs?: number;
}

export function useAutoSavePlan({
  organizationId,
  userId,
  debounceMs = 2000,
}: UseAutoSavePlanOptions) {
  const [planId, setPlanId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep latest planId in a ref so closures inside setTimeout always see the current value
  const planIdRef = useRef<string | null>(null);

  useEffect(() => {
    planIdRef.current = planId;
  }, [planId]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const save = useCallback(async (data: AutoSavePlanData) => {
    if (!organizationId || !userId) return;
    // Don't save completely empty plans
    if (!data.title.trim() && !data.description.trim() && data.tasks.length === 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const currentPlanId = planIdRef.current;

      if (currentPlanId) {
        // ── Update existing draft ────────────────────────────────────────────
        await supabase
          .from('project_plans')
          .update({
            title: data.title.trim() || 'Untitled Plan',
            description: data.description,
            last_edited_at: new Date().toISOString(),
          })
          .eq('id', currentPlanId);

        // Replace tasks: delete + re-insert (simpler than diffing)
        await supabase.from('plan_tasks').delete().eq('plan_id', currentPlanId);

        if (data.tasks.length > 0) {
          await supabase.from('plan_tasks').insert(
            data.tasks.map((t, i) => ({
              plan_id: currentPlanId,
              task_name: t.task,
              estimated_hours: t.estimatedHours,
              required_skills: t.requiredSkills,
              order_index: i,
            }))
          );
        }
      } else {
        // ── Create new draft ─────────────────────────────────────────────────
        const { data: plan, error } = await supabase
          .from('project_plans')
          .insert({
            organization_id: organizationId,
            created_by: userId,
            title: data.title.trim() || 'Untitled Plan',
            description: data.description,
            status: 'draft',
            auto_saved: true,
            last_edited_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) throw error;

        planIdRef.current = plan.id;
        setPlanId(plan.id);

        if (data.tasks.length > 0) {
          await supabase.from('plan_tasks').insert(
            data.tasks.map((t, i) => ({
              plan_id: plan.id,
              task_name: t.task,
              estimated_hours: t.estimatedHours,
              required_skills: t.requiredSkills,
              order_index: i,
            }))
          );
        }
      }

      setLastSaved(new Date());
    } catch (err: any) {
      console.error('[useAutoSavePlan] save error:', err?.message || err);
      setSaveError(err?.message || 'Auto-save failed');
    } finally {
      setIsSaving(false);
    }
  }, [organizationId, userId]);

  // Debounced trigger — call this on every state change
  const autoSave = useCallback((data: AutoSavePlanData) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(data), debounceMs);
  }, [save, debounceMs]);

  // Force-save immediately (bypasses debounce — use before navigation)
  const flushSave = useCallback((data: AutoSavePlanData) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    return save(data);
  }, [save]);

  return {
    planId,
    setPlanId,
    isSaving,
    lastSaved,
    saveError,
    autoSave,
    flushSave,
  };
}
