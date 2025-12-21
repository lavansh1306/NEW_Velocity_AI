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
      if (char === '"') {
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

  return {
    estimatedTimeSavedHours: totalHours,
    estimatedCostSavedUSD: totalCost,
    hourlyRateUsedUSD: HOURLY_RATE_USD,
    perAppHours,
    perAppReturns,
    totalReturns,
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
