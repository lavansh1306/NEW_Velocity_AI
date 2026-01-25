import { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  // Clear Jira cookies
  res.setHeader('Set-Cookie', [
    'jira_access_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    'jira_cloud_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    'jira_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    'jira_code_verifier=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
  ]);

  res.json({ 
    success: true, 
    message: 'Jira account disconnected' 
  });
}
