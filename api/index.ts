// API Health Check
import { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  res.status(200).json({ status: 'ok', message: 'Velocity AI API is running' });
}
