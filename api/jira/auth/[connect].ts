import { Request, Response } from 'express';
import { handleJiraConnect } from '../auth';

export default async function handler(req: Request, res: Response) {
  try {
    await handleJiraConnect(req, res);
  } catch (error) {
    console.error('Connect endpoint error:', error);
    res.status(500).json({ error: 'Failed to connect to Jira' });
  }
}
