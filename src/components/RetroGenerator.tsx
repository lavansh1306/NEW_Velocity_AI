import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { FileText, Download, Loader2 } from 'lucide-react';

interface RetroGeneratorProps {
  // Can be used standalone (no props) or embedded in project detail (with props)
  projectId?: string;
  projectName?: string;
}

export const RetroGenerator: React.FC<RetroGeneratorProps> = ({
  projectId: propProjectId,
  projectName: propProjectName,
}) => {
  const [loading, setLoading] = useState(false);
  const [retro, setRetro] = useState<string | null>(null);

  // Standalone mode
  const isStandalone = !propProjectId;
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    if (!isStandalone) return;
    const load = async () => {
      setProjectsLoading(true);
      const orgId = getCurrentOrgId();
      if (!orgId) return;
      try {
        // Show both active and completed projects — retros are most useful on completed ones
        const { data } = await supabase
          .from('projects')
          .select('id, name, status')
          .eq('organization_id', orgId)
          .in('status', ['active', 'completed'])
          .order('status', { ascending: true }) // completed first
          .limit(20);
        setProjects(data || []);
      } catch (e) {
        console.error('RetroGenerator projects error:', e);
      } finally {
        setProjectsLoading(false);
      }
    };
    load();
  }, [isStandalone]);

  const activeProjectId = propProjectId || selectedProjectId;
  const activeProjectName = propProjectName || selectedProjectName;

  const handleGenerate = async () => {
    if (!activeProjectId) return;
    setLoading(true);
    try {
      const [tasksRes, membersRes, projectRes] = await Promise.all([
        supabase
          .from('tasks')
          .select(
            'name, status, estimated_hours, actual_hours, assignee_id, created_at, updated_at, users(name)'
          )
          .eq('project_id', activeProjectId),
        supabase
          .from('team_members')
          .select('*, users(name)')
          .eq('project_id', activeProjectId),
        supabase
          .from('projects')
          .select('name, description, end_date, created_at, status')
          .eq('id', activeProjectId)
          .single(),
      ]);

      const tasks = tasksRes.data || [];
      const project = projectRes.data;
      const completed = tasks.filter(t =>
        ['done', 'completed'].some(s => t.status?.toLowerCase().includes(s))
      );
      const incomplete = tasks.filter(
        t => !['done', 'completed'].some(s => t.status?.toLowerCase().includes(s))
      );
      const totalEst = tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
      const totalActual = tasks.reduce((s, t) => s + ((t as any).actual_hours || 0), 0);

      // Member workload analysis
      const memberCounts: Record<
        string,
        { name: string; done: number; total: number }
      > = {};
      tasks.forEach((t: any) => {
        if (!t.assignee_id) return;
        if (!memberCounts[t.assignee_id])
          memberCounts[t.assignee_id] = {
            name: t.users?.name || 'Unknown',
            done: 0,
            total: 0,
          };
        memberCounts[t.assignee_id].total++;
        if (['done', 'completed'].some(s => t.status?.toLowerCase().includes(s)))
          memberCounts[t.assignee_id].done++;
      });

      // Timeline
      const projectAge =
        project?.created_at
          ? Math.ceil(
              (Date.now() - new Date(project.created_at).getTime()) / 86400000
            )
          : null;
      const daysOverdue =
        project?.end_date && new Date(project.end_date) < new Date()
          ? Math.ceil(
              (Date.now() - new Date(project.end_date).getTime()) / 86400000
            )
          : 0;

      const context = `Project: ${project?.name || activeProjectName}
Status: ${project?.status || 'active'}
Timeline: ${projectAge ? projectAge + ' days since start' : 'unknown'}${daysOverdue > 0 ? `, ${daysOverdue} days overdue` : ''}
Total tasks: ${tasks.length} (${completed.length} completed, ${incomplete.length} incomplete)
Completion rate: ${tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0}%
Estimated hours: ${totalEst}h${totalActual > 0 ? `, Actual: ${totalActual}h` : ''}
Team breakdown: ${Object.values(memberCounts)
        .map(m => `${m.name} (${m.done}/${m.total} tasks done)`)
        .join(', ') || 'No assignments recorded'}
Overloaded members: ${
        Object.values(memberCounts)
          .filter(m => m.total >= 8)
          .map(m => m.name)
          .join(', ') || 'None'
      }
Slipped tasks: ${incomplete
        .slice(0, 5)
        .map((t: any) => t.name)
        .join(', ') || 'None'}`;

      const res = await fetch('/api/ai/expand-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Project post-mortem',
          description: `Generate a structured project post-mortem report based on this data:\n${context}\n\nFormat with these exact sections:\n## What Went Well\n## What Slipped & Why\n## Workload Analysis\n## Estimate vs Actual\n## Recommendations for Next Time\n\nBe specific, direct, and actionable. Write for a manager who will share this with their team.`,
        }),
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
    const blob = new Blob(
      [`# Post-Mortem: ${activeProjectName}\n\n${retro}`],
      { type: 'text/markdown' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `post-mortem-${activeProjectName
      .toLowerCase()
      .replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Standalone card wrapper
  if (isStandalone) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-gray-900">
            Project Post-Mortem AI
          </h3>
          <span className="text-xs text-gray-400 ml-1">
            — 2 hours of writing in 2 seconds
          </span>
        </div>

        <div className="p-5 space-y-3">
          {projectsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading projects…
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-400">
              No active or completed projects found.
            </p>
          ) : (
            <>
              <select
                value={selectedProjectId}
                onChange={e => {
                  const id = e.target.value;
                  setSelectedProjectId(id);
                  setRetro(null);
                  const p = projects.find(p => p.id === id);
                  if (p) setSelectedProjectName(p.name);
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-700"
              >
                <option value="">Select a project…</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {!retro ? (
                <button
                  onClick={handleGenerate}
                  disabled={loading || !selectedProjectId}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 w-full justify-center"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {loading ? 'Generating post-mortem…' : '✦ Generate Post-Mortem'}
                </button>
              ) : (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">
                      Post-Mortem: {activeProjectName}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRetro(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Change project
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        <Download className="w-3 h-3" /> Download .md
                      </button>
                    </div>
                  </div>
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {retro}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Inline mode (embedded in project detail page with props)
  return (
    <div className="mt-4">
      {!retro ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:border-primary/30 hover:bg-primary/5 transition-all text-sm text-gray-600 hover:text-primary disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          {loading ? 'Generating retrospective...' : '✦ Generate Retrospective'}
        </button>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-medium text-gray-900">
              Project Retrospective
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80"
            >
              <Download className="w-3 h-3" /> Download
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {retro}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
