import { Request, Response } from 'express';
import fetch from 'node-fetch';

export default async function handler(req: Request, res: Response) {
  try {
    // Extract siteId from the URL path
    // For Vercel, the path will be like /api/jira/auth/switch-site/[siteId]
    const siteId = req.query.siteId as string || req.url?.split('/').pop();

    console.log('[Switch Site] Request for siteId:', siteId);
    console.log('[Switch Site] Query:', req.query);
    console.log('[Switch Site] URL:', req.url);

    if (!siteId) {
      console.error('[Switch Site] No siteId provided');
      return res.status(400).json({ error: 'Site ID is required' });
    }

    // Get token from cookie
    const token = req.cookies?.jira_access_token || 
                  req.headers.cookie?.split('; ').find((row: string) => row.startsWith('jira_access_token='))?.split('=')[1];

    console.log('[Switch Site] Token exists:', !!token);

    if (!token) {
      console.error('[Switch Site] No token found');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Fetch accessible resources to verify the site is accessible
    const resourcesRes = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('[Switch Site] Resources response:', resourcesRes.status);

    if (!resourcesRes.ok) {
      console.error('[Switch Site] Failed to fetch resources:', resourcesRes.status);
      return res.status(resourcesRes.status).json({ error: 'Failed to fetch Jira resources' });
    }

    const resources = await resourcesRes.json() as any[];
    console.log('[Switch Site] Available resources:', resources.map((r: any) => ({ id: r.id, name: r.name })));
    
    const targetSite = resources.find((r: any) => r.id === siteId);

    console.log('[Switch Site] Target site found:', !!targetSite, targetSite?.name);

    if (!targetSite) {
      console.error('[Switch Site] Site not found:', siteId);
      return res.status(404).json({ error: 'Site not found or not accessible' });
    }

    // Store the selected cloudId in a cookie
    console.log('[Switch Site] Setting cookie for cloudId:', targetSite.id);
    res.setHeader('Set-Cookie', 
      `jira_cloud_id=${targetSite.id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${24*60*60}`
    );

    console.log('[Switch Site] Success, switched to:', targetSite.name);
    res.json({ 
      success: true,
      site: {
        id: targetSite.id,
        name: targetSite.name,
        url: targetSite.url,
      }
    });
  } catch (error) {
    console.error('[Jira Switch Site] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
