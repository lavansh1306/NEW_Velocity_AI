// ========================================
// Raw row interfaces — one per CSV source
// ========================================

/**
 * Raw row from jira_events.csv
 */
export interface RawJiraRow {
  issue_id: string;
  issue_key: string;
  created_at: string;
  event_type: string;
  actor: string;
  from_status: string;
  to_status: string;
  project_id: string;
  fields: string; // JSON string
}

// ========================================
export interface MLCandidate {
  id: string;
  current_load: number;
  skills: string[];
  role_level: 'junior' | 'mid' | 'senior' | 'lead';
  name?: string;
  availability_hours?: number;
  avg_completion_time?: number;
  // --- NEW CAPACITY FIELDS ---
  base_productive_hours?: number;
  pto_hours_this_week?: number;
  holiday_hours_this_week?: number;
}

// 2. Add these new Request/Response interfaces anywhere in the file:
export interface CapacityRequest {
  candidates: MLCandidate[];
}

export interface CapacityReport {
  employee_id: string;
  name: string;
  base_productive_hours: number;
  pto_hours_this_week: number;
  holiday_hours_this_week: number;
  net_available_hours: number;
  status: string; // "Available", "At Capacity", or "Overloaded / Out of Office"
}