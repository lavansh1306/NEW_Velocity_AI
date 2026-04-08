/**
 * Client-side organization context.
 * Stores the current user's active org_id so that all Supabase
 * queries are automatically scoped to the correct organization.
 *
 * Set once after login (from AuthContext), read by jiraDbClient
 * and other services that need tenant isolation.
 */

let _currentOrgId: string | null = null;

export function setCurrentOrgId(orgId: string | null) {
  // PRO-LEVEL VALIDATION: Ensure it's not null, 'undefined', or a malformed non-UUID string
  if (orgId && orgId !== 'undefined' && orgId !== 'null' && orgId.length >= 10) {
    _currentOrgId = orgId;
    localStorage.setItem('velocity_org_id', orgId);
  } else {
    _currentOrgId = null;
    localStorage.removeItem('velocity_org_id');
  }
}

export function getCurrentOrgId(): string | null {
  if (_currentOrgId && _currentOrgId !== 'undefined' && _currentOrgId !== 'null') return _currentOrgId;
  // Hydrate from localStorage on first access
  const stored = localStorage.getItem('velocity_org_id');
  if (stored === 'undefined' || stored === 'null' || !stored) {
    _currentOrgId = null;
    return null;
  }
  _currentOrgId = stored;
  return _currentOrgId;
}

export function clearCurrentOrg() {
  _currentOrgId = null;
  localStorage.removeItem('velocity_org_id');
  localStorage.removeItem('velocity_org_role');
  localStorage.removeItem('velocity_org_name');
}

// --- Org role (owner / manager / employee) ---

export function setCurrentOrgRole(role: string | null) {
  if (role) localStorage.setItem('velocity_org_role', role);
  else localStorage.removeItem('velocity_org_role');
}

export function getCurrentOrgRole(): string | null {
  return localStorage.getItem('velocity_org_role');
}

// --- Org name ---

export function setCurrentOrgName(name: string | null) {
  if (name) localStorage.setItem('velocity_org_name', name);
  else localStorage.removeItem('velocity_org_name');
}

export function getCurrentOrgName(): string | null {
  return localStorage.getItem('velocity_org_name');
}
