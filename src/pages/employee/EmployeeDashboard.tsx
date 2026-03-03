import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Kanban,
  ArrowRight,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Issue {
  issue_key: string;
  summary: string;
  status: string;
  priority: string;
  project_key: string;
  project_name: string;
  due_date: string | null;
  time_spent_seconds: number;
  story_points: number | null;
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, orgId } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [workHoursPerWeek, setWorkHoursPerWeek] = useState(40);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !orgId) {
      setLoading(false);
      return;
    }
    const email = user.email ?? '';
    setLoading(true);
    Promise.all([
      supabase
        .from('jira_issues')
        .select(
          'issue_key, summary, status, priority, project_key, project_name, due_date, time_spent_seconds, story_points',
        )
        .eq('org_id', orgId)
        .eq('assignee_email', email),
      supabase
        .from('organization_settings')
        .select('work_hours_per_week')
        .eq('org_id', orgId)
        .single(),
    ]).then(([issuesRes, settingsRes]) => {
      if (!issuesRes.error && issuesRes.data)
        setIssues(issuesRes.data as Issue[]);
      if (!settingsRes.error && settingsRes.data)
        setWorkHoursPerWeek(settingsRes.data.work_hours_per_week || 40);
      setLoading(false);
    });
  }, [user, orgId]);

  /* ---------- derived data ---------- */

  const totalHoursLogged = useMemo(
    () =>
      Math.round(
        issues.reduce((s, i) => s + (i.time_spent_seconds || 0), 0) / 3600,
      ),
    [issues],
  );

  const activeIssues = useMemo(
    () =>
      issues.filter(
        (i) => !['Done', 'Closed', 'Resolved'].includes(i.status),
      ),
    [issues],
  );

  const projectKeys = useMemo(
    () => [...new Set(activeIssues.map((i) => i.project_key))],
    [activeIssues],
  );

  const utilizationPct = useMemo(() => {
    if (workHoursPerWeek <= 0) return 0;
    return Math.min(
      Math.round((totalHoursLogged / workHoursPerWeek) * 100),
      150,
    );
  }, [totalHoursLogged, workHoursPerWeek]);

  const projects = useMemo(() => {
    const map: Record<
      string,
      { name: string; key: string; total: number; done: number; hours: number }
    > = {};
    issues.forEach((i) => {
      if (!map[i.project_key])
        map[i.project_key] = {
          name: i.project_name || i.project_key,
          key: i.project_key,
          total: 0,
          done: 0,
          hours: 0,
        };
      map[i.project_key].total++;
      if (['Done', 'Closed', 'Resolved'].includes(i.status))
        map[i.project_key].done++;
      map[i.project_key].hours += Math.round(
        (i.time_spent_seconds || 0) / 3600,
      );
    });
    return Object.values(map);
  }, [issues]);

  const upcoming = useMemo(() => {
    return issues
      .filter((i) => i.due_date && new Date(i.due_date) >= new Date())
      .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
      .slice(0, 4);
  }, [issues]);

  /* ---------- render ---------- */

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#2DD4BF] animate-spin" />
      </div>
    );

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      <h1 className="text-3xl font-light text-[#1C1917] mb-8 tracking-tight">
        Dashboard
      </h1>

      {/* ─── Section 1 · Workload Summary KPIs ─── */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        {/* Current Utilization */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] text-[#A8A29E] uppercase font-semibold tracking-wider">
              CURRENT UTILIZATION
            </div>
            <div className="p-1.5 bg-[#FFF7ED] rounded-md text-[#D97706]">
              <Zap className="h-3.5 w-3.5" />
            </div>
          </div>
          <div
            className={`text-4xl font-light mb-3 ${utilizationPct > 90 ? 'text-[#D97706]' : 'text-[#0F766E]'}`}
          >
            {utilizationPct}%
          </div>
          <div className="w-full bg-[#F5F5F4] rounded-full h-1.5 mb-4 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${utilizationPct > 90 ? 'bg-[#D97706]' : 'bg-[#0F766E]'}`}
              style={{ width: `${Math.min(utilizationPct, 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${utilizationPct > 90 ? 'bg-[#D97706]' : 'bg-[#0F766E]'} animate-pulse`}
            />
            <span className="text-sm text-[#57534E] font-medium">
              {utilizationPct > 90 ? 'At Capacity' : 'Healthy'}
            </span>
          </div>
          <p className="text-xs text-[#A8A29E] font-light">
            {totalHoursLogged}h logged / {workHoursPerWeek}h capacity
          </p>
        </div>

        {/* Active Projects */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] text-[#A8A29E] uppercase font-semibold tracking-wider">
              ACTIVE PROJECTS
            </div>
            <div className="p-1.5 bg-[#F5F5F4] rounded-md text-[#57534E]">
              <Kanban className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-4xl font-light text-[#1C1917] mb-3">
            {projectKeys.length}
          </div>
          <div className="text-sm text-[#78716C] mb-4 font-light">
            Projects in progress
          </div>
          <div className="text-sm text-[#57534E] mb-1 font-medium">
            {activeIssues.length === 0
              ? 'All on track'
              : `${activeIssues.length} active issues`}
          </div>
          <p className="text-xs text-[#A8A29E] font-light">
            {totalHoursLogged}h/wk allocated
          </p>
        </div>
      </div>

      {/* ─── Section 2 · This Week's Work ─── */}
      <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 mb-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-[#1C1917]">
            This Week's Work
          </h2>
          <button
            onClick={() => navigate('/app/employee/my-projects')}
            className="text-sm text-[#0F766E] hover:text-[#0D9488] font-medium flex items-center gap-1 transition-colors hover:underline decoration-[#0F766E]/30 underline-offset-4"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-10 text-sm text-[#A8A29E]">
            No projects found.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E7E5E4]">
                <th className="text-left text-xs font-semibold text-[#A8A29E] uppercase pb-3 tracking-wider pl-4">
                  Project
                </th>
                <th className="text-left text-xs font-semibold text-[#A8A29E] uppercase pb-3 tracking-wider">
                  Hours Logged
                </th>
                <th className="text-left text-xs font-semibold text-[#A8A29E] uppercase pb-3 tracking-wider">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-[#A8A29E] uppercase pb-3 tracking-wider pr-4">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map((p) => {
                const pct =
                  p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
                const isDone = pct === 100;
                return (
                  <tr
                    key={p.key}
                    className="border-b border-[#F5F5F4] last:border-0 h-[64px] hover:bg-[#FAFAF9] transition-colors group cursor-pointer"
                    onClick={() =>
                      navigate(`/app/employee/projects/${p.key}`)
                    }
                  >
                    <td className="text-sm text-[#1C1917] font-medium pl-4 group-hover:text-black transition-colors">
                      {p.name}
                    </td>
                    <td className="text-sm text-[#78716C] font-light">
                      {p.hours}h
                    </td>
                    <td>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full shadow-sm ${
                          isDone
                            ? 'bg-[#F5F5F4] text-[#78716C] border border-[#E7E5E4]'
                            : 'bg-white text-[#1C1917] border border-[#E7E5E4]'
                        }`}
                      >
                        {isDone ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-[120px] bg-[#F5F5F4] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${isDone ? 'bg-[#0F766E]' : 'bg-[#1C1917]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#A8A29E] font-light w-8">
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Section 3 · Deadlines & AI Insights ─── */}
      <div className="flex gap-6">
        {/* Upcoming Deadlines */}
        <div className="w-[60%] bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="text-base font-medium text-[#1C1917] mb-5">
            Upcoming Deadlines
          </h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#A8A29E]">
              No upcoming deadlines.
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((item) => (
                <div
                  key={item.issue_key}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#FAFAF9] border border-transparent hover:border-[#E7E5E4] transition-all cursor-default group"
                >
                  <div className="bg-[#F5F5F4] text-xs text-[#57534E] h-10 w-14 flex items-center justify-center rounded-lg font-medium shadow-sm group-hover:bg-white group-hover:shadow-md transition-all">
                    {item.due_date
                      ? new Date(item.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#1C1917] font-medium group-hover:text-black truncate">
                      {item.summary}
                    </div>
                    <div className="text-xs text-[#78716C] font-light">
                      {item.project_name || item.project_key}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#D6D3D1] group-hover:text-[#1C1917] transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="w-[40%] bg-gradient-to-b from-white to-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-medium text-[#1C1917] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#D97706]" /> AI Insights
            </h2>
            <span className="bg-white text-[#1C1917] text-[10px] px-2 py-0.5 rounded-full border border-[#E7E5E4] shadow-sm">
              {activeIssues.length > 0 ? '2 New' : 'No Data'}
            </span>
          </div>

          <div className="space-y-4">
            {utilizationPct > 85 && (
              <div className="bg-white border border-[#FEF3C7] rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#FCD34D] transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D97706] mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-[#1C1917] mb-1">
                      Timeline adjustment
                    </div>
                    <p className="text-xs text-[#78716C] leading-relaxed mb-3 font-light">
                      Your utilization is at {utilizationPct}%. Consider
                      redistributing workload to avoid burnout.
                    </p>
                    <button className="text-xs text-[#1C1917] hover:underline font-medium flex items-center gap-1">
                      Review Impact{' '}
                      <ChevronRight className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border border-[#CCFBF1] rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#5EEAD4] transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0F766E] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[#1C1917] mb-1">
                    Resource opportunity
                  </div>
                  <p className="text-xs text-[#78716C] leading-relaxed mb-3 font-light">
                    {issues.length} total issues across {projects.length}{' '}
                    projects.{' '}
                    {
                      issues.filter((i) =>
                        ['Done', 'Closed', 'Resolved'].includes(i.status),
                      ).length
                    }{' '}
                    completed so far.
                  </p>
                  <button
                    onClick={() => navigate('/app/employee/my-projects')}
                    className="text-xs text-[#1C1917] hover:underline font-medium flex items-center gap-1"
                  >
                    View Schedule{' '}
                    <ChevronRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
