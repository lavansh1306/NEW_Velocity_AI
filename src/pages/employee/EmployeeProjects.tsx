import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectRow {
  project_key: string;
  project_name: string;
  total: number;
  done: number;
  in_progress: number;
  time_spent_seconds: number;
}

export default function EmployeeProjects() {
  const navigate = useNavigate();
  const { user, orgId } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !orgId) { setLoading(false); return; }
    const email = user.email ?? '';
    supabase
      .from('jira_issues')
      .select('project_key, project_name, status, time_spent_seconds')
      .eq('org_id', orgId)
      .eq('assignee_email', email)
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return; }
        const rows = data ?? [];
        // Aggregate per project
        const map: Record<string, ProjectRow> = {};
        for (const r of rows) {
          const key = r.project_key;
          if (!map[key]) map[key] = { project_key: key, project_name: r.project_name || key, total: 0, done: 0, in_progress: 0, time_spent_seconds: 0 };
          map[key].total += 1;
          if (['Done', 'Closed', 'Resolved'].includes(r.status)) map[key].done += 1;
          if (r.status === 'In Progress') map[key].in_progress += 1;
          map[key].time_spent_seconds += r.time_spent_seconds || 0;
        }
        setProjects(Object.values(map));
        setLoading(false);
      });
  }, [user, orgId]);

  const filtered = projects.filter(p => {
    if (filter === 'active') return p.done < p.total;
    if (filter === 'completed') return p.total > 0 && p.done === p.total;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal-400" /></div>;
  if (error) return <div className="text-rose-400 p-6">{error}</div>;

  const active = projects.filter(p => p.done < p.total).length;
  const completed = projects.filter(p => p.total > 0 && p.done === p.total).length;
  const totalHours = Math.round(projects.reduce((s, p) => s + p.time_spent_seconds, 0) / 3600);

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">My Projects</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px] h-[36px] border-[#E7E5E4] bg-white font-light">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary stats */}
      <div className="flex gap-4 mb-8">
        {[
          { value: String(active), label: 'Active' },
          { value: String(completed), label: 'Completed' },
          { value: `${totalHours}h`, label: 'Total Logged' },
        ].map(({ value, label }) => (
          <div key={label} className="flex items-baseline gap-2 bg-[#FAFAF9] px-4 py-2.5 rounded-lg border border-[#E7E5E4]">
            <span className="text-xl font-light text-[#1C1917]">{value}</span>
            <span className="text-xs text-[#78716C]">{label}</span>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#78716C] font-light">
          {projects.length === 0 ? 'No issues assigned to you yet.' : 'No projects match this filter.'}
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((project) => {
            const progress = project.total > 0 ? Math.round((project.done / project.total) * 100) : 0;
            const hours = Math.round(project.time_spent_seconds / 3600);
            const isCompleted = project.done === project.total && project.total > 0;
            const healthScore = isCompleted ? 100 : Math.max(40, Math.round(70 + (progress - 50) * 0.3));
            const statusLabel = isCompleted ? 'Completed' : progress > 70 ? 'On Track' : progress > 40 ? 'In Progress' : 'At Risk';
            const healthColor = isCompleted || statusLabel === 'On Track' ? 'text-[#0F766E] border-[#CCFBF1]' : statusLabel === 'At Risk' ? 'text-[#BE123C] border-[#FECDD3]' : 'text-[#D97706] border-[#FEF3C7]';
            const statusColor = isCompleted ? 'text-[#78716C]' : statusLabel === 'On Track' ? 'text-[#0F766E]' : statusLabel === 'At Risk' ? 'text-[#BE123C]' : 'text-[#D97706]';
            return (
              <div
                key={project.project_key}
                onClick={() => navigate(`/app/employee/projects/${project.project_key}`)}
                className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-xl font-light text-[#1C1917] mb-2">{project.project_name}</h2>
                    <div className="text-sm text-[#78716C] font-light">
                      {project.total} issues · {project.in_progress} in progress · {hours}h logged
                    </div>
                  </div>
                  <div className="flex flex-col items-center ml-8">
                    <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center mb-1 ${healthColor}`}>
                      <span className="text-xl font-light">{healthScore}</span>
                    </div>
                    <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-[#78716C] mb-2 font-light">
                    <span>{progress}% Complete</span>
                    <span>{project.done} / {project.total} issues done</span>
                  </div>
                  <div className="w-full bg-[#F5F5F4] h-1.5 rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full bg-[#1C1917]" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
