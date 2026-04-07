import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Zap, CheckCircle2, Clock, Users, AlertTriangle } from 'lucide-react';

export default function ProjectBrief() {
  const { projectId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      try {
        const [projectRes, tasksRes, membersRes] = await Promise.all([
          supabase.from('projects').select('*').eq('id', projectId).single(),
          supabase.from('tasks').select('*').eq('project_id', projectId),
          supabase.from('team_members').select('*, users(name, email)').eq('project_id', projectId),
        ]);

        const project = projectRes.data;
        const tasks = tasksRes.data || [];
        const members = membersRes.data || [];

        const completed = tasks.filter(t => t.status === 'completed').length;
        const completionPct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
        const overdue = tasks.filter(t => t.status !== 'completed').length;
        const daysLeft = project?.end_date
          ? Math.ceil((new Date(project.end_date).getTime() - Date.now()) / 86400000)
          : null;
        const healthScore = Math.max(0, Math.min(100, completionPct - (overdue > 5 ? 20 : 0)));

        setData({ project, tasks, members, completed, completionPct, overdue, daysLeft, healthScore });
      } catch (e) {
        console.error('ProjectBrief error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data?.project) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Project not found or not publicly accessible.</p>
    </div>
  );

  const { project, tasks, members, completionPct, overdue, daysLeft, healthScore } = data;
  const isAtRisk = healthScore < 50 || (daysLeft !== null && daysLeft < 7);

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-500">Velocity AI — Project Brief</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${isAtRisk ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {isAtRisk ? 'At Risk' : 'On Track'}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-light text-gray-900 mb-1">{project.name}</h1>
          {project.description && <p className="text-gray-500">{project.description}</p>}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, value: `${completionPct}%`, label: 'Complete' },
            { icon: <Clock className="w-4 h-4 text-primary" />, value: daysLeft !== null ? `${daysLeft}d` : '—', label: 'Days left' },
            { icon: <Users className="w-4 h-4 text-blue-600" />, value: members.length.toString(), label: 'Team size' },
            { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, value: healthScore.toString(), label: 'Health score' },
          ].map(({ icon, value, label }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
              <p className="text-2xl font-light text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-gray-900">Project Progress</p>
            <span className="text-sm text-gray-500">{data.completed}/{tasks.length} tasks</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionPct}%` }} />
          </div>
        </div>

        {/* Team */}
        {members.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-900 mb-3">Team</p>
            <div className="flex flex-wrap gap-2">
              {members.map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                    {(m.users?.name || 'U')[0].toUpperCase()}
                  </div>
                  {m.users?.name || m.email || 'Team member'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Built with <a href="https://joinvelocity.co" className="text-primary hover:underline">Velocity AI</a> — AI-powered project management
          </p>
        </div>
      </div>
    </div>
  );
}
