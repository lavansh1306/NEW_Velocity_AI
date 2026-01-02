import { useMemo, useState } from 'react'
import { getWeekNumber, getWeekStart, type Issue } from './types'

interface GanttChartProps {
  tasks: Issue[]
  assignee: string
}

interface Stats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  totalHours: number
  avgDuration: number
  minDate: string
  maxDate: string
}

export default function GanttChart({ tasks, assignee }: GanttChartProps) {
  const [scrollPosition, setScrollPosition] = useState(0)

  const { stats, tasksByWeek, sortedWeeks, minDate, maxDate, allWeeks } = useMemo(() => {
    // Group tasks by week but compute earliest start from task.created
    const tasksByWeek: { [key: string]: Issue[] } = {}
    let earliest: Date | null = null
    let latest: Date | null = null

    tasks.forEach(task => {
      // use created as the primary start; fall back to due if missing
      const createdDate = task.created ? new Date(task.created) : null
      const dueDate = task.due ? new Date(task.due) : null

      const taskStart = createdDate && !isNaN(createdDate.getTime()) ? createdDate : (dueDate && !isNaN(dueDate.getTime()) ? dueDate : null)
      const taskEnd = dueDate && !isNaN(dueDate.getTime()) ? dueDate : (createdDate && !isNaN(createdDate.getTime()) ? createdDate : null)

      if (taskStart) {
        const weekStart = getWeekStart(taskStart)
        const weekKey = weekStart.toISOString().split('T')[0]
        if (!tasksByWeek[weekKey]) tasksByWeek[weekKey] = []
        tasksByWeek[weekKey].push(task)

        // Track earliest and latest task dates
        if (!earliest || taskStart < earliest) earliest = taskStart
        if (!latest || (taskEnd && taskEnd > latest)) latest = taskEnd
      } else if (taskEnd) {
        const weekStart = getWeekStart(taskEnd)
        const weekKey = weekStart.toISOString().split('T')[0]
        if (!tasksByWeek[weekKey]) tasksByWeek[weekKey] = []
        tasksByWeek[weekKey].push(task)

        if (!earliest) earliest = taskEnd
        if (!latest || taskEnd > latest) latest = taskEnd
      }
    })

    // Set minimum date as earliest task start (normalized) or default
    const minDate = earliest ? getWeekStart(earliest) : getWeekStart(new Date())

    // Set maximum date to 6 months after the last task (or 6 months from now if no tasks)
    let referenceDate = latest ? latest : new Date()
    const maxDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 6, referenceDate.getDate())

    // Generate all weeks from minDate to maxDate (for slider)
    const allWeeks: string[] = []
    const currentDate = new Date(minDate)
    while (currentDate <= maxDate) {
      const weekStart = getWeekStart(new Date(currentDate))
      const weekKey = weekStart.toISOString().split('T')[0]
      if (!allWeeks.includes(weekKey)) {
        allWeeks.push(weekKey)
      }
      currentDate.setDate(currentDate.getDate() + 7)
    }

    const sortedWeeks = Object.keys(tasksByWeek).sort()

    // Calculate stats
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Closed').length
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length
    const totalHours = tasks.reduce((sum, t) => sum + (typeof t.duration === 'number' ? t.duration : 0), 0) * 8
    const avgDuration = Math.round(tasks.reduce((sum, t) => sum + (typeof t.duration === 'number' ? t.duration : 0), 0) / totalTasks)

    const stats: Stats = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalHours,
      avgDuration,
      minDate: minDate.toLocaleDateString(),
      maxDate: maxDate.toLocaleDateString(),
    }

    return { stats, tasksByWeek, sortedWeeks, minDate, maxDate, allWeeks }
  }, [tasks])

  // Get visible weeks based on scroll position (show 12 weeks at a time)
  const weeksPerView = 12
  const visibleStartIndex = Math.floor((scrollPosition / 100) * Math.max(0, allWeeks.length - weeksPerView))
  const visibleWeeks = allWeeks.slice(visibleStartIndex, visibleStartIndex + weeksPerView)

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 px-8 md:px-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        📅 Gantt Chart - {assignee}
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">📊 Total Tasks</h4>
          <p className="text-3xl font-bold text-blue-600">{stats.totalTasks}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">✅ Completed</h4>
          <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">⏳ In Progress</h4>
          <p className="text-3xl font-bold text-purple-600">{stats.inProgressTasks}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">⏱️ Total Hours</h4>
          <p className="text-3xl font-bold text-orange-600">{stats.totalHours}h</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">📈 Avg Duration</h4>
          <p className="text-3xl font-bold text-red-600">{stats.avgDuration}d</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">📅 Timeline</h4>
          <p className="text-sm font-semibold text-indigo-600">{stats.minDate}</p>
          <p className="text-sm font-semibold text-indigo-600">{stats.maxDate}</p>
        </div>
      </div>

      {/* Timeline Slider */}
      {allWeeks.length > 0 && (
        <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold text-gray-700">📍 Timeline Navigator</label>
            <span className="text-sm text-gray-600">
              Showing weeks {visibleStartIndex + 1}-{Math.min(visibleStartIndex + weeksPerView, allWeeks.length)} of {allWeeks.length}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={scrollPosition}
            onChange={(e) => setScrollPosition(Number(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between mt-3 text-xs text-gray-500">
            <span>{new Date(allWeeks[0]).toLocaleDateString()}</span>
            <span>{new Date(allWeeks[allWeeks.length - 1]).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {/* Tasks by Week - Show visible weeks only */}
      <div className="space-y-6">
        {visibleWeeks.map((weekKey) => {
          const weekStart = new Date(weekKey)
          const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
          const weekNumber = getWeekNumber(weekStart)
          const weekTasks = tasksByWeek[weekKey] || []

          return (
            <div key={weekKey}>
              {/* Week Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  Week {weekNumber} ({weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()})
                </h3>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">
                  {weekTasks.length} task(s)
                </span>
              </div>

              {/* Tasks in Week */}
              {weekTasks.length > 0 ? (
                <div className="space-y-3">
                  {weekTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{task.key}</h4>
                          <p className="text-sm text-gray-700 mt-1">{task.summary}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {task.status}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Created: {task.created ? new Date(task.created).toLocaleDateString() : '-'}</span>
                        <span>Due: {task.due ? new Date(task.due).toLocaleDateString() : '-'}</span>
                        <span className="font-semibold text-blue-600">Duration: {task.duration}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500 text-sm">
                  No tasks scheduled for this week
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
