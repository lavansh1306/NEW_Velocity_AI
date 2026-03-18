import React, { useState } from 'react';
import { ProcessedTask, getTaskColor } from './TimelineUtils';

interface TimelineBarProps {
  task: ProcessedTask;
  position: { left: number; width: number };
  onHover?: (task: ProcessedTask | null) => void;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({ task, position, onHover }) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorClass = getTaskColor(task.status, task.isOverdue);
  const isMilestone = task.isMilestone;

  return (
    <>
      {/* Timeline Bar */}
      <div
        className="absolute h-6 group cursor-pointer transition-all duration-200 hover:shadow-lg hover:h-8 hover:-top-1 z-10"
        style={{
          left: `${position.left}%`,
          width: `${Math.max(position.width, 2)}%`,
          top: '50%',
          transform: 'translateY(-50%)'
        }}
        onMouseEnter={() => {
          setIsHovered(true);
          onHover?.(task);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onHover?.(null);
        }}
      >
        {/* Bar Element */}
        <div
          className={`w-full h-full rounded-sm ${colorClass} transition-all duration-200 group-hover:shadow-md`}
        />

        {/* Milestone Marker */}
        {isMilestone && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-3 border-transparent border-b-current" />
        )}
      </div>

      {/* Tooltip on Hover */}
      {isHovered && (
        <div className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-50 -top-16 left-1/2 transform -translate-x-1/2 shadow-lg">
          <div className="font-semibold">{task.name}</div>
          <div className="text-gray-300">{task.issue_key}</div>
          {task.startDate && (
            <div className="text-gray-400 mt-1">
              {task.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {task.endDate && ` → ${task.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </div>
          )}
          <div className="text-gray-400 mt-1">
            <span className="capitalize font-medium">
              {task.status.replace('_', ' ')}
            </span>
            {task.isOverdue && <span className="ml-2 text-red-400">Overdue</span>}
          </div>
          {task.assignee && task.assignee !== 'Unassigned' && (
            <div className="text-gray-400 mt-1">{task.assignee}</div>
          )}
        </div>
      )}
    </>
  );
};
