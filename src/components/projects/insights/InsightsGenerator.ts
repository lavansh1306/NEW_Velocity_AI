/**
 * AI Insights - Project Intelligence Analysis
 * Generates risks, recommendations, and insights from project data
 */

export interface TaskData {
  id: string;
  name: string;
  status: string;
  start_date?: string | null;
  due_date?: string | null;
  estimated_hours?: number;
  actual_hours?: number;
  assignee?: string;
  issue_key: string;
}

export interface TeamMemberData {
  name: string;
  tasks_assigned: number;
  tasks_completed: number;
  actual_hours: number;
  status: 'Healthy' | 'Overloaded' | 'Underutilized';
}

export interface OverdueTask extends TaskData {
  daysOverdue: number;
}

export interface AtRiskTask extends TaskData {
  daysUntilDue: number;
  progress: number;
}

export interface Insight {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actionable: boolean;
  metric?: string;
}

export interface ProjectInsights {
  hasData: boolean;
  riskLevel: 'critical' | 'warning' | 'healthy';
  risks: Insight[];
  recommendations: string[];
  overdueTasks: OverdueTask[];
  atRiskTasks: AtRiskTask[];
  overloadedMembers: TeamMemberData[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    atRiskTasks: number;
    overloadedMembers: number;
    completionPercentage: number;
  };
}

/**
 * Parse ISO date string to Date object
 */
function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.ceil((date2.getTime() - date1.getTime()) / oneDay);
}

/**
 * Detect overdue tasks
 */
export function detectOverdueTasks(tasks: TaskData[]): OverdueTask[] {
  const now = new Date();
  const overdue: OverdueTask[] = [];

  tasks.forEach(task => {
    const dueDate = parseDate(task.due_date);
    const isCompleted = task.status?.toLowerCase().includes('completed') || 
                        task.status?.toLowerCase().includes('done');

    if (dueDate && dueDate < now && !isCompleted) {
      overdue.push({
        ...task,
        daysOverdue: daysBetween(dueDate, now)
      });
    }
  });

  return overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/**
 * Detect tasks at risk (high priority, unstarted or low progress, close to deadline)
 */
export function detectAtRiskTasks(tasks: TaskData[], threshold: number = 7): AtRiskTask[] {
  const now = new Date();
  const atRisk: AtRiskTask[] = [];

  tasks.forEach(task => {
    const dueDate = parseDate(task.due_date);
    const startDate = parseDate(task.start_date);
    const isCompleted = task.status?.toLowerCase().includes('completed') || 
                        task.status?.toLowerCase().includes('done');
    const isInProgress = task.status?.toLowerCase().includes('in_progress') || 
                         task.status?.toLowerCase().includes('in progress');
    const isNotStarted = task.status?.toLowerCase().includes('not_started') || 
                         task.status?.toLowerCase().includes('not started') ||
                         !task.status;

    if (dueDate && dueDate >= now && !isCompleted) {
      const daysRemaining = daysBetween(now, dueDate);
      
      // Task is at risk if:
      // 1. Approaching deadline (within threshold) AND not started OR low progress
      // 2. Has large estimated hours but not started
      if (daysRemaining <= threshold) {
        if (isNotStarted || (isInProgress && (task.actual_hours || 0) < (task.estimated_hours || 0) * 0.3)) {
          atRisk.push({
            ...task,
            daysUntilDue: daysRemaining,
            progress: calculateTaskProgress(task)
          });
        }
      }
    }
  });

  return atRisk.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

/**
 * Calculate task progress percentage
 */
export function calculateTaskProgress(task: TaskData): number {
  if (!task.estimated_hours || task.estimated_hours === 0) return 0;
  const actual = task.actual_hours || 0;
  if (task.status?.toLowerCase().includes('completed') || task.status?.toLowerCase().includes('done')) {
    return 100;
  }
  return Math.min(100, Math.round((actual / task.estimated_hours) * 100));
}

/**
 * Detect large tasks that could be split
 */
export function detectLargeTasks(tasks: TaskData[], threshold: number = 40): TaskData[] {
  return tasks.filter(task => {
    const isCompleted = task.status?.toLowerCase().includes('completed') || 
                        task.status?.toLowerCase().includes('done');
    return (task.estimated_hours || 0) > threshold && !isCompleted;
  });
}

/**
 * Analyze workload distribution
 */
export function analyzeWorkloadDistribution(tasks: TaskData[]): Map<string, number> {
  const workload = new Map<string, number>();

  tasks.forEach(task => {
    if (task.assignee && task.assignee !== 'Unassigned') {
      const isCompleted = task.status?.toLowerCase().includes('completed') || 
                          task.status?.toLowerCase().includes('done');
      if (!isCompleted) {
        const current = workload.get(task.assignee) || 0;
        workload.set(task.assignee, current + (task.estimated_hours || 0));
      }
    }
  });

  return workload;
}

/**
 * Generate comprehensive project insights
 */
export function generateProjectInsights(
  tasks: TaskData[],
  teamMembers: TeamMemberData[]
): ProjectInsights {
  if (!tasks || tasks.length === 0) {
    return {
      hasData: false,
      riskLevel: 'healthy',
      risks: [],
      recommendations: [],
      overdueTasks: [],
      atRiskTasks: [],
      overloadedMembers: [],
      summary: {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        atRiskTasks: 0,
        overloadedMembers: 0,
        completionPercentage: 0
      }
    };
  }

  // Analyze tasks
  const overdueTasks = detectOverdueTasks(tasks);
  const atRiskTasks = detectAtRiskTasks(tasks);
  const largeTasks = detectLargeTasks(tasks);

  // Count statistics
  const completedTasks = tasks.filter(t => 
    t.status?.toLowerCase().includes('completed') || t.status?.toLowerCase().includes('done')
  ).length;

  const overloadedMembers = teamMembers.filter(m => m.status === 'Overloaded');

  const completionPercentage = tasks.length > 0 
    ? Math.round((completedTasks / tasks.length) * 100) 
    : 0;

  const workloadMap = analyzeWorkloadDistribution(tasks);
  
  // Calculate total estimated and actual hours
  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

  // Generate risks
  const risks: Insight[] = [];

  if (overdueTasks.length > 0) {
    risks.push({
      id: 'overdue-tasks',
      level: 'critical',
      title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
      description: `${overdueTasks[0]?.name || 'Tasks'} ${overdueTasks.length === 1 ? 'is' : 'are'} ${overdueTasks[0]?.daysOverdue || 0} days overdue. Immediate action required.`,
      actionable: true,
      metric: `${overdueTasks.length} tasks`
    });
  }

  if (atRiskTasks.length > 0) {
    risks.push({
      id: 'at-risk-tasks',
      level: 'warning',
      title: `${atRiskTasks.length} Task${atRiskTasks.length > 1 ? 's' : ''} At Risk`,
      description: `${atRiskTasks[0]?.name || 'Tasks'} ${atRiskTasks.length === 1 ? 'is' : 'are'} approaching deadline with minimal progress. Plan to accelerate.`,
      actionable: true,
      metric: `${atRiskTasks.length} tasks within ${7} days`
    });
  }

  if (overloadedMembers.length > 0) {
    risks.push({
      id: 'team-overload',
      level: 'warning',
      title: `${overloadedMembers.length} Team Member${overloadedMembers.length > 1 ? 's' : ''} Overloaded`,
      description: `${overloadedMembers.map(m => m.name).join(', ')} ${overloadedMembers.length === 1 ? 'is' : 'are'} handling too many tasks. Consider reassigning.`,
      actionable: true,
      metric: `${overloadedMembers.length} members`
    });
  }

  if (totalActualHours > totalEstimatedHours * 1.2) {
    risks.push({
      id: 'hours-overrun',
      level: 'critical',
      title: 'Significant Hours Overrun',
      description: `Project has consumed ${Math.round((totalActualHours / totalEstimatedHours) * 100)}% of estimated hours. ${Math.round(totalActualHours - totalEstimatedHours)} hours over budget.`,
      actionable: true,
      metric: `${Math.round(totalActualHours - totalEstimatedHours)}h over`
    });
  }

  if (completionPercentage === 0 && tasks.length > 0) {
    risks.push({
      id: 'no-progress',
      level: 'info',
      title: 'Project Recently Started',
      description: 'No tasks completed yet. Begin work on high-priority items to gain momentum.',
      actionable: true,
      metric: '0% complete'
    });
  } else if (completionPercentage < 20 && completionPercentage > 0) {
    risks.push({
      id: 'slow-progress',
      level: 'warning',
      title: 'Slow Progress',
      description: `Only ${completionPercentage}% of tasks completed. Accelerate delivery to stay on track.`,
      actionable: true,
      metric: `${completionPercentage}% complete`
    });
  }

  if (largeTasks.length > 0) {
    risks.push({
      id: 'large-tasks',
      level: 'info',
      title: `${largeTasks.length} Large Task${largeTasks.length > 1 ? 's' : ''}`,
      description: `${largeTasks[0]?.name || 'Task'} exceeds 40 hours. Consider breaking into smaller subtasks for better tracking.`,
      actionable: true,
      metric: `${Math.round(largeTasks[0]?.estimated_hours || 0)}h`
    });
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (overdueTasks.length > 0) {
    recommendations.push(`🚨 Prioritize completing ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} immediately.`);
  }

  if (atRiskTasks.length > 0) {
    recommendations.push(`⚡ Accelerate work on ${atRiskTasks[0]?.name || 'high-priority tasks'} to meet upcoming deadline.`);
  }

  if (overloadedMembers.length > 0) {
    recommendations.push(`👥 Redistribute workload from ${overloadedMembers[0]?.name || 'overloaded team members'} to balance capacity.`);
  }

  if (totalActualHours > totalEstimatedHours) {
    const overage = Math.round(totalActualHours - totalEstimatedHours);
    recommendations.push(`💰 Review scope to address ${overage}-hour budget overrun. Consider descoping lower-priority items.`);
  }

  if (largeTasks.length > 0) {
    recommendations.push(`📋 Break down large tasks (${Math.round(largeTasks[0]?.estimated_hours || 0)}h+) into smaller, trackable subtasks.`);
  }

  const underutilized = teamMembers.filter(m => m.status === 'Underutilized');
  if (underutilized.length > 0 && atRiskTasks.length > 0) {
    recommendations.push(`📈 Allocate underutilized team members to accelerate at-risk tasks.`);
  }

  if (completionPercentage < 30 && completionPercentage > 0) {
    recommendations.push(`📊 Schedule weekly sync to discuss blockers and ensure ${completionPercentage > 50 ? 'continued' : 'faster'} progress.`);
  }

  // Determine overall risk level
  let riskLevel: 'critical' | 'warning' | 'healthy' = 'healthy';
  if (risks.some(r => r.level === 'critical')) {
    riskLevel = 'critical';
  } else if (risks.some(r => r.level === 'warning')) {
    riskLevel = 'warning';
  }

  return {
    hasData: true,
    riskLevel,
    risks,
    recommendations,
    overdueTasks,
    atRiskTasks,
    overloadedMembers,
    summary: {
      totalTasks: tasks.length,
      completedTasks,
      overdueTasks: overdueTasks.length,
      atRiskTasks: atRiskTasks.length,
      overloadedMembers: overloadedMembers.length,
      completionPercentage
    }
  };
}
