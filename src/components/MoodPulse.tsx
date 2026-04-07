import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { useAuth } from '@/contexts/AuthContext';
import { Heart } from 'lucide-react';

export const MoodPulseWidget: React.FC = () => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [teamAvg, setTeamAvg] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    const last = localStorage.getItem('mood_pulse_date');
    return last === new Date().toDateString();
  });

  useEffect(() => {
    // Check if already submitted today
    const lastSubmit = localStorage.getItem('mood_pulse_submitted');
    if (lastSubmit === new Date().toDateString()) {
      setSubmitted(true);
      loadTeamAvg();
    }
  }, []);

  const loadTeamAvg = async () => {
    const orgId = getCurrentOrgId();
    if (!orgId) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    try {
      const { data } = await supabase
        .from('mood_pulses')
        .select('score')
        .eq('organization_id', orgId)
        .gte('created_at', weekAgo.toISOString());
      if (data && data.length > 0) {
        const avg = data.reduce((sum, d) => sum + d.score, 0) / data.length;
        setTeamAvg(Math.round(avg * 10) / 10);
      }
    } catch (e) { /* table may not exist yet */ }
  };

  const handleSubmit = async (value: number) => {
    setScore(value);
    try {
      await supabase.from('mood_pulses').insert({
        user_id: user?.id,
        organization_id: getCurrentOrgId(),
        score: value,
        week: new Date().toISOString().split('T')[0],
      });
      localStorage.setItem('mood_pulse_submitted', new Date().toDateString());
      setSubmitted(true);
      loadTeamAvg();
    } catch (e) {
      // Table may not exist — still show as submitted
      setSubmitted(true);
    }
  };

  // Only show on Mondays or if never dismissed
  const isMonday = new Date().getDay() === 1;
  if (dismissed || (!isMonday && localStorage.getItem('mood_pulse_submitted') === new Date().toDateString())) return null;

  return (
    <div className="mx-8 mb-6 rounded-xl border border-pink-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-pink-50 border-b border-pink-100">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-500" />
          <p className="text-sm font-medium text-gray-900">Team Pulse Check</p>
          <span className="text-xs text-gray-400">— anonymous, takes 2 seconds</span>
        </div>
        <button onClick={() => { setDismissed(true); localStorage.setItem('mood_pulse_date', new Date().toDateString()); }} className="text-xs text-gray-400 hover:text-gray-600">Skip</button>
      </div>

      <div className="px-5 py-4">
        {!submitted ? (
          <>
            <p className="text-sm text-gray-700 mb-3">How are you feeling about your workload this week?</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  onClick={() => handleSubmit(v)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all text-center group"
                >
                  <span className="text-xl">{['😩', '😔', '😐', '😊', '🤩'][v - 1]}</span>
                  <p className="text-xs text-gray-400 mt-1 group-hover:text-pink-500">{v}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Thanks for sharing! {score ? `You rated ${score}/5` : ''}</p>
              {teamAvg && <p className="text-xs text-gray-400 mt-1">Team average this week: <span className="font-medium text-gray-700">{teamAvg}/5</span></p>}
            </div>
            <span className="text-2xl">{score ? ['😩', '😔', '😐', '😊', '🤩'][score - 1] : '✅'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Manager view — shows team aggregate
export const MoodPulseDashboard: React.FC = () => {
  const [weeklyScores, setWeeklyScores] = useState<{ week: string; avg: number; count: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const orgId = getCurrentOrgId();
      if (!orgId) return;
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 28);
      try {
        const { data } = await supabase
          .from('mood_pulses')
          .select('score, week')
          .eq('organization_id', orgId)
          .gte('created_at', monthAgo.toISOString())
          .order('week', { ascending: false });

        if (!data) return;
        const byWeek: Record<string, number[]> = {};
        data.forEach(d => {
          if (!byWeek[d.week]) byWeek[d.week] = [];
          byWeek[d.week].push(d.score);
        });
        const result = Object.entries(byWeek).map(([week, scores]) => ({
          week,
          avg: Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10,
          count: scores.length,
        }));
        setWeeklyScores(result);
      } catch (e) { /* table may not exist */ }
    };
    load();
  }, []);

  if (weeklyScores.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4 text-pink-500" />
        <h3 className="text-sm font-medium text-gray-900">Team Mood — Last 4 Weeks</h3>
      </div>
      <div className="space-y-3">
        {weeklyScores.slice(0, 4).map(({ week, avg, count }) => (
          <div key={week} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-20">{new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-pink-400 rounded-full" style={{ width: `${(avg / 5) * 100}%` }} />
            </div>
            <span className="text-sm font-medium text-gray-700 w-8">{avg}/5</span>
            <span className="text-xs text-gray-400">{count} responses</span>
          </div>
        ))}
      </div>
    </div>
  );
};
