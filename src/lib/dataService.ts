/**
 * Client-side data service for loading projects and computing metrics.
 * Works in the browser by fetching CSVs from public/data/ and processing them.
 */

import type {
  RawAsanaRow,
  RawJiraRow,
  RawZapierRow,
  RawHubSpotRow,
  RawMicrosoft365Row,
  NormalizedEvent,
  MetricsResponse,
} from './types';

import {
  normalizeAsana,
  normalizeJira,
  normalizeZapier,
  normalizeHubSpot,
  normalizeMicrosoft365,
} from './normalizers';

import {
  automationCoverage,
  totalAutomations,
  estimatedTimeSavedHours,
  automationGrowthTrend,
  manualVsAutomatedByApp,
} from './metrics';
import { estimatedTimeSavedHoursByApp, estimatedReturnsByApp, estimatedTotalReturnsUSD } from './metrics';
import { estimatedCostSavedUSD, automationCoveragePrevious } from './metrics';

// ========================================
// CSV Parser (browser-compatible)
// ========================================

function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    // Simple CSV parser that handles quoted fields
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];
      
      if (char === '"' && nextChar === '"' && inQuotes) {
        // Double quote escape - add one quote to output
        current += '"';
        j++; // Skip next quote
      } else if (char === '"') {
        // Toggle quote mode, don't add quote to output
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length === headers.length) {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] ?? '';
      });
      rows.push(obj as T);
    }
  }

  return rows;
}

async function fetchCSV(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${path}`);
  }
  return response.text();
}

// ========================================
// Project interface for the list
// ========================================

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  tags: string[];
  color: string;
}

// Fallback metadata (could be moved to a separate JSON file)
const projectDescriptions: Record<string, string> = {
  '1': 'Built an integrated inventory management and demand forecasting system for a mid-market retail chain. Reduced stockouts by 32% and optimized warehouse operations.',
  '2': 'Designed a multi-tenant cloud infrastructure orchestration platform enabling real-time resource allocation and auto-scaling.',
  '3': 'Developed a comprehensive healthcare tracking platform with HIPAA compliance and real-time patient monitoring.',
  '4': 'Developed an advanced quantitative analytics platform for portfolio optimization with ML-driven market risk prediction and real-time scenario modeling.',
  '5': 'Optimized supply chain logistics using advanced algorithms, reducing delivery times and costs significantly.',
  '6': 'Created an enterprise HR analytics suite for workforce planning, engagement tracking, and talent management.',
};

const projectColors: Record<string, string> = {
  '1': '#d97706',
  '2': '#2563EB',
  '3': '#059669',
  '4': '#7c3aed',
  '5': '#f59e0b',
  '6': '#10b981',
};

const projectTags: Record<string, string[]> = {
  '1': ['Inventory', 'Analytics', 'Operations'],
  '2': ['Cloud', 'Infrastructure', 'DevOps'],
  '3': ['Healthcare', 'Compliance', 'Real-time'],
  '4': ['Fintech', 'AI/ML', 'Risk Analysis'],
  '5': ['Supply Chain', 'Logistics', 'Optimization'],
  '6': ['HR', 'Analytics', 'Enterprise'],
};

const projectImages: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=800&fit=crop',
  '2': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop',
  '3': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=800&fit=crop',
  '4': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop',
  '5': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=800&fit=crop',
  '6': 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=800&fit=crop',
};

// ========================================
// Public API
// ========================================

/**
 * Load list of projects from projects-analytics.csv
 */
export async function loadProjects(): Promise<ProjectItem[]> {
  const csvText = await fetchCSV('/data/projects-analytics.csv');
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const projects: ProjectItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Format: id,name,category,"json_data"
    const match = line.match(/^([^,]+),([^,]+),([^,]+),/);
    if (!match) continue;

    const id = match[1].trim();
    const title = match[2].trim();
    const category = match[3].trim();

    projects.push({
      id,
      title,
      category,
      description: projectDescriptions[id] ?? 'Project details not available.',
      image: projectImages[id] ?? 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=800&fit=crop',
      tags: projectTags[id] ?? [],
      color: projectColors[id] ?? '#6366f1',
    });
  }

  return projects;
}

/**
 * Load raw event CSVs, normalize, and compute metrics for a specific project
 */
export async function loadMetrics(projectId: string): Promise<MetricsResponse> {
  const events = await getNormalizedEventsForProject(projectId);

  // Compute metrics from filtered events
  const HOURLY_RATE_USD = 100; // assumption used for cost estimates
  const estHours = estimatedTimeSavedHours(events);
  const estCost = estimatedCostSavedUSD(events, HOURLY_RATE_USD);
  const { previous: prevCoverage, current: currentCoverage } = automationCoveragePrevious(events, 30);

  return {
    automationCoverage: automationCoverage(events),
    totalAutomations: totalAutomations(events),
    estimatedTimeSavedHours: estHours,
    estimatedCostSavedUSD: estCost,
    hourlyRateUsedUSD: HOURLY_RATE_USD,
    automationCoveragePrevious: prevCoverage,
    automationCoverageDelta: automationCoverage(events) - prevCoverage,
    automationTrend: automationGrowthTrend(events),
    manualVsAutomated: manualVsAutomatedByApp(events),
  };
}

/**
 * Load overall metrics across all projects (aggregated).
 * This avoids re-fetching CSVs per-project when we only need a global number.
 */
export async function loadAllMetrics(): Promise<Partial<MetricsResponse>> {
  const [asanaCsv, jiraCsv, zapierCsv, hubspotCsv, m365Csv] = await Promise.all([
    fetchCSV('/data/asana_events.csv').catch(() => ''),
    fetchCSV('/data/jira_events.csv').catch(() => ''),
    fetchCSV('/data/zapier_events.csv').catch(() => ''),
    fetchCSV('/data/hubspot_events.csv').catch(() => ''),
    fetchCSV('/data/microsoft365_events.csv').catch(() => ''),
  ]);

  const asanaRows = parseCSV<RawAsanaRow>(asanaCsv);
  const jiraRows = parseCSV<RawJiraRow>(jiraCsv);
  const zapierRows = parseCSV<RawZapierRow>(zapierCsv);
  const hubspotRows = parseCSV<RawHubSpotRow>(hubspotCsv);
  const m365Rows = parseCSV<RawMicrosoft365Row>(m365Csv);

  const allEvents: NormalizedEvent[] = [
    ...normalizeAsana(asanaRows),
    ...normalizeJira(jiraRows),
    ...normalizeZapier(zapierRows),
    ...normalizeHubSpot(hubspotRows),
    ...normalizeMicrosoft365(m365Rows),
  ];

  const HOURLY_RATE_USD = 100;
  const totalHours = estimatedTimeSavedHours(allEvents);
  const totalCost = estimatedCostSavedUSD(allEvents, HOURLY_RATE_USD);
  const perAppHours = estimatedTimeSavedHoursByApp(allEvents);
  
  // Investment costs per app (in USD) — adjust as needed
  const investmentCosts: Record<string, number> = {
    Asana: 10000,
    Jira: 10000,
    Zapier: 10000,
    HubSpot: 10000,
    Microsoft365: 10000,
  };
  
  const perAppReturns = estimatedReturnsByApp(allEvents, HOURLY_RATE_USD, investmentCosts);
  
  // Total investment across all platforms (50K total)
  const TOTAL_INVESTMENT_USD = 50000;
  const totalReturns = estimatedTotalReturnsUSD(allEvents, HOURLY_RATE_USD, TOTAL_INVESTMENT_USD);

  // Build monthly savings/investment trend from events
  const monthMap = new Map<string, NormalizedEvent[]>();
  for (const e of allEvents) {
    const d = new Date(e.timestamp);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key)!.push(e);
  }

  const monthKeys = Array.from(monthMap.keys()).sort();
  const savingsInvestmentTrend: { label: string; investmentUSD: number; savingsUSD: number }[] = [];
  if (monthKeys.length > 0) {
    const investmentPerMonth = TOTAL_INVESTMENT_USD / monthKeys.length;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (const key of monthKeys) {
      const [y, m] = key.split('-').map(Number);
      const eventsForMonth = monthMap.get(key) ?? [];
      const savings = estimatedCostSavedUSD(eventsForMonth, HOURLY_RATE_USD);
      const label = monthNames[(m - 1) % 12];
      savingsInvestmentTrend.push({ label, investmentUSD: Math.round(investmentPerMonth), savingsUSD: Math.round(savings) });
    }
  }

  return {
    estimatedTimeSavedHours: totalHours,
    estimatedCostSavedUSD: totalCost,
    hourlyRateUsedUSD: HOURLY_RATE_USD,
    perAppHours,
    perAppReturns,
    totalReturns,
    savingsInvestmentTrend,
  } as Partial<MetricsResponse> & { perAppHours: Record<string, number>; perAppReturns: Record<string, number>; totalReturns: number };
}

/**
 * getNormalizedEventsForProject
 * Fetch raw CSVs, normalize them and return NormalizedEvent[] filtered by projectId.
 */
export async function getNormalizedEventsForProject(projectId: string): Promise<NormalizedEvent[]> {
  const [asanaCsv, jiraCsv, zapierCsv, hubspotCsv, m365Csv] = await Promise.all([
    fetchCSV('/data/asana_events.csv').catch(() => ''),
    fetchCSV('/data/jira_events.csv').catch(() => ''),
    fetchCSV('/data/zapier_events.csv').catch(() => ''),
    fetchCSV('/data/hubspot_events.csv').catch(() => ''),
    fetchCSV('/data/microsoft365_events.csv').catch(() => ''),
  ]);

  const asanaRows = parseCSV<RawAsanaRow>(asanaCsv);
  const jiraRows = parseCSV<RawJiraRow>(jiraCsv);
  const zapierRows = parseCSV<RawZapierRow>(zapierCsv);
  const hubspotRows = parseCSV<RawHubSpotRow>(hubspotCsv);
  const m365Rows = parseCSV<RawMicrosoft365Row>(m365Csv);

  const allEvents: NormalizedEvent[] = [
    ...normalizeAsana(asanaRows),
    ...normalizeJira(jiraRows),
    ...normalizeZapier(zapierRows),
    ...normalizeHubSpot(hubspotRows),
    ...normalizeMicrosoft365(m365Rows),
  ];

  return allEvents.filter((e) => e.projectId === projectId);
}

// ========================================
// Project Detail Data Loaders
// ========================================

export interface GitHubEvent {
  event_id: string;
  occurred_at: string;
  event_type: string;
  actor: string;
  project_id: string;
  repo: string;
  properties: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  files_changed?: number;
  additions?: number;
  deletions?: number;
}

export interface PullRequest {
  pr_id: string;
  title: string;
  author: string;
  status: 'pending-review' | 'approved' | 'changes-requested';
  created_at: string;
  reviewers: string[];
}

export interface TeamMember {
  project_id: string;
  member_id: string;
  name: string;
  role: string;
  avatar: string;
  tasks_assigned: number;
  tasks_completed: number;
  tasks_due_today: number;
  current_task: string;
  prs_pending: number;
  reviews_pending: number;
}

export interface WeeklyCommit {
  project_id: string;
  week_start: string;
  week_end: string;
  commits_count: number;
}

export interface BurndownData {
  project_id: string;
  sprint_name: string;
  day: string;
  date: string;
  total_tasks: number;
  remaining_tasks: number;
}

/**
 * Load commits for a specific project from github_events.csv
 */
export async function loadCommitsByProject(projectId: string): Promise<Commit[]> {
  const csvText = await fetchCSV('/data/github_events.csv');
  const allEvents = parseCSV<GitHubEvent>(csvText);
  
  const commitEvents = allEvents.filter(
    (e) => e.project_id === projectId && e.event_type === 'commit'
  );
  
  return commitEvents.map((e) => {
    try {
      const propsStr = e.properties || '{}';
      const props = JSON.parse(propsStr);
      return {
        sha: props.sha || '',
        message: props.message || '',
        author: e.actor,
        date: e.occurred_at,
        files_changed: props.files_changed,
        additions: props.additions,
        deletions: props.deletions,
      };
    } catch (err) {
      console.error('Failed to parse commit properties:', e.properties, err);
      return {
        sha: '',
        message: '',
        author: e.actor,
        date: e.occurred_at,
      };
    }
  });
}

/**
 * Load pull requests for a specific project from github_events.csv
 */
export async function loadPullRequestsByProject(projectId: string): Promise<PullRequest[]> {
  const csvText = await fetchCSV('/data/github_events.csv');
  const allEvents = parseCSV<GitHubEvent>(csvText);
  
  const prEvents = allEvents.filter(
    (e) => e.project_id === projectId && e.event_type === 'pull_request'
  );
  
  return prEvents.map((e) => {
    try {
      const propsStr = e.properties || '{}';
      const props = JSON.parse(propsStr);
      return {
        pr_id: props.pr_id || e.event_id,
        title: props.title || '',
        author: e.actor,
        status: props.status || 'pending-review',
        created_at: e.occurred_at,
        reviewers: props.reviewers ? props.reviewers.split('|') : [],
      };
    } catch (err) {
      console.error('Failed to parse PR properties:', e.properties, err);
      return {
        pr_id: e.event_id,
        title: 'Unknown PR',
        author: e.actor,
        status: 'pending-review' as const,
        created_at: e.occurred_at,
        reviewers: [],
      };
    }
  });
}

/**
 * Load team members for a specific project
 */
export async function loadTeamMembersByProject(projectId: string): Promise<TeamMember[]> {
  const csvText = await fetchCSV('/data/github_events.csv');
  const allEvents = parseCSV<GitHubEvent>(csvText);
  
  const memberEvents = allEvents.filter(
    (e) => e.project_id === projectId && e.event_type === 'team_member'
  );
  
  return memberEvents.map((e) => {
    try {
      const propsStr = e.properties || '{}';
      const props = JSON.parse(propsStr);
      return {
        project_id: projectId,
        member_id: props.member_id || '',
        name: props.name || '',
        role: props.role || '',
        avatar: props.avatar || '',
        tasks_assigned: Number(props.tasks_assigned) || 0,
        tasks_completed: Number(props.tasks_completed) || 0,
        tasks_due_today: Number(props.tasks_due_today) || 0,
        current_task: props.current_task || '',
        prs_pending: Number(props.prs_pending) || 0,
        reviews_pending: Number(props.reviews_pending) || 0,
      };
    } catch (err) {
      console.error('Failed to parse team member properties:', e.properties, err);
      return {
        project_id: projectId,
        member_id: '',
        name: '',
        role: '',
        avatar: '',
        tasks_assigned: 0,
        tasks_completed: 0,
        tasks_due_today: 0,
        current_task: '',
        prs_pending: 0,
        reviews_pending: 0,
      };
    }
  });
}

/**
 * Load weekly commit counts for a specific project
 */
export async function loadWeeklyCommitsByProject(projectId: string): Promise<WeeklyCommit[]> {
  const csvText = await fetchCSV('/data/github_events.csv');
  const allEvents = parseCSV<GitHubEvent>(csvText);
  
  const weeklyEvents = allEvents.filter(
    (e) => e.project_id === projectId && e.event_type === 'weekly_commits'
  );
  
  return weeklyEvents.map((e) => {
    try {
      const propsStr = e.properties || '{}';
      const props = JSON.parse(propsStr);
      return {
        project_id: projectId,
        week_start: props.week_start || '',
        week_end: props.week_end || '',
        commits_count: Number(props.commits_count) || 0,
      };
    } catch (err) {
      console.error('Failed to parse weekly commits properties:', e.properties, err);
      return {
        project_id: projectId,
        week_start: '',
        week_end: '',
        commits_count: 0,
      };
    }
  });
}

/**
 * Load burndown data for a specific project
 */
export async function loadBurndownByProject(projectId: string): Promise<BurndownData[]> {
  const csvText = await fetchCSV('/data/github_events.csv');
  const allEvents = parseCSV<GitHubEvent>(csvText);
  
  const burndownEvents = allEvents.filter(
    (e) => e.project_id === projectId && e.event_type === 'burndown'
  );
  
  return burndownEvents.map((e) => {
    try {
      const propsStr = e.properties || '{}';
      const props = JSON.parse(propsStr);
      return {
        project_id: projectId,
        sprint_name: props.sprint_name || '',
        day: props.day || '',
        date: props.date || '',
        total_tasks: Number(props.total_tasks) || 0,
        remaining_tasks: Number(props.remaining_tasks) || 0,
      };
    } catch (err) {
      console.error('Failed to parse burndown properties:', e.properties, err);
      // Return empty object to avoid breaking the app
      return {
        project_id: projectId,
        sprint_name: '',
        day: '',
        date: '',
        total_tasks: 0,
        remaining_tasks: 0,
      };
    }
  }).filter(item => item.day !== ''); // Filter out failed parses
}

// ========================================
// Asana Data Loaders
// ========================================

export interface AsanaTask {
  gid: string;
  created_at: string;
  resource_type: string;
  action: string;
  created_by: string;
  project_id: string;
  task_name?: string;
  assignee?: string;
  status?: string;
  from_status?: string;
  to_status?: string;
  is_automation: boolean;
}

export async function loadAsanaTasksByProject(projectId: string): Promise<AsanaTask[]> {
  const csvText = await fetchCSV('/data/asana_events.csv');
  const allEvents = parseCSV<{ gid: string; created_at: string; resource_type: string; action: string; created_by: string; project_id: string; details: string }>(csvText);
  
  const projectEvents = allEvents.filter((e) => e.project_id === projectId);
  
  return projectEvents.map((e) => {
    try {
      let detailsStr = e.details || '{}';
      
      // Fix common JSON issues in the CSV data
      // First, unescape any escaped quotes
      detailsStr = detailsStr.replace(/\\"/g, '"');
      
      // Handle property names that might be missing quotes
      detailsStr = detailsStr.replace(/([{,])\s*\\?([a-zA-Z_][a-zA-Z0-9_]*)\\?\s*:/g, '$1"$2":');
      
      // Handle unquoted values (but not if already quoted or if it's a number/boolean/null)
      detailsStr = detailsStr.replace(/:\s*([^,}\[\]"\s][^,}\[\]]*?)\s*([,}])/g, (match, value, ending) => {
        const trimmed = value.trim();
        // Don't quote numbers, booleans, null, or already quoted strings
        if (trimmed.match(/^(\d+(\.\d+)?|true|false|null)$/)) return `: ${trimmed}${ending}`;
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) return `: ${trimmed}${ending}`;
        // Escape any internal quotes and wrap in quotes
        const escaped = trimmed.replace(/"/g, '\\"');
        return `: "${escaped}"${ending}`;
      });
      
      const details = JSON.parse(detailsStr);
      
      // Handle different status field formats in CSV:
      // - direct: { "status": "in_progress" }
      // - field update: { "field": "status", "new": "in_progress" }
      let status = details.status || details.new_status;
      if (!status && details.field === 'status' && details.new) {
        status = details.new;
      }
      
      return {
        gid: e.gid,
        created_at: e.created_at,
        resource_type: e.resource_type,
        action: e.action,
        created_by: e.created_by,
        project_id: e.project_id,
        task_name: details.task_name || details.name,
        assignee: details.assignee,
        status: status,
        from_status: details.from_status,
        to_status: details.to_status || (details.field === 'status' ? details.new : undefined),
        is_automation: e.created_by.toLowerCase().includes('bot'),
      };
    } catch (err) {
      console.error('Failed to parse Asana task details:', e.details, err);
      return {
        gid: e.gid,
        created_at: e.created_at,
        resource_type: e.resource_type,
        action: e.action,
        created_by: e.created_by,
        project_id: e.project_id,
        is_automation: e.created_by.toLowerCase().includes('bot'),
      };
    }
  });
}

// ========================================
// Jira Data Loaders
// ========================================

export interface JiraIssue {
  issue_id: string;
  issue_key: string;
  created_at: string;
  event_type: string;
  actor: string;
  from_status: string;
  to_status: string;
  project_id: string;
  summary?: string;
  severity?: string;
  priority?: string;
  comment?: string;
  resolution?: string;
  is_automation: boolean;
}

export async function loadJiraIssuesByProject(projectId: string): Promise<JiraIssue[]> {
  const csvText = await fetchCSV('/data/jira_events.csv');
  const allEvents = parseCSV<{ issue_id: string; issue_key: string; created_at: string; event_type: string; actor: string; from_status: string; to_status: string; project_id: string; fields: string }>(csvText);
  
  const projectEvents = allEvents.filter((e) => e.project_id === projectId);
  
  return projectEvents.map((e) => {
    try {
      let fieldsStr = e.fields || '{}';
      
      // Fix common JSON issues in the CSV data
      // First, unescape any escaped quotes
      fieldsStr = fieldsStr.replace(/\\"/g, '"');
      
      // Handle property names that might be missing quotes
      fieldsStr = fieldsStr.replace(/([{,])\s*\\?([a-zA-Z_][a-zA-Z0-9_]*)\\?\s*:/g, '$1"$2":');
      
      // Handle unquoted values (but not if already quoted or if it's a number/boolean/null)
      fieldsStr = fieldsStr.replace(/:\s*([^,}\[\]"\s][^,}\[\]]*?)\s*([,}])/g, (match, value, ending) => {
        const trimmed = value.trim();
        // Don't quote numbers, booleans, null, or already quoted strings
        if (trimmed.match(/^(\d+(\.\d+)?|true|false|null)$/)) return `: ${trimmed}${ending}`;
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) return `: ${trimmed}${ending}`;
        // Escape any internal quotes and wrap in quotes
        const escaped = trimmed.replace(/"/g, '\\"');
        return `: "${escaped}"${ending}`;
      });
      
      const fields = JSON.parse(fieldsStr);
      return {
        issue_id: e.issue_id,
        issue_key: e.issue_key,
        created_at: e.created_at,
        event_type: e.event_type,
        actor: e.actor,
        from_status: e.from_status,
        to_status: e.to_status,
        project_id: e.project_id,
        summary: fields.summary,
        severity: fields.severity,
        priority: fields.priority,
        comment: fields.comment,
        resolution: fields.resolution,
        is_automation: e.actor.toLowerCase().includes('automation'),
      };
    } catch (err) {
      console.error('Failed to parse Jira issue fields:', e.fields, err);
      return {
        issue_id: e.issue_id,
        issue_key: e.issue_key,
        created_at: e.created_at,
        event_type: e.event_type,
        actor: e.actor,
        from_status: e.from_status,
        to_status: e.to_status,
        project_id: e.project_id,
        is_automation: e.actor.toLowerCase().includes('automation'),
      };
    }
  });
}

// ========================================
// Zapier Data Loaders
// ========================================

export interface ZapierWorkflow {
  id: string;
  created_at: string;
  zap_name: string;
  trigger_app: string;
  action_app: string;
  status: 'success' | 'failure';
  task_usage: number;
  project_id: string;
  execution_time_ms?: number;
  error_message?: string;
}

export async function loadZapierWorkflowsByProject(projectId: string): Promise<ZapierWorkflow[]> {
  const csvText = await fetchCSV('/data/zapier_events.csv');
  const allEvents = parseCSV<{ id: string; created_at: string; zap_name: string; trigger_app: string; action_app: string; status: string; task_usage: string; project_id: string; metadata: string }>(csvText);
  
  const projectEvents = allEvents.filter((e) => e.project_id === projectId);
  
  return projectEvents.map((e) => {
    try {
      let metadataStr = e.metadata || '{}';
      
      // Fix common JSON issues in the CSV data
      // First, unescape any escaped quotes
      metadataStr = metadataStr.replace(/\\"/g, '"');
      
      // Handle property names that might be missing quotes
      metadataStr = metadataStr.replace(/([{,])\s*\\?([a-zA-Z_][a-zA-Z0-9_]*)\\?\s*:/g, '$1"$2":');
      
      // Handle unquoted values (but not if already quoted or if it's a number/boolean/null)
      metadataStr = metadataStr.replace(/:\s*([^,}\[\]"\s][^,}\[\]]*?)\s*([,}])/g, (match, value, ending) => {
        const trimmed = value.trim();
        // Don't quote numbers, booleans, null, or already quoted strings
        if (trimmed.match(/^(\d+(\.\d+)?|true|false|null)$/)) return `: ${trimmed}${ending}`;
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) return `: ${trimmed}${ending}`;
        // Escape any internal quotes and wrap in quotes
        const escaped = trimmed.replace(/"/g, '\\"');
        return `: "${escaped}"${ending}`;
      });
      
      const metadata = JSON.parse(metadataStr);
      return {
        id: e.id,
        created_at: e.created_at,
        zap_name: e.zap_name,
        trigger_app: e.trigger_app,
        action_app: e.action_app,
        status: e.status as 'success' | 'failure',
        task_usage: Number(e.task_usage) || 0,
        project_id: e.project_id,
        execution_time_ms: metadata.execution_time_ms,
        error_message: metadata.error_message,
      };
    } catch (err) {
      console.error('Failed to parse Zapier workflow metadata:', e.metadata, err);
      return {
        id: e.id,
        created_at: e.created_at,
        zap_name: e.zap_name,
        trigger_app: e.trigger_app,
        action_app: e.action_app,
        status: e.status as 'success' | 'failure',
        task_usage: Number(e.task_usage) || 0,
        project_id: e.project_id,
      };
    }
  });
}

// ========================================
// HubSpot Data Loaders
// ========================================

export interface HubSpotEvent {
  event_id: string;
  occurred_at: string;
  object_type: string;
  event_action: string;
  source: 'workflow' | 'manual';
  object_id: string;
  project_id: string;
  workflow_name?: string;
  template?: string;
  company_size?: string;
  device?: string;
  subject?: string;
  link?: string;
  role?: string;
  tags_added?: number;
  status?: string;
}

export async function loadHubSpotEventsByProject(projectId: string): Promise<HubSpotEvent[]> {
  const csvText = await fetchCSV('/data/hubspot_events.csv');
  const allEvents = parseCSV<{ event_id: string; occurred_at: string; object_type: string; event_action: string; source: string; object_id: string; project_id: string; properties: string }>(csvText);
  
  const projectEvents = allEvents.filter((e) => e.project_id === projectId);
  
  return projectEvents.map((e) => {
    try {
      let propsStr = e.properties || '{}';
      
      // Fix common JSON issues in the CSV data
      // First, unescape any escaped quotes
      propsStr = propsStr.replace(/\\"/g, '"');
      
      // Handle property names that might be missing quotes
      propsStr = propsStr.replace(/([{,])\s*\\?([a-zA-Z_][a-zA-Z0-9_]*)\\?\s*:/g, '$1"$2":');
      
      // Handle unquoted values (but not if already quoted or if it's a number/boolean/null)
      propsStr = propsStr.replace(/:\s*([^,}\[\]"\s][^,}\[\]]*?)\s*([,}])/g, (match, value, ending) => {
        const trimmed = value.trim();
        // Don't quote numbers, booleans, null, or already quoted strings
        if (trimmed.match(/^(\d+(\.\d+)?|true|false|null)$/)) return `: ${trimmed}${ending}`;
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) return `: ${trimmed}${ending}`;
        // Escape any internal quotes and wrap in quotes
        const escaped = trimmed.replace(/"/g, '\\"');
        return `: "${escaped}"${ending}`;
      });
      
      const props = JSON.parse(propsStr);
      return {
        event_id: e.event_id,
        occurred_at: e.occurred_at,
        object_type: e.object_type,
        event_action: e.event_action,
        source: e.source as 'workflow' | 'manual',
        object_id: e.object_id,
        project_id: e.project_id,
        workflow_name: props.workflow_name,
        template: props.template,
        company_size: props.company_size,
        device: props.device,
        subject: props.subject,
        link: props.link,
        role: props.role,
        tags_added: props.tags_added,
        status: props.status,
      };
    } catch (err) {
      console.error('Failed to parse HubSpot event properties:', e.properties, err);
      return {
        event_id: e.event_id,
        occurred_at: e.occurred_at,
        object_type: e.object_type,
        event_action: e.event_action,
        source: e.source as 'workflow' | 'manual',
        object_id: e.object_id,
        project_id: e.project_id,
      };
    }
  });
}

// ========================================
// Microsoft 365 Data Loaders
// ========================================

export interface M365Activity {
  activity_id: string;
  activity_time: string;
  workload: 'Teams' | 'Outlook' | 'OneDrive';
  activity_type: string;
  user_type: 'user' | 'service';
  resource_id: string;
  project_id: string;
  participant_count?: number;
  duration_minutes?: number;
  subject?: string;
  recipients?: string[];
  file_name?: string;
  file_size_mb?: number;
  action?: string;
}

export async function loadM365ActivitiesByProject(projectId: string): Promise<M365Activity[]> {
  const csvText = await fetchCSV('/data/microsoft365_events.csv');
  const allEvents = parseCSV<{ activity_id: string; activity_time: string; workload: string; activity_type: string; user_type: string; resource_id: string; project_id: string; additional_data: string }>(csvText);
  
  const projectEvents = allEvents.filter((e) => e.project_id === projectId);
  
  return projectEvents.map((e) => {
    try {
      let dataStr = e.additional_data || '{}';
      
      // Fix common JSON issues in the CSV data
      // First, unescape any escaped quotes
      dataStr = dataStr.replace(/\\"/g, '"');
      
      // Handle property names that might be missing quotes
      dataStr = dataStr.replace(/([{,])\s*\\?([a-zA-Z_][a-zA-Z0-9_]*)\\?\s*:/g, '$1"$2":');
      
      // Handle unquoted values (but not if already quoted or if it's a number/boolean/null)
      dataStr = dataStr.replace(/:\s*([^,}\[\]"\s][^,}\[\]]*?)\s*([,}])/g, (match, value, ending) => {
        const trimmed = value.trim();
        // Don't quote numbers, booleans, null, or already quoted strings
        if (trimmed.match(/^(\d+(\.\d+)?|true|false|null)$/)) return `: ${trimmed}${ending}`;
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) return `: ${trimmed}${ending}`;
        // Escape any internal quotes and wrap in quotes
        const escaped = trimmed.replace(/"/g, '\\"');
        return `: "${escaped}"${ending}`;
      });
      
      const data = JSON.parse(dataStr);
      return {
        activity_id: e.activity_id,
        activity_time: e.activity_time,
        workload: e.workload as 'Teams' | 'Outlook' | 'OneDrive',
        activity_type: e.activity_type,
        user_type: e.user_type as 'user' | 'service',
        resource_id: e.resource_id,
        project_id: e.project_id,
        participant_count: data.participant_count,
        duration_minutes: data.duration_minutes,
        subject: data.subject,
        recipients: data.recipients ? data.recipients.split('|') : undefined,
        file_name: data.file_name,
        file_size_mb: data.file_size_mb,
        action: data.action,
      };
    } catch (err) {
      console.error('Failed to parse M365 activity data:', e.additional_data, err);
      return {
        activity_id: e.activity_id,
        activity_time: e.activity_time,
        workload: e.workload as 'Teams' | 'Outlook' | 'OneDrive',
        activity_type: e.activity_type,
        user_type: e.user_type as 'user' | 'service',
        resource_id: e.resource_id,
        project_id: e.project_id,
      };
    }
  });
}

// ========================================
// Project Analytics Loader
// ========================================

export interface AIToolUsage {
  tool: string;
  hours: number;
}

export interface IntegrationSavings {
  hubspot: number;
  asana: number;
  microsoft365: number;
  zapier: number;
}

export interface Task {
  task_name: string;
  start_date: string;
  end_date: string;
}

export interface JiraTicket {
  type: 'bug' | 'non-bug';
}

export interface TimeLog {
  date: string;
  hours_logged: number;
}

export interface ProjectAnalytics {
  project_id: string;
  project_name: string;
  category: string;
  planned_hours: number;
  actual_hours: number;
  ai_hours_used: number;
  ai_time_saved_hours: number;
  ai_time_saved_percent: number;
  tasks_automated_count: number;
  ai_tool_usage: AIToolUsage[];
  integration_savings: IntegrationSavings;
  tasks: Task[];
  jira_tickets: JiraTicket[];
  time_logs: TimeLog[];
  notes: string;
}

export async function loadProjectAnalytics(projectId: string): Promise<ProjectAnalytics | null> {
  const csvText = await fetchCSV('/data/projects-analytics.csv');
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) return null;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Format: id,name,category,"json_data"
    const match = line.match(/^([^,]+),([^,]+),([^,]+),(.+)$/);
    if (!match) continue;
    
    const id = match[1].trim();
    if (id !== projectId) continue;
    
    const name = match[2].trim();
    const category = match[3].trim();
    const jsonData = match[4].trim();
    
    try {
      // Remove outer quotes if present
      let cleanJson = jsonData.startsWith('"') && jsonData.endsWith('"') 
        ? jsonData.slice(1, -1) 
        : jsonData;
      
      // Unescape double quotes
      cleanJson = cleanJson.replace(/""/g, '"');
      
      // Parse the JSON data
      const data = JSON.parse(cleanJson);
      
      return {
        project_id: id,
        project_name: name,
        category,
        planned_hours: data.planned_hours || 0,
        actual_hours: data.actual_hours || 0,
        ai_hours_used: data.ai_hours_used || 0,
        ai_time_saved_hours: data.ai_time_saved_hours || 0,
        ai_time_saved_percent: data.ai_time_saved_percent || 0,
        tasks_automated_count: data.tasks_automated_count || 0,
        ai_tool_usage: data.ai_tool_usage || [],
        integration_savings: data.integration_savings || { hubspot: 0, asana: 0, microsoft365: 0, zapier: 0 },
        tasks: data.tasks || [],
        jira_tickets: data.jira_tickets || [],
        time_logs: data.time_logs || [],
        notes: data.notes || '',
      };
    } catch (err) {
      console.error('Failed to parse project analytics JSON:', err);
      return null;
    }
  }
  
  return null;
}
