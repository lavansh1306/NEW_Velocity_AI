import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { MessageSquare, RefreshCw } from 'lucide-react';

interface StandupSummary {
  date: string;
  completed: { name: string; task: string }[];
  inProgress: { name: string; task: string }[];
  blocked: { name: string; task: string }[];
}

export const StandupCard: React.FC = () => {
  const [standup, setStandup] = useState<StandupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('standup_dismissed') === new Date().toDateString()
  );

  useEffect(() => {
    const generate = async () => {
      const orgId = getCurrentOrgId();
      if (!orgId) return;

      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Tasks completed yesterday
        const { data: completedTasks } = await supabase
          .from('tasks')
          .select('name, assignee_id, users(name)')
          .eq('status', 'completed')
          .gte('updated_at', yesterday.toISOString())
          .lt('updated_at', new Date().toISOString())
          .not('assignee_id', 'is', null)
          .limit(10);

        // Tasks in progress
        const { data: activeTasks } = await supabase
          .from('tasks')
          .select('name, assignee_id, users(name)')
          .eq('status', 'in_progress')
          .not('assignee_id', 'is', null)
          .limit(10);

        // Overdue tasks
        const { data: overdueTasks } = await supabase
          .from('tasks')
          .select('name, assignee_id, users(name)')
          .eq('status', 'not_started')
          .lt('created_at', yesterday.toISOString())
          .not('assignee_id', 'is', null)
          .limit(5);

        setStandup({
          date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
          completed: (completedTasks || []).map((t: any) => ({ name: t.users?.name || 'Someone', task: t.name })),
          inProgress: (activeTasks || []).map((t: any) => ({ name: t.users?.name || 'Someone', task: t.name })),
          blocked: (overdueTasks || []).map((t: any) => ({ name: t.users?.name || 'Someone', task: t.name })),
        });
      } catch (e) {
        console.error('Standup error:', e);
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, []);

  if (dismissed || loading) return null;
  if (!standup) return null;
  if (standup.completed.length === 0 && standup.inProgress.length === 0) return null;

  const handleDismiss = () => {
    localStorage.setItem('standup_dismissed', new Date().toDateString());
    setDismissed(true);
  };

  return (
    <div className="mx-8 mb-6 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-gray-900">Daily Standup — {standup.date}</p>
        </div>
        <button onClick={handleDismiss} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
      </div>

      <div className="p-5 grid grid-cols-3 gap-4">
        {standup.completed.length > 0 && (
          <div>
            <p className="text-xs font-medium text-green-700 mb-2">✅ Completed yesterday</p>
            <div className="space-y-1">
              {standup.completed.slice(0, 3).map((item, i) => (
                <p key={i} className="text-xs text-gray-600">
                  <span className="font-medium">{item.name}:</span> {item.task}
                </p>
              ))}
            </div>
          </div>
        )}

        {standup.inProgress.length > 0 && (
          <div>
            <p className="text-xs font-medium text-blue-700 mb-2">🔄 In progress today</p>
            <div className="space-y-1">
              {standup.inProgress.slice(0, 3).map((item, i) => (
                <p key={i} className="text-xs text-gray-600">
                  <span className="font-medium">{item.name}:</span> {item.task}
                </p>
              ))}
            </div>
          </div>
        )}

        {standup.blocked.length > 0 && (
          <div>
            <p className="text-xs font-medium text-red-700 mb-2">⚠️ Needs attention</p>
            <div className="space-y-1">
              {standup.blocked.slice(0, 3).map((item, i) => (
                <p key={i} className="text-xs text-gray-600">
                  <span className="font-medium">{item.name}:</span> {item.task}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
