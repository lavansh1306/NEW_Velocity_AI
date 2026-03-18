import express, { Request, Response } from 'express';
import * as db from './db.js';
import { ensureLeaveTypesExist, ensureLeaveBalancesExist } from '../leave/provisioning.js';

const router = express.Router();

router.use((req, _res, next) => {
  console.log('[Invites Router] Request:', req.method, req.path, 'sessionID:', req.sessionID);
  next();
});

// Create/generate an invite code for an organization (server-side only)
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { organizationId, role } = req.body;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    const createdBy = (req.session as any)?.userId || null;
    const inviteCode = await db.createInviteForOrganization(organizationId, createdBy, role || 'employee');
    if (!inviteCode) return res.status(500).json({ error: 'Failed to create invite' });

    // Auto-create default leave types for this organization (idempotent)
    try {
      await ensureLeaveTypesExist(organizationId);
    } catch (ltErr) {
      console.warn('[Invites Router] Non-blocking: failed to create leave types:', ltErr);
    }

    res.json({ success: true, inviteCode });
  } catch (err) {
    console.error('[Invites Router] create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List invites for an organization
router.get('/list/:orgId', async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    if (!orgId) return res.status(400).json({ error: 'orgId required' });
    const invites = await db.getInviteForOrg(orgId);
    res.json({ invites });
  } catch (err) {
    console.error('[Invites Router] list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join using invite code (server-side)
router.post('/join', async (req: Request, res: Response) => {
  try {
    const { code, userId, email, displayName } = req.body;
    if (!code || !userId) return res.status(400).json({ error: 'code and userId are required' });

    const result = await db.joinWithInviteCodeServer(code, userId, email, displayName);
    if (!result) return res.status(400).json({ error: 'Invalid invite or join failed' });

    // Auto-assign leave balances for the joining employee (idempotent)
    try {
      await ensureLeaveBalancesExist(result.organizationId, userId);
    } catch (lbErr) {
      console.warn('[Invites Router] Non-blocking: failed to create leave balances:', lbErr);
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Invites Router] join error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
