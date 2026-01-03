import React, { useMemo, useState } from 'react'
import { getWeekStart, type Issue } from './types'

interface ManagerSummaryProps {
  tasks: Issue[]
}

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
}

interface TotalItem {
  name: string
  count: number
  avgDuration: number
  overdue: number
  idleDays: number
}

interface WorkingPeriod {
  [key: string]: { start: Date; end: Date }
}

interface FreePeriod {
  start: Date
  end: Date
  days: number
  type: string
}

function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )
}

function formatDate(d: Date): string {
  return d.toLocaleDateString()
}

export default function ManagerSummary({ tasks }: ManagerSummaryProps) {
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null)
  const [workingPeriod, setWorkingPeriod] = useState<WorkingPeriod>({})
  const [showBlockTimeResult, setShowBlockTimeResult] = useState(false)
  const { byAssignee, weeks, tasksPerWeekPerAssignee, totals, idleDaysByAssignee } = useMemo(() => {
    const byAssignee: { [key: string]: Issue[] } = {}
    const msPerDay = 24 * 60 * 60 * 1000
    const normalizeDate = (d: Date | string): Date => {
      const nd = new Date(d)
      nd.setHours(0, 0, 0, 0)
      return nd
    }
    const weeksSet = new Set<string>()

    tasks.forEach(t => {
      const assignee = t.assignee || 'Unassigned'
      if (!byAssignee[assignee]) byAssignee[assignee] = []

      byAssignee[assignee].push(t)

      if (t.due) {
        const wk = getWeekStart(new Date(t.due)).toISOString().split('T')[0]
        weeksSet.add(wk)
      } else if (t.startDate) {
        const wk = getWeekStart(new Date(t.startDate)).toISOString().split('T')[0]
        weeksSet.add(wk)
      }
    })

    const weeks = Array.from(weeksSet).sort()

    // tasks per week per assignee (count)
    const tasksPerWeekPerAssignee: { [key: string]: { [key: string]: number } } = {}
    Object.keys(byAssignee).forEach(assignee => {
      tasksPerWeekPerAssignee[assignee] = {}
      byAssignee[assignee].forEach(t => {
        const wk = (t.due ? getWeekStart(new Date(t.due)) : getWeekStart(new Date(t.startDate!))).toISOString().split('T')[0]
        tasksPerWeekPerAssignee[assignee][wk] = (tasksPerWeekPerAssignee[assignee][wk] || 0) + 1
      })
    })

    // Calculate idle days between first and last task for each assignee
    const idleDaysByAssignee: { [key: string]: number } = {}
    Object.keys(byAssignee).forEach(assignee => {
      const assigneeTasks = byAssignee[assignee].map(t => ({
        start: normalizeDate(t.startDate!),
        end: t.due ? normalizeDate(t.due) : normalizeDate(t.startDate!),
        // duration in days (inclusive)
        durationDays: (() => {
          const s = normalizeDate(t.startDate!)
          const e = t.due ? normalizeDate(t.due) : s
          return Math.max(1, Math.floor((e.getTime() - s.getTime()) / msPerDay) + 1)
        })()
      }))

      if (assigneeTasks.length === 0) {
        idleDaysByAssignee[assignee] = 0
        return
      }

      // Sort by start date
      assigneeTasks.sort((a, b) => a.start.getTime() - b.start.getTime())

      // Get total span from first task start to last task end (inclusive)
      const firstTaskStart = assigneeTasks[0].start
      const lastTaskEnd = assigneeTasks[assigneeTasks.length - 1].end
      const totalSpanDays = Math.max(1, Math.floor((lastTaskEnd.getTime() - firstTaskStart.getTime()) / msPerDay) + 1)

      // Sum all task durations (inclusive)
      const totalTaskDays = assigneeTasks.reduce((sum, task) => sum + Math.max(1, Math.floor((task.end.getTime() - task.start.getTime()) / msPerDay) + 1), 0)

      // Idle days = total span - total task days
      const idleDays = Math.max(0, totalSpanDays - totalTaskDays)
      idleDaysByAssignee[assignee] = idleDays
    })

    // totals
    const totals: TotalItem[] = Object.keys(byAssignee).map(name => {
      const items = byAssignee[name]
      const avgDuration = Math.round(items.reduce((s, it) => s + (Number(it.duration) || 0), 0) / Math.max(1, items.length))
      const overdue = items.filter(it => it.due && new Date(it.due) < new Date()).length
      const idleDays = idleDaysByAssignee[name] || 0
      return { name, count: items.length, avgDuration, overdue, idleDays }
    }).sort((a, b) => b.count - a.count)

    return { byAssignee, weeks, tasksPerWeekPerAssignee, totals, idleDaysByAssignee }
  }, [tasks])

  const topAssignees = totals.slice(0, 8)

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">Manager Summary</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Assignees" value={Object.keys(byAssignee).length} />
        <StatsCard title="Total Tasks" value={tasks.length} />
        <StatsCard title="Avg Duration (days)" value={Math.round(tasks.reduce((s, t) => s + (Number(t.duration) || 0), 0) / Math.max(1, tasks.length))} />
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowBlockTimeResult(!showBlockTimeResult)}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center gap-2"
        >
          ⏱️ Calculate Block Time
        </button>
        
        {showBlockTimeResult && (
          <div className="mt-4 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Total Block Time (All Employees)</p>
                <p className="text-4xl font-bold text-purple-600">{(Object.values(idleDaysByAssignee) as number[]).reduce((sum, days) => sum + days, 0)}</p>
                <p className="text-xs text-gray-500 mt-2">Total Idle Days</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Average Block Time Per Employee</p>
                <p className="text-4xl font-bold text-orange-600">{((Object.values(idleDaysByAssignee) as number[]).reduce((sum, days) => sum + days, 0) / Math.max(1, Object.keys(byAssignee).length)).toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-2">Idle Days/Employee</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Highest Block Time</p>
                <p className="text-4xl font-bold text-orange-600">{Math.max(...(Object.values(idleDaysByAssignee) as number[]), 0)}</p>
                <p className="text-xs text-gray-500 mt-2">{totals.find(t => t.idleDays === Math.max(...totals.map(x => x.idleDays)))?.name || '-'}</p>
              </div>
            </div>
            
            <div className="mt-4 bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Block Time Breakdown by Employee</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {totals
                  .filter(t => t.idleDays > 0)
                  .sort((a, b) => b.idleDays - a.idleDays)
                  .map(t => (
                    <div key={t.name} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-sm font-bold text-purple-600">{t.idleDays} days</span>
                    </div>
                  ))}
                {totals.filter(t => t.idleDays > 0).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">All employees are fully scheduled</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="md:flex gap-6">
        <div className="flex-1">
          <h4 className="text-sm font-semibold mb-2">Top Assignees (by task count)</h4>
          <div className="space-y-2">
            {topAssignees.map(a => (
              <div key={a.name} className="flex items-center justify-between">
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-sm text-gray-600">{a.count} tasks • {a.avgDuration}d avg • {a.overdue} overdue</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-[420px]">
          <h4 className="text-sm font-semibold mb-2">Tasks per Assignee (bar)</h4>
          <div className="space-y-2">
            {totals.map(t => (
              <div key={t.name} className="flex items-center gap-3">
                <div className="w-32 text-sm">{t.name}</div>
                <div className="flex-1 bg-gray-100 h-4 rounded overflow-hidden">
                  <div className="bg-orange-500 h-4 rounded" style={{ width: `${Math.min(100, (t.count / (totals[0]?.count || 1)) * 100)}%` }} />
                </div>
                <div className="w-10 text-sm text-right">{t.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-[420px]">
          <h4 className="text-sm font-semibold mb-2">Idle Days by Assignee</h4>
          <div className="space-y-2">
            {totals.map(t => (
              <div key={`idle-${t.name}`} className="flex items-center gap-3">
                <div className="w-32 text-sm">{t.name}</div>
                <div className="flex-1 bg-gray-100 h-4 rounded overflow-hidden">
                  <div className="bg-amber-500 h-4 rounded" style={{ width: `${Math.min(100, (t.idleDays / Math.max(...totals.map(x => x.idleDays), 1)) * 100)}%` }} />
                </div>
                <div className="w-10 text-sm text-right">{t.idleDays}d</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-2">Weekly workload heatmap (tasks/week)</h4>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-max">
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${Math.max(1, weeks.length)}, 80px)` }}>
              <div className="p-2 font-semibold">Assignee</div>
              {weeks.map(w => <div key={w} className="p-2 font-semibold text-xs text-center">{w}</div>)}

              {Object.keys(byAssignee).sort().map(name => (
                <React.Fragment key={name}>
                  <div className="p-2 text-sm">{name}</div>
                  {weeks.map(wk => {
                    const v = (tasksPerWeekPerAssignee[name] && tasksPerWeekPerAssignee[name][wk]) || 0
                    const intensity = Math.min(1, v / 5)
                    const bg = `rgba(249,115,22,${0.15 + intensity * 0.7})`
                    return <div key={wk} className="p-2 text-center text-sm" style={{ background: bg }}>{v || '-'}</div>
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Availability Dashboard */}
      <div className="mt-8 border rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-bold mb-4">Employee Availability Dashboard</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee:</label>
          <select
            value={selectedAssignee || ''}
            onChange={(e) => setSelectedAssignee(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white w-full md:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">-- Choose an employee --</option>
            {Object.keys(byAssignee).sort().map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {selectedAssignee && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold mb-4 text-gray-800">{selectedAssignee} - Available Date Ranges</h4>
            
            {(() => {
              const msPerDay_local = 24 * 60 * 60 * 1000
              const normDate = (d: Date | string): Date => { const nd = new Date(d); nd.setHours(0, 0, 0, 0); return nd }

              const assigneeTasks = byAssignee[selectedAssignee].map(t => ({
                start: normDate(t.startDate!),
                end: t.due ? normDate(t.due) : normDate(t.startDate!),
                key: t.key,
                summary: t.summary
              }))
              
              if (assigneeTasks.length === 0) {
                return <p className="text-gray-500">No tasks assigned</p>
              }

              // Sort by start date
              assigneeTasks.sort((a, b) => a.start.getTime() - b.start.getTime())
              
              const defaultStart = assigneeTasks[0].start
              const defaultEnd = assigneeTasks[assigneeTasks.length - 1].end
              
              const currentStart = workingPeriod[selectedAssignee]?.start || defaultStart
              const currentEnd = workingPeriod[selectedAssignee]?.end || defaultEnd
              
              // Handle date change
              const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const newDate = new Date(e.target.value)
                setWorkingPeriod(prev => ({
                  ...prev,
                  [selectedAssignee]: {
                    ...prev[selectedAssignee],
                    start: newDate
                  }
                }))
              }
              
              const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const newDate = new Date(e.target.value)
                setWorkingPeriod(prev => ({
                  ...prev,
                  [selectedAssignee]: {
                    ...prev[selectedAssignee],
                    end: newDate
                  }
                }))
              }
              
              const resetDates = () => {
                setWorkingPeriod(prev => {
                  const updated = { ...prev }
                  delete updated[selectedAssignee]
                  return updated
                })
              }
              
              const freePeriods: FreePeriod[] = []
              
              // Calculate gaps between tasks
              for (let i = 0; i < assigneeTasks.length - 1; i++) {
                const currentEnd = assigneeTasks[i].end
                const nextStart = assigneeTasks[i + 1].start

                // gapDays excludes the end day of the earlier task and the start day of the next task
                const rawDays = Math.floor((nextStart.getTime() - currentEnd.getTime()) / msPerDay_local)
                const gapDays = Math.max(0, rawDays - 1)

                if (gapDays > 0) {
                  const freeStart = new Date(currentEnd.getTime() + msPerDay_local)
                  const freeEnd = new Date(nextStart.getTime() - msPerDay_local)
                  freePeriods.push({
                    start: freeStart,
                    end: freeEnd,
                    days: gapDays,
                    type: 'between'
                  })
                }
              }
              
              return (
                <div className="space-y-3">
                  {/* Date Range Picker */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <h5 className="font-semibold text-sm text-gray-800 mb-3">Adjust Working Period</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Date:</label>
                        <input
                          type="date"
                          value={currentStart.toISOString().split('T')[0]}
                          onChange={handleStartDateChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">End Date:</label>
                        <input
                          type="date"
                          value={currentEnd.toISOString().split('T')[0]}
                          onChange={handleEndDateChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={resetDates}
                      className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                    >
                      Reset to Default
                    </button>
                  </div>

                  {/* Working Period Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-orange-50 p-3 rounded border border-orange-200">
                      <p className="text-xs text-gray-600">Working Period Start</p>
                      <p className="text-lg font-semibold text-orange-700">{formatDate(currentStart)}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded border border-orange-200">
                      <p className="text-xs text-gray-600">Working Period End</p>
                      <p className="text-lg font-semibold text-orange-700">{formatDate(currentEnd)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h5 className="font-semibold text-sm mb-3 text-gray-700">Free/Idle Periods</h5>
                    {freePeriods.length > 0 ? (
                      <div className="space-y-2">
                        {freePeriods.map((period, idx) => (
                          <div key={idx} className="bg-green-50 border border-green-200 rounded p-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{formatDate(period.start)} → {formatDate(period.end)}</p>
                              <p className="text-xs text-gray-600">Available for new tasks</p>
                            </div>
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-semibold">
                              {period.days} {period.days === 1 ? 'day' : 'days'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No free periods - employee is fully scheduled</p>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h5 className="font-semibold text-sm mb-3 text-gray-700">Scheduled Tasks</h5>
                    <div className="space-y-2">
                      {assigneeTasks.map((task, idx) => {
                        const duration = Math.max(1, Math.floor((task.end.getTime() - task.start.getTime()) / msPerDay_local) + 1)
                        return (
                          <div key={idx} className="bg-purple-50 border border-purple-200 rounded p-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{task.key} - {task.summary}</p>
                              <p className="text-xs text-gray-600">{formatDate(task.start)} → {formatDate(task.end)}</p>
                            </div>
                            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm font-semibold">
                              {duration} {duration === 1 ? 'day' : 'days'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {!selectedAssignee && (
          <p className="text-gray-400 text-center py-8">Select an employee to view their availability</p>
        )}
      </div>
    </div>
  )
}
