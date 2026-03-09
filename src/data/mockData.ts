import { TeamMemberView, PendingSkillView, PersonDetailView, PlanTask, PlanTeamCandidate } from '../types';

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
    { name: 'Sarah Chen', role: 'Frontend Lead', avatar: 'SC', skills: ['React', 'TypeScript', 'CSS', 'UI/UX'], utilization: 120, projects: 3, status: 'overloaded', availability: 0 },
    { name: 'Marcus Rodriguez', role: 'Backend Engineer', avatar: 'MR', skills: ['Node.js', 'PostgreSQL', 'AWS'], utilization: 95, projects: 2, status: 'at-risk', availability: 8 },
    { name: 'Alex Kim', role: 'Data Engineer', avatar: 'AK', skills: ['Python', 'Spark', 'SQL'], utilization: 70, projects: 1, status: 'healthy', availability: 24 },
];

export const pendingSkillsView: PendingSkillView[] = [
    { id: 1, person: 'Alex Kim', avatar: 'AK', skill: 'Kubernetes', selfRated: 'Expert', evidence: 'Managed cluster for Project Alpha', suggestedBy: 'ai' },
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
