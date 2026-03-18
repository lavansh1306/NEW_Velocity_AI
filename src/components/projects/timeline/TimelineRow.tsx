import React, { useState } from 'react';
import { ProcessedTask, getTaskColor } from './TimelineUtils';
import { TimelineBar } from './TimelineBar';

interface TimelineRowProps {
  task: ProcessedTask;
  position: { left: number; width: number };
  columnCount: number;
}

export const TimelineRow: React.FC<TimelineRowProps> = ({ task, position, columnCount }) => {
  const [hoveredTask, setHoveredTask] = useState<ProcessedTask | null>(null);

  const statusLabel = task.status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const statusColor = getTaskColor(task.status, task.isOverdue);

  return (
    <div className="flex gap-4 mb-4 items-center">
      {/* Task Info - Left Column */}
      <div className="w-64 flex-shrink-0">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900 truncate" title={task.name}>
            {task.name}
          </p>
          <p className="text-xs text-gray-500">{task.issue_key}</p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div
            className={`w-2 h-2 rounded-full ${statusColor}`}
          />
          <span className="text-xs text-gray-600 capitalize">
            {statusLabel}
          </span>
          {task.isOverdue && (
            <span className="text-xs font-semibold text-red-600">Overdue</span>
          )}
        </div>
        {task.assignee && task.assignee !== 'Unassigned' && (
          <p className="text-xs text-gray-500 mt-1">{task.assignee}</p>
        )}
      </div>

      {/* Timeline Bar - Right Column */}
      <div className="flex-1">
        <div className="relative h-8 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0 flex opacity-30">
            {Array.from({ length: Math.min(columnCount, 20) }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-gray-300"
                style={{ width: `${100 / Math.min(columnCount, 20)}%` }}
              />
            ))}
          </div>

          {/* Timeline bar */}
          <TimelineBar
            task={task}
            position={position}
            onHover={setHoveredTask}
          />
        </div>

        {/* Task Duration Info - Below Bar */}
        {task.durationDays > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {task.durationDays} day{task.durationDays !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};
