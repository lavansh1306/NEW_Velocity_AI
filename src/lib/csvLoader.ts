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
