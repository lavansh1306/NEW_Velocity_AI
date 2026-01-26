import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  try {
    // Get token from cookie
    const token = req.cookies?.jira_access_token || 
                  req.headers.cookie?.split('; ').find((row: string) => row.startsWith('jira_access_token='))?.split('=')[1];

    console.log('[Jira Projects] Token exists:', !!token);

    if (!token) {
      console.log('[Jira Projects] No token found');
      return res.status(401).json({ error: 'Not authenticated. Please connect Jira first.' });
    }

    // Fetch accessible resources
    const resourcesRes = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('[Jira Projects] Resources response:', resourcesRes.status);

    if (!resourcesRes.ok) {
      console.error('[Jira Projects] Failed to fetch resources:', resourcesRes.status);
      return res.status(resourcesRes.status).json({ error: 'Failed to fetch Jira resources' });
    }

    const resources = await resourcesRes.json();
    console.log('[Jira Projects] Found resources:', resources?.length || 0);
    
    if (!resources || resources.length === 0) {
      console.log('[Jira Projects] No resources available');
      return res.json({ projects: [] });
    }

    // Use stored cloudId from cookie if available, otherwise use first resource
    const cookieCloudId = req.cookies?.jira_cloud_id || 
                          req.headers.cookie?.split('; ').find((row: string) => row.startsWith('jira_cloud_id='))?.split('=')[1];
    
    const cloudId = cookieCloudId || resources[0].id;
    console.log('[Jira Projects] Using cloudId:', cloudId, 'from', cookieCloudId ? 'cookie' : 'first resource');

    // Verify the cloudId exists in accessible resources
    const validResource = resources.find((r: any) => r.id === cloudId);
    if (!validResource) {
      console.error('[Jira Projects] CloudId not found in resources:', cloudId);
      return res.status(400).json({ error: 'Selected Jira site not accessible' });
    }

    // Fetch projects
    const projectsUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`;
    console.log('[Jira Projects] Fetching from:', projectsUrl);

    const projectsRes = await fetch(projectsUrl, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log('[Jira Projects] Projects response:', projectsRes.status);

    if (!projectsRes.ok) {
      const errorText = await projectsRes.text();
      console.error('[Jira Projects] Failed to fetch projects:', projectsRes.status, errorText);
      return res.status(projectsRes.status).json({ error: 'Failed to fetch Jira projects', details: errorText });
    }

    const projects = await projectsRes.json();
    console.log('[Jira Projects] Fetched projects:', projects?.length || 0);

    // Format projects with required fields
    const formattedProjects = (projects || []).map((p: any) => ({
      key: p.key,
      title: p.name || p.key,
      id: p.id,
      name: p.name,
      projectTypeKey: p.projectTypeKey,
      avatarUrls: p.avatarUrls,
    }));

    res.json({ projects: formattedProjects });
  } catch (error) {
    console.error('[Jira Projects] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
