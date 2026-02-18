import React, { useState } from 'react';
import { Bell, XCircle, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { LeaveRequest, Task } from './types';

interface LeaveNotificationPanelProps {
  pendingLeaves: LeaveRequest[];
  allTasks: Task[];
  onApprove: (leave: LeaveRequest) => void;
  onReject: (leave: LeaveRequest) => void;
}

export function LeaveNotificationPanel({
  pendingLeaves,
  allTasks,
  onApprove,
  onReject,
}: LeaveNotificationPanelProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (pendingLeaves.length === 0) {
    return null;
  }

  const getAffectedTasks = (employeeName: string, startDate: string, endDate: string): Task[] => {
    return allTasks.filter(task => {
      if (task.assignee !== employeeName || task.isCancelled) return false;
      // Tasks within the leave period
      return task.day >= 0 && task.day <= 5;
    });
  };

  return (
    <div className="space-y-3">
      {pendingLeaves.map((leave) => {
        const affectedTasks = getAffectedTasks(leave.name, leave.startDate, leave.endDate);
        const totalHours = affectedTasks.reduce((sum, task) => sum + task.hours, 0);
        const isExpanded = expandedId === leave.id;

        return (
          <div
            key={leave.id}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all"
          >
            {/* Header */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : leave.id)}
              className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-light">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-light text-gray-900 text-sm">
                    Leave Request from {leave.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    📅 {leave.startDate} → {leave.endDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 font-light text-[11px] rounded-full">
                  {affectedTasks.length} Tasks
                </span>
                <span className="text-blue-600">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                {/* Reason */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs font-light text-gray-900 mb-1">📝 Reason:</p>
                  <p className="text-sm text-gray-800 font-light">{leave.reason}</p>
                </div>

                {/* Affected Tasks */}
                {affectedTasks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-light text-gray-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Affected Tasks: {affectedTasks.length}
                    </p>
                    <div className="bg-white border border-gray-200 rounded-lg p-2 max-h-[200px] overflow-y-auto space-y-2">
                      {affectedTasks.map((task, i) => (
                        <div key={task.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                          <span className="text-xs font-light text-blue-600 min-w-fit">
                            {i + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-light text-gray-900 truncate">
                              [{task.projectName}] {task.taskName}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-600 mt-0.5">
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-light">
                                {task.hours}h
                              </span>
                              {task.requiredSkills?.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded truncate text-[10px] font-light">
                                  {task.requiredSkills[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-200">
                      <span className="text-xs font-light text-blue-900">Total Hours at Risk:</span>
                      <span className="text-sm font-light text-blue-600">{totalHours}h</span>
                    </div>
                  </div>
                )}

                {/* Impact Summary */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-blue-900 font-light">Team Capacity Loss</p>
                    <p className="text-blue-700 font-light">{affectedTasks.length} tasks</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded border border-orange-200">
                    <p className="text-orange-900 font-light">Estimated RiskScore</p>
                    <p className="text-orange-700 font-light">{Math.min(affectedTasks.length * 15, 100)}%</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Button
                    onClick={() => onApprove(leave)}
                    className="flex-1 h-8 text-xs font-light bg-green-600 hover:bg-green-700 text-white gap-1.5 rounded-lg transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Leave
                  </Button>
                  <Button
                    onClick={() => onReject(leave)}
                    variant="outline"
                    className="flex-1 h-8 text-xs font-light border-gray-300 text-gray-600 hover:bg-gray-100 gap-1.5 rounded-lg transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
