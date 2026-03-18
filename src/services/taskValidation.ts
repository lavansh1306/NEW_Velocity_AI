/**
 * Task validation utilities for project completion logic
 * Handles standard task statuses plus abandoned tasks
 */

const COMPLETE_STATUSES = ['done', 'resolved', 'closed', 'complete', 'completed'];
const ABANDONED_STATUSES = ['abandoned'];

/**
 * Checks if a task is considered abandoned
 * @param task - The task object with a status property
 * @returns true if task is abandoned, false otherwise
 */
export const isTaskAbandoned = (task: any): boolean => {
  if (!task || !task.status) return false;
  return ABANDONED_STATUSES.some(status => 
    task.status.toLowerCase().includes(status)
  );
};

/**
 * Checks if a task is considered complete
 * @param task - The task object with a status property
 * @returns true if task is complete, false otherwise
 */
export const isTaskComplete = (task: any): boolean => {
  if (!task || !task.status) return false;
  return COMPLETE_STATUSES.some(status => 
    task.status.toLowerCase().includes(status)
  );
};

/**
 * Checks if a task should be counted in project metrics
 * (excludes abandoned tasks)
 * @param task - The task object with a status property
 * @returns true if task should be counted, false otherwise
 */
export const shouldCountTaskInMetrics = (task: any): boolean => {
  return !isTaskAbandoned(task);
};

/**
 * Filters incomplete tasks from a list (excludes abandoned)
 * @param tasks - Array of task objects
 * @returns Array of incomplete tasks excluding abandoned
 */
export const getIncompleteTasks = (tasks: any[]): any[] => {
  if (!Array.isArray(tasks)) return [];
  return tasks.filter(task => !isTaskComplete(task) && !isTaskAbandoned(task));
};

/**
 * Filters abandoned tasks from a list
 * @param tasks - Array of task objects
 * @returns Array of abandoned tasks
 */
export const getAbandonedTasks = (tasks: any[]): any[] => {
  if (!Array.isArray(tasks)) return [];
  return tasks.filter(task => isTaskAbandoned(task));
};

/**
 * Checks if all active (non-abandoned) tasks in a project are complete
 * @param tasks - Array of task objects
 * @returns true if all active tasks are complete, false otherwise
 */
export const areAllTasksComplete = (tasks: any[]): boolean => {
  if (!Array.isArray(tasks) || tasks.length === 0) return true;
  const activeTasks = tasks.filter(task => shouldCountTaskInMetrics(task));
  if (activeTasks.length === 0) return true;
  return activeTasks.every(task => isTaskComplete(task));
};

/**
 * Gets detailed task completion stats excluding abandoned tasks
 * @param tasks - Array of task objects
 * @returns Object with completion stats
 */
export const getTaskCompletionStats = (tasks: any[]) => {
  const activeTasks = tasks.filter(task => shouldCountTaskInMetrics(task));
  const completed = activeTasks.filter(task => isTaskComplete(task)).length;
  const abandoned = tasks.filter(task => isTaskAbandoned(task)).length;
  const incomplete = activeTasks.length - completed;
  const completionPercentage = activeTasks.length > 0 ? Math.round((completed / activeTasks.length) * 100) : 0;

  return {
    total: activeTasks.length,
    completed,
    incomplete,
    abandoned,
    completionPercentage,
    isComplete: incomplete === 0
  };
};
