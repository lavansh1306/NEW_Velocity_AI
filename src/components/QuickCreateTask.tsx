import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { Plus, X, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface QuickCreateTaskProps {
  onTaskCreated?: () => void;
}

export const QuickCreateTask: React.FC<QuickCreateTaskProps> = ({ onTaskCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const loadData = async () => {
    const orgId = getCurrentOrgId();
    if (!orgId) return;
    const [projRes, membersRes] = await Promise.all([
      supabase.from('projects').select('id, name').eq('organization_id', orgId).eq('status', 'active').limit(20),
      supabase.from('users').select('id, name').eq('organization_id', orgId).limit(20),
    ]);
    setProjects(projRes.data || []);
    setMembers(membersRes.data || []);
  };

  const handleParse = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      // Parse natural language using Groq via existing backend
      const res = await fetch('/api/ai/expand-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'parse task',
          description: `Parse this task request into JSON with fields: name, assignee_name, priority (low/medium/high), estimated_hours (number), project_hint. Input: "${input}". Return ONLY valid JSON, no preamble.`
        })
      });

      if (res.ok) {
        const data = await res.json();
        try {
          const clean = data.description.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(clean);
          
          // Match assignee
          const assignee = members.find(m =>
            m.name?.toLowerCase().includes((parsed.assignee_name || '').toLowerCase())
          );
          // Match project
          const project = projects.find(p =>
            p.name?.toLowerCase().includes((parsed.project_hint || '').toLowerCase())
          );

          setParsed({
            name: parsed.name || input,
            assignee_id: assignee?.id || null,
            assignee_name: assignee?.name || parsed.assignee_name || '',
            priority: parsed.priority || 'medium',
            estimated_hours: parsed.estimated_hours || 4,
            project_id: project?.id || projects[0]?.id || null,
            project_name: project?.name || projects[0]?.name || '',
          });
        } catch {
          // Fallback — use raw input as task name
          setParsed({
            name: input,
            assignee_id: null,
            assignee_name: '',
            priority: 'medium',
            estimated_hours: 4,
            project_id: projects[0]?.id || null,
            project_name: projects[0]?.name || '',
          });
        }
      }
    } catch (e) {
      console.error('Parse error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!parsed?.name || !parsed?.project_id) return toast.error('Need a project to assign this to');
    setSaving(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        name: parsed.name,
        project_id: parsed.project_id,
        assignee_id: parsed.assignee_id || null,
        estimated_hours: parsed.estimated_hours,
        status: 'not_started',
        priority: parsed.priority,
      });
      if (error) throw error;
      toast.success(`Task created: ${parsed.name}`);
      setIsOpen(false);
      setInput('');
      setParsed(null);
      onTaskCreated?.();
    } catch (e: any) {
      toast.error('Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const priorityColor = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-red-100 text-red-700' };

  return (
    <>
      {/* Floating + button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[9990] w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-105"
        title="Quick create task"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9991] flex items-end sm:items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-gray-900">Quick Create Task</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input */}
            <div className="p-5">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); setParsed(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleParse()}
                  placeholder='e.g. "Login bug, assign Sarah, high priority"'
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
                <button
                  onClick={handleParse}
                  disabled={loading || !input.trim()}
                  className="px-4 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Parse
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Type naturally — AI will extract the task name, assignee, and priority</p>

              {/* Parsed preview */}
              {parsed && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI parsed this as:</p>
                  
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Task name</p>
                    <input
                      value={parsed.name}
                      onChange={e => setParsed({ ...parsed, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Project</p>
                      <select
                        value={parsed.project_id || ''}
                        onChange={e => setParsed({ ...parsed, project_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                      >
                        <option value="">Select project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Assignee</p>
                      <select
                        value={parsed.assignee_id || ''}
                        onChange={e => setParsed({ ...parsed, assignee_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                      >
                        <option value="">Unassigned</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Estimated hours</p>
                      <input
                        type="number"
                        value={parsed.estimated_hours}
                        onChange={e => setParsed({ ...parsed, estimated_hours: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        min="0"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Priority</p>
                      <select
                        value={parsed.priority}
                        onChange={e => setParsed({ ...parsed, priority: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Task
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
