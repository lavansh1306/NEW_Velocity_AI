import { fetchProjectsHybrid, fetchAllIssuesHybrid } from '@/lib/jiraDbClient';
import type { KPIData, Deadline, GanttMember, DashboardData } from '@/types/dashboard';

/**
 * Main dashboard data fetcher
 * Aggregates all dashboard data in one call using the Jira DB client
 */
interface DashboardOptions {
    startDate?: Date;
    endDate?: Date;
}

export async function getDashboardData(options?: DashboardOptions): Promise<DashboardData> {
    try {
        console.log('[dashboardService] Fetching dashboard data...');

        // Fetch all required data
        const { projects } = await fetchProjectsHybrid();
        const { issues: allIssues } = await fetchAllIssuesHybrid();

        // Parse today's date for comparisons
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter issues based on Date Range if provided
        const viewStart = options?.startDate;
        const viewEnd = options?.endDate;

        const issues = allIssues.filter(issue => {
            if (!viewStart || !viewEnd) return true;

            // Assume issue has a created date or due date to see if it was active
            // In Jira extracts, 'created' and 'updated' exist. 'duedate' might exist.
            // If it was created before the end and updated after the start, it physically existed in this range.
            const created = issue.created ? new Date(issue.created) : new Date('2024-01-01');
            const updated = issue.updated ? new Date(issue.updated) : created;

            // Allow issue if it existed and was active anywhere inside the window
            // Active means: created before the view ends, AND updated after the view begins
            return created <= viewEnd && updated.getTime() >= viewStart.getTime();
        });

        // Group issues by project and assignee for processing
        const issuesByProject = new Map<string, any[]>();
        const issuesByAssignee = new Map<string, any[]>();

        issues.forEach(issue => {
            const projectKey = issue.project_key || 'unknown';
            if (!issuesByProject.has(projectKey)) {
                issuesByProject.set(projectKey, []);
            }
            issuesByProject.get(projectKey)!.push(issue);

            const assignee = issue.assignee || 'Unassigned';
            if (!issuesByAssignee.has(assignee)) {
                issuesByAssignee.set(assignee, []);
            }
            issuesByAssignee.get(assignee)!.push(issue);
        });

        // 1. Calculate KPIs
        const activeProjectsSet = new Set<string>();
        const projectsAtRiskSet = new Set<string>();
        let usedCapacity = 0;
        const uniqueAssignees = new Set<string>();

        const countBusinessDays = (startDate: Date, endDate: Date): number => {
            let count = 0;
            const current = new Date(startDate);
            current.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(0, 0, 0, 0);

            while (current <= end) {
                const dayOfWeek = current.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    count++;
                }
                current.setDate(current.getDate() + 1);
            }
            return count;
        };

        issues.forEach(issue => {
            const issueDueDate = issue.due ? new Date(issue.due) : null;
            const issueStartDate = issue.start ? new Date(issue.start) : null;
            const projectKey = issue.key?.split('-')[0] || 'Unknown';

            if (issue.assignee) {
                uniqueAssignees.add(issue.assignee);
            }

            // Active projects
            if ((issueDueDate && issueDueDate.getTime() === today.getTime() && issue.status !== 'Done') ||
                issue.status === 'In Progress' || issue.status === 'In_Progress') {
                activeProjectsSet.add(projectKey);
            }

            // Projects at risk
            if (issueDueDate && issueDueDate < today && issue.status !== 'Done') {
                projectsAtRiskSet.add(projectKey);
            }

            // Capacity
            if (issueStartDate && issueDueDate) {
                const businessDays = countBusinessDays(issueStartDate, issueDueDate);
                const capacityNeeded = businessDays * 8;
                usedCapacity += capacityNeeded;
            }
        });

        const totalAssignees = uniqueAssignees.size;
        const totalCapacity = totalAssignees * 40 * 4; // 40 hours per week, 4 weeks
        const utilizationPercent = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;

        const kpis: KPIData[] = [
            {
                label: 'Active Projects',
                value: activeProjectsSet.size,
                trend: activeProjectsSet.size > 0 ? 'up' : 'down',
            },
            {
                label: 'Team Utilization',
                value: `${utilizationPercent}%`,
                sublabel: 'Target: 85%',
                trend: utilizationPercent >= 80 ? 'up' : 'down',
            },
            {
                label: 'Projects at Risk',
                value: projectsAtRiskSet.size,
                trend: projectsAtRiskSet.size > 0 ? 'down' : 'up',
            },
            {
                label: 'Active Team Members',
                value: totalAssignees,
                sublabel: 'With assignments',
                trend: 'up',
            },
        ];

        // 2. Calculate Deadlines
        const deadlinesList = projects.map(project => {
            const projectIssues = issuesByProject.get(project.key) || [];
            let earliestDueDate: Date | null = null;
            let hasIncompleteIssues = false;

            projectIssues.forEach(issue => {
                if (issue.status !== 'Done' && issue.status !== 'Closed') {
                    hasIncompleteIssues = true;
                    if (issue.due) {
                        const dueDate = new Date(issue.due);
                        dueDate.setHours(0, 0, 0, 0);
                        if (!earliestDueDate || dueDate < earliestDueDate) {
                            earliestDueDate = dueDate;
                        }
                    }
                }
            });

            if (!earliestDueDate || !hasIncompleteIssues) return null;

            const daysRemaining = Math.ceil((earliestDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            return {
                project: project.title,
                deadline: earliestDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                daysLeft: daysRemaining,
                status: daysRemaining < 0 ? 'At Risk' : daysRemaining <= 7 ? 'Active' : 'Completed' as const,
            };
        })
            .filter((d): d is NonNullable<typeof d> => d !== null)
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 5);

        // 3. Calculate Gantt
        const teamMap = new Map<string, GanttMember>();

        issues.forEach(issue => {
            if (!issue.assignee) return;

            if (!teamMap.has(issue.assignee)) {
                teamMap.set(issue.assignee, {
                    name: issue.assignee,
                    role: 'Team Member',
                    avatar: issue.assignee.charAt(0).toUpperCase(),
                    tasks: [],
                });
            }

            const member = teamMap.get(issue.assignee)!;

            if (issue.start && issue.due) {
                const iStart = new Date(issue.start);
                const iDue = new Date(issue.due);

                let status: 'track' | 'risk' = 'track';
                if (iDue < today && issue.status !== 'Done') {
                    status = 'risk';
                }

                member.tasks.push({
                    name: issue.summary || 'Task',
                    project: issue.project_key || 'Unknown',
                    startDate: iStart.toISOString(),
                    endDate: iDue.toISOString(),
                    status,
                });
            }
        });

        const gantt = Array.from(teamMap.values()).slice(0, 10); // Show top 10 members

        return {
            kpis,
            deadlines: deadlinesList as Deadline[],
            gantt,
            weekDates: [] // Deprecated in favor of UI generation, keeping for type compliance
        };
    } catch (error) {
        console.error('[dashboardService] Failed to fetch dashboard data:', error);
        throw error;
    }
}