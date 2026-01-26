import React, { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/contexts/ToastContext'
import { apiUrl } from '@/lib/api'

interface GlobalTask {
  key: string
  title: string
  project: string
  assignee: string
  team: string
  status: string
  priority: string
  startDate: string | null
  dueDate: string | null
  estimatedHours: number
  source: 'jira' | 'asana' | 'hubspot'
}

interface AssigneeStats {
  name: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  totalHours: number
  assignedProjects: string[]
}

export default function GlobalGanttDashboard() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [allTasks, setAllTasks] = useState<GlobalTask[]>([])
  const [assigneeStats, setAssigneeStats] = useState<AssigneeStats[]>([])
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week')
  const [zoom, setZoom] = useState(1.5)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchText, setSearchText] = useState('')

  // Fetch all tasks from all sources
  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        setLoading(true)
        const allCollectedTasks: GlobalTask[] = []

        // ======== JIRA ========
        console.log('[GlobalGantt] Fetching Jira data...')
        try {
          // First get projects list
          const projectsResp = await fetch(apiUrl('/api/jira/projects'), {
            credentials: 'include',
          })
          if (projectsResp.ok) {
            const projectsData = await projectsResp.json()
            const projects = projectsData.projects || []
            console.log('[GlobalGantt] Found', projects.length, 'Jira projects')

            // Fetch issues for each project
            for (const project of projects) {
              try {
                const issuesResp = await fetch(apiUrl(`/api/jira/issues?projectKey=${encodeURIComponent(project.key)}`), {
                  credentials: 'include',
                })
                if (issuesResp.ok) {
                  const issuesData = await issuesResp.json()
                  const issues = issuesData.issues || []
                  console.log(`[GlobalGantt] Jira project ${project.key}: ${issues.length} issues`)

                  const jiraTasks = issues.map((iss: any) => ({
                    key: iss.key || iss.id || '',
                    title: iss.summary || '',
                    project: project.key,
                    assignee: iss.assignee || 'Unassigned',
                    team: 'Engineering',
                    status: iss.status || 'Open',
                    priority: iss.priority || 'Medium',
                    startDate: iss.start || null,
                    dueDate: iss.due || null,
                    estimatedHours: 8,
                    source: 'jira' as const,
                  }))
                  allCollectedTasks.push(...jiraTasks)
                }
              } catch (e) {
                console.warn(`[GlobalGantt] Failed to fetch issues for project ${project.key}:`, e)
              }
            }
          }
        } catch (e) {
          console.warn('[GlobalGantt] Jira fetch failed:', e)
        }

        // ======== HUBSPOT ========
        console.log('[GlobalGantt] Fetching HubSpot data...')
        try {
          const hubspotResp = await fetch(apiUrl('/api/hubspot/tickets'), {
            credentials: 'include',
          })
          if (hubspotResp.ok) {
            const hubspotData = await hubspotResp.json()
            const tickets = hubspotData.tickets || []
            console.log('[GlobalGantt] HubSpot tickets:', tickets.length)

            const hubspotTasks = tickets.map((ticket: any) => ({
              key: ticket.id || ticket.ticketId || '',
              title: ticket.subject || ticket.name || '',
              project: 'HubSpot',
              assignee: ticket.assignee || 'Unassigned',
              team: 'Sales',
              status: ticket.stage || ticket.status || 'Open',
              priority: ticket.priority || 'Medium',
              startDate: ticket.createdAt || null,
              dueDate: ticket.closedAt || null,
              estimatedHours: 8,
              source: 'hubspot' as const,
            }))
            allCollectedTasks.push(...hubspotTasks)
          }
        } catch (e) {
          console.warn('[GlobalGantt] HubSpot fetch failed:', e)
        }

        console.log('[GlobalGantt] Total tasks collected:', allCollectedTasks.length)
        setAllTasks(allCollectedTasks)

        // Calculate assignee stats
        const byAssignee: Record<string, GlobalTask[]> = {}
        allCollectedTasks.forEach((task) => {
          if (!byAssignee[task.assignee]) {
            byAssignee[task.assignee] = []
          }
          byAssignee[task.assignee].push(task)
        })

        const statsData: AssigneeStats[] = Object.entries(byAssignee)
          .map(([assignee, tasks]) => ({
            name: assignee,
            totalTasks: tasks.length,
            completedTasks: tasks.filter((t) => t.status === 'Done' || t.status === 'Closed').length,
            inProgressTasks: tasks.filter((t) => t.status === 'In Progress').length,
            totalHours: tasks.reduce((sum, t) => sum + t.estimatedHours, 0),
            assignedProjects: [...new Set(tasks.map((t) => t.project))],
          }))
          .sort((a, b) => b.totalTasks - a.totalTasks)
        setAssigneeStats(statsData)

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
            description: 'No tasks available from connected integrations. Check your API connections.',
            duration: 4000,
          })
        }
      } catch (error) {
        console.error('[GlobalGantt] Error fetching tasks:', error)
        addToast({
          type: 'error',
          title: 'Failed to Load Data',
          description: 'Could not load global task data. Check console for details.',
          duration: 5000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAllTasks()
  }, [addToast])

  // Filter tasks based on criteria
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const matchesProject = !selectedProject || task.project === selectedProject
      const matchesAssignee = !selectedAssignee || task.assignee === selectedAssignee
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus
      const matchesSearch =
        searchText === '' ||
        task.title.toLowerCase().includes(searchText.toLowerCase()) ||
        task.key.toLowerCase().includes(searchText.toLowerCase()) ||
        task.assignee.toLowerCase().includes(searchText.toLowerCase())
      return matchesProject && matchesAssignee && matchesStatus && matchesSearch
    })
  }, [allTasks, selectedProject, selectedAssignee, filterStatus, searchText])

  // Helper to parse date
  const parseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr || dateStr === '') return null
    const parsed = new Date(dateStr)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  // Calculate timeline
  const { minDate, maxDate, dateMarkers } = useMemo(() => {
    let min: Date | null = null
    let max: Date | null = null

    filteredTasks.forEach((task) => {
      const start = parseDate(task.startDate)
      const end = parseDate(task.dueDate)

      if (start) {
        if (!min || start < min) min = start
        if (!max || start > max) max = start
      }
      if (end) {
        if (!min || end < min) min = end
        if (!max || end > max) max = end
      }
    })

    // Default to current date if no tasks
    min = min || new Date()
    max = max || new Date()

    // Extend timeline
    min = new Date(min.getFullYear(), min.getMonth(), 1)
    max = new Date(max.getFullYear(), max.getMonth() + 3, 1)

    let markers: Date[] = []

    if (viewType === 'day') {
      const totalUnits = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24))
      for (let i = 0; i < totalUnits; i++) {
        markers.push(new Date(min.getTime() + i * 24 * 60 * 60 * 1000))
      }
    } else if (viewType === 'week') {
      const totalUnits = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24 * 7))
      for (let i = 0; i < totalUnits; i++) {
        markers.push(new Date(min.getTime() + i * 7 * 24 * 60 * 60 * 1000))
      }
    } else {
      const totalUnits = (max.getFullYear() - min.getFullYear()) * 12 + (max.getMonth() - min.getMonth()) + 1
      for (let i = 0; i < totalUnits; i++) {
        const m = new Date(min.getFullYear(), min.getMonth() + i, 1)
        markers.push(m)
      }
    }

    return { minDate: min, maxDate: max, dateMarkers: markers }
  }, [filteredTasks, viewType])

  // Calculate position for task bar
  const getTaskBarStyle = (task: GlobalTask): React.CSSProperties => {
    const start = parseDate(task.startDate)
    const end = parseDate(task.dueDate)

    if (!start || !end) {
      return { width: '2px', backgroundColor: '#ccc' }
    }

    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const offset = Math.floor((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))

    let pixelsPerDay = 0
    if (viewType === 'day') {
      pixelsPerDay = zoom * 2
    } else if (viewType === 'week') {
      pixelsPerDay = (zoom * 14) / 7
    } else {
      pixelsPerDay = (zoom * 30) / 30
    }

    return {
      left: `${offset * pixelsPerDay}px`,
      width: `${Math.max(1, duration * pixelsPerDay)}px`,
    }
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'Open': 'bg-blue-500',
      'In Progress': 'bg-purple-500',
      'Done': 'bg-green-500',
      'Closed': 'bg-green-600',
      'Pending': 'bg-yellow-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      High: 'border-red-500 text-red-700',
      Medium: 'border-yellow-500 text-yellow-700',
      Low: 'border-green-500 text-green-700',
    }
    return colors[priority] || 'border-gray-500 text-gray-700'
  }

  const projects = [...new Set(allTasks.map((t) => t.project))]
  const assignees = [...new Set(allTasks.map((t) => t.assignee))]
  const statuses = [...new Set(allTasks.map((t) => t.status))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <div className="max-w-full mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-4xl font-bold text-gray-900">📊 Global Gantt Dashboard</h1>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Tasks</h3>
            <p className="text-4xl font-bold text-blue-600">{allTasks.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Projects</h3>
            <p className="text-4xl font-bold text-green-600">{projects.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Team Members</h3>
            <p className="text-4xl font-bold text-purple-600">{assignees.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Hours</h3>
            <p className="text-4xl font-bold text-orange-600">
              {Math.round(allTasks.reduce((sum, t) => sum + t.estimatedHours, 0))}h
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg text-gray-600">Loading global task data from all integrations...</p>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Task, key, assignee..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Project Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Project</label>
                  <select
                    value={selectedProject || ''}
                    onChange={(e) => setSelectedProject(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Projects</option>
                    {projects.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assignee Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assignee</label>
                  <select
                    value={selectedAssignee || ''}
                    onChange={(e) => setSelectedAssignee(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Team Members</option>
                    {assignees.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">View</label>
                  <select
                    value={viewType}
                    onChange={(e) => setViewType(e.target.value as 'day' | 'week' | 'month')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="day">Day View</option>
                    <option value="week">Week View</option>
                    <option value="month">Month View</option>
                  </select>
                </div>
              </div>

              {/* Zoom Control */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">Zoom:</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm text-gray-600 min-w-12">{zoom.toFixed(1)}x</span>
              </div>
            </div>

            {/* Gantt Chart */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* Timeline Header */}
                  <div className="flex sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                    <div className="w-96 flex-shrink-0 px-4 py-3 border-r border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700">Task Details</h3>
                    </div>
                    <div className="flex-1 px-4 py-3">
                      <div className="flex gap-1">
                        {dateMarkers.slice(0, 20).map((date, idx) => (
                          <div key={idx} className="text-xs text-gray-600 text-center" style={{ minWidth: `${zoom * 60}px` }}>
                            {viewType === 'day' && date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {viewType === 'week' && `W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`}
                            {viewType === 'month' && date.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tasks */}
                  {filteredTasks.length === 0 ? (
                    <div className="px-4 py-12 text-center text-gray-500">
                      <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No tasks match your filters</p>
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div key={`${task.source}-${task.key}`} className="flex border-b border-gray-200 hover:bg-blue-50">
                        <div className="w-96 flex-shrink-0 px-4 py-3 border-r border-gray-200">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              <span className="text-xs font-mono text-gray-600">{task.key}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</p>
                            <div className="flex gap-2 text-xs text-gray-600">
                              <span className="px-2 py-1 bg-gray-100 rounded">{task.project}</span>
                              <span className="px-2 py-1 bg-gray-100 rounded">{task.assignee}</span>
                              <span className={`px-2 py-1 text-white rounded ${getStatusColor(task.status)}`}>{task.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 px-4 py-3 relative">
                          <div className="relative h-12 bg-gray-50 rounded">
                            {task.startDate && task.dueDate && (
                              <div
                                className={`absolute top-2 h-8 rounded flex items-center justify-center text-xs font-semibold text-white ${getStatusColor(task.status)} opacity-90 hover:opacity-100 cursor-pointer transition-opacity`}
                                style={getTaskBarStyle(task)}
                                title={`${task.title} - ${task.estimatedHours}h`}
                              >
                                {task.estimatedHours}h
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Assignee Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">👥 Team Members Overview</h2>
              {assigneeStats.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No team member data available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assigneeStats.map((assignee) => (
                    <div key={assignee.name} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-4">{assignee.name}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Tasks:</span>
                          <span className="font-semibold text-gray-900">{assignee.totalTasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Completed:</span>
                          <span className="font-semibold text-green-600">{assignee.completedTasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">In Progress:</span>
                          <span className="font-semibold text-purple-600">{assignee.inProgressTasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Hours:</span>
                          <span className="font-semibold text-orange-600">{assignee.totalHours.toFixed(1)}h</span>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Projects:</p>
                          <div className="flex flex-wrap gap-1">
                            {assignee.assignedProjects.map((proj) => (
                              <span key={proj} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {proj}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
