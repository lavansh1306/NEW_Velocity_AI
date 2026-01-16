// src/api/microsoft365/graphClient.ts
// Minimal Graph client wrappers using session-stored tokens
import fetch from 'node-fetch';
import { Request } from 'express';
import * as auth from './auth';

const GRAPH_BASE: string = 'https://graph.microsoft.com/v1.0';

interface CallGraphOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

async function callGraph(req: Request, path: string, opts: CallGraphOptions = {}): Promise<any> {
  const accessToken = await auth.ensureValidAccessTokenForSession(req);
  const url = path.startsWith('http') ? path : `${GRAPH_BASE}${path}`;
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Graph API error ${res.status}: ${text}`) as any;
    err.status = res.status;
    throw err;
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (jsonErr) {
      throw new Error(`Invalid JSON response from Graph API: ${(jsonErr as Error).message}. Response: ${text.substring(0, 500)}...`);
    }
  }
  return res.text();
}

async function getMe(req: Request): Promise<any> {
  return callGraph(req, '/me');
}

async function getUsers(req: Request): Promise<any> {
  // Returns basic users list; for large tenants paging should be implemented
  return callGraph(req, '/users?$select=id,displayName');
}

async function getUserCalendarEvents(req: Request, userId: string, start: string, end: string): Promise<any> {
  // Use calendarview to fetch events in a time window (ISO 8601)
  const url = `/users/${userId}/calendarView?startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}&$select=subject,start,end,attendees`;
  return callGraph(req, url);
}

async function getOnlineMeetings(req: Request): Promise<any> {
  // /me/onlineMeetings
  return callGraph(req, '/me/onlineMeetings');
}

async function getChats(req: Request): Promise<any> {
  return callGraph(req, '/me/chats');
}

async function getChatMessages(req: Request, chatId: string): Promise<any> {
  return callGraph(req, `/chats/${chatId}/messages`);
}

async function getEmailActivityReport(req: Request, period: string = 'D30'): Promise<any> {
  // Reports API uses a different path
  const path = `${GRAPH_BASE}/reports/getEmailActivityUserDetail(period='${period}')`;
  return callGraph(req, path, { method: 'GET' });
}

export {
  callGraph,
  getMe,
  getUsers,
  getUserCalendarEvents,
  getOnlineMeetings,
  getChats,
  getChatMessages,
  getEmailActivityReport
};
