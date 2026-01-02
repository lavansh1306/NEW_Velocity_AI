import React from 'react'
import { getPriorityColor, getStatusColor, type Issue } from './types'

interface IssuesTableProps {
  issues: Issue[]
}

export default function IssuesTable({ issues }: IssuesTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Project Key</th>
              <th className="px-6 py-4 text-left font-semibold">Team</th>
              <th className="px-6 py-4 text-left font-semibold">Issue Type</th>
              <th className="px-6 py-4 text-left font-semibold">Summary</th>
              <th className="px-6 py-4 text-left font-semibold">Description</th>
              <th className="px-6 py-4 text-left font-semibold">Priority</th>
              <th className="px-6 py-4 text-left font-semibold">Status</th>
              <th className="px-6 py-4 text-left font-semibold">Assignee</th>
              <th className="px-6 py-4 text-left font-semibold">Created</th>
              <th className="px-6 py-4 text-left font-semibold">Due Date</th>
              <th className="px-6 py-4 text-left font-semibold">Duration (days)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {issues.map((issue, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-gray-900">{issue.key}</td>
                <td className="px-6 py-4 text-gray-700">{issue.team || '-'}</td>
                <td className="px-6 py-4 text-gray-700">{issue.issueType}</td>
                <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{issue.summary}</td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{issue.description}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                    {issue.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700">{issue.assignee}</td>
                <td className="px-6 py-4 text-gray-600">
                  {issue.created ? new Date(issue.created).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {issue.due ? new Date(issue.due).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 font-semibold text-blue-600">
                  {issue.duration !== '' ? issue.duration : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
