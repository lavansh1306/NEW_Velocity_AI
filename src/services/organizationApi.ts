import { supabase } from '@/lib/supabase';
import { apiUrl } from '@/lib/api';
import { Organization } from '@/types';

const API_BASE_URL = '/api/organization';

/**
 * Helper to fetch with auth token
 */
async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session. Please log in.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  const response = await fetch(apiUrl(path), { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }
  return response.json();
}

/**
 * Organization API Client
 */
export const organizationApi = {
  /**
   * Fetch current organization settings
   */
  async getSettings(): Promise<Organization> {
    return fetchWithAuth(`${API_BASE_URL}/settings`);
  },

  /**
   * Update organization settings
   */
  async updateSettings(settings: Partial<Organization>): Promise<Organization> {
    return fetchWithAuth(`${API_BASE_URL}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },

  /**
   * Fetch holidays for the organization
   */
  async getHolidays(): Promise<any[]> {
    return fetchWithAuth(`${API_BASE_URL}/holidays`);
  },

  /**
   * Add a new holiday
   */
  async addHoliday(holiday: { name: string; date: string }): Promise<any> {
    return fetchWithAuth(`${API_BASE_URL}/holidays`, {
      method: 'POST',
      body: JSON.stringify(holiday),
    });
  },

  /**
   * Delete a holiday
   */
  async deleteHoliday(holidayId: string): Promise<void> {
    return fetchWithAuth(`${API_BASE_URL}/holidays/${holidayId}`, {
      method: 'DELETE',
    });
  },
};
