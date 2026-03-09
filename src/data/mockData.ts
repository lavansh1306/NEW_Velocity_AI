import { PlanTask, PlanTeamCandidate } from '../types';

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
