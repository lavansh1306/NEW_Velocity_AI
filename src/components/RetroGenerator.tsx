import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Download, Loader2 } from 'lucide-react';

interface RetroGeneratorProps {
  projectId: string;
  projectName: string;
}

export const RetroGenerator: React.FC<RetroGeneratorProps> = ({ projectId, projectName }) => {
  const [loading, setLoading] = useState(false);
  const [retro, setRetro] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Fetch project data
      const [tasksRes, membersRes] = await Promise.all([
        supabase.from('tasks').select('name, status, estimated_hours, actual_hours, assignee_id, created_at, updated_at, users(name)').eq('project_id', projectId),
        supabase.from('team_members').select('*, users(name)').eq('project_id', projectId),
      ]);

      const tasks = tasksRes.data || [];
      const completed = tasks.filter(t => t.status === 'completed');
      const overdue = tasks.filter(t => t.status !== 'completed');
      const totalEst = tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
      const totalActual = tasks.reduce((s, t) => s + ((t as any).actual_hours || 0), 0);

      // Member workload
      const memberCounts: Record<string, { name: string; done: number; total: number }> = {};
      tasks.forEach((t: any) => {
        if (!t.assignee_id) return;
        if (!memberCounts[t.assignee_id]) memberCounts[t.assignee_id] = { name: t.users?.name || 'Unknown', done: 0, total: 0 };
        memberCounts[t.assignee_id].total++;
        if (t.status === 'completed') memberCounts[t.assignee_id].done++;
      });

      const context = `Project: ${projectName}
Total tasks: ${tasks.length} (${completed.length} completed, ${overdue.length} incomplete)
Estimated hours: ${totalEst}h, Actual: ${totalActual > 0 ? totalActual + 'h' : 'not tracked'}
Team: ${Object.values(memberCounts).map(m => `${m.name} (${m.done}/${m.total} tasks)`).join(', ')}
Completion rate: ${tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0}%`;

      const res = await fetch('/api/ai/expand-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Project retrospective',
          description: `Generate a concise project retrospective based on this data:\n${context}\n\nInclude: what went well, what was delayed, who was overloaded, estimate vs actual comparison, and 2 recommendations for next time. Format with clear sections.`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRetro(data.description || 'Could not generate retrospective.');
      }
    } catch (e) {
      setRetro('Failed to generate retrospective. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!retro) return;
    const blob = new Blob([`# Retrospective: ${projectName}\n\n${retro}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retro-${projectName.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4">
      {!retro ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:border-primary/30 hover:bg-primary/5 transition-all text-sm text-gray-600 hover:text-primary disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {loading ? 'Generating retrospective...' : '✦ Generate Retrospective'}
        </button>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-medium text-gray-900">Project Retrospective</p>
            <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80">
              <Download className="w-3 h-3" /> Download
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{retro}</p>
          </div>
        </div>
      )}
    </div>
  );
};
