import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { Zap, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SyncActivity {
  id: string;
  taskName: string;
  sourceMeetingId: string | null;
  createdAt: string;
  status: string;
  suggestedUserName?: string;
}

export const AgentSyncCard: React.FC = () => {
  const [activities, setActivities] = useState<SyncActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const orgId = getCurrentOrgId();
      if (!orgId) return;

      try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { data } = await supabase
          .from('ai_task_suggestions')
          .select('id, task_name, source_meeting_id, created_at, status, users(name)')
          .gte('created_at', threeDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        if (data) {
          setActivities(data.map((s: any) => ({
            id: s.id,
            taskName: s.task_name,
            sourceMeetingId: s.source_meeting_id,
            createdAt: s.created_at,
            status: s.status,
            suggestedUserName: s.users?.name,
          })));
        }
      } catch (e) {
        console.error('AgentSyncCard error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || activities.length === 0) return null;

  const pending = activities.filter(a => a.status === 'pending').length;
  const approved = activities.filter(a => a.status === 'approved').length;

  // Group by source meeting
  const byMeeting: Record<string, SyncActivity[]> = {};
  activities.forEach(a => {
    const key = a.sourceMeetingId || 'Unknown meeting';
    if (!byMeeting[key]) byMeeting[key] = [];
    byMeeting[key].push(a);
  });

  return (
    <div className="mx-8 mb-6 rounded-xl border border-violet-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-violet-50 border-b border-violet-100">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-600" />
          <p className="text-sm font-medium text-violet-900">Agent synced tasks from your meetings</p>
        </div>
        <div className="flex items-center gap-3">
          {pending > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {pending} pending review
            </span>
          )}
          {approved > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {approved} approved
            </span>
          )}
        </div>
      </div>

      {/* Activities */}
      <div className="divide-y divide-gray-50">
        {Object.entries(byMeeting).map(([meetingId, tasks]) => (
          <div key={meetingId} className="px-5 py-3">
            <p className="text-xs text-gray-400 mb-2 truncate">
              📝 {meetingId === 'Unknown meeting' ? 'Recent meeting' : meetingId}
              <span className="ml-2 text-violet-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''} extracted</span>
            </p>
            <div className="space-y-1.5">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {task.status === 'approved'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      : <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    }
                    <span className="text-sm text-gray-700 truncate">{task.taskName}</span>
                    {task.suggestedUserName && (
                      <span className="text-xs text-gray-400 flex-shrink-0">→ {task.suggestedUserName}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {pending > 0 && (
        <div
          className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => navigate('/agent')}
        >
          <span className="text-xs text-violet-600 font-medium">Review {pending} pending suggestion{pending !== 1 ? 's' : ''}</span>
          <ChevronRight className="w-4 h-4 text-violet-400" />
        </div>
      )}
    </div>
  );
};
