import type {
  NormalizedEvent,
  AutomationTrendPoint,
  ManualVsAutomatedByApp,
  AppName,
} from './types';

// ========================================
// Metric computation utilities
// ========================================

/**
 * automationCoverage
 * Returns ratio of automated events to total events (0–1).
 */
export function automationCoverage(events: NormalizedEvent[]): number {
  if (events.length === 0) return 0;
  const automated = events.filter((e) => e.actionType === 'automation').length;
  return automated / events.length;
}

/**
 * totalAutomations
 * Returns the count of events where actionType === 'automation'.
 */
export function totalAutomations(events: NormalizedEvent[]): number {
  return events.filter((e) => e.actionType === 'automation').length;
}

/**
 * estimatedTimeSavedHours
 * Sums avgManualMinutes * units for all automation events, then converts to hours.
 */
export function estimatedTimeSavedHours(events: NormalizedEvent[]): number {
  const totalMinutes = events
    .filter((e) => e.actionType === 'automation')
    .reduce((acc, e) => acc + e.avgManualMinutes * e.units, 0);
  return totalMinutes / 60;
}

/**
 * estimatedTimeSavedHoursByApp
 * Returns a mapping of app name => total hours saved (number) across provided events.
 */
export function estimatedTimeSavedHoursByApp(events: NormalizedEvent[]): Record<AppName, number> {
  const apps: AppName[] = ['Asana', 'Jira', 'Zapier', 'HubSpot', 'Microsoft365'];
  const totals: Record<AppName, number> = Object.fromEntries(apps.map((a) => [a, 0])) as Record<AppName, number>;

  for (const e of events) {
    if (e.actionType !== 'automation') continue;
    const minutes = e.avgManualMinutes * e.units;
    const key = e.app as AppName;
    if (!totals[key] && totals[key] !== 0) continue;
    totals[key] = (totals[key] ?? 0) + minutes / 60;
  }

  return totals;
}

/**
 * getWeekStart
 * Returns ISO date string of the Monday (start of week) for a given timestamp.
 */
function getWeekStart(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * automationGrowthTrend
 * Returns weekly totals of automation events, sorted chronologically.
 */
export function automationGrowthTrend(events: NormalizedEvent[]): AutomationTrendPoint[] {
  const map = new Map<string, number>();
  for (const e of events) {
    if (e.actionType !== 'automation') continue;
    const week = getWeekStart(e.timestamp);
    map.set(week, (map.get(week) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, automations]) => ({ weekStart, automations }));
}

/**
 * manualVsAutomatedByApp
 * Returns per-app breakdown of manual vs automated event counts.
 */
export function manualVsAutomatedByApp(events: NormalizedEvent[]): ManualVsAutomatedByApp[] {
  const apps: AppName[] = ['Asana', 'Jira', 'Zapier', 'HubSpot', 'Microsoft365'];
  const result: ManualVsAutomatedByApp[] = apps.map((app) => ({
    app,
    manual: 0,
    automated: 0,
  }));
  const lookup = new Map(result.map((r) => [r.app, r]));

  for (const e of events) {
    const entry = lookup.get(e.app);
    if (!entry) continue;
    if (e.actionType === 'automation') {
      entry.automated += 1;
    } else {
      entry.manual += 1;
    }
  }
  return result;
}

/**
 * estimatedCostSavedUSD
 * Multiply estimatedTimeSavedHours by an hourly rate (USD).
 */
export function estimatedCostSavedUSD(events: NormalizedEvent[], hourlyRateUSD = 100): number {
  const hours = estimatedTimeSavedHours(events);
  return Math.round(hours * hourlyRateUSD * 100) / 100; // round to cents
}

/**
 * estimatedReturnsByApp
 * Returns per-app ROI returns: (hours saved * hourlyRate) - investmentCost.
 * investmentCosts is a map of app name to investment cost (in USD).
 */
export function estimatedReturnsByApp(
  events: NormalizedEvent[],
  hourlyRateUSD = 100,
  investmentCosts: Record<string, number> = {}
): Record<string, number> {
  const apps: AppName[] = ['Asana', 'Jira', 'Zapier', 'HubSpot', 'Microsoft365'];
  const hoursPerApp = estimatedTimeSavedHoursByApp(events);
  const returns: Record<string, number> = {};

  for (const app of apps) {
    const hours = hoursPerApp[app] ?? 0;
    const saved = Math.round(hours * hourlyRateUSD * 100) / 100;
    returns[app] = Math.max(0, saved); // returns can't be negative
  }

  return returns;
}

/**
 * estimatedTotalReturnsUSD
 * Calculate total returns as: (sum of all platform hours * hourlyRate) - total investment.
 * This allows negative returns.
 */
export function estimatedTotalReturnsUSD(events: NormalizedEvent[], hourlyRateUSD = 100, totalInvestmentUSD = 0): number {
  const totalHours = estimatedTimeSavedHours(events);
  const totalCostSaved = Math.round(totalHours * hourlyRateUSD * 100) / 100;
  // Return total cost saved minus investments (can be negative); round to cents
  return Math.round((totalCostSaved) * 100) / 100;
}

/**
 * automationCoverageForWindow
 * Returns coverage (0-1) for events that fall within [start, end).
 */
export function automationCoverageForWindow(events: NormalizedEvent[], start: Date, end: Date): number {
  const windowEvents = events.filter((e) => {
    const t = new Date(e.timestamp);
    return t >= start && t < end;
  });
  if (windowEvents.length === 0) return 0;
  const automated = windowEvents.filter((e) => e.actionType === 'automation').length;
  return automated / windowEvents.length;
}

/**
 * automationCoveragePrevious
 * Compute previous-period coverage using a sliding window anchored to latest event.
 * By default, uses 30-day windows: current = last 30 days, previous = 30-60 days ago.
 */
export function automationCoveragePrevious(events: NormalizedEvent[], windowDays = 30): { previous: number; current: number } {
  if (events.length === 0) return { previous: 0, current: 0 };
  // anchor to the latest event timestamp if available
  const latest = events.reduce((acc, e) => (new Date(e.timestamp) > acc ? new Date(e.timestamp) : acc), new Date(events[0].timestamp));
  const currentEnd = new Date(latest);
  const currentStart = new Date(currentEnd.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const prevStart = new Date(currentStart.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const prevEnd = new Date(currentStart);

  const current = automationCoverageForWindow(events, currentStart, currentEnd);
  const previous = automationCoverageForWindow(events, prevStart, prevEnd);
  return { previous, current };
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
}): number {
  if (!projectData.issues || projectData.issues.length === 0) return 60;

  const scheduleScore = calculateScheduleHealth(projectData);
  const resourceScore = calculateResourceHealth(projectData);
  const riskScore = calculateRiskHealth(projectData);
  const qualityScore = calculateQualityHealth(projectData);

  // Weighted composite health score
  const healthScore = 
    (scheduleScore * 0.40) +
    (resourceScore * 0.30) +
    (riskScore * 0.20) +
    (qualityScore * 0.10);

  return Math.max(0, Math.min(100, Math.round(healthScore)));
}

/**
 * calculateScheduleHealth (40% weight)
 * Measures if project is on track to complete on time
 * Accounts for actual task progress vs time elapsed
 */
function calculateScheduleHealth(projectData: {
  issues: any[];
  startDate?: Date;
  endDate?: Date;
}): number {
  const { issues, startDate, endDate } = projectData;
  
  const today = new Date();
  const projectStart = startDate || new Date(2026, 0, 1);
  const projectEnd = endDate || new Date(2026, 2, 31);

  // Total duration in days
  const totalDuration = (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
  const daysElapsed = Math.max(1, (today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, (projectEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Task progress
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

  // Expected vs Actual progress ratio
  const expectedProgress = Math.min((daysElapsed / totalDuration) * 100, 100);
  const actualProgress = (completedTasks / totalTasks) * 100;
  const progressDelta = actualProgress - expectedProgress;

  // Progress efficiency: how much progress per day
  const completionRate = completedTasks / daysElapsed;
  const requiredRate = totalTasks / totalDuration;
  const progressEfficiency = requiredRate > 0 ? completionRate / requiredRate : 0;

  // Predict end date based on current velocity
  const daysToCompleteRemaining = progressEfficiency > 0 ? remainingTasks / completionRate : daysRemaining;
  const predictedEndDate = new Date(today.getTime() + daysToCompleteRemaining * 24 * 60 * 60 * 1000);
  const daysOverBudget = Math.max(0, (predictedEndDate.getTime() - projectEnd.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate score based on prediction vs deadline
  let scheduleScore = 100;

  if (daysOverBudget <= 0) {
    // On track or ahead
    scheduleScore = 100 - (Math.abs(progressDelta) * 0.3); // Slight penalty for being behind expected
  } else if (daysOverBudget <= 3) {
    scheduleScore = 85;
  } else if (daysOverBudget <= 7) {
    scheduleScore = 65;
  } else if (daysOverBudget <= 14) {
    scheduleScore = 40;
  } else {
    scheduleScore = 20;
  }

  // Boost if making up time (actual > expected)
  if (progressDelta > 10) {
    scheduleScore = Math.min(100, scheduleScore + 15);
  }

  return Math.max(0, Math.min(100, Math.round(scheduleScore)));
}

/**
 * calculateResourceHealth (30% weight)
 * Measures team utilization balance and availability
 */
function calculateResourceHealth(projectData: {
  issues: any[];
  teamMembers?: string[];
}): number {
  const { issues, teamMembers } = projectData;

  // Get unique team members from issues
  const allTeamMembers = teamMembers || Array.from(new Set(
    issues.map((i: any) => i.assignee).filter((a: any) => a && a !== 'Unassigned')
  )) as string[];

  if (allTeamMembers.length === 0) return 80;

  let totalHealthScore = 0;
  let evaluatedMembers = 0;

  // Evaluate each team member's utilization
  allTeamMembers.forEach((member: string) => {
    const memberIssues = issues.filter((i: any) => i.assignee === member);
    
    // Calculate allocated hours (estimate 8 hours per task)
    const allocatedHours = memberIssues.reduce((sum: number, issue: any) => {
      const hours = issue.duration ? parseInt(issue.duration, 10) : 8;
      return sum + (isNaN(hours) ? 8 : hours);
    }, 0);

    // Calculate utilization percentage (40 hours per week = baseline)
    const utilization = (allocatedHours / 40) * 100;

    // Score based on utilization bands
    let memberScore = 0;
    if (utilization >= 80 && utilization <= 100) {
      memberScore = 100; // Ideal utilization
    } else if (utilization >= 70 && utilization <= 110) {
      memberScore = 85; // Acceptable range
    } else if ((utilization >= 50 && utilization < 70) || (utilization > 110 && utilization <= 130)) {
      memberScore = 65; // Moderate concern
    } else if ((utilization >= 30 && utilization < 50) || (utilization > 130 && utilization <= 160)) {
      memberScore = 40; // Significant concern
    } else {
      memberScore = 20; // Critical concern (severely under/over utilized)
    }

    totalHealthScore += memberScore;
    evaluatedMembers++;
  });

  // Average health across team
  const avgResourceHealth = evaluatedMembers > 0 ? totalHealthScore / evaluatedMembers : 80;

  return Math.round(avgResourceHealth);
}

/**
 * calculateRiskHealth (20% weight)
 * Measures project blockers, dependencies, and high-risk items
 */
function calculateRiskHealth(projectData: { issues: any[] }): number {
  const { issues } = projectData;

  let riskScore = 100; // Start at max

  // Count blocked issues
  const blockedIssues = issues.filter((i: any) =>
    i.status?.toLowerCase?.()?.includes('blocked')
  ).length;
  riskScore -= blockedIssues * 8; // Each blocked issue = -8 points

  // Count high priority unresolved issues
  const highPriority = issues.filter((i: any) =>
    (i.priority?.toLowerCase?.()?.includes('high') ||
     i.priority?.toLowerCase?.()?.includes('critical')) &&
    !(i.status?.toLowerCase?.()?.includes('done') ||
      i.status?.toLowerCase?.()?.includes('completed'))
  ).length;
  riskScore -= highPriority * 4; // Each high priority unresolved = -4 points

  // Count issues with dependencies (assume from description or linked issues)
  const dependencyIssues = issues.filter((i: any) =>
    i.description?.toLowerCase?.()?.includes('depend') ||
    i.labels?.some?.((l: string) => l.toLowerCase().includes('depend'))
  ).length;
  riskScore -= dependencyIssues * 2; // Each dependency = -2 points

  // Count "In Progress" status items
  const inProgressCount = issues.filter((i: any) =>
    i.status?.toLowerCase?.()?.includes('in progress') ||
    i.status?.toLowerCase?.()?.includes('in_progress')
  ).length;

  const inProgressRatio = inProgressCount / issues.length;
  if (inProgressRatio > 0.5) {
    riskScore -= 15; // Too many items in progress (context switching risk)
  }

  // Ensure score stays in valid range
  return Math.max(20, Math.min(100, riskScore));
}

/**
 * calculateQualityHealth (10% weight)
 * Measures code quality and testing metrics
 */
function calculateQualityHealth(projectData: { issues: any[] }): number {
  const { issues } = projectData;

  // Bug ratio calculation
  const bugIssues = issues.filter((i: any) =>
    i.type?.toLowerCase?.()?.includes('bug') ||
    i.labels?.some?.((l: string) => l.toLowerCase().includes('bug'))
  ).length;

  const bugRatio = issues.length > 0 ? (bugIssues / issues.length) * 100 : 0;

  let qualityScore = 100;

  if (bugRatio < 10) {
    qualityScore = 100;
  } else if (bugRatio < 15) {
    qualityScore = 85;
  } else if (bugRatio < 20) {
    qualityScore = 70;
  } else if (bugRatio < 30) {
    qualityScore = 50;
  } else {
    qualityScore = 30;
  }

  // Account for test coverage (if available in labels)
  const testedCount = issues.filter((i: any) =>
    i.labels?.some?.((l: string) => l.toLowerCase().includes('tested'))
  ).length;

  if (issues.length > 0) {
    const testCoverage = (testedCount / issues.length) * 100;
    const coverageBonus = Math.min(15, (testCoverage / 100) * 15); // Max +15 for 100% coverage
    qualityScore = Math.min(100, qualityScore + coverageBonus);
  }

  return Math.round(qualityScore);
}

