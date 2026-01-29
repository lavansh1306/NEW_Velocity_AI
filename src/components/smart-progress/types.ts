export interface ScopeItem {
  id: string;
  name: string;
  weight: number; 
  isCompleted: boolean;
}

export interface SmartTask {
  id: number;
  title: string;
  assignee: string;
  scope: ScopeItem[]; // Changed from string[]
  progress: number; // Calculated automatically based on weights
  lastUpdate: string;
  lastUpdatedTime: string;
}