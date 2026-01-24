import React, { useMemo, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { hubspotFetch } from '@/lib/hubspot-fetch';
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
  const [allProjectsBlocked, setAllProjectsBlocked] = useState<number | null>(null)
  const [loadingAllProjects, setLoadingAllProjects] = useState(false)
  const [projectTasks, setProjectTasks] = useState<any[]>([])
  const [projectIdleHours, setProjectIdleHours] = useState<number | null>(null)
  const [endpointDebug, setEndpointDebug] = useState<Array<{url: string; ok?: boolean; status?: number; body?: string; tag?: string}>>([])
  const [perProjectBlocked, setPerProjectBlocked] = useState<Array<{ key: string; title?: string; source: 'jira'|'asana'; hours: number }>>([])
  const [perAssigneeBlocked, setPerAssigneeBlocked] = useState<Array<{ assignee: string; hours: number }>>([])
  const [hubspotAiSavedHours, setHubspotAiSavedHours] = useState<number | null>(null)
  // If no specific project is selected (or you want a global total), fetch all projects
  // from Jira and Asana, then sum their estimated blocked hours.
  useEffect(() => {
    let cancelled = false
    async function fetchAllAndCompute() {
      setLoadingAllProjects(true)
      try {
        const msPerDay = 24 * 60 * 60 * 1000
        let totalBlocked = 0
        // collect per-project and per-assignee across Jira + Asana
        const localPerProject: Array<{ key: string; title?: string; source: 'jira'|'asana'; hours: number }> = []
        const assigneeMap = new Map<string, number>()

        // Fetch Jira projects
        try {
          let jiraCount = 0
          let jiraHours = 0
          const pjRes = await fetch('/api/jira/projects', { credentials: 'include' })
          setEndpointDebug((prev) => [...prev, { url: '/api/jira/projects', ok: pjRes.ok, status: pjRes.status, tag: 'global-projects' }])
          if (pjRes.ok) {
            const pjData = await pjRes.json()
            const projects = pjData.projects || []
            for (const p of projects) {
              try {
                let projectBlocked = 0
                const issuesRes = await fetch(`/api/jira/issues?projectKey=${encodeURIComponent(p.key)}`, { credentials: 'include' })
                if (!issuesRes.ok) {
                  try {
                    const txt = await issuesRes.text()
                    console.error(`[CapacityLedger][Global] Failed to fetch /api/jira/issues url=/api/jira/issues?projectKey=${encodeURIComponent(p.key)} status=${issuesRes.status} body=${txt}`)
                    setEndpointDebug((prev) => [...prev, { url: `/api/jira/issues?projectKey=${encodeURIComponent(p.key)}`, ok: false, status: issuesRes.status, body: txt, tag: 'global-issues' }])
                  } catch (e) {
                    console.error(`[CapacityLedger][Global] Failed to fetch /api/jira/issues url=/api/jira/issues?projectKey=${encodeURIComponent(p.key)} status=${issuesRes.status} (no body)`)
                    setEndpointDebug((prev) => [...prev, { url: `/api/issues?projectKey=${encodeURIComponent(p.key)}`, ok: false, status: issuesRes.status, tag: 'global-issues' }])
                  }
                  continue
                }
                const issuesJson = await issuesRes.json()
                setEndpointDebug((prev) => [...prev, { url: `/api/issues?projectKey=${encodeURIComponent(p.key)}`, ok: true, status: issuesRes.status, tag: 'global-issues' }])
                const issues = issuesJson.issues || []
                // Build per-assignee intervals for this project (UTC-normalized)
                const byAssigneeProj: Record<string, Array<{ s: number; e: number }>> = {}
                const startOfDayUTC = (d: any) => {
                  const dd = new Date(d)
                  return Date.UTC(dd.getFullYear(), dd.getMonth(), dd.getDate())
                }
                const businessDaysBetween = (startMs: number, endMs: number) => {
                  let count = 0
                  for (let cur = startMs; cur < endMs; cur += msPerDay) {
                    const dow = new Date(cur).getUTCDay()
                    if (dow !== 0 && dow !== 6) count++
                  }
                  return count
                }

                for (const it of issues) {
                  const sourceStart = it.created || it.start || null
                  const s = startOfDayUTC(sourceStart || new Date())
                  const e = startOfDayUTC(it.due || it.due_date || sourceStart || new Date()) + msPerDay
                  const assigneeKey = (it.assignee || 'Unassigned')
                  if (!byAssigneeProj[assigneeKey]) byAssigneeProj[assigneeKey] = []
                  byAssigneeProj[assigneeKey].push({ s, e })
                  jiraCount++
                  // estimate hours for debug metrics (not used for block calculation)
                  let est = HOURS_PER_TASK
                  if (sourceStart && it.due) {
                    const parsed = parseDaysToHours(sourceStart, it.due)
                    if (parsed !== null) est = parsed
                  }
                  jiraHours += est
                }

                // Now compute idle (blocked) days per assignee using merged intervals clipped to working window
                const DEFAULT_WORKING_START = new Date('2025-12-01T00:00:00Z')
                const DEFAULT_WORKING_END = new Date('2026-01-01T00:00:00Z')
                const workingStartMs = Date.UTC(DEFAULT_WORKING_START.getUTCFullYear(), DEFAULT_WORKING_START.getUTCMonth(), DEFAULT_WORKING_START.getUTCDate())
                const workingEndMs = Date.UTC(DEFAULT_WORKING_END.getUTCFullYear(), DEFAULT_WORKING_END.getUTCMonth(), DEFAULT_WORKING_END.getUTCDate()) + msPerDay
                const totalWindowDays = Math.max(0, businessDaysBetween(workingStartMs, workingEndMs))

                let totalIdleDaysForProject = 0
                for (const assignee of Object.keys(byAssigneeProj)) {
                  const intervals = byAssigneeProj[assignee].slice().sort((a, b) => a.s - b.s)
                  const merged: Array<{ s: number; e: number }> = []
                  for (const intv of intervals) {
                    if (merged.length === 0) merged.push({ ...intv })
                    else {
                      const last = merged[merged.length - 1]
                      if (intv.s <= last.e) last.e = Math.max(last.e, intv.e)
                      else merged.push({ ...intv })
                    }
                  }

                  let occupied = 0
                  for (const m of merged) {
                    const clipStart = Math.max(m.s, workingStartMs)
                    const clipEnd = Math.min(m.e, workingEndMs)
                    if (clipEnd <= clipStart) continue
                    occupied += businessDaysBetween(clipStart, clipEnd)
                  }

                  const idleDays = Math.max(0, totalWindowDays - occupied)
                  totalIdleDaysForProject += idleDays
                  // convert to hours and add to global per-assignee map
                  const assigneeHours = Math.round(idleDays * 8)
                  assigneeMap.set(assignee, (assigneeMap.get(assignee) || 0) + assigneeHours)
                }

                const projectBlockedHours = Math.round(totalIdleDaysForProject * 8 * 10) / 10
                totalBlocked += projectBlockedHours
                // store per-project blocked hours for UI debug
                localPerProject.push({ key: p.key, title: p.title, source: 'jira', hours: projectBlockedHours })
              } catch (err) {
                // ignore per-project errors
              }
            }
          }
          // attach debug info for global Jira fetch
          console.debug('[CapacityLedger][Global] Jira projects scanned', { jiraCount, jiraHours })
        } catch (err) {
          // ignore
        }

        // Fetch Asana projects
        try {
          let asanaCount = 0
          let asanaHours = 0
          const aRes = await fetch('/api/asana/projects')
          setEndpointDebug((prev) => [...prev, { url: '/api/asana/projects', ok: aRes.ok, status: aRes.status, tag: 'global-asana-projects' }])
          if (aRes.ok) {
            const aData = await aRes.json()
            const projects = aData.projects || []
              for (const p of projects) {
                try {
                  let projectBlocked = 0
                  const tasksRes = await fetch(`/api/asana/issues?projectKey=${encodeURIComponent(p.id)}`)
                if (!tasksRes.ok) {
                  try {
                    const txt = await tasksRes.text()
                    console.error(`[CapacityLedger][Global] Failed to fetch /api/asana/issues url=/api/asana/issues?projectKey=${encodeURIComponent(p.id)} status=${tasksRes.status} body=${txt}`)
                    setEndpointDebug((prev) => [...prev, { url: `/api/asana/issues?projectKey=${encodeURIComponent(p.id)}`, ok: false, status: tasksRes.status, body: txt, tag: 'global-asana-issues' }])
                  } catch (e) {
                    console.error(`[CapacityLedger][Global] Failed to fetch /api/asana/issues url=/api/asana/issues?projectKey=${encodeURIComponent(p.id)} status=${tasksRes.status} (no body)`)
                    setEndpointDebug((prev) => [...prev, { url: `/api/asana/issues?projectKey=${encodeURIComponent(p.id)}`, ok: false, status: tasksRes.status, tag: 'global-asana-issues' }])
                  }
                  continue
                }
                const tasksJson = await tasksRes.json()
                setEndpointDebug((prev) => [...prev, { url: `/api/asana/issues?projectKey=${encodeURIComponent(p.id)}`, ok: true, status: tasksRes.status, tag: 'global-asana-issues' }])
                const tasks = tasksJson.issues || []
                // Build per-assignee intervals for this Asana project
                const byAssigneeProjA: Record<string, Array<{ s: number; e: number }>> = {}
                const startOfDayUTC = (d: any) => {
                  const dd = new Date(d)
                  return Date.UTC(dd.getFullYear(), dd.getMonth(), dd.getDate())
                }
                const businessDaysBetween = (startMs: number, endMs: number) => {
                  let count = 0
                  for (let cur = startMs; cur < endMs; cur += msPerDay) {
                    const dow = new Date(cur).getUTCDay()
                    if (dow !== 0 && dow !== 6) count++
                  }
                  return count
                }

                for (const t of tasks) {
                  const sourceStart = t.startDate || t.start || t.created || null
                  const s = startOfDayUTC(sourceStart || new Date())
                  const e = startOfDayUTC(t.due || t.due_on || sourceStart || new Date()) + msPerDay
                  const assigneeKey = (t.assignee || t.finalAssignee || 'Unassigned')
                  if (!byAssigneeProjA[assigneeKey]) byAssigneeProjA[assigneeKey] = []
                  byAssigneeProjA[assigneeKey].push({ s, e })
                  asanaCount++
                  // estimate hours for debug metrics
                  let est = HOURS_PER_TASK
                  if (sourceStart && t.due) {
                    const parsed = parseDaysToHours(sourceStart, t.due)
                    if (parsed !== null) est = parsed
                  }
                  asanaHours += est
                }

                // compute idle days per assignee for Asana project using same working window
                const DEFAULT_WORKING_START = new Date('2025-12-01T00:00:00Z')
                const DEFAULT_WORKING_END = new Date('2026-01-01T00:00:00Z')
                const workingStartMs = Date.UTC(DEFAULT_WORKING_START.getUTCFullYear(), DEFAULT_WORKING_START.getUTCMonth(), DEFAULT_WORKING_START.getUTCDate())
                const workingEndMs = Date.UTC(DEFAULT_WORKING_END.getUTCFullYear(), DEFAULT_WORKING_END.getUTCMonth(), DEFAULT_WORKING_END.getUTCDate()) + msPerDay
                const totalWindowDays = Math.max(0, businessDaysBetween(workingStartMs, workingEndMs))

                let totalIdleDaysForProjectA = 0
                for (const assignee of Object.keys(byAssigneeProjA)) {
                  const intervals = byAssigneeProjA[assignee].slice().sort((a, b) => a.s - b.s)
                  const merged: Array<{ s: number; e: number }> = []
                  for (const intv of intervals) {
                    if (merged.length === 0) merged.push({ ...intv })
                    else {
                      const last = merged[merged.length - 1]
                      if (intv.s <= last.e) last.e = Math.max(last.e, intv.e)
                      else merged.push({ ...intv })
                    }
                  }

                  let occupied = 0
                  for (const m of merged) {
                    const clipStart = Math.max(m.s, workingStartMs)
                    const clipEnd = Math.min(m.e, workingEndMs)
                    if (clipEnd <= clipStart) continue
                    occupied += businessDaysBetween(clipStart, clipEnd)
                  }

                  const idleDays = Math.max(0, totalWindowDays - occupied)
                  totalIdleDaysForProjectA += idleDays
                  const assigneeHours = Math.round(idleDays * 8)
                  assigneeMap.set(assignee, (assigneeMap.get(assignee) || 0) + assigneeHours)
                }

                const projectBlockedHoursA = Math.round(totalIdleDaysForProjectA * 8 * 10) / 10
                totalBlocked += projectBlockedHoursA
                localPerProject.push({ key: p.id, title: p.title, source: 'asana', hours: projectBlockedHoursA })
              } catch (err) {
                // ignore per-project errors
              }
            }
          }
          // attach debug info for global Asana fetch
          console.debug('[CapacityLedger][Global] Asana projects scanned', { asanaCount, asanaHours })
        } catch (err) {
          // ignore
        }

        if (!cancelled) {
          setAllProjectsBlocked(Math.round(totalBlocked * 10) / 10)
          // update per-project list in state for UI
          setPerProjectBlocked(localPerProject)
          // update per-assignee list in state, sorted desc
          const assigneeArr = Array.from(assigneeMap.entries()).map(([assignee, hours]) => ({ assignee, hours: Math.round(hours * 10) / 10 }))
          assigneeArr.sort((a, b) => b.hours - a.hours)
          setPerAssigneeBlocked(assigneeArr)
          console.debug('[CapacityLedger][Global] totalBlocked hours', { totalBlocked: Math.round(totalBlocked * 10) / 10 })
          console.debug('[CapacityLedger][Global] perProjectBlocked', localPerProject)
          console.debug('[CapacityLedger][Global] perAssigneeBlocked', assigneeArr)
        }
      } finally {
        if (!cancelled) setLoadingAllProjects(false)
      }
    }

    // Only fetch global totals when no specific project is provided
    if (!projectId) fetchAllAndCompute()

    return () => { cancelled = true }
  }, [projectId])

  // Fetch HubSpot AI metrics
  useEffect(() => {
    let cancelled = false
    async function fetchHubSpotMetrics() {
      try {
        const response = await hubspotFetch(apiUrl('/api/hubspot/ai-metrics'))
        if (!cancelled && response.ok) {
          const data = await response.json()
          setHubspotAiSavedHours(data.totalTimeSavedHours ?? null)
        }
      } catch (err) {
        console.error('[CapacityLedger] Failed to fetch HubSpot AI metrics:', err)
      }
    }
    fetchHubSpotMetrics()
    return () => { cancelled = true }
  }, [])

  // When a specific projectId is provided and no asanaTasks prop passed,
  // fetch project tasks from both Jira and Asana so per-project totals include Jira data.
  useEffect(() => {
    let cancelled = false
    async function fetchProjectTasks() {
      if (!projectId) {
        setProjectTasks([])
        return
      }
      const aggregated: any[] = []
      try {
        // Try Jira issues for this project
        try {
          const res = await fetch(`/api/issues?projectKey=${encodeURIComponent(projectId)}`)
          setEndpointDebug((prev) => [...prev, { url: `/api/issues?projectKey=${encodeURIComponent(projectId)}`, ok: res.ok, status: res.status, tag: 'project-issues' }])
          if (!res.ok) {
            try {
              const txt = await res.text()
              console.error(`[CapacityLedger][Project] Failed to fetch /api/issues projectId=${projectId} status=${res.status} body=${txt}`)
              setEndpointDebug((prev) => [...prev, { url: `/api/issues?projectKey=${encodeURIComponent(projectId)}`, ok: false, status: res.status, body: txt, tag: 'project-issues' }])
            } catch (e) {
              console.error(`[CapacityLedger][Project] Failed to fetch /api/issues projectId=${projectId} status=${res.status} (no body)`)
              setEndpointDebug((prev) => [...prev, { url: `/api/issues?projectKey=${encodeURIComponent(projectId)}`, ok: false, status: res.status, tag: 'project-issues' }])
            }
          } else {
            const j = await res.json()
            setEndpointDebug((prev) => [...prev, { url: `/api/issues?projectKey=${encodeURIComponent(projectId)}`, ok: true, status: res.status, tag: 'project-issues' }])
            const issues = j.issues || []
            for (const it of issues) {
                aggregated.push({
                  source: 'jira',
                  assignee: it.assignee || 'Unassigned',
                  task_name: it.summary || it.key || '',
                  is_automation: false,
                  status: it.status || '',
                  from_status: '',
                  to_status: '',
                  action: '',
                  startDate: it.created || null,
                  due: it.due || null,
                  created: it.created || null,
                })
            }
          }
        } catch (err) {
          // ignore
        }

        // Try Asana tasks for this project
        try {
          const res2 = await fetch(`/api/asana/issues?projectKey=${encodeURIComponent(projectId)}`)
          setEndpointDebug((prev) => [...prev, { url: `/api/asana/issues?projectKey=${encodeURIComponent(projectId)}`, ok: res2.ok, status: res2.status, tag: 'project-asana-issues' }])
          if (!res2.ok) {
            try {
              const txt = await res2.text()
              console.error(`[CapacityLedger][Project] Failed to fetch /api/asana/issues projectId=${projectId} status=${res2.status} body=${txt}`)
              setEndpointDebug((prev) => [...prev, { url: `/api/asana/issues?projectKey=${encodeURIComponent(projectId)}`, ok: false, status: res2.status, body: txt, tag: 'project-asana-issues' }])
            } catch (e) {
              console.error(`[CapacityLedger][Project] Failed to fetch /api/asana/issues projectId=${projectId} status=${res2.status} (no body)`)
              setEndpointDebug((prev) => [...prev, { url: `/api/asana/issues?projectKey=${encodeURIComponent(projectId)}`, ok: false, status: res2.status, tag: 'project-asana-issues' }])
            }
          } else {
            const j2 = await res2.json()
            setEndpointDebug((prev) => [...prev, { url: `/api/asana/issues?projectKey=${encodeURIComponent(projectId)}`, ok: true, status: res2.status, tag: 'project-asana-issues' }])
            const tasks = j2.issues || []
            for (const t of tasks) {
              aggregated.push({
                source: 'asana',
                ...t,
                task_name: t.summary || t.task_name || '',
                startDate: t.startDate || t.start || t.created || null,
                created: t.created || null,
              })
            }
          }
        } catch (err) {
          // ignore
        }
              if (!cancelled) {
                setProjectTasks(aggregated)
                // compute simple per-source counts and estimated hours and log for debugging
                try {
                  let jiraCount = 0
                  let asanaCount = 0
                  let jiraHours = 0
                  let asanaHours = 0
                  for (const it of aggregated) {
                    const s = it.startDate || it.start || it.created || null
                    const e = it.due || it.due_on || it.dueDate || null
                    let est = HOURS_PER_TASK
                    if (s && e) {
                      const parsed = parseDaysToHours(s, e)
                      if (parsed !== null) est = parsed
                    }
                    if (it.source === 'jira') {
                      jiraCount++
                      jiraHours += est
                    } else if (it.source === 'asana') {
                      asanaCount++
                      asanaHours += est
                    }
                  }
                  console.debug('[CapacityLedger][Project]', { projectId, jiraCount, jiraHours: Math.round(jiraHours*10)/10, asanaCount, asanaHours: Math.round(asanaHours*10)/10, totalTasks: aggregated.length })
                } catch (err) {
                  // ignore
                }
              }
      } finally {
        if (!cancelled) {
          setProjectTasks(aggregated)
          // compute idle hours (free time) from the aggregated tasks to match ManagerSummary logic
          try {
            const MS_PER_DAY = 24 * 60 * 60 * 1000
            const startOfDayUTC = (d: any) => {
              const dd = new Date(d)
              return Date.UTC(dd.getFullYear(), dd.getMonth(), dd.getDate())
            }
            const businessDaysBetween = (startMs: number, endMs: number) => {
              let count = 0
              for (let cur = startMs; cur < endMs; cur += MS_PER_DAY) {
                const dow = new Date(cur).getUTCDay()
                if (dow !== 0 && dow !== 6) count++
              }
              return count
            }

            const DEFAULT_WORKING_START = new Date('2025-12-01T00:00:00Z')
            const DEFAULT_WORKING_END = new Date('2026-01-01T00:00:00Z')

            const byAssignee: Record<string, Array<{ s: number; e: number }>> = {}
            for (const t of aggregated) {
              const assignee = (t.assignee || 'Unassigned') as string
              const sourceStart = t.startDate || t.start || t.created || null
              const s = startOfDayUTC(sourceStart || new Date())
              const e = startOfDayUTC(t.due || t.due_on || t.dueDate || sourceStart || new Date()) + MS_PER_DAY
              if (!byAssignee[assignee]) byAssignee[assignee] = []
              byAssignee[assignee].push({ s, e })
            }

            let totalIdleDays = 0
            const workingStartMs = Date.UTC(DEFAULT_WORKING_START.getUTCFullYear(), DEFAULT_WORKING_START.getUTCMonth(), DEFAULT_WORKING_START.getUTCDate())
            const workingEndMs = Date.UTC(DEFAULT_WORKING_END.getUTCFullYear(), DEFAULT_WORKING_END.getUTCMonth(), DEFAULT_WORKING_END.getUTCDate()) + MS_PER_DAY
            const totalWindowDays = Math.max(0, businessDaysBetween(workingStartMs, workingEndMs))

            for (const assignee of Object.keys(byAssignee)) {
              const intervals = byAssignee[assignee].slice().sort((a, b) => a.s - b.s)
              const merged: Array<{ s: number; e: number }> = []
              for (const intv of intervals) {
                if (merged.length === 0) {
                  merged.push({ ...intv })
                } else {
                  const last = merged[merged.length - 1]
                  if (intv.s <= last.e) last.e = Math.max(last.e, intv.e)
                  else merged.push({ ...intv })
                }
              }

              // occupied business days clipped to working window
              let occupied = 0
              for (const m of merged) {
                const clipStart = Math.max(m.s, workingStartMs)
                const clipEnd = Math.min(m.e, workingEndMs)
                if (clipEnd <= clipStart) continue
                occupied += businessDaysBetween(clipStart, clipEnd)
              }

              const idleDays = Math.max(0, totalWindowDays - occupied)
              totalIdleDays += idleDays
            }

            const idleHours = Math.round(totalIdleDays * 8)
            setProjectIdleHours(idleHours)
          } catch (err) {
            setProjectIdleHours(null)
          }
        }
      }
    }

    fetchProjectTasks()
    return () => { cancelled = true }
  }, [projectId])

  // Choose tasks source: prefer `asanaTasks` prop when provided, otherwise use fetched `projectTasks` (which includes Jira+Asana for the selected project)
  const tasksForCalc = (asanaTasks && asanaTasks.length > 0) ? asanaTasks : projectTasks

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

    for (const task of tasksForCalc) {
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
  }, [tasksForCalc, teamMembers, projectAnalytics]);

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

      {endpointDebug.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded p-3 mb-6 text-xs">
          <div className="font-medium text-sm mb-2">Debug: endpoint statuses (recent)</div>
          <div className="space-y-2 max-h-48 overflow-auto">
            {endpointDebug.slice(-30).reverse().map((e, i) => (
              <div key={i} className="text-left">
                <div>
                  <span className="font-mono">{e.url}</span>
                  <span className="ml-2">{e.ok ? <span className="text-green-600">OK</span> : <span className="text-red-600">FAIL</span>} ({e.status ?? '—'})</span>
                  <span className="ml-2 text-gray-500">{e.tag ?? ''}</span>
                </div>
                {e.body && (
                  <pre className="whitespace-pre-wrap text-xs text-red-700 mt-1 break-words">{e.body}</pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

        {perProjectBlocked.length > 0 && (
          <div className="mt-2 bg-white border rounded p-3 text-sm">
            <div className="font-medium mb-2">Per-project Blocked Hours</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {perProjectBlocked.map((p) => (
                <div key={`${p.source}-${p.key}`} className="p-2 border rounded bg-gray-50">
                  <div className="text-gray-700 font-semibold">{p.title ?? p.key} <span className="text-gray-400">({p.source})</span></div>
                  <div className="text-green-600 font-bold">{p.hours} hrs</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {perAssigneeBlocked.length > 0 && (
          <div className="mt-4 bg-white border rounded p-3 text-sm">
            <div className="font-medium mb-2">Blocked Hours by Individual</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {perAssigneeBlocked.map((p) => (
                <div key={p.assignee} className="p-2 border rounded bg-gray-50">
                  <div className="text-gray-700 font-semibold">{p.assignee}</div>
                  <div className="text-green-600 font-bold">{p.hours} hrs</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="text-xs sm:text-sm opacity-90 mb-1">{!projectId ? 'Block Capacity (All Projects)' : 'Block Capacity (This Project)'}</div>
          <div className="text-3xl sm:text-4xl font-bold">{!projectId ? (
            loadingAllProjects ? '...' : (allProjectsBlocked !== null ? `${allProjectsBlocked} hrs` : `${totals.blocked.toFixed(1)} hrs`)
          ) : (
            projectIdleHours !== null ? `${projectIdleHours} hrs` : `${totals.blocked.toFixed(1)} hrs`
          )}</div>
          <div className="text-xs sm:text-sm mt-2 opacity-75">Detected from task statuses and time ranges{!projectId ? ' (aggregated across Jira + Asana)' : ''}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="text-xs sm:text-sm opacity-90 mb-1">AI-SAVED TIME (This Project)</div>
          <div className="text-3xl sm:text-4xl font-bold">{hubspotAiSavedHours !== null ? `${hubspotAiSavedHours} hrs` : `${totals.fractional.toFixed(1)} hrs`}</div>
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
