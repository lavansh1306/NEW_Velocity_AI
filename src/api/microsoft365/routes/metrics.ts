// src/api/microsoft365/routes/metrics.ts
import express, { Request, Response } from 'express';
import * as graph from '../graphClient';

const router = express.Router();

// GET /api/microsoft365/metrics/meetings
router.get('/meetings', async (req: Request, res: Response) => {
  try {
    const meetings = await graph.getOnlineMeetings(req);
    res.json({ meetings });
  } catch (err: any) {
    console.error('meetings error', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/microsoft365/metrics/email
router.get('/email', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || 'D30';
    const report = await graph.getEmailActivityReport(req, period);
    res.json({ report });
  } catch (err: any) {
    console.error('email error', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/microsoft365/metrics/chat
router.get('/chat', async (req: Request, res: Response) => {
  try {
    const chats = await graph.getChats(req);
    res.json({ chats });
  } catch (err: any) {
    console.error('chat error', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/microsoft365/metrics/focus
// Note: Viva Insights APIs require special consent and may not be available to delegated tokens.
router.get('/focus', async (req: Request, res: Response) => {
  try {
    // Placeholder: Graph doesn't surface 'focus hours' directly without Viva endpoints.
    res.json({ message: 'Focus metrics may be available via Viva Insights (separate API).' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
