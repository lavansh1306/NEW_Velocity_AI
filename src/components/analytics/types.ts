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
  ai_usage?: AIUsageItem[];
  // New AI-focused fields
  ai_hours_used?: number;
  ai_time_saved_hours?: number;
  ai_time_saved_percent?: number;
  ai_tool_usage?: AIUsageItem[];
  jira_tickets: JiraTicket[];
  time_logs: TimeLog[];
}

// Optional integration-specific summaries (added so analytics can include multiple sources)
export interface HubSpotSummary {
  contacts_count?: number;
  deals_count?: number;
  closed_revenue?: number;
  deals_by_stage?: Array<{ stage: string; count: number }>;
  hubspot_time_saved_hours?: number;
  last_sync?: string;
}

export interface AsanaSummary {
  projects_count?: number;
  tasks_total?: number;
  tasks_automated_count?: number;
  asana_time_saved_hours?: number;
  last_sync?: string;
}

export interface Microsoft365Summary {
  mail_count?: number;
  calendar_meetings_count?: number;
  meeting_duration_minutes?: number;
  meeting_minutes_saved?: number;
  microsoft365_time_saved_hours?: number;
  last_sync?: string;
}

export interface ZapierSummary {
  zaps_count?: number;
  active_zaps?: number;
  runs_last_30_days?: number;
  success_rate?: number;
  runs_automated_by_ai?: number;
  zapier_time_saved_hours?: number;
  last_sync?: string;
}

// Extend ProjectAnalytics with optional integration summaries
export interface ProjectAnalyticsWithIntegrations extends ProjectAnalytics {
  hubspot?: HubSpotSummary;
  asana?: AsanaSummary;
  microsoft365?: Microsoft365Summary;
  zapier?: ZapierSummary;
  // Whether Jira-derived analytics were available for this project
  jira_available?: boolean;
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
