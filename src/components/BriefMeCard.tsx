import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronUp, Sparkles, AlertTriangle, Calendar, Users, TrendingUp, Zap } from 'lucide-react';

interface BriefItem {
  type: 'overdue' | 'leave' | 'overloaded' | 'risk' | 'velocity' | 'ai';
  message: string;
  detail?: string;
}

interface BriefStats {
  tasksCompletedToday: number;
  pendingLeaveRequests: number;
  aiSuggestionsPending: number;
  teamOnLeaveToday: number;
}

export const BriefMeCard: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<BriefItem[]>([]);
  const [stats, setStats] = useState<BriefStats>({
    tasksCompletedToday: 0,
    pendingLeaveRequests: 0,
    aiSuggestionsPending: 0,
    teamOnLeaveToday: 0,
  });
  const [expanded, setExpanded] = useState(false);
  const [fullBriefing, setFullBriefing] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingFull, setLoadingFull] = useState(false);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    const load = async () => {
      const orgId = getCurrentOrgId();
      if (!orgId) return;
      try {
        const today = new Date().toISOString().split('T')[0];
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const weekOut = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
        const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString();

        const [
          overdueRes,
          leaveRes,
          tasksRes,
          completedTodayRes,
          pendingLeaveRes,
          aiRes,
          recentTasksRes,
          prevTasksRes,
        ] = await Promise.all([
          supabase
            .from('tasks')
            .select('name, assignee_id, users(name)')
            .eq('status', 'not_started')
            .lt('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
            .not('assignee_id', 'is', null)
            .limit(5),
          supabase
            .from('leave_requests')
            .select('*, users(name)')
            .eq('status', 'approved')
            .gte('start_date', today)
            .lte('start_date', weekOut)
            .limit(5),
          supabase
            .from('tasks')
            .select('assignee_id, users(name)')
            .neq('status', 'completed')
            .not('assignee_id', 'is', null),
          supabase
            .from('tasks')
            .select('id')
            .eq('status', 'completed')
            .gte('updated_at', todayStart.toISOString()),
          supabase.from('leave_requests').select('id').eq('status', 'pending'),
          supabase.from('ai_task_suggestions').select('id').eq('status', 'pending'),
          supabase
            .from('tasks')
            .select('id')
            .eq('status', 'completed')
            .gte('updated_at', twoWeeksAgo),
          supabase
            .from('tasks')
            .select('id')
            .eq('status', 'completed')
            .gte('updated_at', fourWeeksAgo)
            .lt('updated_at', twoWeeksAgo),
        ]);

        const brief: BriefItem[] = [];

        if (overdueRes.data?.length) {
          brief.push({
            type: 'overdue',
            message: `${overdueRes.data.length} overdue task${overdueRes.data.length > 1 ? 's' : ''} need attention`,
            detail: (overdueRes.data[0] as any).name,
          });
        }

        if (leaveRes.data?.length) {
          const onToday = leaveRes.data.filter((l: any) => l.start_date === today);
          if (onToday.length > 0) {
            brief.push({
              type: 'leave',
              message: `${onToday.length} team member${onToday.length > 1 ? 's' : ''} on leave today`,
              detail: onToday.map((l: any) => l.users?.name).join(', '),
            });
          } else {
            brief.push({
              type: 'leave',
              message: `${leaveRes.data.length} upcoming leave this week`,
              detail: `${(leaveRes.data[0] as any).users?.name} starting ${new Date(
                (leaveRes.data[0] as any).start_date
              ).toLocaleDateString('en-US', { weekday: 'short' })}`,
            });
          }
        }

        if (tasksRes.data) {
          const counts: Record<string, { name: string; count: number }> = {};
          tasksRes.data.forEach((t: any) => {
            const uid = t.assignee_id;
            if (!counts[uid]) counts[uid] = { name: t.users?.name || 'Someone', count: 0 };
            counts[uid].count++;
          });
          const overloaded = Object.values(counts).filter(c => c.count >= 8);
          if (overloaded.length > 0) {
            brief.push({
              type: 'overloaded',
              message: `${overloaded[0].name} is overloaded`,
              detail: `${overloaded[0].count} tasks assigned`,
            });
          }
        }

        const thisMonth = recentTasksRes.data?.length || 0;
        const prevMonth = prevTasksRes.data?.length || 0;
        if (prevMonth > 0) {
          const trend = Math.round(((thisMonth - prevMonth) / prevMonth) * 100);
          if (Math.abs(trend) >= 10) {
            brief.push({
              type: 'velocity',
              message: `Team velocity ${trend > 0 ? 'up' : 'down'} ${Math.abs(trend)}% vs last 2 weeks`,
              detail: `${thisMonth} tasks completed recently`,
            });
          }
        }

        const aiPending = aiRes.data?.length || 0;
        if (aiPending > 0) {
          brief.push({
            type: 'ai',
            message: `${aiPending} AI suggestion${aiPending > 1 ? 's' : ''} waiting for review`,
            detail: 'From recent meeting transcripts',
          });
        }

        setItems(brief);
        setStats({
          tasksCompletedToday: completedTodayRes.data?.length || 0,
          pendingLeaveRequests: pendingLeaveRes.data?.length || 0,
          aiSuggestionsPending: aiPending,
          teamOnLeaveToday: leaveRes.data?.filter((l: any) => l.start_date === today).length || 0,
        });
      } catch (e) {
        console.error('BriefMeCard error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFullBriefing = async () => {
    if (fullBriefing) {
      setExpanded(!expanded);
      return;
    }
    setLoadingFull(true);
    try {
      const summary = items
        .map(i => `- ${i.message}${i.detail ? ` (${i.detail})` : ''}`)
        .join('\n');
      const res = await fetch('/api/ai/expand-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Daily manager briefing',
          description: `Generate a concise, actionable daily briefing for a manager. Status:\n${summary}\n\nProvide 2-3 specific action recommendations in a direct, executive tone. No fluff.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFullBriefing(data.description || summary);
      }
      setExpanded(true);
    } catch (e) {
      setExpanded(true);
    } finally {
      setLoadingFull(false);
    }
  };

  if (loading) return null;

  const typeConfig: Record<
    BriefItem['type'],
    { icon: React.ReactNode; color: string; bg: string }
  > = {
    overdue: {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-100',
    },
    leave: {
      icon: <Calendar className="w-3.5 h-3.5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-100',
    },
    overloaded: {
      icon: <Users className="w-3.5 h-3.5" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
    },
    risk: {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-100',
    },
    velocity: {
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      color: 'text-[#0F766E]',
      bg: 'bg-teal-50 border-teal-100',
    },
    ai: {
      icon: <Zap className="w-3.5 h-3.5" />,
      color: 'text-violet-600',
      bg: 'bg-violet-50 border-violet-100',
    },
  };

  return (
    <div className="mx-8 mb-6 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#FAFAF9] to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#030213] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {greeting}, {firstName}.
              </p>
              <p className="text-xs text-gray-400 font-light">{dateLabel}</p>
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleFullBriefing}
              disabled={loadingFull}
              className="flex items-center gap-1.5 text-xs text-[#030213] font-medium bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              {loadingFull ? (
                <>
                  <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                  Generating...
                </>
              ) : expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Less
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Full briefing
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        {[
          { label: 'Done today', value: stats.tasksCompletedToday, color: 'text-[#0F766E]' },
          { label: 'On leave today', value: stats.teamOnLeaveToday, color: 'text-blue-600' },
          { label: 'Leave pending', value: stats.pendingLeaveRequests, color: 'text-amber-600' },
          { label: 'AI suggestions', value: stats.aiSuggestionsPending, color: 'text-violet-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="px-4 py-3 text-center">
            <p className={`text-xl font-light ${color}`}>{value}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Alert items */}
      {items.length > 0 ? (
        <div className="px-5 py-3 space-y-2">
          {items.map((item, i) => {
            const cfg = typeConfig[item.type];
            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border ${cfg.bg}`}
              >
                <span className={`mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${cfg.color}`}>{item.message}</p>
                  {item.detail && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-4">
          <p className="text-sm text-gray-400 text-center">
            All clear — no issues to flag today ✅
          </p>
        </div>
      )}

      {/* AI full briefing */}
      {expanded && fullBriefing && (
        <div className="mx-5 mb-4 p-4 bg-[#030213]/[0.03] rounded-xl border border-[#030213]/10">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-[#030213]" />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              AI Recommendations
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{fullBriefing}</p>
          </div>
        </div>
      )}
    </div>
  );
};
