import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { AlertTriangle, TrendingDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectRisk {
  id: string;
  name: string;
  completionProbability: number;
  daysLeft: number;
  tasksRemaining: number;
  tasksTotal: number;
  requiredPacePerDay: number;
  actualPacePerDay: number;
}

export const DeadlineRiskPredictor: React.FC = () => {
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const orgId = getCurrentOrgId();
      if (!orgId) return;
      try {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, end_date, created_at')
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .not('end_date', 'is', null);

        if (!projects?.length) return;

        const projectRisks: ProjectRisk[] = [];

        for (const project of projects) {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('status, created_at, updated_at')
            .eq('project_id', project.id);

          if (!tasks?.length) continue;

          const total = tasks.length;
          const completed = tasks.filter(t =>
            ['done', 'completed', 'closed', 'resolved'].some(s => t.status?.toLowerCase().includes(s))
          ).length;
          const remaining = total - completed;

          const daysLeft = Math.ceil(
            (new Date(project.end_date).getTime() - Date.now()) / 86400000
          );
          if (daysLeft < 0 || daysLeft > 90) continue;

          // Calculate actual pace — tasks completed per day over project lifetime
          const projectAgeDays = Math.max(1, Math.ceil(
            (Date.now() - new Date(project.created_at).getTime()) / 86400000
          ));
          const actualPace = completed / projectAgeDays;
          const requiredPace = daysLeft > 0 ? remaining / daysLeft : remaining;

          // Completion probability
          const paceRatio = requiredPace > 0 ? actualPace / requiredPace : 1;
          const probability = Math.max(5, Math.min(99, Math.round(paceRatio * 100)));

          if (probability < 70) {
            projectRisks.push({
              id: project.id,
              name: project.name,
              completionProbability: probability,
              daysLeft,
              tasksRemaining: remaining,
              tasksTotal: total,
              requiredPacePerDay: Math.round(requiredPace * 10) / 10,
              actualPacePerDay: Math.round(actualPace * 10) / 10,
            });
          }
        }

        setRisks(projectRisks.sort((a, b) => a.completionProbability - b.completionProbability));
      } catch (e) {
        console.error('DeadlineRiskPredictor error:', e);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  if (loading || risks.length === 0) return null;

  return (
    <div className="mx-8 mb-6 rounded-xl border border-red-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-red-50 border-b border-red-100">
        <TrendingDown className="w-4 h-4 text-red-600" />
        <p className="text-sm font-medium text-red-900">Deadline Risk Alert</p>
        <span className="text-xs text-red-500 ml-1">— {risks.length} project{risks.length !== 1 ? 's' : ''} unlikely to finish on time</span>
      </div>
      <div className="divide-y divide-gray-50">
        {risks.map(r => (
          <div
            key={r.id}
            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => navigate(`/projects/${r.id}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {r.tasksRemaining} tasks left · {r.daysLeft} days · needs {r.requiredPacePerDay}/day, doing {r.actualPacePerDay}/day
              </p>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <div className="text-right">
                <p className={`text-sm font-semibold ${r.completionProbability < 40 ? 'text-red-600' : 'text-amber-600'}`}>
                  {r.completionProbability}%
                </p>
                <p className="text-xs text-gray-400">on-time</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
