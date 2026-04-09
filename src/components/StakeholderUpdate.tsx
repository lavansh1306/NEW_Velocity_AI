import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { FileText, Copy, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StakeholderUpdateProps {
  projectId?: string;
  projectName?: string;
  projectsList?: any[];
}

export const StakeholderUpdate: React.FC<StakeholderUpdateProps> = ({ projectId, projectName, projectsList }) => {
  const [loading, setLoading] = useState(false);
  const [update, setUpdate] = useState('');
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [showProjects, setShowProjects] = useState(!projectId);

  const projects = projectsList || [];

  const handleGenerate = async () => {
    const pid = selectedProject || projectId;
    if (!pid) return toast.error('Select a project first');
    setLoading(true);
    try {
      const [tasksRes, membersRes, projectRes] = await Promise.all([
        supabase.from('tasks').select('name, status, estimated_hours').eq('project_id', pid),
        supabase.from('team_members').select('*, users(name)').eq('project_id', pid),
        supabase.from('projects').select('name, description, end_date, status').eq('id', pid).single(),
      ]);

      const tasks = tasksRes.data || [];
      const project = projectRes.data;
      const completed = tasks.filter(t => ['done','completed'].some(s => t.status?.includes(s))).length;
      const total = tasks.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      const daysLeft = project?.end_date
        ? Math.ceil((new Date(project.end_date).getTime() - Date.now()) / 86400000)
        : null;

      const context = `Project: ${project?.name}
Completion: ${pct}% (${completed}/${total} tasks done)
Timeline: ${daysLeft !== null ? daysLeft + ' days remaining' : 'no deadline set'}
Team size: ${membersRes.data?.length || 0}
Status: ${pct > 70 ? 'On Track' : pct > 40 ? 'In Progress' : 'Early Stage'}`;

      const res = await fetch('/api/ai/expand-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'stakeholder update',
          description: `Write a concise, professional stakeholder update email for this project. Use plain language suitable for non-technical stakeholders. 3-4 sentences max. Data:\n${context}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUpdate(data.description || '');
      }
    } catch (e) {
      toast.error('Failed to generate update');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(update);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-gray-900">Stakeholder Update Generator</h3>
        <span className="text-xs text-gray-400 ml-1">— one click, ready to send</span>
      </div>

      {showProjects && (
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white mb-3"
        >
          <option value="">Select a project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}

      {!update ? (
        <button
          onClick={handleGenerate}
          disabled={loading || (!selectedProject && !projectId)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 w-full justify-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {loading ? 'Generating...' : '✦ Generate Friday Update'}
        </button>
      ) : (
        <div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-3">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{update}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button onClick={() => setUpdate('')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
