import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  try {
    // Get token from cookie
    const token = req.cookies?.jira_access_token || 
                  req.headers.cookie?.split('; ').find((row: string) => row.startsWith('jira_access_token='))?.split('=')[1];

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated. Please connect Jira first.' });
    }

    // Fetch accessible resources
    const resourcesRes = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resourcesRes.ok) {
      return res.status(resourcesRes.status).json({ error: 'Failed to fetch Jira resources' });
    }

    const resources = await resourcesRes.json();
    
    if (!resources || resources.length === 0) {
      return res.json({ projects: [] });
    }

    const cloudId = resources[0].id;

    // Fetch projects
    const projectsRes = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!projectsRes.ok) {
      return res.status(projectsRes.status).json({ error: 'Failed to fetch Jira projects' });
    }

    const projects = await projectsRes.json();

    res.json({ projects });
  } catch (error) {
    console.error('Error fetching Jira projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
