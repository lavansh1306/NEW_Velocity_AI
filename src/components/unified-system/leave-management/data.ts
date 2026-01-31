import { EmployeeProfile, Task } from './types';

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export const EMPLOYEES_DATA: EmployeeProfile[] = [
  { name: "Alex Rivera", role: "Full Stack", skills: ["React", "Node.js", "SQL"] },
  { name: "Sarah Chen", role: "Backend Lead", skills: ["Python", "AWS", "Auth"] },
  { name: "Michael Vance", role: "Frontend Dev", skills: ["React", "UI/UX", "Tailwind"] },
  // RESTORED THESE TWO:
  { name: "Jordan Smith", role: "QA Engineer", skills: ["Testing", "Cypress", "Python"] },
  { name: "Emma Wilson", role: "DevOps", skills: ["Docker", "Security", "AWS"] },
];

export const INITIAL_TASKS: Task[] = [
  { id: 101, projectName: "Titan AI", taskName: "API Setup", assignee: "Alex Rivera", hours: 6, day: 0, requiredSkills: ["Node.js"], logs: [], totalLogged: 0 },
  { id: 102, projectName: "Titan AI", taskName: "DB Schema", assignee: "Alex Rivera", hours: 4, day: 1, requiredSkills: ["SQL"], logs: [], totalLogged: 0 },
  { id: 103, projectName: "Cloud Migration", taskName: "Auth Logic", assignee: "Sarah Chen", hours: 9, day: 0, requiredSkills: ["AWS", "Auth"], logs: [], totalLogged: 0 },
  { id: 104, projectName: "Velocity Dashboard", taskName: "UI Refactor", assignee: "Michael Vance", hours: 5, day: 2, requiredSkills: ["React"], logs: [], totalLogged: 0 },
  { id: 105, projectName: "Titan AI", taskName: "Testing", assignee: "Jordan Smith", hours: 3, day: 0, requiredSkills: ["Testing"], logs: [], totalLogged: 0 },
  { id: 106, projectName: "Security Audit", taskName: "Patching", assignee: "Emma Wilson", hours: 2, day: 1, requiredSkills: ["Security"], logs: [], totalLogged: 0 },
];