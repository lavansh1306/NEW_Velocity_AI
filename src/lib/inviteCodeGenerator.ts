/**
 * Centralized invite code generation — single source of truth.
 * DO NOT duplicate this logic anywhere else.
 */

const VALID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes 0/O, 1/I

/**
 * Generate team invite code: PREFIX-XXXX
 *
 * @example generateInviteCode("Engineering") → "ENGINEER-A3B9"
 * @example generateInviteCode("QA")          → "QAX-P2Q8"
 */
export function generateInviteCode(name: string, maxPrefixLength = 8): string {
  const prefix = (name || 'TEAM')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, maxPrefixLength)
    .padEnd(3, 'X'); // Ensure min 3 chars

  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += VALID_CHARS.charAt(Math.floor(Math.random() * VALID_CHARS.length));
  }
  return `${prefix}-${suffix}`;
}

/** Build the shareable invite link */
export function generateInviteLink(code: string): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.APP_URL || 'https://app.velocityai.com';
  return `${origin}/onboarding/join?code=${code}`;
}

/** Validate code format: 3-8 uppercase alphanum, dash, 4 uppercase alphanum */
export function isValidInviteCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{3,8}-[A-Z0-9]{4}$/.test((code || '').toUpperCase());
}

/** Normalize user input to uppercase trimmed */
export function normalizeInviteCode(code: string): string {
  return (code || '').trim().toUpperCase();
}
