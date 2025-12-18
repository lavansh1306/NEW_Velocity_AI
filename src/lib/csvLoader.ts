/**
 * CSV parsing utility for loading analytics data
 * Expects CSV with project_id and JSON data column
 */

export async function fetchCSV(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${path}`);
  }
  return response.text();
}

export async function parseProjectCSV(csvText: string): Promise<Record<string, Record<string, any>>> {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return {};

  const projectDataMap: Record<string, Record<string, any>> = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Parse CSV line with quoted JSON data
    // Format: id,name,category,"json_data"
    const match = line.match(/^([^,]+),([^,]+),([^,]+),"(.+)"$/);
    
    if (!match) {
      console.warn(`Skipping invalid line ${i}: ${line}`);
      continue;
    }

    const project_id = match[1].trim();
    const project_name = match[2].trim();
    const category = match[3].trim();
    let jsonDataStr = match[4];

    try {
      // Replace escaped quotes with regular quotes for JSON parsing
      jsonDataStr = jsonDataStr.replace(/""/g, '"');
      const parsedData = JSON.parse(jsonDataStr);
      
      projectDataMap[project_id] = {
        project_id,
        project_name,
        category,
        ...parsedData,
      };
    } catch (error) {
      console.error(`Failed to parse JSON for project ${project_id}:`, error, jsonDataStr);
    }
  }

  return projectDataMap;
}

export async function loadProjectAnalytics(projectId: string) {
  try {
    const csvText = await fetchCSV('/data/projects-analytics.csv');
    const projectDataMap = await parseProjectCSV(csvText);

    const projectData = projectDataMap[projectId];
    if (!projectData) {
      throw new Error(`No data found for project ${projectId}`);
    }

    // Extract analytics with defaults
    return {
      planned_hours: projectData.planned_hours || 0,
      actual_hours: projectData.actual_hours || 0,
      tasks: projectData.tasks || [],
      ai_usage: projectData.ai_usage || [],
      jira_tickets: projectData.jira_tickets || [],
      time_logs: projectData.time_logs || [],
    };
  } catch (error) {
    console.error(`Failed to load analytics for project ${projectId}:`, error);
    throw error;
  }
}

// Helper to try loading additional integration CSVs with the same format
async function tryLoadIntegrationCSV(path: string, projectId: string) {
  try {
    const csvText = await fetchCSV(path);
    const map = await parseProjectCSV(csvText);
    return map[projectId] || null;
  } catch (e) {
    // non-fatal if integration file missing or parse fails
    console.warn(`Integration CSV not available or failed to parse: ${path}`, e);
    return null;
  }
}

// New loader that returns analytics plus possible integration summaries
export async function loadProjectAnalyticsWithIntegrations(projectId: string) {
  const base = await loadProjectAnalytics(projectId);

  // Attempt to load per-integration files (these are optional)
  const [hubspotData, asanaData, msData, zapierData] = await Promise.all([
    tryLoadIntegrationCSV('/data/projects-hubspot.csv', projectId),
    tryLoadIntegrationCSV('/data/projects-asana.csv', projectId),
    tryLoadIntegrationCSV('/data/projects-microsoft365.csv', projectId),
    tryLoadIntegrationCSV('/data/projects-zapier.csv', projectId),
  ]);

  // Map to minimal summaries to keep shape stable
  return {
    ...base,
    hubspot: hubspotData
      ? {
          contacts_count: hubspotData.contacts_count,
          deals_count: hubspotData.deals_count,
          closed_revenue: hubspotData.closed_revenue,
          deals_by_stage: hubspotData.deals_by_stage,
          last_sync: hubspotData.last_sync,
        }
      : undefined,
    asana: asanaData
      ? {
          projects_count: asanaData.projects_count,
          tasks_count: asanaData.tasks_count,
          completed_last_30_days: asanaData.completed_last_30_days,
          last_sync: asanaData.last_sync,
        }
      : undefined,
    microsoft365: msData
      ? {
          mail_count: msData.mail_count,
          calendar_meetings_count: msData.calendar_meetings_count,
          meeting_duration_minutes: msData.meeting_duration_minutes,
          last_sync: msData.last_sync,
        }
      : undefined,
    zapier: zapierData
      ? {
          zaps_count: zapierData.zaps_count,
          active_zaps: zapierData.active_zaps,
          runs_last_30_days: zapierData.runs_last_30_days,
          success_rate: zapierData.success_rate,
          last_sync: zapierData.last_sync,
        }
      : undefined,
  };
}
