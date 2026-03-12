export interface Project {
  id: string; // UUID
  organization_id: string;
  team_id?: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'planned';
  source: 'internal' | 'jira';
  start_date?: string;
  end_date?: string;
  created_at: string;

  // Virtual / Joined Fields
  team_name?: string;
  task_count?: number; // <--- This was the missing property
}

export interface ProjectPlan {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  created_by: string;
  tasks?: PlanTask[];
}

export interface PlanTask {
  id: string;
  plan_id?: string;
  task_name: string;
  description?: string;
  estimated_hours: number;
  required_skills?: string[];
}

export interface DraftProjectState {
  name: string;
  key: string;
  description: string;
  tasks: {
    id: string;
    task: string;
    estimatedHours: number;
    status?: string;
    startDate?: Date;
    dueDate?: Date;
    assigneeId?: string;
  }[];
  selectedTeamIds: string[];
}