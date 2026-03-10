import { TeamMemberView, PersonDetailView, User, TaskAssignment, UserSkill, AISuggestion } from '../../types';

export const normalizeTeamMember = (
    user: any,
    assignments: any[],
    skills: any[]
): TeamMemberView => {
    const utilization = assignments.reduce((acc, curr) => acc + (curr.allocated_hours_per_week || 0), 0);
    const totalCapacity = user.capacity_hours_per_week || 40;
    const utilizationPercentage = Math.round((utilization / totalCapacity) * 100);

    return {
        id: user.id,
        name: user.name || user.email,
        role: user.role || 'Member',
        avatar: (user.name || user.email).substring(0, 2).toUpperCase(),
        skills: skills.map(s => s.skill_name),
        utilization: utilizationPercentage,
        projects: new Set(assignments.map(a => a.tasks?.project_id)).size,
        status: utilizationPercentage > 100 ? 'overloaded' : utilizationPercentage > 85 ? 'at-risk' : 'healthy',
        availability: Math.max(0, totalCapacity - utilization) // Simple weekly availability
    };
};

export const normalizePersonDetail = (
    user: any,
    assignments: any[],
    skills: any[],
    suggestions: AISuggestion[] = []
): PersonDetailView => {
    // Group assignments by project
    const projectMap: Record<string, number> = {};
    assignments.forEach(a => {
        const projectName = a.tasks?.projects?.name || 'Unknown Project';
        projectMap[projectName] = (projectMap[projectName] || 0) + (a.allocated_hours_per_week || 0);
    });

    return {
        capacityTimeline: [
            { week: 'Week 1', allocated: 38, available: 40 },
            { week: 'Week 2', allocated: 42, available: 40 },
            { week: 'Week 3', allocated: 35, available: 40 },
            { week: 'Week 4', allocated: 40, available: 40 },
        ], // Placeholder for actual timeline logic
        projects: Object.entries(projectMap).map(([name, hours]) => ({ name, hours })),
        skills: skills.map(s => ({
            name: s.skill_name,
            proficiency: s.proficiency_level === 'advanced' ? 90 : s.proficiency_level === 'mid' ? 65 : 35
        })),
        recommendations: suggestions
    };
};
