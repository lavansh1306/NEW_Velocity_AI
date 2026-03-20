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
  assignee_id?: string
  team: string
  start: string | null
  due: string | null
  duration: number | string
  created?: string | null
  project?: string
  projectId?: string
  project_key?: string
  projectKey?: string
  projectName?: string
}

interface ColorGradient {
  from: string
  to: string
}

interface AssigneeRow {
  assignee: string
  assignee_id?: string
  tasks: TaskWithDates[]
}

interface TaskWithDates extends Issue {
  _start: Date
  _end: Date
  _projectKey: string
  _assigneeId?: string
}

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
  const [zoom] = useState(2)
  const [selectedTask, setSelectedTask] = useState<TaskWithDates | null>(null)
  const [tasks, setTasks] = useState<Issue[]>(externalTasks)
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [projectNameMap, setProjectNameMap] = useState<{ [key: string]: string }>({})
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Use the useJiraData hook if we're fetching data and no Jira issues provided
  const jiraHookData = useJiraData()
  const shouldUseFallbackFetch = autoFetch && externalTasks.length === 0 && !externalJiraIssues

  // When jiraIssues are provided externally, use those
  useEffect(() => {
    if (externalJiraIssues && externalJiraIssues.length > 0) {
      // Convert Jira issues to internal Issue format, preserving assignee_id
      const convertedTasks: JiraIssue[] = externalJiraIssues.map(issue => ({
        ...issue,
        assignee_id: issue.assignee_id || (issue as any).assigneeId,
      }))
      setTasks(convertedTasks)
      
      // Build project name map from the tasks
      const nameMap: { [key: string]: string } = {}
      convertedTasks.forEach(task => {
        const projectKey = task.project_key || task.projectKey || task.project || ''
        if (projectKey && !nameMap[projectKey]) {
          nameMap[projectKey] = task.projectName || projectKey
        }
      })
      setProjectNameMap(nameMap)
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
      
      // Build project name map from the tasks
      const nameMap: { [key: string]: string } = {}
      jiraHookData.issues.forEach(task => {
        const projectKey = task.project_key || task.projectKey || task.project || ''
        if (projectKey && !nameMap[projectKey]) {
          nameMap[projectKey] = task.projectName || projectKey
        }
      })
      setProjectNameMap(nameMap)
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
              assignee_id: ticket.assigneeId || ticket.assignee_id || undefined,
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
              assignee_id: task.assigneeId || task.assignee_id || undefined,
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

      byAssignee[assignee].push({ 
        ...t, 
        _start: start, 
        _end: end, 
        _projectKey: projectKey,
        _assigneeId: t.assignee_id
      })

      if (!isNaN(start.getTime())) min = min ? (start < min ? start : min) : start
      if (!isNaN(end.getTime())) max = max ? (end > max ? end : max) : end
    })

    if (!min) min = normalizeDate(new Date())
    if (!max) max = normalizeDate(new Date())

    // Start timeline from the earliest task start
    min = normalizeDate(new Date(min.getTime()))
    // Extend max to 6 months after last task
    max = normalizeDate(new Date(max.getFullYear(), max.getMonth() + 6, max.getDate()))

    // Day view only
    const totalUnits = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const markers: Date[] = []
    for (let i = 0; i < totalUnits; i++) {
      markers.push(new Date(min.getTime() + i * 24 * 60 * 60 * 1000))
    }

    const projectKeys = Array.from(projectSet).sort()
    const colorMap: { [key: string]: ColorGradient } = {}

    projectKeys.forEach((projectKey, idx) => {
      colorMap[projectKey] = projectColors[idx % projectColors.length]
    })

    const assigneeNames = Object.keys(byAssignee).sort()
    const assigneeRows: AssigneeRow[] = assigneeNames.map(name => {
      const tasks = byAssignee[name].sort((a, b) => a._start.getTime() - b._start.getTime())
      // Get assignee_id from the first task (all tasks for an assignee should have the same id)
      const assignee_id = tasks.length > 0 ? tasks[0].assignee_id : undefined
      return {
        assignee: name,
        assignee_id,
        tasks
      }
    })

    return { assigneeRows, minDate: min, maxDate: max, totalUnits, dateMarkers: markers, colorMap, allProjects: projectKeys }
  }, [tasks])

  const getCellWidth = (): number => {
    return 50 * zoom
  }

  const cellWidth = getCellWidth()

  // Function to scroll to first task of a project
  const scrollToProject = (projectKey: string, rows: AssigneeRow[]) => {
    setSelectedProject(projectKey)
    const firstTaskInProject = rows.flatMap(row => row.tasks).find(t => t._projectKey === projectKey)
    if (firstTaskInProject && containerRef.current) {
      // Find the row this task belongs to
      const assigneeIdx = rows.findIndex(row => row.tasks.some(t => t.key === firstTaskInProject.key))
      if (assigneeIdx >= 0) {
        setTimeout(() => {
          const rowElement = containerRef.current?.querySelector(`[data-assignee-idx="${assigneeIdx}"]`)
          if (rowElement) {
            // Scroll row into view vertically
            rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            
            // Scroll horizontally to show the task
            const parentContainer = containerRef.current?.parentElement
            if (parentContainer) {
              const startCol = Math.round((firstTaskInProject._start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
              const scrollPos = startCol * cellWidth - 200 // Offset by 200px for better visibility
              parentContainer.scrollLeft = Math.max(0, scrollPos)
            }
          }
        }, 100)
      }
    }
  }

  // Scroll to today's date on mount
  useEffect(() => {
    setTimeout(() => {
      if (containerRef.current?.parentElement) {
        const today = new Date()
        const normalizeDate = (d: Date): Date => {
          const dd = new Date(d)
          return new Date(Date.UTC(dd.getFullYear(), dd.getMonth(), dd.getDate()))
        }
        const normalizedToday = normalizeDate(today)
        const todayCol = Math.round((normalizedToday.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
        const scrollPos = todayCol * cellWidth - 200
        containerRef.current.parentElement.scrollLeft = Math.max(0, scrollPos)
      }
    }, 200)
  }, [minDate, cellWidth])

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
          {/* Project Color Legend */}
          <div className="flex flex-wrap gap-3">
            {allProjects.map((projectKey) => {
              const colors = colorMap[projectKey]
              const projectName = projectNameMap[projectKey] || projectKey
              const projectTickets = assigneeRows.flatMap(row => row.tasks).filter(t => t._projectKey === projectKey).length
              return (
                <button
                  key={projectKey}
                  type="button"
                  onClick={() => {
                    console.log('Clicked project:', projectKey)
                    scrollToProject(projectKey, assigneeRows)
                  }}
                  className={`px-3 py-2 rounded-xl bg-gradient-to-r ${colors.from} ${colors.to} text-[#1C1917] text-xs font-medium border border-[#E7E5E4] transition-all hover:shadow-md cursor-pointer ${selectedProject === projectKey ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                >
                  {projectName} ({projectTickets})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="border border-[#E7E5E4] rounded-xl bg-white overflow-hidden">
        <div className="flex">
          {/* Fixed left panel for employee names */}
          <div className="w-56 flex-shrink-0 border-r border-[#E7E5E4] overflow-hidden">
            {/* Header - empty space for alignment */}
            <div className="h-[50px] bg-[#F5F5F4] border-b border-[#E7E5E4] flex items-center justify-center font-medium text-xs text-[#78716C]">
              Employees
            </div>
            
            {/* Employee names - always visible */}
            {assigneeRows.map((assignee, assigneeIdx) => (
              <div
                key={assignee.assignee}
                className="h-[50px] p-3 font-medium bg-white border-b border-[#E7E5E4] last:border-b-0 text-sm text-[#1C1917] flex items-center"
                data-assignee-idx={assigneeIdx}
              >
                <div className="truncate">{assignee.assignee}</div>
              </div>
            ))}
          </div>

          {/* Scrollable timeline area */}
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-max" ref={containerRef}>
              {/* Date Header Row */}
              <div className="flex border-b border-[#E7E5E4] h-[50px] bg-[#F5F5F4]">
                <div
                  className="relative flex-shrink-0"
                  style={{ width: `${totalUnits * cellWidth}px`, height: '50px' }}
                >
                  <div className="absolute inset-0 flex flex-nowrap">
                    {Array.from({ length: totalUnits }).map((_, idx) => {
                      const cellDate = new Date(minDate.getTime() + idx * 24 * 60 * 60 * 1000)
                      const dayOfWeek = cellDate.getDay()
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                      
                      // Format date in USA format: MM/DD/YYYY
                      const month = String(cellDate.getMonth() + 1).padStart(2, '0')
                      const day = String(cellDate.getDate()).padStart(2, '0')
                      const year = cellDate.getFullYear()
                      const formattedDate = `${month}/${day}/${year}`
                      
                      // Format short day name
                      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]

                      return (
                        <div
                          key={idx}
                          className={`border-r border-[#E7E5E4] h-full flex flex-col items-center justify-center text-[10px] font-medium flex-shrink-0 ${
                            isWeekend ? 'bg-[#FFFBFA]' : 'bg-white'
                          }`}
                          style={{ width: `${cellWidth}px` }}
                        >
                          <div className="text-[#78716C]">{dayName}</div>
                          <div className="text-[#1C1917]">{formattedDate}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Employee rows with tasks */}
              {assigneeRows.map((assignee, assigneeIdx) => (
                <div key={assignee.assignee} className="flex border-b border-[#E7E5E4] last:border-b-0 h-[50px]" data-assignee-idx={assigneeIdx}>
                  {/* Timeline area */}
                  <div
                    className="relative flex-shrink-0"
                    style={{ width: `${totalUnits * cellWidth}px`, height: '50px' }}
                  >
                    {/* Grid columns */}
                    <div className="absolute inset-0 flex flex-nowrap">
                      {Array.from({ length: totalUnits }).map((_, idx) => {
                        const cellDate = new Date(minDate.getTime() + idx * 24 * 60 * 60 * 1000)
                        const dayOfWeek = cellDate.getDay()
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                        return (
                          <div
                            key={idx}
                            className={`border-r border-[#E7E5E4] h-full flex-shrink-0 ${isWeekend ? 'bg-[#F5F5F4]' : ''}`}
                            style={{ width: `${cellWidth}px` }}
                          />
                        )
                      })}
                    </div>

                    {/* Task bars */}
                    {assignee.tasks.map((task, tIdx) => {
                      // Day view only
                      const startCol = Math.round((task._start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
                      const spanCols = Math.max(1, Math.round((task._end.getTime() - task._start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

                      // Calculate task index within the project
                      const projectTasks = assigneeRows.flatMap(row => row.tasks).filter(t => t._projectKey === task._projectKey)
                      const taskIndexInProject = projectTasks.findIndex(t => t.key === task.key)
                      const taskDisplay = `Task ${taskIndexInProject}`

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
                            <span className="truncate">{taskDisplay}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                  <label className="text-sm font-semibold text-[#78716C]">Assignee ID</label>
                  <p className="text-[#1C1917] font-mono text-xs">{selectedTask._assigneeId || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
