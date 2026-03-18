/**
 * Timeline utility functions for date calculations and data processing
 */

export interface TimelineTask {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  start_date?: string | null;
  due_date?: string | null;
  assignee: string;
  issue_key: string;
}

export interface ProcessedTask extends TimelineTask {
  startDate: Date | null;
  endDate: Date | null;
  isMilestone: boolean;
  isOverdue: boolean;
  durationDays: number;
}

export enum TimelineZoom {
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months'
}

/**
 * Parse ISO date string to Date object
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Get the range of dates for the timeline
 */
export function getTimelineRange(tasks: ProcessedTask[], zoom: TimelineZoom) {
  let minDate = new Date();
  let maxDate = new Date(minDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days default

  const validTasks = tasks.filter(t => t.startDate || t.endDate);
  
  if (validTasks.length > 0) {
    const dates = validTasks.flatMap(t => [t.startDate, t.endDate].filter(Boolean) as Date[]);
    if (dates.length > 0) {
      minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    }
  }

  // Add padding
  minDate = new Date(minDate.getTime() - 5 * 24 * 60 * 60 * 1000);
  maxDate = new Date(maxDate.getTime() + 5 * 24 * 60 * 60 * 1000);

  return { startDate: minDate, endDate: maxDate };
}

/**
 * Get position and width for a task bar on the timeline
 */
export function getTaskBarPosition(
  task: ProcessedTask,
  timelineStart: Date,
  timelineEnd: Date,
  zoom: TimelineZoom
): { left: number; width: number } {
  const totalMs = timelineEnd.getTime() - timelineStart.getTime();
  
  // Use start date, or due date if start is missing
  const start = task.startDate || task.endDate;
  if (!start) return { left: 0, width: 0 };

  const startMs = Math.max(start.getTime(), timelineStart.getTime());
  const leftPercent = ((startMs - timelineStart.getTime()) / totalMs) * 100;

  // Duration: use due_date - start_date, minimum of 1 day for visibility
  let durationMs: number;
  if (task.isMilestone) {
    // Milestone: show as small dot (2% width)
    durationMs = (totalMs * 0.02) / 100;
  } else if (task.endDate && task.startDate) {
    durationMs = Math.max(
      task.endDate.getTime() - start.getTime(),
      24 * 60 * 60 * 1000 // Minimum 1 day
    );
  } else {
    // No end date: show as ongoing bar (5% width)
    durationMs = (totalMs * 0.05) / 100;
  }

  const widthPercent = (durationMs / totalMs) * 100;

  return {
    left: Math.max(0, leftPercent),
    width: Math.min(widthPercent, 100 - leftPercent)
  };
}

/**
 * Process raw tasks into timeline-ready format
 */
export function processTimelineTasks(tasks: TimelineTask[]): ProcessedTask[] {
  const now = new Date();

  return tasks
    .map(task => {
      const startDate = parseDate(task.start_date);
      const endDate = parseDate(task.due_date);

      // A task is a milestone if start and end are the same day, or has no duration
      const isMilestone = startDate && endDate ? 
        startDate.toDateString() === endDate.toDateString():
        !endDate;

      // Calculate duration
      const durationMs = startDate && endDate ? 
        endDate.getTime() - startDate.getTime() :
        0;
      const durationDays = Math.ceil(durationMs / (24 * 60 * 60 * 1000));

      // Check if overdue
      const isOverdue = endDate ? endDate < now && task.status !== 'completed' : false;

      return {
        ...task,
        startDate,
        endDate,
        isMilestone,
        isOverdue,
        durationDays
      };
    })
    .filter(task => task.startDate || task.endDate); // Filter out tasks with no dates
}

/**
 * Get color for task based on status
 */
export function getTaskColor(status: string, isOverdue: boolean): string {
  if (isOverdue && status !== 'completed') {
    return 'bg-red-500'; // Overdue: red
  }

  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'in_progress':
      return 'bg-blue-500';
    case 'not_started':
      return 'bg-gray-300';
    case 'abandoned':
      return 'bg-gray-400 opacity-50';
    default:
      return 'bg-gray-300';
  }
}

/**
 * Format date for display
 */
export function formatDate(date: Date | null, format: 'short' | 'long' = 'short'): string {
  if (!date) return '-';
  
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Get number of timeline columns based on date range and zoom
 */
export function getTimelineColumns(startDate: Date, endDate: Date, zoom: TimelineZoom): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);

  switch (zoom) {
    case TimelineZoom.DAYS:
      return Math.ceil(diffDays);
    case TimelineZoom.WEEKS:
      return Math.ceil(diffDays / 7);
    case TimelineZoom.MONTHS:
      return Math.ceil(diffDays / 30);
    default:
      return Math.ceil(diffDays / 7);
  }
}

/**
 * Get header labels for timeline columns
 */
export function getTimelineHeaders(startDate: Date, endDate: Date, zoom: TimelineZoom): string[] {
  const headers: string[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    switch (zoom) {
      case TimelineZoom.DAYS:
        headers.push(formatDate(currentDate, 'short'));
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case TimelineZoom.WEEKS:
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        headers.push(`W${Math.ceil((currentDate.getDate() + new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7)}`);
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case TimelineZoom.MONTHS:
        headers.push(currentDate.toLocaleDateString('en-US', { month: 'short' }));
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return headers;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Get today's marker position on timeline
 */
export function getTodayPosition(timelineStart: Date, timelineEnd: Date): number {
  const today = new Date();
  const totalMs = timelineEnd.getTime() - timelineStart.getTime();
  const todayMs = today.getTime() - timelineStart.getTime();
  
  if (todayMs < 0 || todayMs > totalMs) return -1;
  
  return (todayMs / totalMs) * 100;
}
