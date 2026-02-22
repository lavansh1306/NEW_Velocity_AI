import React, { useMemo, useState, useEffect } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { apiUrl } from '@/lib/api'
import { useJiraData, type JiraIssue } from '@/hooks/useJiraData'

export interface Issue {
  key: string
  issueType: string
  summary: string
  description: string
  priority: string
  status: string
  assignee: string
  team: string
  start: string | null
  due: string | null
  duration: number | string
  created?: string | null
  project?: string
  projectId?: string
  project_key?: string
  projectKey?: string
}

interface ColorGradient {
  from: string
  to: string
}

interface AssigneeRow {
  assignee: string
  tasks: TaskWithDates[]
}

interface TaskWithDates extends Issue {
  _start: Date
  _end: Date
  _projectKey: string
}

type ViewType = 'day' | 'week' | 'month'

function formatDate(d: Date): string {
  return d.toLocaleDateString()
}

const projectColors: ColorGradient[] = [
  { from: 'from-blue-100', to: 'to-blue-200' },
  { from: 'from-rose-100', to: 'to-rose-200' },
  { from: 'from-emerald-100', to: 'to-emerald-200' },
  { from: 'from-violet-100', to: 'to-violet-200' },
  { from: 'from-amber-100', to: 'to-amber-200' },
  { from: 'from-pink-100', to: 'to-pink-200' },
  { from: 'from-indigo-100', to: 'to-indigo-200' },
  { from: 'from-cyan-100', to: 'to-cyan-200' },
  { from: 'from-orange-100', to: 'to-orange-200' },
  { from: 'from-yellow-100', to: 'to-yellow-200' },
  { from: 'from-lime-100', to: 'to-lime-200' },
  { from: 'from-teal-100', to: 'to-teal-200' },
]

interface ManagerGanttProps {
  tasks?: Issue[]
  autoFetch?: boolean
  jiraIssues?: JiraIssue[]
}

export default function ManagerGantt({ tasks: externalTasks = [], autoFetch = true, jiraIssues: externalJiraIssues }: ManagerGanttProps) {
  const { addToast } = useToast()
  const [viewType, setViewType] = useState<ViewType>('day')
  const [zoom, setZoom] = useState(1.6)
  const [selectedTask, setSelectedTask] = useState<TaskWithDates | null>(null)
  const [tasks, setTasks] = useState<Issue[]>(externalTasks)
  const [loading, setLoading] = useState(false)

  // Use the useJiraData hook if we're fetching data and no Jira issues provided
  const jiraHookData = useJiraData()
  const shouldUseFallbackFetch = autoFetch && externalTasks.length === 0 && !externalJiraIssues

  // When jiraIssues are provided externally, use those
  useEffect(() => {
    if (externalJiraIssues && externalJiraIssues.length > 0) {
      // Convert Jira issues to internal Issue format
      const convertedTasks = externalJiraIssues.map(issue => ({
        ...issue,
      }))
      setTasks(convertedTasks)
      setLoading(false)
    }
  }, [externalJiraIssues])

  // Use the hook data if we're supposed to autoFetch and no external data provided
  useEffect(() => {
    if (!shouldUseFallbackFetch) return

    if (jiraHookData.loading) {
      setLoading(true)
    } else if (jiraHookData.issues.length > 0) {
      setTasks(jiraHookData.issues)
      setLoading(false)
    }
  }, [jiraHookData.issues, jiraHookData.loading, shouldUseFallbackFetch])

  // Fallback fetch for other data sources (HubSpot, Microsoft 365)
  useEffect(() => {
    if (!autoFetch || externalTasks.length > 0) return

    const fetchOtherSources = async () => {
      try {
        setLoading(true)
        const allCollectedTasks: Issue[] = []

        // Add Jira tasks from hook if available
        if (jiraHookData.issues.length > 0) {
          allCollectedTasks.push(...jiraHookData.issues)
        }

        // ======== HUBSPOT ========
        console.log('[ManagerGantt] Fetching HubSpot data...')
        try {
          const hubspotResp = await fetch(apiUrl('/api/hubspot/tickets'), {
            credentials: 'include',
          })
          if (hubspotResp.ok) {
            const hubspotData = await hubspotResp.json()
            const tickets = hubspotData.tickets || []
            console.log('[ManagerGantt] HubSpot tickets:', tickets.length)

            const hubspotTasks = tickets.map((ticket: any) => ({
              key: ticket.id || ticket.ticketId || '',
              issueType: ticket.type || 'Ticket',
              summary: ticket.subject || ticket.name || '',
              description: ticket.description || '',
              project: 'HubSpot',
              priority: ticket.priority || 'Medium',
              status: ticket.stage || ticket.status || 'Open',
              assignee: ticket.assignee || 'Unassigned',
              team: 'Sales',
              start: ticket.createdAt || null,
              due: ticket.closedAt || ticket.dueDate || null,
              duration: ticket.duration || 8,
              created: ticket.createdAt || null,
              projectKey: 'HUBSPOT',
            }))
            allCollectedTasks.push(...hubspotTasks)
          }
        } catch (e) {
          console.warn('[ManagerGantt] HubSpot fetch failed:', e)
        }

        // ======== MICROSOFT 365 ========
        console.log('[ManagerGantt] Fetching Microsoft 365 data...')
        try {
          const msResp = await fetch(apiUrl('/api/microsoft365/tasks'), {
            credentials: 'include',
          })
          if (msResp.ok) {
            const msData = await msResp.json()
            const msTasks = msData.tasks || []
            console.log('[ManagerGantt] Microsoft 365 tasks:', msTasks.length)

            const mappedMsTasks = msTasks.map((task: any) => ({
              key: task.id || task.taskId || '',
              issueType: 'Task',
              summary: task.title || task.subject || '',
              description: task.description || '',
              project: 'Microsoft 365',
              priority: task.priority || 'Medium',
              status: task.status || 'Open',
              assignee: task.assignee || 'Unassigned',
              team: 'Operations',
              start: task.startDate || task.createdDateTime || null,
              due: task.dueDate || null,
              duration: task.duration || 8,
              created: task.createdDateTime || null,
              projectKey: 'MS365',
            }))
            allCollectedTasks.push(...mappedMsTasks)
          }
        } catch (e) {
          console.warn('[ManagerGantt] Microsoft 365 fetch failed:', e)
        }

        console.log('[ManagerGantt] Total tasks collected:', allCollectedTasks.length)
        setTasks(allCollectedTasks)

        if (allCollectedTasks.length > 0) {
          addToast({
            type: 'success',
            title: 'Global Data Loaded',
            description: `Loaded ${allCollectedTasks.length} tasks from all sources`,
            duration: 4000,
          })
        } else {
          addToast({
            type: 'info',
            title: 'No Tasks Found',
            description: 'No tasks available from connected integrations.',
            duration: 4000,
          })
        }
      } catch (error) {
        console.error('[ManagerGantt] Error fetching tasks:', error)
        addToast({
          type: 'error',
          title: 'Failed to Load Data',
          description: 'Could not load global task data.',
          duration: 5000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOtherSources()
  }, [autoFetch, jiraHookData.issues, shouldUseFallbackFetch, addToast])


  const { assigneeRows, minDate, maxDate, totalUnits, dateMarkers, colorMap, allProjects } = useMemo(() => {
    // Helper to normalize date to UTC midnight (start of day)
    const normalizeDate = (d: Date): Date => {
      const dd = new Date(d)
      return new Date(Date.UTC(dd.getFullYear(), dd.getMonth(), dd.getDate()))
    }

    // Derive project key from task
    const deriveProjectKey = (t: Issue): string => {
      const anyT: any = t as any
      if (anyT.project) return String(anyT.project)
      if (anyT.projectId) return String(anyT.projectId)
      if (anyT.project_key) return String(anyT.project_key)
      if (anyT.projectKey) return String(anyT.projectKey)
      if (typeof t.key === 'string' && t.key.includes('-')) return t.key.split('-')[0]
      return 'UNKNOWN'
    }

    // Group tasks by assignee
    const byAssignee: { [key: string]: TaskWithDates[] } = {}
    const projectSet = new Set<string>()
    let min: Date | null = null
    let max: Date | null = null

    tasks.forEach(t => {
      const assignee = t.assignee || 'Unassigned'
      const projectKey = deriveProjectKey(t)

      if (!byAssignee[assignee]) byAssignee[assignee] = []
      projectSet.add(projectKey)

      const sourceStart = t.start || t.created
      const start = normalizeDate(new Date(sourceStart!))
      let end = t.due ? normalizeDate(new Date(t.due)) : normalizeDate(new Date(sourceStart!))

      if (end.getTime() < start.getTime()) end = new Date(start.getTime())

      byAssignee[assignee].push({ ...t, _start: start, _end: end, _projectKey: projectKey })

      if (!isNaN(start.getTime())) min = min ? (start < min ? start : min) : start
      if (!isNaN(end.getTime())) max = max ? (end > max ? end : max) : end
    })

    if (!min) min = normalizeDate(new Date())
    if (!max) max = normalizeDate(new Date())

    // Start timeline from the earliest task start
    min = normalizeDate(new Date(min.getTime()))
    // Extend max to 6 months after last task
    max = normalizeDate(new Date(max.getFullYear(), max.getMonth() + 6, max.getDate()))

    let totalUnits = 0
    let markers: Date[] = []

    if (viewType === 'day') {
      totalUnits = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)) + 1
      for (let i = 0; i < totalUnits; i++) markers.push(new Date(min.getTime() + i * 24 * 60 * 60 * 1000))
    } else if (viewType === 'week') {
      totalUnits = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1
      for (let i = 0; i < totalUnits; i++) markers.push(new Date(min.getTime() + i * 7 * 24 * 60 * 60 * 1000))
    } else if (viewType === 'month') {
      let current = new Date(min)
      current.setDate(1)
      while (current <= max) {
        markers.push(new Date(current))
        current.setMonth(current.getMonth() + 1)
      }
      totalUnits = markers.length
    }

    const projectKeys = Array.from(projectSet).sort()
    const colorMap: { [key: string]: ColorGradient } = {}

    projectKeys.forEach((projectKey, idx) => {
      colorMap[projectKey] = projectColors[idx % projectColors.length]
    })

    const assigneeNames = Object.keys(byAssignee).sort()
    const assigneeRows: AssigneeRow[] = assigneeNames.map(name => ({
      assignee: name,
      tasks: byAssignee[name].sort((a, b) => a._start.getTime() - b._start.getTime())
    }))

    return { assigneeRows, minDate: min, maxDate: max, totalUnits, dateMarkers: markers, colorMap, allProjects: projectKeys }
  }, [tasks, viewType])

  const getCellWidth = (): number => {
    const baseWidths: { [key in ViewType]: number } = { day: 50, week: 280, month: 200 }
    return baseWidths[viewType] * zoom
  }

  const cellWidth = getCellWidth()

  if (loading) {
    return <div className="p-6 bg-white rounded shadow">Loading tasks...</div>
  }

  if (!assigneeRows.length) {
    return <div className="p-6 bg-white rounded shadow">No tasks to show</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">All Projects — Employee Timeline</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
            <div>
              Timeline: <strong>{minDate.toLocaleString(undefined, { month: 'short', year: 'numeric' })}</strong> — <strong>{maxDate.toLocaleString(undefined, { month: 'short', year: 'numeric' })}</strong>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewType('day')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${viewType === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Day
              </button>
              <button
                onClick={() => setViewType('week')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${viewType === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewType('month')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${viewType === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Month
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium">Zoom:</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-32 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Project Color Legend */}
          <div className="flex flex-wrap gap-3">
            {allProjects.map((projectKey) => {
              const colors = colorMap[projectKey]
              const projectTickets = assigneeRows.flatMap(row => row.tasks).filter(t => t._projectKey === projectKey).length
              return (
                <div key={projectKey} className={`px-3 py-2 rounded-xl bg-gradient-to-r ${colors.from} ${colors.to} text-[#1C1917] text-xs font-medium border border-[#E7E5E4]`}>
                  {projectKey} ({projectTickets})
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-[#E7E5E4] rounded-xl bg-white">
        <div className="min-w-max">
          {/* Header with date markers */}
          <div className="flex border-b border-[#E7E5E4] bg-[#F5F5F4] sticky top-0">
            <div className="w-56 p-3 font-medium bg-[#F5F5F4] border-r border-[#E7E5E4] flex-shrink-0"></div>
            {/* Header columns */}
            <div className="flex flex-shrink-0" style={{ width: `${totalUnits * cellWidth}px` }}>
              {dateMarkers.map((date, idx) => {
                let displayText = ''
                let dayName = ''
                let isWeekend = false
                
                // Get actual day of week for this specific date
                const dayOfWeek = date.getDay()
                isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                dayName = dayNames[dayOfWeek]

                if (viewType === 'day') {
                  displayText = formatDate(date)
                } else if (viewType === 'week') {
                  const weekEnd = new Date(date)
                  weekEnd.setDate(weekEnd.getDate() + 6)
                  // Show the actual day of the week at start of week
                  displayText = `${formatDate(date)} - ${formatDate(weekEnd)}`
                  dayName = dayNames[date.getDay()] // Ensure we use actual day of week
                } else if (viewType === 'month') {
                  displayText = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  dayName = dayNames[date.getDay()]
                }
                return (
                  <div
                    key={idx}
                    className={`border-r border-[#E7E5E4] text-xs text-[#78716C] flex flex-col items-center justify-center font-medium h-12 ${isWeekend ? 'bg-[#F5F5F4]' : 'bg-white'}`}
                    style={{ width: `${cellWidth}px` }}
                  >
                    <div className="font-bold text-[#1C1917]">{dayName}</div>
                    <div className="opacity-60 text-xs">{displayText}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Employee rows with tasks */}
          {assigneeRows.map((assignee) => (
            <div key={assignee.assignee} className="flex border-b border-[#E7E5E4] last:border-b-0">
              {/* Employee name column */}
              <div className="w-56 p-3 font-medium bg-white border-r border-[#E7E5E4] flex-shrink-0 text-sm text-[#1C1917]">{assignee.assignee}</div>

              {/* Timeline area */}
              <div
                className="relative flex-shrink-0"
                style={{ width: `${totalUnits * cellWidth}px`, height: '50px' }}
              >
                {/* Grid columns */}
                <div className="absolute inset-0 flex">
                  {Array.from({ length: totalUnits }).map((_, idx) => {
                    let isWeekend = false

                    if (viewType === 'day') {
                      const cellDate = new Date(minDate.getTime() + idx * 24 * 60 * 60 * 1000)
                      const dayOfWeek = cellDate.getDay()
                      isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                    }
                    // In week and month view, don't highlight weekends on the grid
                    // since each cell represents a longer period

                    return (
                      <div
                        key={idx}
                        className={`border-r border-[#E7E5E4] h-full ${isWeekend ? 'bg-[#F5F5F4]' : ''}`}
                        style={{ width: `${cellWidth}px` }}
                      />
                    )
                  })}
                </div>

                {/* Task bars */}
                {assignee.tasks.map((task, tIdx) => {
                  let startCol = 0
                  let spanCols = 1

                  if (viewType === 'day') {
                    startCol = Math.round((task._start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
                    spanCols = Math.round((task._end.getTime() - task._start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                  } else if (viewType === 'week') {
                    startCol = Math.round((task._start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
                    spanCols = Math.max(1, Math.round((task._end.getTime() - task._start.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1)
                  } else if (viewType === 'month') {
                    const minDateMonthStart = new Date(minDate)
                    minDateMonthStart.setDate(1)

                    const taskStartMonth = new Date(task._start)
                    taskStartMonth.setDate(1)

                    const taskEndMonth = new Date(task._end)
                    taskEndMonth.setDate(1)

                    startCol = (taskStartMonth.getFullYear() - minDateMonthStart.getFullYear()) * 12 +
                      (taskStartMonth.getMonth() - minDateMonthStart.getMonth())

                    const endMonthDiff = (taskEndMonth.getFullYear() - taskStartMonth.getFullYear()) * 12 +
                      (taskEndMonth.getMonth() - taskStartMonth.getMonth())

                    spanCols = Math.max(1, endMonthDiff + 1)
                  }

                  const leftPx = startCol * cellWidth
                  const widthPx = spanCols * cellWidth
                  const colors = colorMap[task._projectKey]

                  return (
                    <div
                      key={tIdx}
                      className={`absolute rounded-xl shadow-sm bg-gradient-to-r ${colors.from} ${colors.to} text-[#1C1917] text-xs font-medium hover:opacity-80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#2DD4BF] hover:ring-offset-1 transition-all border border-[#E7E5E4]/50`}
                      style={{
                        left: `${leftPx}px`,
                        width: `${widthPx}px`,
                        top: '9px',
                        height: '32px'
                      }}
                      title={`${task.key}: ${task.summary}`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="px-2 py-1 truncate h-full flex items-center">
                        <span className="truncate">{task.key}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all border border-[#E7E5E4]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-[#1C1917]">Task Details</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-[#78716C] hover:text-[#1C1917] text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-[#78716C]">Task Name</label>
                <p className="text-[#1C1917] font-medium">{selectedTask.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[#78716C]">Task ID</label>
                  <p className="text-[#1C1917]">{selectedTask.key}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#78716C]">Status</label>
                  <p className={`font-medium ${selectedTask.status === 'Done' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedTask.status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[#78716C]">Assignee</label>
                  <p className="text-[#1C1917]">{selectedTask.assignee || 'Unassigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#78716C]">Priority</label>
                  <p className="text-[#1C1917]">{selectedTask.priority || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[#78716C]">Start Date</label>
                  <p className="text-[#1C1917]">{formatDate(selectedTask._start)}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#78716C]">Due Date</label>
                  <p className="text-[#1C1917]">{formatDate(selectedTask._end)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[#78716C]">Duration</label>
                  <p className="text-[#1C1917] font-medium">
                    {selectedTask._start && selectedTask._end
                      ? `${Math.ceil((selectedTask._end.getTime() - selectedTask._start.getTime()) / (1000 * 60 * 60 * 24)) + 1} days`
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#78716C]">Type</label>
                  <p className="text-[#1C1917]">{selectedTask.issueType || '-'}</p>
                </div>
              </div>

              {selectedTask.description && (
                <div>
                  <label className="text-sm font-semibold text-[#78716C]">Description</label>
                  <p className="text-[#1C1917] text-sm mt-1">{selectedTask.description}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-[#2DD4BF] text-[#1C1917] rounded-xl hover:bg-[#15c9af] transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
