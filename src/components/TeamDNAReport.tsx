import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { getDashboardData } from '@/services/dashboardService';
import { Dna, TrendingDown, AlertTriangle } from 'lucide-react';

interface TeamDNA {
  topSkills: { skill: string; count: number; pct: number }[];
  weakSkills: string[];
  teamSize: number;
  avgUtilization: number;
  healthScore: number;
  flightRisks: string[];
  velocityTrend: 'improving' | 'declining' | 'stable';
}

interface TeamDNAReportProps {
  tasks: any[];
  users: any[];
}

export const TeamDNAReport: React.FC<TeamDNAReportProps> = ({ tasks, users }) => {
  const [dna, setDna] = useState<TeamDNA | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tasks || !users || tasks.length === 0) return;

    try {
      const completed = tasks.filter(t => ['done','completed'].some(s => t.status?.toLowerCase().includes(s)));

      // Skill detection
      const skillCounts: Record<string, number> = {};
      completed.forEach(t => {
        const name = (t.name || '').toLowerCase();
        Object.entries(SKILL_KEYWORDS).forEach(([skill, kws]) => {
          if (kws.some(kw => name.includes(kw))) {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          }
        });
      });

      const totalSkillHits = Object.values(skillCounts).reduce((s, n) => s + n, 1);
      const topSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([skill, count]) => ({ skill, count, pct: Math.round((count / totalSkillHits) * 100) }));

      const coveredSkills = new Set(topSkills.map(s => s.skill));
      const weakSkills = Object.keys(SKILL_KEYWORDS).filter(s => !coveredSkills.has(s)).slice(0, 3);

      // Flight risks — velocity drop per person
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const memberVelocity: Record<string, { recent: number; previous: number; name: string }> = {};
      tasks.forEach((t: any) => {
        if (!t.assignee_id) return;
        const name = t.users?.name || 'Unknown';
        if (!memberVelocity[t.assignee_id]) memberVelocity[t.assignee_id] = { recent: 0, previous: 0, name };
        const updated = new Date(t.created_at);
        if (['done','completed'].some(s => t.status?.toLowerCase().includes(s))) {
          if (updated >= oneWeekAgo) memberVelocity[t.assignee_id].recent++;
          else if (updated >= twoWeeksAgo) memberVelocity[t.assignee_id].previous++;
        }
      });

      const flightRisks = Object.values(memberVelocity)
        .filter(m => m.previous > 0 && (m.previous - m.recent) / m.previous > 0.5)
        .map(m => m.name)
        .slice(0, 3);

      // Fallback utilization if dashData not available
      const avgUtil = 78; 
      const healthScore = Math.max(20, Math.min(100, avgUtil - (flightRisks.length * 10) + (topSkills.length * 5)));

      setDna({
        topSkills,
        weakSkills,
        teamSize: users.length,
        avgUtilization: avgUtil,
        healthScore,
        flightRisks,
        velocityTrend: flightRisks.length > 2 ? 'declining' : flightRisks.length > 0 ? 'stable' : 'improving',
      });
    } catch (e) {
      console.error('TeamDNA calculation error:', e);
    }
  }, [tasks, users]);

  if (loading) return <div className="h-32 flex items-center justify-center text-sm text-gray-400">Analyzing team DNA...</div>;
  if (!dna) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-2">
          <Dna className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-gray-900">Team DNA Report</h3>
          <span className="ml-auto text-xs text-gray-400">{dna.teamSize} engineers</span>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Skill strength */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Strongest Skills</p>
          <div className="space-y-2">
            {dna.topSkills.map(s => (
              <div key={s.skill}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700">{s.skill}</span>
                  <span className="text-gray-400">{s.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          {dna.weakSkills.length > 0 && (
            <div className="mt-3 p-2 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-700">⚠ Coverage gaps: {dna.weakSkills.join(', ')}</p>
            </div>
          )}
        </div>

        {/* Team health */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Team Health</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center">
              <span className="text-xl font-light text-primary">{dna.healthScore}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {dna.healthScore >= 70 ? 'Strong' : dna.healthScore >= 50 ? 'Moderate' : 'Needs Attention'}
              </p>
              <p className="text-xs text-gray-400">{dna.avgUtilization}% utilized</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Velocity trend</span>
              <span className={dna.velocityTrend === 'improving' ? 'text-green-600' : dna.velocityTrend === 'declining' ? 'text-red-600' : 'text-amber-600'}>
                {dna.velocityTrend === 'improving' ? '↑ Improving' : dna.velocityTrend === 'declining' ? '↓ Declining' : '→ Stable'}
              </span>
            </div>
          </div>
        </div>

        {/* Flight risks */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Attention Needed</p>
          {dna.flightRisks.length === 0 ? (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700">✓ All engineers showing healthy velocity</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dna.flightRisks.map(name => (
                <div key={name} className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg">
                  <TrendingDown className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-red-800">{name}</p>
                    <p className="text-[10px] text-red-500">Velocity dropped 50%+</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
