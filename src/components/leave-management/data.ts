import { EmployeeProfile, Task } from './types';

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export const EMPLOYEES_DATA: EmployeeProfile[] = [
  {
    id: "emp-alex",
    organization_id: "org-1",
    email: "alex@example.com",
    name: "Alex Rivera",
    role: "employee",
    capacity_hours_per_week: 40,
    is_active: true,
    skills: ["React", "Node.js", "SQL"]
  },
  {
    id: "emp-sarah",
    organization_id: "org-1",
    email: "sarah@example.com",
    name: "Sarah Chen",
    role: "manager",
    capacity_hours_per_week: 40,
    is_active: true,
    skills: ["Python", "AWS", "Auth"]
  },
  {
    id: "emp-michael",
    organization_id: "org-1",
    email: "michael@example.com",
    name: "Michael Vance",
    role: "employee",
    capacity_hours_per_week: 40,
    is_active: true,
    skills: ["React", "UI/UX", "Tailwind"]
  },
  {
    id: "emp-jordan",
    organization_id: "org-1",
    email: "jordan@example.com",
    name: "Jordan Smith",
    role: "employee",
    capacity_hours_per_week: 40,
    is_active: true,
    skills: ["Testing", "Cypress", "Python"]
  },
  {
    id: "emp-emma",
    organization_id: "org-1",
    email: "emma@example.com",
    name: "Emma Wilson",
    role: "employee",
    capacity_hours_per_week: 40,
    is_active: true,
    skills: ["Docker", "Security", "AWS"]
  },
];

export const INITIAL_TASKS: Task[] = [
  { id: "101", projectName: "Titan AI", taskName: "API Setup", assignee: "Alex Rivera", hours: 6, status: "Todo", requiredSkills: ["Node.js"], logs: [], totalLogged: 0 },
  { id: "102", projectName: "Titan AI", taskName: "DB Schema", assignee: "Alex Rivera", hours: 4, status: "In Progress", requiredSkills: ["SQL"], logs: [], totalLogged: 0 },
  { id: "103", projectName: "Cloud Migration", taskName: "Auth Logic", assignee: "Sarah Chen", hours: 9, status: "Todo", requiredSkills: ["AWS", "Auth"], logs: [], totalLogged: 0 },
  { id: "104", projectName: "Velocity Dashboard", taskName: "UI Refactor", assignee: "Michael Vance", hours: 5, status: "Done", requiredSkills: ["React"], logs: [], totalLogged: 0 },
  { id: "105", projectName: "Titan AI", taskName: "Testing", assignee: "Jordan Smith", hours: 3, status: "Todo", requiredSkills: ["Testing"], logs: [], totalLogged: 0 },
  { id: "106", projectName: "Security Audit", taskName: "Patching", assignee: "Emma Wilson", hours: 2, status: "Todo", requiredSkills: ["Security"], logs: [], totalLogged: 0 },
];