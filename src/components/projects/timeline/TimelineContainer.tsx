import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import {
  TimelineZoom,
  ProcessedTask,
  processTimelineTasks,
  getTimelineRange,
  getTaskBarPosition,
  getTodayPosition,
  getTimelineHeaders,
  formatDate,
  type TimelineTask
} from './TimelineUtils';
import { TimelineRow } from './TimelineRow';

interface TimelineContainerProps {
  tasks: TimelineTask[];
  loading?: boolean;
  projectName?: string;
}

export const TimelineContainer: React.FC<TimelineContainerProps> = ({
  tasks,
  loading = false,
  projectName = 'Project'
}) => {
  const [zoom, setZoom] = useState<TimelineZoom>(TimelineZoom.WEEKS);
  const [processedTasks, setProcessedTasks] = useState<ProcessedTask[]>([]);
  const [timelineStart, setTimelineStart] = useState<Date>(new Date());
  const [timelineEnd, setTimelineEnd] = useState<Date>(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [todayPosition, setTodayPosition] = useState<number>(-1);

  // Process tasks on load or when tasks/zoom changes
  useEffect(() => {
    if (tasks.length === 0) {
      setProcessedTasks([]);
      return;
    }

    const processed = processTimelineTasks(tasks);
    setProcessedTasks(processed);

    if (processed.length > 0) {
      const range = getTimelineRange(processed, zoom);
      setTimelineStart(range.startDate);
      setTimelineEnd(range.endDate);
      setTodayPosition(getTodayPosition(range.startDate, range.endDate));
    }
  }, [tasks, zoom]);

  // Sort tasks by start date
  const sortedTasks = [...processedTasks].sort((a, b) => {
    const aDate = a.startDate || a.endDate || new Date();
    const bDate = b.startDate || b.endDate || new Date();
    return aDate.getTime() - bDate.getTime();
  });

  // Group tasks by status for stats
  const stats = {
    total: processedTasks.length,
    completed: processedTasks.filter(t => t.status === 'completed').length,
    inProgress: processedTasks.filter(t => t.status === 'in_progress').length,
    notStarted: processedTasks.filter(t => t.status === 'not_started').length,
    overdue: processedTasks.filter(t => t.isOverdue).length
  };

  const timelineHeaders = getTimelineHeaders(timelineStart, timelineEnd, zoom);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No timeline data available</h3>
            <p className="text-sm text-gray-600">Add tasks with dates to see your project timeline</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Controls & Stats */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Project Timeline</h3>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(TimelineZoom.DAYS)}
              className={`px-3 py-2 text-sm rounded-lg transition-all ${
                zoom === TimelineZoom.DAYS
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Days
            </button>
            <button
              onClick={() => setZoom(TimelineZoom.WEEKS)}
              className={`px-3 py-2 text-sm rounded-lg transition-all ${
                zoom === TimelineZoom.WEEKS
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weeks
            </button>
            <button
              onClick={() => setZoom(TimelineZoom.MONTHS)}
              className={`px-3 py-2 text-sm rounded-lg transition-all ${
                zoom === TimelineZoom.MONTHS
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Months
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Not Started</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">{stats.notStarted}</p>
          </div>
          {stats.overdue > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="space-y-6">
          {/* Timeline Date Range Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-gray-600">Start: </span>
                <span className="font-medium text-gray-900">{formatDate(timelineStart, 'short')}</span>
              </div>
              <div>
                <span className="text-gray-600">End: </span>
                <span className="font-medium text-gray-900">{formatDate(timelineEnd, 'short')}</span>
              </div>
            </div>
            {todayPosition >= 0 && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1 h-4 bg-red-500" />
                <span className="text-gray-600">Today</span>
              </div>
            )}
          </div>

          {/* Scroll Container */}
          <div className="relative">
            {/* Left Scroll Button */}
            <button
              onClick={() => handleScroll('left')}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-white border border-gray-300 rounded-lg p-1 hover:bg-gray-50 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Right Scroll Button */}
            <button
              onClick={() => handleScroll('right')}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-white border border-gray-300 rounded-lg p-1 hover:bg-gray-50 shadow-sm"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            {/* Scrollable Timeline */}
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto"
            >
              <div className="min-w-full px-12">
                {sortedTasks.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    No tasks with valid dates
                  </div>
                ) : (
                  <>
                    {/* Tasks */}
                    <div className="space-y-2">
                      {sortedTasks.map(task => {
                        const position = getTaskBarPosition(
                          task,
                          timelineStart,
                          timelineEnd,
                          zoom
                        );

                        return (
                          <TimelineRow
                            key={task.id}
                            task={task}
                            position={position}
                            columnCount={timelineHeaders.length}
                          />
                        );
                      })}
                    </div>

                    {/* Today Marker */}
                    {todayPosition >= 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-red-500 opacity-50 pointer-events-none mt-[70px]"
                        style={{ left: `calc(${todayPosition}% + 3rem)` }}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Status Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-sm bg-green-500" />
            <span className="text-sm text-gray-700">Completed</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-sm bg-blue-500" />
            <span className="text-sm text-gray-700">In Progress</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-sm bg-gray-300" />
            <span className="text-sm text-gray-700">Not Started</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-sm bg-red-500" />
            <span className="text-sm text-gray-700">Overdue</span>
          </div>
        </div>
      </div>
    </div>
  );
};
