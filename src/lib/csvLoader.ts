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

  const headers = lines[0].split(',').map((h) => h.trim());
  const projectDataMap: Record<string, Record<string, any>> = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Find the data column (last column contains JSON)
    const commaCount = (line.match(/,/g) || []).length;
    let parts: string[] = [];
    
    if (commaCount === headers.length - 1) {
      // Normal case: split by comma
      parts = line.split(',').map((v) => v.trim());
    } else {
      // Data column contains commas, parse carefully
      const firstCommaIndex = line.indexOf(',');
      const secondCommaIndex = line.indexOf(',', firstCommaIndex + 1);
      const thirdCommaIndex = line.indexOf(',', secondCommaIndex + 1);
      
      const project_id = line.substring(0, firstCommaIndex).trim();
      const project_name = line.substring(firstCommaIndex + 1, secondCommaIndex).trim();
      const category = line.substring(secondCommaIndex + 1, thirdCommaIndex).trim();
      const data = line.substring(thirdCommaIndex + 1).trim();
      
      parts = [project_id, project_name, category, data];
    }

    const project_id = parts[0];
    const project_name = parts[1];
    const category = parts[2];
    const jsonData = parts[3];

    try {
      const parsedData = JSON.parse(jsonData);
      projectDataMap[project_id] = {
        project_id,
        project_name,
        category,
        ...parsedData,
      };
    } catch (error) {
      console.error(`Failed to parse JSON for project ${project_id}:`, error);
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
