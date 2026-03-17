/**
 * Default leave types auto-created for every new organization.
 * Used when an org is created (onboarding) and when backfilling existing orgs.
 */
export const DEFAULT_LEAVE_TYPES = [
  { name: 'Annual Leave', annual_quota: 20, description: 'Vacation and personal time off' },
  { name: 'Sick Leave', annual_quota: 10, description: 'Medical appointments and illness' },
  { name: 'Personal Leave', annual_quota: 5, description: 'Personal matters and emergencies' },
] as const;
