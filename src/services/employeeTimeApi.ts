/**
 * Frontend API client for employee time features.
 * Uses fetch with the Supabase session token for JWT verification.
 * No direct Supabase DB access — all data goes through the backend.
 */

import { apiUrl } from '@/lib/api';
import { supabase } from '@/lib/supabase';

// ---------- Helpers ----------

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

// ---------- Leave Requests ----------

export async function fetchLeaveRequests() {
  const { data } = await apiFetch<{ success: boolean; data: any[] }>(
    '/api/employee/leave-requests',
  );
  return data;
}

export async function submitLeaveRequest(payload: {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}) {
  const { data } = await apiFetch<{ success: boolean; data: any }>(
    '/api/employee/leave-requests',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return data;
}

export async function withdrawLeaveRequest(requestId: string) {
  const { data } = await apiFetch<{ success: boolean; data: any }>(
    `/api/employee/leave-requests/${requestId}/withdraw`,
    { method: 'POST' },
  );
  return data;
}

// ---------- Leave Types ----------

export async function fetchLeaveTypes() {
  const { data } = await apiFetch<{ success: boolean; data: any[] }>(
    '/api/employee/leave-types',
  );
  return data;
}

// ---------- Leave Balances ----------

export async function fetchLeaveBalances() {
  const { data } = await apiFetch<{ success: boolean; data: any[] }>(
    '/api/employee/leave-balances',
  );
  return data;
}

// ---------- Holidays ----------

export async function fetchHolidays() {
  const { data } = await apiFetch<{ success: boolean; data: any[] }>(
    '/api/employee/holidays',
  );
  return data;
}

// ---------- Timesheets ----------

export async function fetchTimesheetEntries(start: string, end: string) {
  const { data } = await apiFetch<{ success: boolean; data: any[] }>(
    `/api/employee/timesheets?start=${start}&end=${end}`,
  );
  return data;
}

export async function upsertTimesheetEntry(payload: any) {
  const { data } = await apiFetch<{ success: boolean; data: any }>(
    '/api/employee/timesheets/upsert',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return data;
}

export async function submitTimesheet(start: string, end: string) {
  const { data } = await apiFetch<{ success: boolean; data: any }>(
    '/api/employee/timesheets/submit',
    {
      method: 'POST',
      body: JSON.stringify({ start, end }),
    },
  );
  return data;
}
