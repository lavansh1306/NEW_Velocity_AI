import React, { useMemo } from 'react'
import { Card } from '../ui/card'
import { Briefcase, AlertCircle } from 'lucide-react'
import { JiraIssue } from '@/hooks/useJiraData'

interface JiraCapacityMapProps {
  jiraIssues: JiraIssue[]
  loading?: boolean
  className?: string
}

const STATUS_COLORS: { [key: string]: string } = {
  'Done': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'To Do': 'bg-amber-50 text-amber-700 border-amber-200',
  'Blocked': 'bg-rose-50 text-rose-700 border-rose-200',
}

const getStatusColor = (status: string) => {
  return STATUS_COLORS[status] || STATUS_COLORS['To Do']
}

const getPriorityBadge = (priority: string) => {
  const colors: { [key: string]: string } = {
    'Highest': 'bg-rose-100 text-rose-700',
    'High': 'bg-orange-100 text-orange-700',
    'Medium': 'bg-blue-100 text-blue-700',
    'Low': 'bg-slate-100 text-slate-700',
    'Lowest': 'bg-gray-100 text-gray-700',
  }
  return colors[priority] || colors['Medium']
}

export const JiraCapacityMap: React.FC<JiraCapacityMapProps> = ({
  jiraIssues,
  loading = false,
  className = '',
}) => {
  // Group issues by assignee
  const groupedByAssignee = useMemo(() => {
    const groups: { [key: string]: JiraIssue[] } = {}

    jiraIssues.forEach(issue => {
      const assignee = issue.assignee || 'Unassigned'
      if (!groups[assignee]) {
        groups[assignee] = []
      }
      groups[assignee].push(issue)
    })

    return groups
  }, [jiraIssues])

  const assignees = Object.keys(groupedByAssignee).sort()

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-center h-64 text-gray-400">
          Loading Jira capacity data...
        </div>
      </div>
    )
  }

  if (jiraIssues.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <AlertCircle className="w-12 h-12 mb-2 opacity-30" />
          <p>No Jira issues available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
            <Briefcase className="w-5 h-5 text-indigo-600" />
          </div>
          Real-time Capacity Map
        </h2>
        <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
          {jiraIssues.length} Issues
        </span>
      </div>

      <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {assignees.map(assignee => {
            const assigneeIssues = groupedByAssignee[assignee]
            const totalIssues = assigneeIssues.length
            const doneIssues = assigneeIssues.filter(i => i.status === 'Done').length
            const inProgressIssues = assigneeIssues.filter(i => i.status === 'In Progress').length
            const blockedIssues = assigneeIssues.filter(i => i.status === 'Blocked').length

            return (
              <div
                key={assignee}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
              >
                {/* Assignee Header */}
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {assignee
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{assignee}</p>
                      <p className="text-xs text-slate-500">{totalIssues} assigned issue{totalIssues !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Status Summary */}
                  <div className="flex gap-2 text-[10px] font-semibold">
                    {inProgressIssues > 0 && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                        ▶ {inProgressIssues} In Progress
                      </span>
                    )}
                    {doneIssues > 0 && (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                        ✓ {doneIssues} Done
                      </span>
                    )}
                    {blockedIssues > 0 && (
                      <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-md border border-rose-200">
                        ⚠ {blockedIssues} Blocked
                      </span>
                    )}
                  </div>
                </div>

                {/* Assigned Issues */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {assigneeIssues.map(issue => (
                    <div
                      key={issue.key}
                      className={`p-2 rounded-md border text-xs transition-all hover:shadow-sm ${getStatusColor(issue.status)}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-bold text-[11px]">{issue.key}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${getPriorityBadge(issue.priority)}`}>
                          {issue.priority}
                        </span>
                      </div>
                      <p className="font-semibold text-[11px] line-clamp-2 mb-1">{issue.summary}</p>
                      <div className="text-[10px] opacity-75">
                        {issue.project}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-600 mb-3 uppercase">Status Legend</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(STATUS_COLORS).map(([status, colors]) => (
            <div key={status} className={`px-3 py-2 rounded-md border text-xs font-medium ${colors}`}>
              {status}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
