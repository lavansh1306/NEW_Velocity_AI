/**
 * Authentication API routes.
 * Provides endpoints for auth-related operations that require JWT verification.
 */

import express, { Request, Response } from 'express';
import { verifySupabaseToken } from '../authMiddleware.js';
import * as db from './db.js';

const router = express.Router();

// Protect all routes on this router
router.use(verifySupabaseToken);

// Debug logging
router.use((req, _res, next) => {
  console.log('[Auth Router]', req.method, req.path);
  next();
});

// ---------- User Organization Lookup ----------

/**
 * GET /api/auth/lookup-org
 * Returns the current user's organization details.
 * Requires valid Supabase JWT in Authorization header.
 * The auth middleware verifies the token and attaches authUserId to res.locals.
 */
router.get('/lookup-org', async (_req: Request, res: Response) => {
  try {
    const { authUserId } = res.locals;

    const orgDetails = await db.getUserOrgDetails(authUserId);

    res.json({
      success: true,
      data: orgDetails,
    });
  } catch (err: any) {
    console.error('[Auth] GET lookup-org error:', err?.message || err);
    
    // Distinguish between "user not found" and other errors
    if (err?.message?.includes('no organization')) {
      res.status(403).json({ 
        error: 'User not associated with any organization',
        details: err.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to look up organization',
        details: err?.message 
      });
    }
  }
});

export default router;
