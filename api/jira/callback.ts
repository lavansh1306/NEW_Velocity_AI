import { Request, Response } from 'express';
import { handleJiraCallback } from './auth';

export default async function handler(req: Request, res: Response) {
  try {
    await handleJiraCallback(req, res);
  } catch (error) {
    console.error('Callback endpoint error:', error);
    res.status(500).json({ error: 'Failed to complete authentication' });
  }
}
