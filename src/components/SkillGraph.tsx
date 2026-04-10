import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';

interface EngineerSkills {
  userId: string;
  name: string;
  skills: { skill: string; count: number; confidence: number }[];
}

interface SkillGraphProps {
  tasks: any[];
}

export const SkillGraph: React.FC<SkillGraphProps> = ({ tasks }) => {
  const [engineers, setEngineers] = useState<EngineerSkills[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    try {
      // Filter for completed tasks
      const completedTasks = tasks.filter(t => t.status === 'completed' && t.assignee_id);
      if (!completedTasks.length) return;

      const userSkillCounts: Record<string, { name: string; skills: Record<string, number> }> = {};

      completedTasks.forEach((task: any) => {
        const uid = task.assignee_id;
        const name = (task.users as any)?.name || 'Unknown';
        const taskName = (task.name || '').toLowerCase();

        if (!userSkillCounts[uid]) userSkillCounts[uid] = { name, skills: {} };

        Object.entries(SKILL_KEYWORDS).forEach(([skill, keywords]) => {
          if (keywords.some(kw => taskName.includes(kw))) {
            userSkillCounts[uid].skills[skill] = (userSkillCounts[uid].skills[skill] || 0) + 1;
          }
        });
      });

      const result: EngineerSkills[] = Object.entries(userSkillCounts)
        .map(([uid, data]) => {
          const maxCount = Math.max(...Object.values(data.skills), 1);
          return {
            userId: uid,
            name: data.name,
            skills: Object.entries(data.skills)
              .filter(([, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([skill, count]) => ({
                skill,
                count,
                confidence: Math.min(Math.round((count / maxCount) * 100), 100),
              })),
          };
        })
        .filter(e => e.skills.length > 0);

      setEngineers(result);
    } catch (e) {
      console.error('SkillGraph calculation error:', e);
    }
  }, [tasks]);

  if (loading) return (
    <div className="p-6 text-center text-sm text-gray-400">Loading skill data...</div>
  );

  if (engineers.length === 0) return (
    <div className="p-6 text-center text-sm text-gray-400">
      Complete tasks to see skill graphs build over time.
    </div>
  );

  return (
    <div className="space-y-6">
      {engineers.map((eng) => (
        <div key={eng.userId} className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
              {eng.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <p className="text-sm font-medium text-gray-900">{eng.name}</p>
            <span className="text-xs text-gray-400">{eng.skills.length} skills detected</span>
          </div>
          <div className="space-y-2">
            {eng.skills.map((s) => (
              <div key={s.skill} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-24 flex-shrink-0">{s.skill}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${s.confidence}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{s.count}x</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
