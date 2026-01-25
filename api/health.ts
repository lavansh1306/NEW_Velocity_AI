// Vercel Serverless API - Simple health check endpoint
import { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  res.status(200).json({ status: 'ok', message: 'API is running' });
}
