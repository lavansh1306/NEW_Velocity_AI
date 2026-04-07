import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { useNavigate } from 'react-router-dom';

interface HeatmapCell {
  memberId: string;
  memberName: string;
  projectId: string;
  projectName: string;
  taskCount: number;
  hoursAllocated: number;
  status: 'healthy' | 'busy' | 'overloaded' | 'idle';
}

export const RiskHeatmap: React.FC = () => {
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const orgId = getCurrentOrgId();
      if (!orgId) return;
      try {
        const [projRes, tasksRes] = await Promise.all([
          supabase.from('projects').select('id, name').eq('organization_id', orgId).eq('status', 'active').limit(8),
          supabase.from('tasks').select('assignee_id, project_id, estimated_hours, status, users(name)').neq('status', 'completed').not('assignee_id', 'is', null),
        ]);

        const projectList = projRes.data || [];
        const tasks = tasksRes.data || [];

        // Build member list
        const memberMap: Record<string, string> = {};
        tasks.forEach((t: any) => {
          if (t.assignee_id && t.users?.name) memberMap[t.assignee_id] = t.users.name;
        });
        const memberList = Object.entries(memberMap).map(([id, name]) => ({ id, name }));

        // Build heatmap cells
        const heatCells: HeatmapCell[] = [];
        memberList.forEach(member => {
          projectList.forEach(project => {
            const memberTasks = tasks.filter((t: any) =>
              t.assignee_id === member.id && t.project_id === project.id
            );
            const hours = memberTasks.reduce((s: number, t: any) => s + (t.estimated_hours || 0), 0);
            const count = memberTasks.length;

            let status: HeatmapCell['status'] = 'idle';
            if (count >= 6 || hours >= 30) status = 'overloaded';
            else if (count >= 3 || hours >= 15) status = 'busy';
            else if (count >= 1) status = 'healthy';

            heatCells.push({
              memberId: member.id,
              memberName: member.name,
              projectId: project.id,
              projectName: project.name,
              taskCount: count,
              hoursAllocated: hours,
              status,
            });
          });
        });

        setMembers(memberList.map(m => m.name));
        setProjects(projectList);
        setCells(heatCells);
      } catch (e) {
        console.error('RiskHeatmap error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="h-32 flex items-center justify-center text-sm text-gray-400">Loading heatmap...</div>;
  if (members.length === 0 || projects.length === 0) return null;

  const colors = {
    idle: 'bg-gray-50 border-gray-100 text-gray-300',
    healthy: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    busy: 'bg-amber-50 border-amber-200 text-amber-700',
    overloaded: 'bg-red-50 border-red-200 text-red-700',
  };

  const labels = { idle: '—', healthy: '✓', busy: '!', overloaded: '⚠' };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-900">Risk Heatmap</h3>
        <p className="text-xs text-gray-400 mt-0.5">Team × Project workload distribution</p>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-gray-400 font-normal pb-2 pr-4 min-w-24">Member</th>
              {projects.map(p => (
                <th key={p.id} className="text-center font-normal text-gray-500 pb-2 px-1 min-w-20 max-w-24 truncate" title={p.name}>
                  {p.name.length > 10 ? p.name.slice(0, 10) + '…' : p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="space-y-1">
            {members.map(memberName => (
              <tr key={memberName}>
                <td className="text-gray-700 font-medium pr-4 py-1 whitespace-nowrap">{memberName}</td>
                {projects.map(project => {
                  const cell = cells.find(c => c.memberName === memberName && c.projectId === project.id);
                  const status = cell?.status || 'idle';
                  return (
                    <td key={project.id} className="px-1 py-1 text-center">
                      <div
                        className={`rounded-lg border py-2 px-1 cursor-pointer transition-all hover:opacity-80 ${colors[status]}`}
                        title={cell ? `${cell.taskCount} tasks, ${cell.hoursAllocated}h` : 'No tasks'}
                        onClick={() => cell?.projectId && navigate(`/projects/${cell.projectId}`)}
                      >
                        <div className="font-semibold">{labels[status]}</div>
                        {cell && cell.taskCount > 0 && (
                          <div className="text-[9px] opacity-70">{cell.taskCount}t</div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
          {Object.entries(colors).map(([status, cls]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded border ${cls}`} />
              <span className="text-xs text-gray-500 capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
