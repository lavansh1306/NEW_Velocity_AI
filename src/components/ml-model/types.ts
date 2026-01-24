export interface EmployeeRecord {
  Assignee: string;
  Project: string;
  "Task Name": string;
  "Planned Hours": number;
  "Actual Hours": number;
  "Skill Used": string;
}

export interface PredictionResult {
  name: string;
  matchScore: number;     // 0-100%
  topSkill: string;       // The skill that matched
  efficiency: number;     // Avg performance ratio
  absenceProbability: number; // 0-100% (Predicted risk)
  currentLoad: number;    // Number of active projects
  isAvailable: boolean;   // True if load < 2
  reason: string;         // Explain why they were picked
}