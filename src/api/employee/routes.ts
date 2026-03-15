/**
 * Express routes for employee time-related features.
 * All routes are protected by JWT verification via verifySupabaseToken.
 * The middleware attaches authUserId and organizationId to res.locals.
 */

import express, { Request, Response } from 'express';
import { verifySupabaseToken } from '../authMiddleware.js';
import * as db from './db.js';

const router = express.Router();

// Protect all routes on this router
router.use(verifySupabaseToken);

// Debug logging
router.use((req, _res, next) => {
  console.log('[Employee Router]', req.method, req.path);
  next();
});

// ---------- Leave Requests ----------

// GET /api/employee/leave-requests
router.get('/leave-requests', async (_req: Request, res: Response) => {
  try {
    const { authUserId, organizationId } = res.locals;
    const data = await db.getLeaveRequests(organizationId, authUserId);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[Employee] GET leave-requests error:', err?.message || err);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// POST /api/employee/leave-requests
router.post('/leave-requests', async (req: Request, res: Response) => {
  try {
    const { authUserId, organizationId } = res.locals;
    const { leave_type_id, start_date, end_date, reason } = req.body;

    if (!leave_type_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'leave_type_id, start_date, and end_date are required' });
    }

    const data = await db.createLeaveRequest({
      organization_id: organizationId,
      user_id: authUserId,
      leave_type_id,
      start_date,
      end_date,
      reason,
    });

    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[Employee] POST leave-requests error:', err?.message || err);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// POST /api/employee/leave-requests/:id/withdraw
router.post('/leave-requests/:id/withdraw', async (req: Request, res: Response) => {
  try {
    const { authUserId } = res.locals;
    const requestId = req.params.id as string;

    const data = await db.withdrawLeaveRequest(requestId, authUserId);
    res.json({ success: true, data });
  } catch (err: any) {
    const message = err?.message || 'Failed to withdraw leave request';
    const status = message.includes('Not authorized') || message.includes('not found') ? 403 : 500;
    console.error('[Employee] POST withdraw error:', message);
    res.status(status).json({ error: message });
  }
});

// ---------- Leave Types ----------

// GET /api/employee/leave-types
router.get('/leave-types', async (_req: Request, res: Response) => {
  try {
    const { organizationId } = res.locals;
    const data = await db.getLeaveTypes(organizationId);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[Employee] GET leave-types error:', err?.message || err);
    res.status(500).json({ error: 'Failed to fetch leave types' });
  }
});

// ---------- Leave Balances ----------

// GET /api/employee/leave-balances
router.get('/leave-balances', async (_req: Request, res: Response) => {
  try {
    const { authUserId, organizationId } = res.locals;
    const data = await db.getLeaveBalances(organizationId, authUserId);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[Employee] GET leave-balances error:', err?.message || err);
    res.status(500).json({ error: 'Failed to fetch leave balances' });
  }
});

// ---------- Holidays ----------

// GET /api/employee/holidays
router.get('/holidays', async (_req: Request, res: Response) => {
  try {
    const { organizationId } = res.locals;
    console.log(`[Employee Routes] Fetching holidays for Org: ${organizationId}`);
    const data = await db.getHolidays(organizationId);
    console.log(`[Employee Routes] Found ${data.length} holidays`);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[Employee] GET holidays error:', err?.message || err);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// ---------- Timesheets ----------

// GET /api/employee/timesheets?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/timesheets', async (req: Request, res: Response) => {
  try {
    const { authUserId, organizationId } = res.locals;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates are required' });
    }

    const data = await db.getTimesheetEntries(organizationId, authUserId, start as string, end as string);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[Employee] GET timesheets error:', err?.message || err);
    res.status(500).json({ error: 'Failed to fetch timesheets' });
  }
});

// POST /api/employee/timesheets/upsert
router.post('/timesheets/upsert', async (req: Request, res: Response) => {
  try {
    const { authUserId, organizationId } = res.locals;
    const payload = req.body;

    // Ensure user ownership and org scoping
    const data = await db.upsertTimesheetEntry({
      ...payload,
      user_id: authUserId,
      organization_id: organizationId,
    });

    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[Employee] POST timesheets/upsert error:', err?.message || err);
    res.status(500).json({ error: 'Failed to save timesheet entry' });
  }
});

// POST /api/employee/timesheets/submit
router.post('/timesheets/submit', async (req: Request, res: Response) => {
  try {
    const { authUserId, organizationId } = res.locals;
    const { start, end } = req.body;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates are required' });
    }

    const data = await db.bulkUpdateStatus(organizationId, authUserId, start as string, end as string, 'Submitted');
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[Employee] POST timesheets/submit error:', err?.message || err);
    res.status(500).json({ error: 'Failed to submit timesheet' });
  }
});

export default router;
