import { Router, Request, Response } from 'express';
import { verifySupabaseToken } from '../authMiddleware.js';
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  getHolidays,
  addHoliday,
  deleteHoliday
} from './db.js';

const router = Router();

// Protect all organization routes
router.use(verifySupabaseToken);

// --- Organization Settings ---

router.get('/settings', async (req: Request, res: Response) => {
  try {
    const { organizationId } = res.locals;
    const data = await getOrganizationSettings(organizationId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch settings' });
  }
});

router.patch('/settings', async (req: Request, res: Response) => {
  try {
    const { organizationId } = res.locals;
    const data = await updateOrganizationSettings(organizationId, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update settings' });
  }
});

// --- Holidays ---

router.get('/holidays', async (req: Request, res: Response) => {
  try {
    const { organizationId } = res.locals;
    const data = await getHolidays(organizationId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch holidays' });
  }
});

router.post('/holidays', async (req: Request, res: Response) => {
  try {
    const { organizationId } = res.locals;
    const holiday = {
      ...req.body,
      organization_id: organizationId
    };
    const data = await addHoliday(holiday);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add holiday' });
  }
});

router.delete('/holidays/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId } = res.locals;
    const { id } = req.params;
    await deleteHoliday(id as string, organizationId as string);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete holiday' });
  }
});

export default router;
