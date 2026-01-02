import React, { useMemo } from 'react';
import type { AsanaTask, TeamMember, ProjectAnalytics } from '@/lib/dataService';

interface Props {
  projectId?: string | null;
  asanaTasks?: AsanaTask[];
  teamMembers?: TeamMember[];
  projectAnalytics?: ProjectAnalytics | null;
}

const HOURS_PER_TASK = 1.5;
const FRACTIONAL_PERCENT = 0.4; // 40% when automation and human both touch the task

// Block capacity rules - status-based blocking
// Future: extend with custom dependency chains (Designer → Frontend → QA → DevOps)
interface BlockingRule {
  blockedTeam: string;
  blockingStatuses: string[];
  unblockStatuses: string[];
  upstreamTeam?: string; // Which team causes the block
}

const BLOCKING_RULES: BlockingRule[] = [
  {
    blockedTeam: 'Frontend',
    upstreamTeam: 'Design',
    blockingStatuses: ['designing', 'design_review', 'awaiting_design', 'in_design', 'design'],
    unblockStatuses: ['ready_for_dev', 'design_complete', 'design_approved', 'dev_ready']
  },
  {
    blockedTeam: 'QA',
    upstreamTeam: 'Frontend',
    blockingStatuses: ['in_progress', 'in_development', 'code_review', 'dev_in_progress', 'implementing'],
    unblockStatuses: ['ready_for_qa', 'ready_for_testing', 'dev_complete', 'qa_ready', 'done']
  },
  {
    blockedTeam: 'DevOps',
    upstreamTeam: 'QA',
    blockingStatuses: ['testing', 'qa_in_progress', 'in_review', 'qa_review'],
    unblockStatuses: ['ready_for_deployment', 'qa_passed', 'approved', 'deploy_ready']
  },
  {
    blockedTeam: 'Backend',
    upstreamTeam: 'Design',
    blockingStatuses: ['designing', 'design_review', 'awaiting_design'],
    unblockStatuses: ['ready_for_dev', 'design_complete', 'design_approved']
  }
];

function parseDaysToHours(start?: string, end?: string) {
  if (!start || !end) return null;
  try {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    const days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
    return days * 8; // assume 8h workday
  } catch (err) {
    return null;
  }
}

// Helper to map role titles to team names
function mapRoleToTeam(role: string): string {
  const roleLower = (role || '').toLowerCase();
  if (roleLower.includes('qa') || roleLower.includes('test') || roleLower.includes('quality')) return 'QA';
  if (roleLower.includes('devops') || roleLower.includes('ops') || roleLower.includes('infra') || roleLower.includes('platform')) return 'DevOps';
  if (roleLower.includes('frontend') || roleLower.includes('ui') || roleLower.includes('front-end')) return 'Frontend';
  if (roleLower.includes('backend') || roleLower.includes('back-end') || roleLower.includes('api')) return 'Backend';
  if (roleLower.includes('design') || roleLower.includes('ux')) return 'Design';
  if (roleLower.includes('mobile') || roleLower.includes('ios') || roleLower.includes('android')) return 'Mobile';
  if (roleLower.includes('data') || roleLower.includes('analytics') || roleLower.includes('ml') || roleLower.includes('quant')) return 'Data';
  if (roleLower.includes('lead') || roleLower.includes('manager') || roleLower.includes('architect')) return 'Engineering';
  return 'Technical';
}

export default function CapacityLedgerTab({ projectId, asanaTasks = [], teamMembers = [], projectAnalytics = null }: Props) {
  const byTeam = useMemo(() => {
    const map = new Map<string, { team: string; total: number; blocked: number; fractional: number; members: Set<string>; blockedBy: Map<string, number>; representative?: { name: string; role: string } }>();

    // Build lookup maps from teamMembers to allow fuzzy matching of assignee names
    const nameToTeam = new Map<string, string>();
    const memberNameByKey = new Map<string, { name: string; role: string; member_id: string }>();

    for (const m of teamMembers) {
      if (!m) continue;
      const displayName = (m.name || '').trim();
      const role = (m.role || '').trim();
      const id = (m.member_id || '').toString();
      if (!displayName) continue;

      // primary exact key
      nameToTeam.set(displayName.toLowerCase(), mapRoleToTeam(role || 'Other'));
      memberNameByKey.set(displayName.toLowerCase(), { name: displayName, role, member_id: id });

      // first-name key
      const parts = displayName.split(/\s+/);
      if (parts.length > 0) {
        nameToTeam.set(parts[0].toLowerCase(), mapRoleToTeam(role || 'Other'));
        memberNameByKey.set(parts[0].toLowerCase(), { name: displayName, role, member_id: id });
      }

      // last-name and compact keys
      if (parts.length > 1) {
        nameToTeam.set(parts[parts.length - 1].toLowerCase(), mapRoleToTeam(role || 'Other'));
      }

      // id as key
      if (id) {
        nameToTeam.set(id.toLowerCase(), mapRoleToTeam(role || 'Other'));
        memberNameByKey.set(id.toLowerCase(), { name: displayName, role, member_id: id });
      }
    }

    // Resolve an assignee token to a canonical member display name (if available)
    function resolveAssigneeToken(token?: string) {
      if (!token) return undefined;
      const t = token.toString().trim();
      if (!t) return undefined;
      const lower = t.toLowerCase();

      // Exact or first-name/last-name/id mapping
      if (memberNameByKey.has(lower)) return memberNameByKey.get(lower)!.name;
      if (nameToTeam.has(lower) && memberNameByKey.has(lower)) return memberNameByKey.get(lower)!.name;

      // Try substring match against known member display names
      for (const [k, v] of memberNameByKey.entries()) {
        if (k && lower.includes(k)) return v.name;
      }

      // Try matching first name against members
      const first = lower.split(/\s+/)[0];
      for (const [k, v] of memberNameByKey.entries()) {
        if (k === first) return v.name;
      }

      // Fallback: return original token normalized (preserve readability)
      return t;
    }

    // Build a quick lookup for projectAnalytics.tasks by name
    const taskLookup = new Map<string, { start_date?: string; end_date?: string }>();
    if (projectAnalytics?.tasks) {
      for (const t of projectAnalytics.tasks) {
        if (t.task_name) taskLookup.set(t.task_name.toLowerCase(), { start_date: t.start_date, end_date: t.end_date });
      }
    }

    // Helper to check if a team is blocked by a task status
    const getBlockedTeamsForTask = (statusText: string, taskDetails: { action?: string; field?: string; new_value?: string }): Array<{ team: string; upstreamTeam: string }> => {
      const blocked: Array<{ team: string; upstreamTeam: string }> = [];
      
      // Normalize status text - replace underscores with spaces and check both forms
      const normalizedStatus = statusText.toLowerCase().replace(/_/g, ' ');
      const underscoreStatus = statusText.toLowerCase().replace(/ /g, '_');
      
      for (const rule of BLOCKING_RULES) {
        // Check if task is in a blocking status (check both forms)
        const isInBlockingStatus = rule.blockingStatuses.some(bs => 
          normalizedStatus.includes(bs.replace(/_/g, ' ')) || 
          underscoreStatus.includes(bs.replace(/ /g, '_')) ||
          statusText.toLowerCase().includes(bs.toLowerCase())
        );
        
        // Check if task has been unblocked
        const isUnblocked = rule.unblockStatuses.some(us => 
          normalizedStatus.includes(us.replace(/_/g, ' ')) || 
          underscoreStatus.includes(us.replace(/ /g, '_')) ||
          statusText.toLowerCase().includes(us.toLowerCase())
        );
        
        if (isInBlockingStatus && !isUnblocked) {
          blocked.push({ team: rule.blockedTeam, upstreamTeam: rule.upstreamTeam || 'Unknown' });
        }
      }
      return blocked;
    };

    for (const task of asanaTasks) {
      const rawAssignee = task.assignee ?? '';
      const resolvedName = resolveAssigneeToken(rawAssignee) || 'Unassigned';

      // Find team via resolvedName (exact, first-name, id)
      let team = nameToTeam.get(resolvedName.toLowerCase());
      if (!team) {
        // try to derive from memberNameByKey entries (search by value match)
        for (const [k, v] of memberNameByKey.entries()) {
          if (v.name.toLowerCase() === resolvedName.toLowerCase()) { team = mapRoleToTeam(v.role || 'Other'); break; }
        }
      }
      if (!team) team = 'Technical';
      const key = team;

      // Estimate hours: prefer analytics task duration if available, otherwise fallback
      let est = HOURS_PER_TASK;
      const lookup = task.task_name ? taskLookup.get(task.task_name.toLowerCase()) : undefined;
      if (lookup) {
        const parsed = parseDaysToHours(lookup.start_date, lookup.end_date);
        if (parsed !== null) est = parsed;
      }

      // Initialize team entry if needed
      if (!map.has(key)) map.set(key, { team: key, total: 0, blocked: 0, fractional: 0, members: new Set(), blockedBy: new Map() });
      const entry = map.get(key)!;
      entry.total += est;
      // store resolved display name for members list (prefer canonical name)
      const displayMember = resolveAssigneeToken(task.assignee) || 'Unassigned';
      if (displayMember) entry.members.add(displayMember);
      // Resolve role for the displayMember from memberNameByKey (if available) and pick representative by priority
      let memberRole = '';
      const dmLower = (displayMember || '').toLowerCase();
      if (memberNameByKey.has(dmLower)) {
        memberRole = memberNameByKey.get(dmLower)!.role || '';
      } else {
        for (const v of memberNameByKey.values()) {
          if (v.name.toLowerCase() === dmLower) { memberRole = v.role || ''; break; }
        }
      }
      function rolePriority(r: string) {
        const rl = (r || '').toLowerCase();
        if (!rl) return 0;
        if (/owner|director|head|lead|manager|principal|architect/.test(rl)) return 5;
        if (/senior|staff|sr\b|principal/.test(rl)) return 4;
        if (/engineer|developer|dev|backend|frontend|mobile|design|qa|test|ops|devops|data|analyst/.test(rl)) return 3;
        return 1;
      }
      const currentRep = entry.representative;
      const newPriority = rolePriority(memberRole);
      const currentPriority = currentRep ? rolePriority(currentRep.role) : 0;
      if (displayMember && (!currentRep || newPriority >= currentPriority)) {
        entry.representative = { name: displayMember, role: memberRole };
      }

      // Fractional heuristic: if automation involved AND there is an assignee
      const fractionalHours = (task.is_automation && task.assignee) ? est * FRACTIONAL_PERCENT : 0;
      entry.fractional += fractionalHours;

      // Block capacity: check status-based blocking rules
      const statusText = `${task.status || ''} ${task.from_status || ''} ${task.to_status || ''} ${task.action || ''}`;
      const blockedTeams = getBlockedTeamsForTask(statusText, { action: task.action, field: task.status, new_value: task.to_status });
      
      // Add blocked hours to the teams that are blocked by this task
      for (const { team: blockedTeam, upstreamTeam } of blockedTeams) {
        if (!map.has(blockedTeam)) {
          map.set(blockedTeam, { team: blockedTeam, total: 0, blocked: 0, fractional: 0, members: new Set(), blockedBy: new Map() });
        }
        const blockedEntry = map.get(blockedTeam)!;
        blockedEntry.blocked += est;
        // Sync: include blocked hours in the team's total so charts sum to segments
        blockedEntry.total += est;
        
        // Track which upstream team is causing the block
        const currentBlocked = blockedEntry.blockedBy.get(upstreamTeam) || 0;
        blockedEntry.blockedBy.set(upstreamTeam, currentBlocked + est);
      }
    }

    // Convert to sorted array by total desc
    const arr = Array.from(map.values()).map((v) => ({ 
      ...v, 
      members: Array.from(v.members),
      representative: v.representative ? v.representative.name : undefined,
      blockedBy: Array.from(v.blockedBy.entries()).map(([team, hours]) => ({ team, hours }))
    }));
    arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [asanaTasks, teamMembers, projectAnalytics]);

  const totals = useMemo(() => {
    const t = { total: 0, blocked: 0, fractional: 0 };
    for (const r of byTeam) {
      t.total += r.total;
      t.blocked += r.blocked;
      t.fractional += r.fractional;
    }
    return t;
  }, [byTeam]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Weekly Capacity Ledger</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Aggregated capacity by team • Blocked and Fractional hours (computed from CSVs)</p>
        <div className="mt-3">
          <div className="text-xs text-gray-500">Project Members</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {teamMembers && teamMembers.length > 0 ? (
              teamMembers.map((m) => (
                <span key={m.member_id} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{m.name}</span>
              ))
            ) : (
              // fallback to listing members gathered from teams
              (Array.from(new Set(byTeam.flatMap(r => r.members))) || []).map((name) => (
                <span key={name} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{name}</span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="text-xs sm:text-sm opacity-90 mb-1">Block Capacity (This Project)</div>
          <div className="text-3xl sm:text-4xl font-bold">{totals.blocked.toFixed(1)} hrs</div>
          <div className="text-xs sm:text-sm mt-2 opacity-75">Detected from task statuses and time ranges</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="text-xs sm:text-sm opacity-90 mb-1">Fractional Capacity (This Project)</div>
          <div className="text-3xl sm:text-4xl font-bold">{totals.fractional.toFixed(1)} hrs</div>
          <div className="text-xs sm:text-sm mt-2 opacity-75">Estimated where automation reduces per-task human time</div>
        </div>
      </div>

      {/* Charts moved into Capacity by Team area per request - removed top-level charts and dependency graph */}

      {/* Block + Fractional charts panel removed per request */}

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Capacity by Team</h3>
        <div className="space-y-4 sm:space-y-6">
          {/* charts removed per user request */}
          {byTeam.length === 0 && (
            <div className="text-sm text-gray-600">No task data available for this project.</div>
          )}

          {byTeam.map((team) => (
            <div key={team.team}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-900">{team.team}</span>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                  <span className="text-gray-500">Block: {team.blocked.toFixed(1)}h</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">Frac: {team.fractional.toFixed(1)}h</span>
                </div>
              </div>

              {/* Compact segmented bar: Available (blue) | Fractional (purple) | Blocked (green) */}
              <div className="w-full mb-2">
                {(() => {
                  const fractional = Math.max(0, team.fractional);
                  const blocked = Math.max(0, team.blocked);
                  // If fractional exists, show a full-width purple bar with fractional value
                  if (fractional > 0) {
                    return (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="bg-purple-500 rounded-full h-5 sm:h-6 flex items-center justify-center text-white text-xs font-semibold">
                            {fractional.toFixed(1)}h
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Otherwise, show blocked green bar if blocked exists
                  if (blocked > 0) {
                    return (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="bg-green-500 rounded-full h-5 sm:h-6 flex items-center justify-center text-white text-xs font-semibold">
                            {blocked.toFixed(1)}h
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Neither fractional nor blocked: empty gray bar
                  return <div className="bg-gray-100 rounded-full h-5 sm:h-6" />;
                })()}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <div className="text-gray-500 text-xs">Members</div>
                  <div className="font-bold text-gray-900 text-sm">{team.members.length}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {team.members.map((n) => (
                      <span key={n} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{n}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <div className="text-gray-500 text-xs">Representative</div>
                  <div className="font-bold text-green-600 text-sm">{team.representative ?? '—'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
