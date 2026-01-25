import { Request, Response } from 'express';
import fetch from 'node-fetch';

export default async function handler(req: Request, res: Response) {
  // Prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const projectKey = req.query.projectKey as string;

    console.log('[Jira Issues] Request for project:', projectKey);

    if (!projectKey) {
      return res.status(400).json({ error: 'Project key is required' });
    }

    // Get token from cookie
    const token = req.cookies?.jira_access_token || 
                  req.headers.cookie?.split('; ').find((row: string) => row.startsWith('jira_access_token='))?.split('=')[1];

    console.log('[Jira Issues] Token exists:', !!token);

    if (!token) {
      console.log('[Jira Issues] No token found');
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please connect your Jira account first',
        requiresAuth: true,
      });
    }

    // Fetch accessible resources to get cloudId
    const resourcesRes = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('[Jira Issues] Resources response:', resourcesRes.status);

    if (!resourcesRes.ok) {
      console.error('[Jira Issues] Failed to fetch resources:', resourcesRes.status);
      return res.status(resourcesRes.status).json({ error: 'Failed to fetch Jira resources' });
    }

    const resources = await resourcesRes.json() as any[];
    console.log('[Jira Issues] Found resources:', resources?.length || 0);
    
    if (!resources || resources.length === 0) {
      console.log('[Jira Issues] No resources available');
      return res.json({ issues: [] });
    }

    // Use cloudId from cookie if available, otherwise use first resource
    const cookieCloudId = req.cookies?.jira_cloud_id || 
                          req.headers.cookie?.split('; ').find((row: string) => row.startsWith('jira_cloud_id='))?.split('=')[1];
    
    const cloudId = cookieCloudId || resources[0].id;
    console.log('[Jira Issues] Using cloudId:', cloudId, 'from', cookieCloudId ? 'cookie' : 'first resource');

    // Fetch issues from Jira
    const jql = `project = ${projectKey}`;
    const fields = 'key,summary,created,duedate,description,priority,status,assignee,issuetype,customfield_10015';
    const searchUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=100&fields=${encodeURIComponent(fields)}`;

    console.log('[Jira Issues] Fetching from:', searchUrl);

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    console.log('[Jira Issues] Issues response:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Jira Issues] Fetch failed:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch Jira issues',
        details: errorText 
      });
    }

    const data = await response.json() as any;
    console.log('[Jira Issues] Raw issues count:', data.issues?.length || 0);
    
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    
    const issues = (data.issues || []).map((issue: any) => {
      const fields = issue.fields || {};
      const created = fields.created || null;
      const due = fields.duedate || null;
      const duration = created && due 
        ? Math.ceil((new Date(due).getTime() - new Date(created).getTime()) / MS_PER_DAY) 
        : "";

      const startDate = fields.customfield_10015 || null;

      return {
        key: issue.key || '-',
        issueType: fields.issuetype?.name || '-',
        summary: fields.summary || '-',
        description: typeof fields.description === 'string' 
          ? fields.description 
          : fields.description?.content 
            ? JSON.stringify(fields.description) 
            : '',
        priority: fields.priority?.name || '-',
        status: fields.status?.name || '-',
        assignee: fields.assignee?.displayName || 'Unassigned',
        team: '-',
        start: startDate || (created ? created.split('T')[0] : null),  // Field name: 'start' not 'startDate'
        due: due,  // Field name: 'due' not 'dueDate'
        duration,
      };
    });

    console.log('[Jira Issues] Formatted issues:', issues.length);
    res.json({ issues });
  } catch (error) {
    console.error('[Jira Issues] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
