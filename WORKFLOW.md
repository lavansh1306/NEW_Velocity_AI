# Velocity AI — System Workflow & Architecture

This document describes the end-to-end data flow of Velocity AI: from user login through Jira data ingestion, normalization, Supabase persistence, portal display, and ML-powered insights.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Login & Authentication Flow](#2-login--authentication-flow)
3. [Jira Connection & Data Ingestion](#3-jira-connection--data-ingestion)
4. [Data Normalization](#4-data-normalization)
5. [Supabase Persistence](#5-supabase-persistence)
6. [Portal Display (React Dashboard)](#6-portal-display-react-dashboard)
7. [ML Pipeline](#7-ml-pipeline)
8. [End-to-End Sequence Diagram](#8-end-to-end-sequence-diagram)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Browser (React SPA)                     │
│  main.tsx → App.tsx → AuthProvider → Route Components   │
└────────────────────┬────────────────────────────────────┘
                     │  /api/* (Vite proxy → Express)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Express Server  (server.ts)                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ /api/jira/* │  │ /api/ml/*    │  │ /api/leave-    │ │
│  │ OAuth +     │  │ Proxy →      │  │  approval/*    │ │
│  │ Issues/     │  │ Python ML    │  │ Weighted       │ │
│  │ Projects    │  │ Engine       │  │ Scoring        │ │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘ │
│         │                │                   │          │
│  ┌──────▼──────┐  ┌──────▼───────┐  ┌───────▼────────┐ │
│  │  Supabase   │  │ Python FastAPI│  │  Google Gemini │ │
│  │ PostgreSQL  │  │ (Render)      │  │  (Skill Match) │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Key source files:**

| File | Purpose |
|------|---------|
| `src/main.tsx` | React DOM root — mounts `<App />` |
| `src/App.tsx` | Router, `QueryClientProvider`, `AuthProvider`, all page routes |
| `src/contexts/AuthContext.tsx` | Supabase auth state, org membership, all sign-in methods |
| `src/lib/supabase.ts` | Supabase browser client |
| `src/api/jira/auth.ts` | Jira OAuth 2.0 PKCE implementation (server-side) |
| `src/api/jira/db.ts` | Multi-tenant Supabase writes (projects, issues, tokens) |
| `src/lib/jiraDbClient.ts` | Client-side Supabase reads + live-API fallback |
| `src/lib/normalizers/jira.ts` | Raw Jira rows → `NormalizedEvent[]` |
| `src/lib/metrics.ts` | Project health score (schedule 40% + resource 30% + risk 20% + quality 10%) |
| `src/services/mlService.ts` | ML engine client, fallback logic, request helpers |
| `server.ts` | Standalone Express entry (local dev & self-host) |
| `api/index.ts` | Vercel serverless entry (same Express app) |

---

## 2. Login & Authentication Flow

Velocity AI supports three sign-in methods, all managed through **Supabase Auth**.

### 2a. Email / Password

```
User fills Login form (/login)
        │
        ▼
AuthContext.signIn(email, password)
        │
        ▼
supabase.auth.signInWithPassword({ email, password })
        │   Supabase validates credentials, issues JWT
        ▼
onAuthStateChange fires (event = "SIGNED_IN")
        │
        ▼
lookupOrg(user.id)
  └─ SELECT org_id, role, organizations.name
     FROM organization_members
     WHERE user_id = <userId>
  └─ Stores orgId, orgRole, orgName in context + localStorage
        │
        ▼
AuthContext exposes { user, session, orgId, orgRole, orgName }
React Router redirects to /dashboard or /velocity-ai
```

### 2b. Google OAuth

```
User clicks "Continue with Google"
        │
        ▼
AuthContext.signInWithGoogle()
  └─ supabase.auth.signInWithOAuth({ provider: 'google',
       redirectTo: window.origin + '/auth/callback' })
        │
        ▼
Browser redirected to Google consent screen
        │  (user approves)
        ▼
Google redirects back to /auth/callback with code
        │
        ▼
AuthCallback page: Supabase exchanges code for session
        │
        ▼
onAuthStateChange fires (event = "SIGNED_IN")
  └─ saves email to oauth_users table (deduped by unique constraint)
  └─ lookupOrg(user.id)  ← same org resolution as email flow
        │
        ▼
React Router navigates to /dashboard
```

### 2c. Jira OAuth 2.0 (Connect Jira Workspace)

This is a separate flow that *links* an already-authenticated Supabase user to an Atlassian Cloud site.

```
User clicks "Connect Jira" on dashboard
        │
        ▼
AuthContext.signInWithJira()
  └─ window.location.href = /api/jira/auth/connect?supabaseUserId=<uid>
        │
        ▼
Express: GET /api/jira/auth/connect  (src/api/jira/auth.ts)
  1. Generate PKCE pair  (code_verifier + code_challenge, SHA-256)
  2. Store code_verifier in session
  3. Redirect → https://auth.atlassian.com/authorize
     ?client_id=...&redirect_uri=...&code_challenge=...&scope=...
        │
        ▼
User approves on Atlassian consent screen
        │
        ▼
Atlassian → GET /api/jira/auth/callback?code=<auth_code>
  1. Exchange code for access_token + refresh_token (PKCE)
  2. GET https://api.atlassian.com/oauth/token/accessible-resources
     → get cloud_id, site name/URL
  3. Upsert jira_connections row in Supabase
     (org_id, cloud_id, access_token, refresh_token, expires_at, site_name)
  4. Upsert org in organizations table; add user to organization_members
  5. Store token in session
  6. Redirect back to React app (/velocity-ai or /projects)
        │
        ▼
AuthContext.refreshOrg() → re-fetches org membership
React app now has orgId, can fetch Jira data
```

---

## 3. Jira Connection & Data Ingestion

Once authenticated and Jira-connected, the app fetches project and issue data.

```
React component mounts (e.g. JiraDashboard.tsx)
        │
        ▼
jiraDbClient.fetchProjectsHybrid()        (src/lib/jiraDbClient.ts)
  │
  ├─ 1st attempt: READ from Supabase jira_projects WHERE org_id = <orgId>
  │     └─ if rows found → return immediately (cached)
  │
  └─ 2nd attempt (fallback): GET /api/jira/projects?orgId=<orgId>
          │
          ▼
     Express: GET /api/jira/projects  (src/api/jira/routes.ts)
       1. Load token from Supabase jira_connections (by org_id)
       2. Refresh token if expired (POST to Atlassian token endpoint)
       3. GET https://api.atlassian.com/ex/jira/<cloudId>/rest/api/3/project
       4. Transform response into DBJiraProject shape
       5. Upsert into supabase.jira_projects  (src/api/jira/db.ts)
       6. Return project list to client
```

The same hybrid pattern applies to issues:

```
jiraDbClient.fetchIssuesHybrid(projectKey)
  │
  ├─ Try Supabase first: SELECT * FROM jira_issues
  │   WHERE org_id = <orgId> AND project_key = <key>
  │
  └─ Fallback: GET /api/jira/issues?projectKey=<key>&orgId=<orgId>
          │
          ▼
     Express: GET /api/jira/issues
       1. Calls Jira REST API: /rest/api/3/search  (JQL filter)
       2. Maps each issue to DBJiraIssue shape
       3. Upserts into supabase.jira_issues
       4. Returns issues array
```

---

## 4. Data Normalization

Normalization happens at two levels.

### 4a. Server-side DB mapping  (`src/api/jira/db.ts` → `mapDBRow`)

Raw Jira REST API fields are renamed to the app's snake_case schema before being stored in Supabase:

| Jira API field | Supabase column |
|----------------|-----------------|
| `fields.issuetype.name` | `issue_type` |
| `fields.summary` | `summary` |
| `fields.priority.name` | `priority` |
| `fields.status.name` | `status` |
| `fields.assignee.displayName` | `assignee` |
| `fields.assignee.emailAddress` | `assignee_email` |
| `fields.timetracking.originalEstimateSeconds` | `original_estimate_seconds` |
| `fields.duedate` | `due_date` |
| `fields.customfield_10015` | `custom_start` (sprint start) |
| `fields.customfield_10016` | `story_points` |
| `fields.parent.key` | `parent_key` |
| `fields.epic.key` | `epic_key` |

### 4b. Client-side read mapping  (`src/lib/jiraDbClient.ts` → `mapDBRow`)

When the browser reads from Supabase, DB column names are re-mapped to the camelCase `JiraIssueFromDB` interface used throughout the React components:

```
DB column          →  JiraIssueFromDB field
─────────────────────────────────────────────
issue_key          →  key
issue_type         →  issueType
assignee_email     →  assigneeEmail
original_estimate  →  originalEstimate
time_spent_seconds →  timeSpentSeconds
created_date       →  created
due_date           →  due
custom_start       →  customfield_10015
story_points       →  storyPoints
```

### 4c. ROI / Event normalization  (`src/lib/normalizers/jira.ts`)

For ROI calculations, raw Jira activity rows (from CSV or API) are normalized into a unified `NormalizedEvent` structure used by `metrics.ts`:

```typescript
// Input (RawJiraRow)
{ event_type: 'transition', actor: 'automation', created_at: '...', project_id: '...' }

// Output (NormalizedEvent)
{
  timestamp: '...',
  app: 'Jira',
  actionType: 'automation',   // 'automation' if actor starts with 'auto'
  source: 'automation',
  units: 1,
  avgManualMinutes: 2,        // lookup by event_type
  projectId: '...',
}
```

---

## 5. Supabase Persistence

### Database Tables

| Table | Contents | Written by |
|-------|----------|-----------|
| `organizations` | Org name, created_at | `src/api/jira/auth.ts` (OAuth callback) |
| `organization_members` | user_id, org_id, role | `src/api/jira/auth.ts` |
| `jira_connections` | org_id, cloud_id, access/refresh tokens, site_name | `src/api/jira/auth.ts` |
| `jira_projects` | Per-org Jira project metadata | `src/api/jira/db.ts → upsertProjects` |
| `jira_issues` | Per-org Jira issue data (normalized) | `src/api/jira/db.ts → upsertIssues` |
| `oauth_users` | Email + provider for Google OAuth users | `src/contexts/AuthContext.tsx` |
| `waitlist` | Email waitlist entries | `api/waitlist.ts` |

### Token Lifecycle

```
Jira token in Supabase jira_connections
        │
        ▼  (every API call)
Express checks token.expires_at < now
  ├─ NOT expired → use access_token directly
  └─ EXPIRED → POST /oauth/token (grant_type=refresh_token)
                 └─ Upsert new token back to Supabase
                 └─ Continue API call with fresh token
```

All server-side Supabase operations use the **service role key** (bypasses Row-Level Security). The browser client uses the **anon key** with RLS enforced.

---

## 6. Portal Display (React Dashboard)

### Application Bootstrap

```
index.html  →  src/main.tsx  →  <App />
                                    │
                    ┌───────────────┤
                    │               │
              QueryClientProvider  AuthProvider
              (React Query cache)  (Supabase session)
                    │               │
                    └───────┬───────┘
                            │
                       BrowserRouter
                            │
                    ┌───────┴───────────────┐
                    │       Routes          │
                    ├── /login              │
                    ├── /signup             │
                    ├── /auth/callback      │
                    ├── /dashboard          │ ← AI Insights
                    ├── /velocity-ai        │ ← Main tabbed dashboard
                    ├── /projects           │ ← Project list + health scores
                    ├── /projects/:id       │ ← Project detail + Gantt
                    ├── /projects/jira-dashboard  │
                    ├── /progress           │ ← Smart progress tracker
                    ├── /roi-calculator     │
                    └── /audit              │ ← Formula audit
```

### Health Score Calculation  (`src/lib/metrics.ts`)

Displayed on the Projects page per project:

```
calculateProjectHealthScore(issues, startDate, endDate)
  │
  ├── Schedule Performance (40%)
  │     completion rate vs expected pace → predict overrun days
  │
  ├── Resource Health (30%)
  │     per-assignee hours / 40h baseline → utilization bands
  │
  ├── Risk Assessment (20%)
  │     -8pts per blocked issue
  │     -4pts per unresolved high/critical priority
  │     -2pts per dependency-tagged issue
  │
  └── Quality Metrics (10%)
        bug ratio bands + test-coverage label bonus
  │
  └─► Weighted sum → score 0–100
```

### Data Flow to Components

```
Component mounts
      │
      ▼
jiraDbClient.fetchProjectsHybrid() / fetchIssuesHybrid()
      │
      ├── Supabase cache hit → data available instantly
      │
      └── API miss → Express → Jira REST → Supabase write → return data
      │
      ▼
State set (useState / React Query)
      │
      ▼
calculateProjectHealthScore(issues)
      │
      ▼
Render: ProjectCard, IssuesTable, GanttChart, AIInsightsDashboard
```

---

## 7. ML Pipeline

### Overview

```
React component (e.g. ProjectCheckDashboard, RecommendationEngine)
        │
        ▼
src/services/mlService.ts
  ├── checkMLEngineHealth()        GET  /api/ml/health  (cached 60s)
  ├── analyzeAvailability(task, candidates)
  │     POST /api/ml/analyze-availability
  ├── analyzeBottlenecks(task, candidates)
  │     POST /api/ml/analyze-bottlenecks
  ├── analyzeCapacity(candidates)
  │     POST /api/ml/analyze-capacity
  └── trainModel(rec_id, emp_id, reward)
        POST /api/ml/train
        │
        ▼ (production — avoids CORS)
Express proxy  api/ml.ts  /  src/api/deployed/routes.ts
        │
        ▼
Python FastAPI engine  (https://python-ml-engine-xlwh.onrender.com)
  ├── POST /api/v1/analyze/availability  → AvailabilityReport[]
  ├── POST /api/v1/analyze/bottlenecks   → BottleneckReport
  ├── POST /api/v1/analyze/capacity      → CapacityReport[]
  └── POST /api/v1/train                 → TrainResponse (RL update)
```

### ML Input Preparation

```
Jira issues (JiraIssueFromDB[])
        │
        ▼
mlService.transformJiraToML(issue)  →  MLTask
  {
    id:              issue.key,
    title:           issue.summary,
    skills_required: extractSkillsFromJira(issue),   // keyword map
    priority:        mapJiraPriority(issue.priority), // → low/medium/high/critical
    complexity:      estimateComplexityNumber(issue), // 0–3 from description keywords
    deadline_hours:  issue.timeestimate / 3600,
  }

Employee CSV / manual data  →  MLCandidate[]
  {
    id, name, skills[], role_level, current_load,
    availability_hours, base_productive_hours,
    pto_hours_this_week, holiday_hours_this_week,
  }
```

### ML Endpoints Detail

| Endpoint | Input | Output | Used for |
|----------|-------|--------|----------|
| `POST /api/v1/analyze/availability` | `{ task: MLTask, candidates: MLCandidate[] }` | `AvailabilityReport[]` — `is_eligible`, `match_score`, `matched_skills`, `missing_skills` | Recommendation engine: who can work on this task? |
| `POST /api/v1/analyze/bottlenecks` | `{ task: MLTask, candidates: MLCandidate[] }` | `BottleneckReport` — `overloaded_skills`, `system_strain_score`, `health_status` | Team health dashboard |
| `POST /api/v1/analyze/capacity` | `{ candidates: MLCandidate[] }` | `CapacityReport[]` — `net_available_hours = base - pto - holidays` | Capacity planning tab |
| `POST /api/v1/train` | `{ recommendation_id, selected_employee_id, actual_reward }` | `TrainResponse` | Reinforcement learning feedback loop |

### Reinforcement Learning Feedback Loop

```
Manager reviews ML recommendation
        │
        ├─ Accepts recommendation  →  actual_reward = 1.0
        └─ Overrides with different employee  →  actual_reward = 0.0–0.5
        │
        ▼
mlService.trainModel(rec_id, emp_id, reward)
        │
        ▼
POST /api/v1/train → Python RL model update
  └─ model weights adjusted for future recommendations
```

### Graceful Degradation

When the Python ML engine is offline or times out (30 s timeout):

```
ML engine offline?
        │
        ├─ analyzeAvailability → local skill string matching
        │    (matched skills / total skills × 100 = match_score)
        │
        ├─ analyzeBottlenecks  → { system_strain_score: 0, health_status: 'healthy' }
        │
        └─ analyzeCapacity     → net = base_productive_hours - pto - holidays
```

### Gemini AI — Skill Matching  (`src/api/deployed/routes.ts`)

For higher-accuracy task-to-employee matching, the Express server calls **Google Gemini 1.5 Flash**:

```
POST /api/deployed/match-skill
  body: { task_description, employee_skills[] }
        │
        ▼
Build structured prompt:
  "Does this employee have the right skills for this task?
   Task: <description>
   Skills: <comma-list>
   Return JSON: { match: boolean, confidence: number }"
        │
        ▼
gemini-1.5-flash API call (server-side, GEMINI_API_KEY)
        │
        ▼
Parse JSON response  →  { match, confidence }
Cache result in memory (24 h per unique task+skill combo)
        │
        ▼
Return to React component for display
```

---

## 8. End-to-End Sequence Diagram

```
Browser          AuthContext        Express           Atlassian         Supabase         ML Engine
   │                  │                │                  │                 │                 │
   │──── /login ─────►│                │                  │                 │                 │
   │   email+password  │                │                  │                 │                 │
   │                  │──signInWithPassword──────────────────────────────►  │                 │
   │                  │◄─ JWT session ────────────────────────────────────  │                 │
   │                  │──lookupOrg(uid)───────────────────────────────────► │                 │
   │                  │◄─ org_id, role ───────────────────────────────────  │                 │
   │◄─ auth state ────│                │                  │                 │                 │
   │                  │                │                  │                 │                 │
   │──── Connect Jira ►│                │                  │                 │                 │
   │                  │──/api/jira/auth/connect──────────►│                 │                 │
   │                  │                │──PKCE redirect──►│                 │                 │
   │◄── redirect ──────────────────────── Atlassian consent ─│               │                 │
   │──── approve ──────────────────────────────────────── │                 │                 │
   │                  │                │◄─ code ──────────│                 │                 │
   │                  │                │──exchange code───►│                 │                 │
   │                  │                │◄─ access/refresh ─│                 │                 │
   │                  │                │──upsert token ──────────────────── ►│                 │
   │                  │                │──upsert org ───────────────────────►│                 │
   │◄─ redirect to app ────────────────│                  │                 │                 │
   │                  │                │                  │                 │                 │
   │── fetchProjects ─►│                │                  │                 │                 │
   │                  │── SELECT jira_projects ─────────────────────────── ►│                 │
   │                  │◄─ [] (first visit) ──────────────────────────────── │                 │
   │                  │──GET /api/jira/projects──────────►│                 │                 │
   │                  │                │──GET projects ───►│                 │                 │
   │                  │                │◄─ project list ───│                 │                 │
   │                  │                │──normalize+upsert──────────────────►│                 │
   │◄─ projects ───────────────────────│                  │                 │                 │
   │                  │                │                  │                 │                 │
   │── analyzeML ─────►│                │                  │                 │                 │
   │                  │──POST /api/ml/analyze-availability────────────────────────────────────►│
   │                  │◄─ AvailabilityReport[] ──────────────────────────────────────────────  │
   │◄─ render results ─│                │                  │                 │                 │
   │                  │                │                  │                 │                 │
   │── trainModel ────►│                │                  │                 │                 │
   │                  │──POST /api/ml/train ───────────────────────────────────────────────── ►│
   │                  │◄─ model updated ──────────────────────────────────────────────────────  │
```

---

## Summary

| Phase | Key Files | Technology |
|-------|-----------|-----------|
| **Login** | `AuthContext.tsx`, `Login.tsx`, `AuthCallback.tsx` | Supabase Auth (email, Google OAuth, Jira OAuth 2.0 PKCE) |
| **Jira Connect** | `src/api/jira/auth.ts` | Atlassian OAuth 2.0 + PKCE, Express session |
| **Data Ingestion** | `src/api/jira/routes.ts` | Jira REST API v3, per-org token from Supabase |
| **Normalization** | `src/api/jira/db.ts`, `src/lib/normalizers/jira.ts`, `src/lib/jiraDbClient.ts` | Field mapping, event classification, camelCase conversion |
| **Supabase Persistence** | `src/api/jira/db.ts`, `src/lib/supabase.ts` | PostgreSQL (upsert with org_id scope), RLS |
| **Portal Display** | `src/pages/*`, `src/components/*`, `src/lib/metrics.ts` | React 18, React Query, Recharts, Tailwind CSS |
| **ML Pipeline** | `src/services/mlService.ts`, `api/ml.ts` | Python FastAPI (Render), RL feedback, graceful fallback |
| **AI Skill Match** | `src/api/deployed/routes.ts` | Google Gemini 1.5 Flash, 24 h memory cache |
