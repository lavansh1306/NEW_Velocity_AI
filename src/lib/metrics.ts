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
