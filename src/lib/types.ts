// ========================================
// Raw row interfaces — one per CSV source
// ========================================

/**
 * Raw row from jira_events.csv
 */
export interface RawJiraRow {
  issue_id: string;
  issue_key: string;
  created_at: string;
  event_type: string;
  actor: string;
  from_status: string;
  to_status: string;
  project_id: string;
  fields: string; // JSON string
}

/**
 * Raw row from hubspot_events.csv
 */
export interface RawHubSpotRow {
  event_id: string;
  occurred_at: string;
  object_type: string;
  event_action: string;
  source: string;
  object_id: string;
  project_id: string;
  properties: string; // JSON string
}

/**
 * Raw row from microsoft365_events.csv
 */
export interface RawMicrosoft365Row {
  activity_id: string;
  activity_time: string;
  workload: string;
  activity_type: string;
  user_type: string;
  resource_id: string;
  project_id: string;
  additional_data: string; // JSON string
}

// ========================================
// Microsoft 365 Types
// ========================================

export interface Microsoft365AuthStatus {
  authenticated: boolean;
  account?: {
    oid: string;
    upn?: string;
    name?: string;
  };
  tenantId?: string;
}

export interface Microsoft365Meeting {
  id: string;
  subject: string;
  startDateTime: string;
  endDateTime: string;
  attendees?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
}

export interface Microsoft365ROIResult {
  userId: string;
  displayName: string;
  meetingMinutesBefore: number;
  meetingMinutesAfter: number;
  meetingTimeSavedHours: number;
  emailTimeSavedHours: number;
  focusGainHours: number;
  totalTimeSavedHours: number;
  estimatedMoneySaved: number;
}

// ========================================
// HubSpot Types
// ========================================

export type Deal = {
  dealId: string;
  dealName: string;
  amount: number | null;
  stage?: string | null;
  pipeline?: string | null;
  createdAt?: string;
  closeDate?: string;
  contacts?: Contact[];
  companies?: Company[];
};

export type Contact = {
  contactId: string;
  email?: string | null;
  firstname?: string | null;
  lastname?: string | null;
};

export type Company = {
  companyId: string;
  name: string;
  domain?: string;
};

export type Campaign = {
  campaignId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  visits?: number;
  conversions?: number;
};

export type Ticket = {
  ticketId: string;
  subject?: string | null;
  pipeline?: string | null;
  stage?: string | null;
  priority?: string;
  createdAt?: string;
  closedAt?: string;
};

export type RealizationDeal = {
  id: string;
  dealname?: string | null;
  amount?: number;
  timeSaved?: {
    totalHours: number;
  };
  revenuePullForward?: number;
  campaigns?: Campaign[];
  stages?: any[];
};

// ========================================
