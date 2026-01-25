import { Request, Response } from 'express';
import fetch from 'node-fetch';

export default async function handler(req: Request, res: Response) {
  try {
    // Get token from cookie
    const token = req.cookies?.jira_access_token || 
                  req.headers.cookie?.split('; ').find((row: string) => row.startsWith('jira_access_token='))?.split('=')[1];

    if (!token) {
      return res.json({ 
        connected: false,
        site: null,
        availableSites: [],
      });
    }

    // Fetch accessible resources
    const resourcesRes = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resourcesRes.ok) {
      return res.json({ 
        connected: false,
        site: null,
        availableSites: [],
      });
    }

    const resources = await resourcesRes.json() as any[];
    
    if (!resources || resources.length === 0) {
      return res.json({ 
        connected: false,
        site: null,
        availableSites: [],
      });
    }

    // Get current cloudId from cookie, or use first resource
    const cookieCloudId = req.cookies?.jira_cloud_id || 
                          req.headers.cookie?.split('; ').find((row: string) => row.startsWith('jira_cloud_id='))?.split('=')[1];
    
    const currentCloudId = cookieCloudId || resources[0].id;
    const currentSite = resources.find((r: any) => r.id === currentCloudId) || resources[0];

    res.json({ 
      connected: true,
      site: {
        cloudId: currentSite.id,
        name: currentSite.name,
        url: currentSite.url,
      },
      availableSites: resources.map((r: any) => ({
        id: r.id,
        name: r.name,
        url: r.url,
      })),
    });
  } catch (error) {
    console.error('[Jira Status] Error:', error);
    res.json({ 
      connected: false,
      site: null,
      availableSites: [],
    });
  }
}
