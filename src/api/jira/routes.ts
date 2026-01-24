// src/api/jira/routes.ts
// API routes for Jira multi-tenant integration
import express, { Request, Response } from 'express';
import { jiraAuth } from './auth.js';

const router = express.Router();

// Debug middleware - log all requests to this router
router.use((req, res, next) => {
  console.log('[Jira Router] Incoming request:', req.method, req.path, req.url);
  console.log('[Jira Router] sessionID:', req.sessionID);
  console.log('[Jira Router] session.jiraStoreKey:', req.session?.jiraStoreKey);
  next();
});

// OAuth routes
router.get('/auth/connect', jiraAuth.login);
router.get('/auth/callback', jiraAuth.callback);

// Disconnect/logout route
router.post('/auth/disconnect', (req: Request, res: Response) => {
  jiraAuth.disconnect(req);
  res.json({ success: true, message: 'Jira account disconnected' });
});

// Check connection status
router.get('/auth/status', (req: Request, res: Response) => {
  const connected = jiraAuth.isConnected(req);
  const siteInfo = jiraAuth.getSiteInfo(req);
  const availableSites = req.session?.jiraAccessibleResources || [];
  
  console.log('[Jira Auth Status] Connected:', connected);
  console.log('[Jira Auth Status] Available sites in session:', availableSites.length);
  if (availableSites.length > 0) {
    console.log('[Jira Auth Status] Sites:', availableSites.map((s: any) => ({ id: s.id, name: s.name })));
  }
  
  res.json({ 
    connected,
    site: siteInfo,
    availableSites: availableSites.map((s: any) => ({ id: s.id, name: s.name, url: s.url })),
  });
});

// Switch to a different Jira site
router.post('/auth/switch-site/:siteId', (req: Request, res: Response) => {
  const { siteId } = req.params;
  const availableSites = req.session?.jiraAccessibleResources || [];
  const targetSite = availableSites.find((s: any) => s.id === siteId);
  
  console.log('[Jira Router] Switch site request, siteId:', siteId);
  console.log('[Jira Router] Available sites:', availableSites.map((s: any) => s.id));
  console.log('[Jira Router] Target site found:', !!targetSite, targetSite?.name);
  
  if (!targetSite) {
    console.error('[Jira Router] Site not found:', siteId);
    return res.status(404).json({ error: 'Site not found or not accessible' });
  }
  
  // Update session to use this site
  req.session.jiraCloudId = targetSite.id;
  console.log('[Jira Router] Updated jiraCloudId to:', req.session.jiraCloudId);
  
  req.session.save((err) => {
    if (err) {
      console.error('[Jira Router] Error saving session:', err);
      return res.status(500).json({ error: 'Failed to save session' });
    }
    console.log('[Jira Router] Session saved successfully');
    res.json({ 
      success: true, 
      site: { id: targetSite.id, name: targetSite.name, url: targetSite.url }
    });
  });
});

// Fetch issues for a specific project (multi-tenant)
router.get('/issues', async (req: Request, res: Response) => {
  // Prevent caching of this endpoint
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    console.log('[Jira Issues] Request received, sessionID:', req.sessionID);
    const projectKey = req.query.projectKey as string;
    console.log('[Jira Issues] projectKey:', projectKey);
    
    if (!projectKey) {
      console.log('[Jira Issues] Missing project key');
      return res.status(400).json({ error: 'Project key is required' });
    }

    // Get user's access token and cloudId
    const accessToken = await jiraAuth.getAccessToken(req);
    const cloudId = jiraAuth.getCloudId(req);
    
    console.log('[Jira Issues] accessToken:', accessToken ? 'EXISTS' : 'NULL');
    console.log('[Jira Issues] cloudId:', cloudId);
    
    if (!accessToken || !cloudId) {
      console.log('[Jira Issues] Not authenticated');
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please connect your Jira account first',
        requiresAuth: true,
      });
    }

    // Fetch issues from Jira Cloud API - use /rest/api/3/search/jql (required endpoint)
    const jql = `project = ${projectKey}`;
    const fields = 'key,summary,created,duedate,description,priority,status,assignee,issuetype,customfield_10015';
    const searchUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=100&fields=${encodeURIComponent(fields)}`;
    
    console.log('[Jira Issues] Search URL:', searchUrl);
    console.log('[Jira Issues] JQL:', jql);
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    console.log('[Jira Issues] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Jira Issues] Fetch issues failed:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch Jira issues',
        details: errorText 
      });
    }

    const data = await response.json() as any;
    console.log('[Jira Issues] Received', data.issues?.length || 0, 'issues');
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
        key: issue.key || "-",
        issueType: fields.issuetype?.name || "-",
        summary: fields.summary || "-",
        description: extractDescription(fields.description),
        priority: fields.priority?.name || "-",
        status: fields.status?.name || "-",
        assignee: fields.assignee?.displayName || "Unassigned",
        team: projectKey,
        created,
        due,
        duration,
        start: startDate,
        customfield_10015: fields.customfield_10015 || null,
      };
    });

    console.log('[Jira Issues] Formatted', issues.length, 'issues');
    console.log('[Jira Issues] Sending response...');
    res.json({ issues });
    console.log('[Jira Issues] Response sent!');
  } catch (err) {
    console.error('[Jira Issues] Error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch Jira issues',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// Check if authentication is working
router.get('/test-auth', async (req: Request, res: Response) => {
  try {
    console.log('[Jira Test Auth] Testing authentication...');
    const accessToken = await jiraAuth.getAccessToken(req);
    const cloudId = jiraAuth.getCloudId(req);
    
    console.log('[Jira Test Auth] accessToken exists:', !!accessToken);
    console.log('[Jira Test Auth] cloudId:', cloudId);
    
    if (!accessToken || !cloudId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Use the correct Jira Cloud API format with cloudId
    const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/myself`;
    
    console.log('[Jira Test Auth] Calling:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    
    console.log('[Jira Test Auth] Response status:', response.status);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Jira Test Auth] Failed:', response.status, data);
      return res.status(response.status).json({ error: 'Auth token invalid', details: data });
    }
    
    console.log('[Jira Test Auth] Success! User:', data.displayName);
    res.json({ success: true, user: data.displayName, accountId: data.accountId });
  } catch (err) {
    console.error('[Jira Test Auth] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// Fetch list of projects (multi-tenant)
router.get('/projects', async (req: Request, res: Response) => {
  try {
    console.log('[Jira Projects] Request received, sessionID:', req.sessionID);
    
    // Get user's access token and cloudId
    const accessToken = await jiraAuth.getAccessToken(req);
    const cloudId = jiraAuth.getCloudId(req);
    
    console.log('[Jira Projects] accessToken:', accessToken ? 'EXISTS' : 'NULL');
    console.log('[Jira Projects] cloudId:', cloudId);
    console.log('[Jira Projects] accessToken value (first 20 chars):', accessToken ? accessToken.substring(0, 20) : 'null');
    
    if (!accessToken || !cloudId) {
      console.log('[Jira Projects] Not authenticated');
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please connect your Jira account first',
        requiresAuth: true,
      });
    }

    // Fetch projects from Jira Cloud API using correct OAuth format with cloudId
    // Use /rest/api/2/project which works with read:jira-work scope
    const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/2/project`;
    
    console.log('[Jira Projects] Fetching from:', url);
    console.log('[Jira Projects] Authorization header:', `Bearer ${accessToken.substring(0, 20)}...`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    console.log('[Jira Projects] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Jira API] Fetch projects failed:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch Jira projects',
        details: errorText 
      });
    }

    const data = await response.json() as any;
    console.log('[Jira Projects] Raw data type:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('[Jira Projects] Raw data length/keys:', Array.isArray(data) ? data.length : Object.keys(data).length);
    
    // API v2 /project returns direct array or paginated response
    const projectArray = Array.isArray(data) ? data : (data.values || data.projects || []);
    console.log('[Jira Projects] Project array length:', projectArray.length);
    
    const projects = projectArray.map((p: any) => ({
      id: p.id,
      key: p.key,
      title: p.name,
      description: p.description || '',
      avatar: p.avatarUrls?.['48x48'] || '',
    }));

    console.log('[Jira Projects] Formatted projects:', projects.length);
    console.log('[Jira Projects] Sending response...');
    res.json({ projects });
    console.log('[Jira Projects] Response sent!');
  } catch (err) {
    console.error('[Jira API] Error fetching projects:', err);
    res.status(500).json({ 
      error: 'Failed to fetch Jira projects',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// Helper function to extract description
function extractDescription(desc: any): string {
  if (!desc) return "";
  if (typeof desc === "string") return desc;
  if (Array.isArray(desc)) return desc.join(" ");
  if (desc.content) {
    const parts: string[] = [];
    const walk = (nodes: any[]): void => {
      nodes.forEach((node: any) => {
        if (node.text) parts.push(node.text);
        if (node.content) walk(node.content);
      });
    };
    walk(desc.content);
    return parts.join(" ").trim();
  }
  return "";
}

export default router;
