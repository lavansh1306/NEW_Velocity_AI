import { Router, Request, Response } from 'express';
import { verifySupabaseToken } from '../authMiddleware.js';
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  getHolidays,
  addHoliday,
  deleteHoliday,
  searchOrganizations,
  findOrgByEmailDomain,
  getTeamsForOrg,
  regenerateTeamInviteCode
} from './db.js';
import { generateInviteCode } from '../../lib/inviteCodeGenerator.js';

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

// --- Organization Search (duplicate prevention) ---

router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length < 2) {
      return res.json({ organizations: [] });
    }
    const results = await searchOrganizations(q);
    res.json({ organizations: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Search failed' });
  }
});

router.get('/check-domain', async (req: Request, res: Response) => {
  try {
    const domain = req.query.domain as string;
    if (!domain) return res.json({ org: null });
    const org = await findOrgByEmailDomain(domain);
    res.json({ org });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Domain check failed' });
  }
});

// --- Team Management ---

router.get('/teams', async (req: Request, res: Response) => {
  try {
    const { organizationId } = res.locals;
    const teams = await getTeamsForOrg(organizationId);
    res.json({ teams });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch teams' });
  }
});

router.post('/teams/:teamId/regenerate-invite', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const teamName = req.body.teamName || 'TEAM';
    const newCode = generateInviteCode(teamName);
    const team = await regenerateTeamInviteCode(teamId as string, newCode);
    res.json({ success: true, team });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to regenerate invite code' });
  }
});

export default router;
