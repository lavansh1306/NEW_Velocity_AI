import React, { useEffect, useState } from 'react';
import { loadProjects, loadAsanaTasksByProject } from '@/lib/dataService';

const HOURS_PER_TASK = 1.5;
const FRACTIONAL_PERCENT = 0.4;

interface ProjectSummary {
  id: string;
  title: string;
  total: number;
  blocked: number;
  fractional: number;
}

// Blocking rules (must mirror CapacityLedgerTab rules)
const BLOCKING_RULES = [
  { blockedTeam: 'Frontend', upstreamTeam: 'Design', blockingStatuses: ['designing', 'design_review', 'awaiting_design', 'in_design', 'design'], unblockStatuses: ['ready_for_dev', 'design_complete', 'design_approved', 'dev_ready'] },
  { blockedTeam: 'QA', upstreamTeam: 'Frontend', blockingStatuses: ['in_progress', 'in_development', 'code_review', 'dev_in_progress', 'implementing'], unblockStatuses: ['ready_for_qa', 'ready_for_testing', 'dev_complete', 'qa_ready', 'done'] },
  { blockedTeam: 'DevOps', upstreamTeam: 'QA', blockingStatuses: ['testing', 'qa_in_progress', 'in_review', 'qa_review'], unblockStatuses: ['ready_for_deployment', 'qa_passed', 'approved', 'deploy_ready'] },
  { blockedTeam: 'Backend', upstreamTeam: 'Design', blockingStatuses: ['designing', 'design_review', 'awaiting_design'], unblockStatuses: ['ready_for_dev', 'design_complete', 'design_approved'] },
];

function isTaskBlocking(statusText: string) {
  const normalized = (statusText || '').toLowerCase().replace(/_/g, ' ');
  const underscore = (statusText || '').toLowerCase().replace(/ /g, '_');
  for (const rule of BLOCKING_RULES) {
    const inBlocking = rule.blockingStatuses.some(bs => normalized.includes(bs.replace(/_/g, ' ')) || underscore.includes(bs.replace(/ /g, '_')) || (statusText || '').toLowerCase().includes(bs));
    const isUnblocked = rule.unblockStatuses.some(us => normalized.includes(us.replace(/_/g, ' ')) || underscore.includes(us.replace(/ /g, '_')) || (statusText || '').toLowerCase().includes(us));
    if (inBlocking && !isUnblocked) return true;
  }
  return false;
}

export default function GlobalCapacity() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      try {
        const projList = await loadProjects();
        const summaries: ProjectSummary[] = [];
        for (const p of projList) {
          const tasks = await loadAsanaTasksByProject(p.id);
          let total = 0;
          let blocked = 0;
          let fractional = 0;
          for (const t of tasks) {
            // estimate hours
            let est = HOURS_PER_TASK;
            // if task includes start/end in details, dataService might have provided it in task.task_name (skip)
            total += est;
            if (t.is_automation && t.assignee) fractional += est * FRACTIONAL_PERCENT;
            const statusText = `${t.status || ''} ${t.from_status || ''} ${t.to_status || ''} ${t.action || ''}`;
            if (isTaskBlocking(statusText)) blocked += est;
          }
          // Sync blocked into total so project totals reflect available + fractional + blocked
          const syncedTotal = total + blocked;
          summaries.push({ id: p.id, title: p.title, total: syncedTotal, blocked, fractional });
        }
        if (mounted) {
          setProjects(summaries);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load GlobalCapacity', err);
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => { mounted = false; };
  }, []);

  const totalBlocked = projects.reduce((s, p) => s + p.blocked, 0);
  const totalFractional = projects.reduce((s, p) => s + p.fractional, 0);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Global Capacity — Blocked & Fractional (All Projects)</h2>
      {loading ? <div className="text-sm text-gray-600">Loading projects...</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-lg font-medium mb-3">Blocked Capacity by Project</div>
            <div className="space-y-2">
              {projects.map(p => {
                const max = Math.max(...projects.map(x => x.blocked), 1);
                const pct = (p.blocked / max) * 100;
                return (
                  <div key={`g-block-${p.id}`} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-700">{p.title}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 h-full flex items-center justify-end pr-3" style={{ width: `${pct}%` }}>
                        <span className="text-white text-xs font-semibold">{p.blocked.toFixed(1)}h</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && <div className="text-sm text-gray-500">No projects found</div>}
            </div>
            <div className="mt-4 text-sm font-semibold">Total blocked: {totalBlocked.toFixed(1)}h</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-lg font-medium mb-3">Fractional Capacity by Project</div>
            <div className="space-y-2">
              {projects.map(p => {
                const max = Math.max(...projects.map(x => x.fractional), 1);
                const pct = (p.fractional / max) * 100;
                return (
                  <div key={`g-frac-${p.id}`} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-700">{p.title}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-full flex items-center justify-end pr-3" style={{ width: `${pct}%` }}>
                        <span className="text-white text-xs font-semibold">{p.fractional.toFixed(1)}h</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && <div className="text-sm text-gray-500">No projects found</div>}
            </div>
            <div className="mt-4 text-sm font-semibold">Total fractional: {totalFractional.toFixed(1)}h</div>
          </div>
        </div>
      )}
    </div>
  );
}
