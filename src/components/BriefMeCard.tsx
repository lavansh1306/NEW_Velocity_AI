import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardData } from '@/services/dashboardService';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface BriefItem {
  type: 'overdue' | 'leave' | 'overloaded' | 'risk';
  message: string;
}

export const BriefMeCard: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<BriefItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [fullBriefing, setFullBriefing] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingFull, setLoadingFull] = useState(false);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const load = async () => {
      const orgId = getCurrentOrgId();
      if (!orgId) return;
      try {
        const [dashData, overdueRes, leaveRes, tasksRes] = await Promise.all([
          getDashboardData(),
          supabase.from('tasks').select('name, assignee_id, users(name)').eq('status', 'not_started').lt('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).not('assignee_id', 'is', null).limit(5),
          supabase.from('leave_requests').select('*, users(name)').eq('status', 'approved').gte('start_date', new Date().toISOString().split('T')[0]).lte('start_date', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]).limit(5),
          supabase.from('tasks').select('assignee_id, users(name)').neq('status', 'completed').not('assignee_id', 'is', null),
        ]);

        const brief: BriefItem[] = [];

        // Overdue tasks
        if (overdueRes.data?.length) {
          const project = (overdueRes.data[0] as any).name;
          brief.push({ type: 'overdue', message: `${overdueRes.data.length} task${overdueRes.data.length > 1 ? 's' : ''} overdue — ${project}` });
        }

        // Upcoming leave
        if (leaveRes.data?.length) {
          leaveRes.data.slice(0, 2).forEach((l: any) => {
            const start = new Date(l.start_date).toLocaleDateString('en-US', { weekday: 'short' });
            const end = new Date(l.end_date).toLocaleDateString('en-US', { weekday: 'short' });
            brief.push({ type: 'leave', message: `${l.users?.name} is on leave ${start}–${end}` });
          });
        }

        // Overloaded members (>8 tasks)
        if (tasksRes.data) {
          const counts: Record<string, { name: string; count: number }> = {};
          tasksRes.data.forEach((t: any) => {
            const uid = t.assignee_id;
            if (!counts[uid]) counts[uid] = { name: t.users?.name || 'Someone', count: 0 };
            counts[uid].count++;
          });
          Object.values(counts).filter(c => c.count >= 8).forEach(c => {
            brief.push({ type: 'overloaded', message: `${c.name} is overloaded — ${c.count} tasks assigned` });
          });
        }

        // Projects at risk
        const atRisk = (dashData as any)?.kpis?.find((k: any) => k.label === 'PROJECTS AT RISK');
        if (atRisk?.value > 0) {
          brief.push({ type: 'risk', message: `${atRisk.value} project${atRisk.value > 1 ? 's' : ''} at risk this week` });
        }

        setItems(brief);
      } catch (e) {
        console.error('BriefMeCard error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFullBriefing = async () => {
    if (fullBriefing) { setExpanded(!expanded); return; }
    setLoadingFull(true);
    try {
      const summary = items.map(i => `- ${i.message}`).join('\n');
      const res = await fetch('/api/ai/expand-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Daily team briefing',
          description: `Generate a concise daily briefing for a manager based on these team status items:\n${summary}\n\nProvide actionable insights and recommendations in 3-4 sentences.`
        })
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

  if (loading || items.length === 0) return null;

  const icons: Record<BriefItem['type'], string> = {
    overdue: '⚠️',
    leave: '🌴',
    overloaded: '🔴',
    risk: '📉',
  };

  return (
    <div className="mx-8 mb-6 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-gray-900">
              {greeting}, {firstName}. Here's your team today.
            </p>
          </div>
          <button
            onClick={handleFullBriefing}
            disabled={loadingFull}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {loadingFull ? 'Generating...' : expanded ? 'Show less' : 'Get full briefing'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <div className="px-5 py-3 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <span>{icons[item.type]}</span>
            <span>{item.message}</span>
          </div>
        ))}
      </div>

      {expanded && fullBriefing && (
        <div className="mx-5 mb-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-sm text-gray-700 leading-relaxed">{fullBriefing}</p>
        </div>
      )}
    </div>
  );
};
