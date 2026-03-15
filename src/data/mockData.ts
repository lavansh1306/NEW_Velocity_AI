import { TeamMemberView, PendingSkillView, PersonDetailView, PlanTask, PlanTeamCandidate, TimesheetWeekMeta, PastWeekSummary, LeaveHistoryEntry } from '../types';

// LEGACY DATA (Needed by PlanMyProjectScreen)
export const planSeedTasks: PlanTask[] = [
    {
        id: 'task-001',
        plan_id: 'plan-beta-1',
        task_name: 'User Authentication System',
        estimated_hours: 24,
        required_skills: ['backend', 'security']
    },
    {
        id: 'task-002',
        plan_id: 'plan-beta-1',
        task_name: 'Database Schema Design',
        estimated_hours: 16,
        required_skills: ['database', 'backend']
    },
    {
        id: 'task-003',
        plan_id: 'plan-beta-1',
        task_name: 'API Integration Layer',
        estimated_hours: 32,
        required_skills: ['api', 'backend']
    },
    {
        id: 'task-004',
        plan_id: 'plan-beta-1',
        task_name: 'Frontend Component Library',
        estimated_hours: 40,
        required_skills: ['frontend', 'ui']
    },
    {
        id: 'task-005',
        plan_id: 'plan-beta-1',
        task_name: 'Real-time Analytics Dashboard',
        estimated_hours: 28,
        required_skills: ['frontend', 'data-viz']
    }
];

export const planRecommendedTeam: PlanTeamCandidate[] = [
    {
        id: 'cand-001',
        plan_id: 'plan-beta-1',
        user_id: 'user-sarah',
        name: 'Sarah Chen',
        role: 'Senior Full Stack Engineer',
        avatar: 'SC',
        match_percentage: 98,
        availability: 85,
        task_fit: ['API Integration Layer', 'Database Schema Design']
    },
    {
        id: 'cand-002',
        plan_id: 'plan-beta-1',
        user_id: 'user-marcus',
        name: 'Marcus Rodriguez',
        role: 'Frontend Specialist',
        avatar: 'MR',
        match_percentage: 94,
        availability: 70,
        task_fit: ['Frontend Component Library', 'User Authentication System']
    },
    {
        id: 'cand-003',
        plan_id: 'plan-beta-1',
        user_id: 'user-alex',
        name: 'Alex Kim',
        role: 'Data Engineer',
        avatar: 'AK',
        match_percentage: 89,
        availability: 90,
        task_fit: ['Real-time Analytics Dashboard', 'Database Schema Design']
    },
    {
        id: 'cand-004',
        plan_id: 'plan-beta-1',
        user_id: 'user-elena',
        name: 'Elena Petrova',
        role: 'Security Engineer',
        avatar: 'EP',
        match_percentage: 91,
        availability: 60,
        task_fit: ['User Authentication System']
    }
];

// NEW VIEW-MODEL DATA (For PeopleCapacityScreen)
export const teamMembersView: TeamMemberView[] = [
    { id: 'user-sarah', name: 'Sarah Chen', role: 'Frontend Lead', avatar: 'SC', skills: ['React', 'TypeScript', 'CSS', 'UI/UX'], utilization: 120, projects: 3, status: 'overloaded', availability: 0 },
    { id: 'user-marcus', name: 'Marcus Rodriguez', role: 'Backend Engineer', avatar: 'MR', skills: ['Node.js', 'PostgreSQL', 'AWS'], utilization: 95, projects: 2, status: 'at-risk', availability: 8 },
    { id: 'user-alex', name: 'Alex Kim', role: 'Data Engineer', avatar: 'AK', skills: ['Python', 'Spark', 'SQL'], utilization: 70, projects: 1, status: 'healthy', availability: 24 },
];

export const pendingSkillsView: PendingSkillView[] = [
    { id: 1, userId: 'user-alex', person: 'Alex Kim', avatar: 'AK', skill: 'Kubernetes', selfRated: 'Expert', evidence: 'Managed cluster for Project Alpha', suggestedBy: 'ai' },
];

export const personDetailsMap: Record<string, PersonDetailView> = {
    'Sarah Chen': {
        capacityTimeline: [
            { week: 'Week 1', allocated: 48, available: 40 },
            { week: 'Week 2', allocated: 45, available: 40 },
        ],
        projects: [
            { name: 'Velocity AI Platform', hours: 25 },
            { name: 'Mobile App MVP', hours: 15 },
        ],
        skills: [
            { name: 'React', proficiency: 95 },
            { name: 'TypeScript', proficiency: 90 },
        ],
        recommendations: [
            {
                id: 'sc-1',
                confidence: 96,
                category: 'overload',
                title: 'Reduce Overload',
                reasoning: 'Sarah is 20% over capacity.',
                impact: { summary: 'Redistribute 8h to Alex Kim', affectedMembers: ['Sarah Chen', 'Alex Kim'], riskLevel: 'high' }
            }
        ]
    }
};

// ==================== TIMESHEET MOCK DATA ====================

export const timesheetWeeks: Record<number, TimesheetWeekMeta> = {
    0: {
        status: 'Draft',
        rows: [
            { id: 'p1', type: 'project', project: 'Velocity AI Platform', task: 'Dashboard Components', suggested: [5, 5, 5, 5, 5, 0, 0], hours: [6, 5, 5, 6, 6, 0, 0] },
            { id: 'p2', type: 'project', project: 'Mobile App MVP', task: 'Bug Fixes & QA', suggested: [3, 3, 3, 3, 3, 0, 0], hours: [2, 3, 3, 2, 2, 0, 0] },
            { id: 'p3', type: 'project', project: 'Design System', task: 'Component Library', suggested: [2, 1, 2, 1, 2, 0, 0], hours: [2, 1, 2, 1, 2, 0, 0] },
        ],
    },
    [-1]: {
        status: 'Approved',
        rows: [
            { id: 'p1', type: 'project', project: 'Velocity AI Platform', task: 'Dashboard Components', suggested: [6, 6, 6, 6, 6, 0, 0], hours: [6, 6, 6, 6, 6, 0, 0] },
            { id: 'p2', type: 'project', project: 'Mobile App MVP', task: 'Feature Development', suggested: [2, 2, 2, 2, 2, 0, 0], hours: [2, 2, 2, 2, 2, 0, 0] },
        ],
    },
    [-2]: {
        status: 'Approved',
        rows: [
            { id: 'p1', type: 'project', project: 'Velocity AI Platform', task: 'API Integration', suggested: [5, 5, 5, 5, 5, 0, 0], hours: [5, 5, 5, 5, 5, 0, 0] },
            { id: 'p2', type: 'project', project: 'Design System', task: 'Figma Sync', suggested: [3, 3, 3, 3, 3, 0, 0], hours: [3, 3, 3, 3, 3, 0, 0] },
        ],
    },
    [-3]: {
        status: 'Pending Review',
        rows: [
            { id: 'p1', type: 'project', project: 'Mobile App MVP', task: 'UI Polish', suggested: [4, 4, 4, 4, 4, 0, 0], hours: [4, 4, 4, 4, 4, 0, 0] },
            { id: 'p2', type: 'project', project: 'Design System', task: 'Token Refactor', suggested: [4, 4, 4, 4, 4, 0, 0], hours: [3, 4, 5, 4, 3, 0, 0] },
        ],
    },
};

export const pastWeeksSummary: PastWeekSummary[] = [
    { offset: -1, label: 'Last Week', hours: 40, status: 'Approved' as const },
    { offset: -2, label: '2 Weeks Ago', hours: 40, status: 'Approved' as const },
    { offset: -3, label: '3 Weeks Ago', hours: 39, status: 'Pending Review' as const },
    { offset: -4, label: '4 Weeks Ago', hours: 38, status: 'Approved' as const },
];

export const leaveHistoryEntries: LeaveHistoryEntry[] = [
    { type: 'Vacation', start: 'Feb 20', end: 'Feb 22', duration: '3 days', status: 'Approved', notes: 'Family trip' },
    { type: 'Sick Leave', start: 'Jan 10', end: 'Jan 10', duration: '1 day', status: 'Approved', notes: '' },
    { type: 'Vacation', start: 'Mar 15', end: 'Mar 19', duration: '5 days', status: 'Pending', notes: 'Spring break' },
];

// --- NEW MOCK DATA FOR EMPLOYEE PROJECTS ---
export const employeeProjectsView = [
  {
    id: 'proj-1',
    name: 'Velocity AI Platform Redesign',
    dates: 'Jan 15 - Mar 30',
    remaining: '36 days remaining',
    status: 'At Risk',
    statusColor: 'text-[#BE123C]',
    health: 72,
    healthColor: 'text-[#BE123C] border-[#FECDD3]',
    team: ['JD', 'AS', 'MK', 'ER'],
    yourHours: '25h',
    progress: 92,
    totalHoursLogged: 185,
    totalHoursEstimated: 200,
    insight: { text: 'You are overloaded this week (120% capacity)' }
  },
  {
    id: 'proj-2',
    name: 'Mobile App Beta Launch',
    dates: 'Feb 01 - Apr 15',
    remaining: '52 days remaining',
    status: 'On Track',
    statusColor: 'text-[#0F766E]',
    health: 94,
    healthColor: 'text-[#0F766E] border-[#CCFBF1]',
    team: ['JD', 'TS'],
    yourHours: '10h',
    progress: 45,
    totalHoursLogged: 45,
    totalHoursEstimated: 100,
    insight: null
  },
  {
    id: 'proj-3',
    name: 'Q4 Marketing Campaign',
    dates: 'Oct 01 - Dec 15',
    remaining: 'Completed',
    status: 'Completed',
    statusColor: 'text-[#78716C]',
    health: 100,
    healthColor: 'text-[#78716C] border-[#E7E5E4]',
    team: ['JD', 'LM', 'RK'],
    yourHours: '0h',
    progress: 100,
    totalHoursLogged: 120,
    totalHoursEstimated: 120,
    insight: null
  }
];

export const empProjectStats = [
  { label: 'Total Hours', value: '840' },
  { label: 'Completed Tasks', value: '45/62' },
  { label: 'Velocity', value: 'High' },
  { label: 'Budget', value: '$45K/$50K' }
];

export const empProjectOverviewTasks = [
  { name: 'Finalize Authentication Flow', status: 'In Progress', progress: 80 },
  { name: 'Database Migration Script', status: 'To Do', progress: 0 },
  { name: 'Update Dashboard UI', status: 'Completed', progress: 100 },
  { name: 'API Rate Limiting', status: 'In Progress', progress: 45 },
  { name: 'Unit Test Coverage', status: 'To Do', progress: 10 }
];

export const empProjectMilestones = [
  { date: 'Feb 28', name: 'Alpha Release Complete', status: 'Delayed', color: 'text-[#BE123C]' },
  { date: 'Mar 15', name: 'Beta Testing Begins', status: 'On Track', color: 'text-[#0F766E]' },
  { date: 'Mar 30', name: 'Production Launch', status: 'Pending', color: 'text-[#78716C]' }
];

export const empProjectMyTasks = [
  { name: 'Implement OAuth Login', phase: 'Auth', hours: '12h', status: 'In Progress', progress: 75, checked: false },
  { name: 'Design Database Schema', phase: 'Backend', hours: '8h', status: 'Completed', progress: 100, checked: true },
  { name: 'Setup CI/CD Pipeline', phase: 'DevOps', hours: '16h', status: 'To Do', progress: 0, checked: false },
  { name: 'Write API Documentation', phase: 'Docs', hours: '4h', status: 'In Progress', progress: 30, checked: false },
  { name: 'Fix Pagination Bug', phase: 'Frontend', hours: '2h', status: 'To Do', progress: 0, checked: false }
];
