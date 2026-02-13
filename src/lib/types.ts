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
