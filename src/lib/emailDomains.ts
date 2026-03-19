/**
 * Email domain utilities for duplicate organization prevention.
 */

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'me.com', 'mac.com',
  'yahoo.co.uk', 'yahoo.co.in',
  'aol.com', 'protonmail.com', 'proton.me',
  'zoho.com', 'mail.com', 'gmx.com',
  'tutanota.com', 'fastmail.com', 'hey.com', 'pm.me',
  'mail.ru', 'yandex.ru', 'qq.com', '163.com', '126.com',
]);

/** Extract domain from email (lowercase) */
export function getEmailDomain(email: string): string {
  if (!email || !email.includes('@')) return '';
  return email.split('@')[1]?.toLowerCase()?.trim() || '';
}

/** True if the email belongs to a free/personal provider */
export function isPersonalEmail(email: string): boolean {
  return PERSONAL_DOMAINS.has(getEmailDomain(email));
}
