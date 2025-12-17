export interface TaskItem {
  task_name: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  planned_hours: number;
  actual_hours: number;
}

export interface AIUsageItem {
  tool: string;
  hours: number;
}

export interface JiraTicket {
  type: 'bug' | 'non-bug';
}

export interface TimeLog {
  date: string; // ISO date
  hours_logged: number;
}

export interface ProjectAnalytics {
  planned_hours: number;
  actual_hours: number;
  tasks: TaskItem[];
  ai_usage: AIUsageItem[];
  jira_tickets: JiraTicket[];
  time_logs: TimeLog[];
}

export interface ProjectItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  image?: string;
  link?: string;
  tags?: string[];
  color?: string;
}
