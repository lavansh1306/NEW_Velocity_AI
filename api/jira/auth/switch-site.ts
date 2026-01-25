import { Request, Response } from 'express';
import fetch from 'node-fetch';

export default async function handler(req: Request, res: Response) {
  try {
    // Extract siteId from the URL path
    // For Vercel, the path will be like /api/jira/auth/switch-site/[siteId]
    const siteId = req.query.siteId as string || req.url?.split('/').pop();

    if (!siteId) {
      return res.status(400).json({ error: 'Site ID is required' });
    }

    // Get token from cookie
    const token = req.cookies?.jira_access_token || 
                  req.headers.cookie?.split('; ').find((row: string) => row.startsWith('jira_access_token='))?.split('=')[1];

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Fetch accessible resources to verify the site is accessible
    const resourcesRes = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resourcesRes.ok) {
      return res.status(resourcesRes.status).json({ error: 'Failed to fetch Jira resources' });
    }

    const resources = await resourcesRes.json() as any[];
    const targetSite = resources.find((r: any) => r.id === siteId);

    if (!targetSite) {
      return res.status(404).json({ error: 'Site not found or not accessible' });
    }

    // Store the selected cloudId in a cookie
    res.setHeader('Set-Cookie', 
      `jira_cloud_id=${targetSite.id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${24*60*60}`
    );

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
