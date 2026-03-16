/**
 * Supabase JWT verification middleware for Express routes.
 *
 * Usage:
 *   import { verifySupabaseToken } from '../authMiddleware.js';
 *   router.use(verifySupabaseToken);   // protects every route on this router
 *
 * After this middleware runs successfully, res.locals contains:
 *   - authUserId:       string   (Supabase auth user id)
 *   - authUserEmail:    string | undefined
 *   - organizationId:   string   (looked up from the users table)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';

// ---------- Singleton server-side Supabase client ----------
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    console.warn('[AuthMiddleware] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }
  _client = createClient(url, key);
  return _client;
}

// ---------- Middleware ----------

export async function verifySupabaseToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  const client = getClient();
  if (!client) {
    res.status(500).json({ error: 'Server misconfiguration — Supabase client unavailable' });
    return;
  }

  try {
    // Verify the JWT and get the authenticated user
    const { data, error } = await client.auth.getUser(token);

    if (error || !data?.user) {
      console.warn('[AuthMiddleware] Token verification failed:', error?.message);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const authUserId = data.user.id;
    const authUserEmail = data.user.email;

    // Look up the user's organization_id from the users table
    const { data: userRow, error: userError } = await client
      .from('users')
      .select('organization_id')
      .eq('id', authUserId)
      .maybeSingle();

    if (userError) {
      console.error('[AuthMiddleware] Failed to look up user org:', userError.message);
      res.status(500).json({ error: 'Failed to resolve user organization' });
      return;
    }

    if (!userRow || !userRow.organization_id) {
      res.status(403).json({ error: 'User is not associated with any organization' });
      return;
    }

    // Attach verified identity to the response locals
    res.locals.authUserId = authUserId;
    res.locals.authUserEmail = authUserEmail;
    res.locals.organizationId = userRow.organization_id;

    console.log(`[AuthMiddleware] Resolved: User=${authUserId}, Email=${authUserEmail}, Org=${userRow.organization_id}`);

    next();
  } catch (err: any) {
    console.error('[AuthMiddleware] Unexpected error:', err?.message || err);
    res.status(500).json({ error: 'Authentication error' });
  }
}
