import React, { useMemo, useState } from 'react'
import type { Issue } from './types'

interface ManagerGanttProps {
  tasks: Issue[]
}

interface ColorGradient {
  from: string
  to: string
}

interface AssigneeData {
  name: string
  tasks: TaskWithDates[]
}

interface TaskWithDates extends Issue {
  _start: Date
  _end: Date
}

type ViewType = 'day' | 'week' | 'month'

function formatDate(d: Date): string {
  return d.toLocaleDateString()
}

const assigneeColors: ColorGradient[] = [
  { from: 'from-blue-500', to: 'to-blue-600' },
  { from: 'from-red-500', to: 'to-red-600' },
  { from: 'from-green-500', to: 'to-green-600' },
  { from: 'from-purple-500', to: 'to-purple-600' },
  { from: 'from-yellow-500', to: 'to-yellow-600' },
  { from: 'from-pink-500', to: 'to-pink-600' },
  { from: 'from-indigo-500', to: 'to-indigo-600' },
  { from: 'from-cyan-500', to: 'to-cyan-600' },
]

export default function ManagerGantt({ tasks }: ManagerGanttProps) {
  const [viewType, setViewType] = useState<ViewType>('day')
  const [zoom, setZoom] = useState(1.6)

  const { assignees, minDate, maxDate, totalUnits, dateMarkers, colorMap } = useMemo(() => {
    // Helper to normalize date to midnight (start of day)
    const normalizeDate = (d: Date): Date => {
      const normalized = new Date(d)
      normalized.setHours(0, 0, 0, 0)
      return normalized
    }

    const byAssignee: { [key: string]: TaskWithDates[] } = {}
    let min: Date | null = null
    let max: Date | null = null

    tasks.forEach(t => {
      const assignee = t.assignee || 'Unassigned'
      if (!byAssignee[assignee]) byAssignee[assignee] = []

      const start = normalizeDate(new Date(t.created!))
      const end = t.due ? normalizeDate(new Date(t.due)) : normalizeDate(new Date(t.created!))

      byAssignee[assignee].push({ ...t, _start: start, _end: end })

      if (!isNaN(start.getTime())) min = min ? (start < min ? start : min) : start
      if (!isNaN(end.getTime())) max = max ? (end > max ? end : max) : end
    })

    if (!min) min = normalizeDate(new Date())
    if (!max) max = normalizeDate(new Date())

    // Start timeline from the earliest task start (no extra left padding)
    const pad = 0
    min = normalizeDate(new Date(min.getTime() - pad * 24 * 60 * 60 * 1000))
    // Extend max to 6 months after last task
    max = normalizeDate(new Date(max.getFullYear(), max.getMonth() + 6, max.getDate()))

    let totalUnits = 0
    let markers: Date[] = []

    if (viewType === 'day') {
      totalUnits = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)) + 1
      for (let i = 0; i < totalUnits; i++) {
        markers.push(new Date(min.getTime() + i * 24 * 60 * 60 * 1000))
      }
    } else if (viewType === 'week') {
      totalUnits = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1
      for (let i = 0; i < totalUnits; i++) {
        markers.push(new Date(min.getTime() + i * 7 * 24 * 60 * 60 * 1000))
      }
    } else if (viewType === 'month') {
      let current = new Date(min)
      current.setDate(1)
      while (current <= max) {
        markers.push(new Date(current))
        current.setMonth(current.getMonth() + 1)
      }
      totalUnits = markers.length
    }

    const assigneeNames = Object.keys(byAssignee).sort()
    
    // Create color map based on PROJECT KEY, not assignee name
    const projectKeys = [...new Set(tasks.map(t => t.key))].sort()
    const colorMap: { [key: string]: ColorGradient } = {}
    projectKeys.forEach((projectKey, idx) => {
      colorMap[projectKey] = assigneeColors[idx % assigneeColors.length]
    })

    const assignees: AssigneeData[] = assigneeNames.map(name => ({
      name,
      tasks: byAssignee[name]
    }))

    return { assignees, minDate: min, maxDate: max, totalUnits, dateMarkers: markers, colorMap }
  }, [tasks, viewType])

  const getCellWidth = (): number => {
    const baseWidths: { [key in ViewType]: number } = { day: 50, week: 280, month: 200 }
    return baseWidths[viewType] * zoom
  }

  const cellWidth = getCellWidth()

  if (!assignees.length) return <div className="p-6 bg-white rounded shadow">No tasks to show</div>

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Manager Gantt — All Assignees</h2>
        <div className="flex items-center gap-4">
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as ViewType)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Day View</option>
            <option value="week">Week View</option>
            <option value="month">Month View</option>
          </select>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Zoom:</span>
            <input
              type="range"
              min="0.3"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-600 w-10">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        {/* Show month-range with year (e.g. "Nov 2025 — Jun 2026") */}
        <div>
          Timeline: <strong>{minDate.toLocaleString(undefined, { month: 'short', year: 'numeric' })}</strong> — <strong>{maxDate.toLocaleString(undefined, { month: 'short', year: 'numeric' })}</strong>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <div className="min-w-max">
          {/* Header with date markers - must match grid exactly */}
          <div className="flex border-b bg-gray-100 sticky top-0">
            <div className="w-48 p-3 font-medium bg-gray-50 border-r flex-shrink-0"></div>
            {/* Header columns - same width calculation as grid */}
            <div className="flex flex-shrink-0" style={{ width: `${totalUnits * cellWidth}px` }}>
              {dateMarkers.map((date, idx) => {
                let displayText = ''
                let dayName = ''
                let isWeekend = false
                const dayOfWeek = date.getDay()
                isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Sunday=0, Saturday=6
                
                // Get day name: Sunday, Monday, Tuesday, etc.
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                dayName = dayNames[dayOfWeek]
                
                if (viewType === 'day') {
                  displayText = formatDate(date)
                } else if (viewType === 'week') {
                  const weekEnd = new Date(date)
                  weekEnd.setDate(weekEnd.getDate() + 6)
                  displayText = `${formatDate(date)} - ${formatDate(weekEnd)}`
                } else if (viewType === 'month') {
                  displayText = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                }
                return (
                  <div
                    key={idx}
                    className={`border-r text-xs text-gray-600 flex flex-col items-center justify-center font-medium h-12 ${isWeekend ? 'bg-gray-200' : 'bg-gray-100'}`}
                    style={{ width: `${cellWidth}px` }}
                  >
                    <div className="font-bold text-gray-800">{dayName}</div>
                    <div className="opacity-60 text-xs">{displayText}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Grid lines and bars */}
          {assignees.map((assignee) => {
            const sortedTasks = [...assignee.tasks].sort((a, b) => a._start.getTime() - b._start.getTime())
            
            return (
              <div key={assignee.name} className="flex border-b last:border-b-0">
                {/* Assignee name column */}
                <div className="w-48 p-3 font-medium bg-gray-50 border-r flex-shrink-0">{assignee.name}</div>
                
                {/* Timeline area - NO PADDING to ensure pixel-perfect alignment */}
                <div 
                  className="relative flex-shrink-0" 
                  style={{ width: `${totalUnits * cellWidth}px`, height: '50px' }}
                >
                  {/* Grid columns - each column = 1 day/week/month */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: totalUnits }).map((_, idx) => {
                      let isWeekend = false
                      
                      if (viewType === 'day') {
                        const cellDate = new Date(minDate.getTime() + idx * 24 * 60 * 60 * 1000)
                        const dayOfWeek = cellDate.getDay()
                        isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Sunday=0, Saturday=6
                      } else if (viewType === 'week') {
                        const cellDate = new Date(minDate.getTime() + idx * 7 * 24 * 60 * 60 * 1000)
                        // For week view, mark if it starts on Saturday or Sunday
                        const dayOfWeek = cellDate.getDay()
                        isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                      }
                      
                      return (
                        <div 
                          key={idx} 
                          className={`border-r border-gray-200 h-full ${isWeekend ? 'bg-gray-200' : ''}`}
                          style={{ width: `${cellWidth}px` }}
                        />
                      )
                    })}
                  </div>

                  {/* Task bars - positioned absolutely within the same coordinate space */}
                  {assignee.tasks.map((task, tIdx) => {
                    let startCol = 0
                    let spanCols = 1

                    if (viewType === 'day') {
                      // COLUMN INDEX = days from timeline start (0-indexed)
                      // Task starting on minDate = column 0
                      startCol = Math.round((task._start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
                      // SPAN = (end - start) in days + 1 (inclusive of both start and end date)
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

                    // PIXEL CALCULATION:
                    // left = startCol * cellWidth (bar starts at left edge of column)
                    // width = spanCols * cellWidth (bar spans exactly N columns)
                    const leftPx = startCol * cellWidth
                    const widthPx = spanCols * cellWidth
                    
                    const colors = colorMap[task.key] || assigneeColors[0]

                    return (
                      <div
                        key={tIdx}
                        className={`absolute rounded shadow-sm bg-gradient-to-r ${colors.from} ${colors.to} text-white text-xs font-medium hover:opacity-100 overflow-hidden`}
                        style={{ 
                          left: `${leftPx}px`, 
                          width: `${widthPx}px`, 
                          top: '9px',
                          height: '32px'
                        }}
                        title={`${task.key} — ${task.summary}\n${formatDate(task._start)} → ${formatDate(task._end)}`}
                      >
                        <div className="px-2 py-1 truncate h-full flex items-center">
                          <span className="truncate">{task.key}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
