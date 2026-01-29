export interface SmartTask {
  id: number;
  title: string;
  assignee: string;
  scope: string[]; // The list of requirements (e.g., "API Setup", "DB Schema")
  completedScope: string[]; // What the Agent detected as done
  progress: number; // 0-100
  lastUpdate: string; // Summary from the Agent
  lastUpdatedTime: string;
}