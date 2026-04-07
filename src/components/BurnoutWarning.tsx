import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { AlertTriangle, TrendingDown } from 'lucide-react';

interface BurnoutRisk {
  userId: string;
  name: string;
  velocityDrop: number; // percentage drop
  tasksOverdue: number;
  hoursThisWeek: number;
  riskLevel: 'high' | 'medium';
}

export const BurnoutWarning: React.FC = () => {
  const [risks, setRisks] = useState<BurnoutRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const orgId = getCurrentOrgId();
      if (!orgId) return;

      try {
        // Get tasks completed per user in last 2 weeks vs previous 2 weeks
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const { data: recentTasks } = await supabase
          .from('tasks')
          .select('assignee_id, status, estimated_hours, updated_at, users(name)')
          .gte('updated_at', fourWeeksAgo.toISOString())
          .not('assignee_id', 'is', null);

        if (!recentTasks) return;

        // Group by user and calculate velocity
        const userStats: Record<string, { name: string; recent: number; previous: number; overdue: number; hours: number }> = {};

        recentTasks.forEach((task: any) => {
          const uid = task.assignee_id;
          const name = task.users?.name || 'Unknown';
          if (!userStats[uid]) userStats[uid] = { name, recent: 0, previous: 0, overdue: 0, hours: 0 };

          const updatedAt = new Date(task.updated_at);
          const isDone = task.status === 'completed' || task.status === 'done';

          if (updatedAt >= twoWeeksAgo) {
            if (isDone) userStats[uid].recent++;
            userStats[uid].hours += task.estimated_hours || 0;
          } else {
            if (isDone) userStats[uid].previous++;
          }

          if (task.status === 'not_started' && updatedAt < twoWeeksAgo) {
            userStats[uid].overdue++;
          }
        });

        // Flag users with significant velocity drop
        const flagged: BurnoutRisk[] = [];
        Object.entries(userStats).forEach(([uid, stats]) => {
          if (stats.previous === 0) return;
          const drop = ((stats.previous - stats.recent) / stats.previous) * 100;

          if (drop >= 40 || stats.overdue >= 3 || stats.hours > 60) {
            flagged.push({
              userId: uid,
              name: stats.name,
              velocityDrop: Math.round(drop),
              tasksOverdue: stats.overdue,
              hoursThisWeek: Math.round(stats.hours),
              riskLevel: drop >= 50 || stats.hours > 70 ? 'high' : 'medium',
            });
          }
        });

        setRisks(flagged.sort((a, b) => (b.riskLevel === 'high' ? 1 : 0) - (a.riskLevel === 'high' ? 1 : 0)));
      } catch (e) {
        console.error('BurnoutWarning error:', e);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  if (loading || risks.length === 0) return null;

  return (
    <div className="mx-8 mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <p className="text-sm font-medium text-amber-900">Burnout Risk Detected</p>
      </div>
      <div className="space-y-2">
        {risks.map((r) => (
          <div key={r.userId} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${r.riskLevel === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <span className="text-sm font-medium text-gray-900">{r.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {r.velocityDrop > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <TrendingDown className="w-3 h-3" />
                  {r.velocityDrop}% slower
                </span>
              )}
              {r.tasksOverdue > 0 && <span>{r.tasksOverdue} overdue</span>}
              {r.hoursThisWeek > 50 && <span>{r.hoursThisWeek}h this week</span>}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-amber-700 mt-2">Consider checking in with these team members.</p>
    </div>
  );
};
