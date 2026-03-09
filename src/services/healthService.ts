/**
 * Health Service
 * 
 * Provides Project Health Scoring logic (Schedule, Resource, Risk, Quality).
 * Migrated from the decommissioned metrics.ts.
 */

export interface ProjectHealthMetrics {
    compositeScore: number;
    schedule: number;
    resource: number;
    risk: number;
    quality: number;
}

/**
 * calculateProjectHealthScore
 * Comprehensive project health assessment based on:
 * - Schedule Performance (40%): Burndown rate vs required pace
 * - Resource Health (30%): Team utilization balance
 * - Risk Assessment (20%): Blockers, dependencies, high priority issues
 * - Quality Metrics (10%): Bug ratio and code quality indicators
 */
export function calculateProjectHealthScore(projectData: {
    issues: any[];
    startDate?: Date;
    endDate?: Date;
    teamMembers?: string[];
}): ProjectHealthMetrics {
    if (!projectData.issues || projectData.issues.length === 0) {
        return {
            compositeScore: 60,
            schedule: 60,
            resource: 60,
            risk: 60,
            quality: 60,
        };
    }

    const schedule = calculateScheduleHealth(projectData);
    const resource = calculateResourceHealth(projectData);
    const risk = calculateRiskHealth(projectData);
    const quality = calculateQualityHealth(projectData);

    // Weighted composite health score
    const compositeScore = Math.max(0, Math.min(100, Math.round(
        (schedule * 0.40) +
        (resource * 0.30) +
        (risk * 0.20) +
        (quality * 0.10)
    )));

    return {
        compositeScore,
        schedule,
        resource,
        risk,
        quality,
    };
}

/**
 * calculateScheduleHealth (40% weight)
 */
export function calculateScheduleHealth(projectData: {
    issues: any[];
    startDate?: Date;
    endDate?: Date;
}): number {
    const { issues, startDate, endDate } = projectData;

    const today = new Date();
    const projectStart = startDate || new Date(2026, 0, 1);
    const projectEnd = endDate || new Date(2026, 2, 31);

    const totalDuration = (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
    const daysElapsed = Math.max(1, (today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, (projectEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const completedTasks = issues.filter((i: any) =>
        i.status?.toLowerCase?.()?.includes('done') ||
        i.status?.toLowerCase?.()?.includes('completed') ||
        i.status?.toLowerCase?.()?.includes('closed')
    ).length;

    const inProgressTasks = issues.filter((i: any) =>
        i.status?.toLowerCase?.()?.includes('in progress') ||
        i.status?.toLowerCase?.()?.includes('in_progress')
    ).length;

    const totalTasks = issues.length;
    const remainingTasks = totalTasks - completedTasks - inProgressTasks;

    const expectedProgress = Math.min((daysElapsed / totalDuration) * 100, 100);
    const actualProgress = (completedTasks / totalTasks) * 100;
    const progressDelta = actualProgress - expectedProgress;

    const completionRate = completedTasks / daysElapsed;
    const requiredRate = totalTasks / totalDuration;
    const progressEfficiency = requiredRate > 0 ? completionRate / requiredRate : 0;

    const daysToCompleteRemaining = progressEfficiency > 0 ? remainingTasks / completionRate : daysRemaining;
    const predictedEndDate = new Date(today.getTime() + daysToCompleteRemaining * 24 * 60 * 60 * 1000);
    const daysOverBudget = Math.max(0, (predictedEndDate.getTime() - projectEnd.getTime()) / (1000 * 60 * 60 * 24));

    let scheduleScore = 100;

    if (daysOverBudget <= 0) {
        scheduleScore = 100 - (Math.abs(progressDelta) * 0.3);
    } else if (daysOverBudget <= 3) {
        scheduleScore = 85;
    } else if (daysOverBudget <= 7) {
        scheduleScore = 65;
    } else if (daysOverBudget <= 14) {
        scheduleScore = 40;
    } else {
        scheduleScore = 20;
    }

    if (progressDelta > 10) {
        scheduleScore = Math.min(100, scheduleScore + 15);
    }

    return Math.max(0, Math.min(100, Math.round(scheduleScore)));
}

/**
 * calculateResourceHealth (30% weight)
 */
export function calculateResourceHealth(projectData: {
    issues: any[];
    teamMembers?: string[];
}): number {
    const { issues, teamMembers } = projectData;

    const allTeamMembers = teamMembers || Array.from(new Set(
        issues.map((i: any) => i.assignee).filter((a: any) => a && a !== 'Unassigned')
    )) as string[];

    if (allTeamMembers.length === 0) return 80;

    let totalHealthScore = 0;
    let evaluatedMembers = 0;

    allTeamMembers.forEach((member: string) => {
        const memberIssues = issues.filter((i: any) => i.assignee === member);

        const allocatedHours = memberIssues.reduce((sum: number, issue: any) => {
            const hours = issue.duration ? parseInt(issue.duration, 10) : 8;
            return sum + (isNaN(hours) ? 8 : hours);
        }, 0);

        const utilization = (allocatedHours / 40) * 100;

        let memberScore = 0;
        if (utilization >= 80 && utilization <= 100) {
            memberScore = 100;
        } else if (utilization >= 70 && utilization <= 110) {
            memberScore = 85;
        } else if ((utilization >= 50 && utilization < 70) || (utilization > 110 && utilization <= 130)) {
            memberScore = 65;
        } else if ((utilization >= 30 && utilization < 50) || (utilization > 130 && utilization <= 160)) {
            memberScore = 40;
        } else {
            memberScore = 20;
        }

        totalHealthScore += memberScore;
        evaluatedMembers++;
    });

    const avgResourceHealth = evaluatedMembers > 0 ? totalHealthScore / evaluatedMembers : 80;
    return Math.round(avgResourceHealth);
}

/**
 * calculateRiskHealth (20% weight)
 */
export function calculateRiskHealth(projectData: { issues: any[] }): number {
    const { issues } = projectData;
    let riskScore = 100;

    const blockedIssues = issues.filter((i: any) =>
        i.status?.toLowerCase?.()?.includes('blocked')
    ).length;
    riskScore -= blockedIssues * 8;

    const highPriority = issues.filter((i: any) =>
        (i.priority?.toLowerCase?.()?.includes('high') ||
            i.priority?.toLowerCase?.()?.includes('critical')) &&
        !(i.status?.toLowerCase?.()?.includes('done') ||
            i.status?.toLowerCase?.()?.includes('completed'))
    ).length;
    riskScore -= highPriority * 4;

    const dependencyIssues = issues.filter((i: any) =>
        i.description?.toLowerCase?.()?.includes('depend') ||
        i.labels?.some?.((l: string) => l.toLowerCase().includes('depend'))
    ).length;
    riskScore -= dependencyIssues * 2;

    const inProgressCount = issues.filter((i: any) =>
        i.status?.toLowerCase?.()?.includes('in progress') ||
        i.status?.toLowerCase?.()?.includes('in_progress')
    ).length;

    if (issues.length > 0) {
        const inProgressRatio = inProgressCount / issues.length;
        if (inProgressRatio > 0.5) {
            riskScore -= 15;
        }
    }

    return Math.max(20, Math.min(100, riskScore));
}

/**
 * calculateQualityHealth (10% weight)
 */
export function calculateQualityHealth(projectData: { issues: any[] }): number {
    const { issues } = projectData;

    const bugIssues = issues.filter((i: any) =>
        i.type?.toLowerCase?.()?.includes('bug') ||
        i.labels?.some?.((l: string) => l.toLowerCase().includes('bug'))
    ).length;

    const bugRatio = issues.length > 0 ? (bugIssues / issues.length) * 100 : 0;
    let qualityScore = 100;

    if (bugRatio < 10) qualityScore = 100;
    else if (bugRatio < 15) qualityScore = 85;
    else if (bugRatio < 20) qualityScore = 70;
    else if (bugRatio < 30) qualityScore = 50;
    else qualityScore = 30;

    const testedCount = issues.filter((i: any) =>
        i.labels?.some?.((l: string) => l.toLowerCase().includes('tested'))
    ).length;

    if (issues.length > 0) {
        const testCoverage = (testedCount / issues.length) * 100;
        const coverageBonus = Math.min(15, (testCoverage / 100) * 15);
        qualityScore = Math.min(100, qualityScore + coverageBonus);
    }

    return Math.round(qualityScore);
}
