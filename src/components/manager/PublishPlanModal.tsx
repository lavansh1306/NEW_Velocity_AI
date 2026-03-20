import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { X, CheckCircle2, Clock, Loader2, Rocket } from 'lucide-react';
import type { EditableTask } from '@/types';

interface Props {
  planId: string;
  planTitle: string;
  tasks: EditableTask[];
  organizationId: string;
  onClose: () => void;
  onPublished: (projectId: string) => void;
}

export function PublishPlanModal({ planId, planTitle, tasks, organizationId, onClose, onPublished }: Props) {
  const [projectName, setProjectName] = useState(planTitle || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);
  const estimatedWeeks = totalHours > 0 ? Math.ceil(totalHours / 40) : 0;

  const handlePublish = async () => {
    if (!projectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    setIsPublishing(true);
    try {
      // 1. Create real project
      const { data: project, error: projError } = await supabase
        .from('projects')
        .insert({
          organization_id: organizationId,
          name: projectName.trim(),
          description: `Published from plan: ${planTitle}`,
          source: 'internal',
          status: 'active',
          ...(startDate ? { start_date: startDate } : {}),
          ...(endDate ? { end_date: endDate } : {}),
        })
        .select('id')
        .single();

      if (projError) throw projError;

      // 2. Create tasks linked to the project
      if (tasks.length > 0) {
        const { error: tasksError } = await supabase.from('tasks').insert(
          tasks.map(t => ({
            project_id: project.id,
            name: t.task,
            estimated_hours: t.estimatedHours,
            status: 'not_started',
          }))
        );
        if (tasksError) throw tasksError;
      }

      // 3. Mark the plan as published
      await supabase
        .from('project_plans')
        .update({
          status: 'published',
          published: true,
          published_at: new Date().toISOString(),
          published_project_id: project.id,
        })
        .eq('id', planId);

      toast.success(`"${projectName.trim()}" is now live!`);
      onPublished(project.id);
    } catch (err: any) {
      console.error('[PublishPlanModal] publish error:', err);
      toast.error('Failed to publish project', { description: err.message });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E7E5E4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0FDFA] flex items-center justify-center">
              <Rocket className="w-4 h-4 text-[#0F766E]" />
            </div>
            <div>
              <h2 className="text-base font-medium text-[#1C1917]">Publish Project</h2>
              <p className="text-xs text-[#A8A29E] font-light">Convert this plan into a live project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F5F5F4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan summary */}
        <div className="mx-6 mt-5 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-[#A8A29E] font-light uppercase tracking-wider mb-1">Plan summary</p>
            <div className="flex items-center gap-4 text-sm text-[#57534E] font-light">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E]" />
                {tasks.length} tasks
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#78716C]" />
                {totalHours}h total
              </span>
              {estimatedWeeks > 0 && (
                <span className="text-[#A8A29E]">~{estimatedWeeks}w estimate</span>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#57534E] mb-1.5">Project Name <span className="text-[#BE123C]">*</span></label>
            <input
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="w-full text-sm border border-[#E7E5E4] rounded-xl px-4 py-2.5 bg-white text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/30 focus:border-[#2DD4BF] font-light"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full text-sm border border-[#E7E5E4] rounded-xl px-4 py-2.5 bg-white text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/30 focus:border-[#2DD4BF] font-light"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full text-sm border border-[#E7E5E4] rounded-xl px-4 py-2.5 bg-white text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/30 focus:border-[#2DD4BF] font-light"
              />
            </div>
          </div>

          {/* Task preview (first 4) */}
          {tasks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#57534E] mb-2">Tasks to be created</p>
              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                {tasks.slice(0, 6).map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-[#F5F5F4] last:border-0">
                    <span className="text-[#1C1917] font-light truncate max-w-[280px]">{t.task}</span>
                    <span className="text-[#A8A29E] flex-shrink-0 ml-2">{t.estimatedHours}h</span>
                  </div>
                ))}
                {tasks.length > 6 && (
                  <p className="text-xs text-[#A8A29E] font-light pt-1">+{tasks.length - 6} more tasks</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-[#E7E5E4] text-sm text-[#78716C] font-light hover:bg-[#F5F5F4] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || !projectName.trim()}
            className="flex-1 h-10 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #1C1917 0%, #0F766E 100%)' }}
          >
            {isPublishing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
            ) : (
              <><Rocket className="w-4 h-4" /> Publish Project</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
