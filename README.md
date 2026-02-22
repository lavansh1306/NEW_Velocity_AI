# Velocity AI

<div align="center">

<img src="https://img.shields.io/badge/Frontend-React-blue">
<img src="https://img.shields.io/badge/Language-TypeScript-blue">
<img src="https://img.shields.io/badge/Backend-Node.js-green">
<img src="https://img.shields.io/badge/Backend-Express-black">
<img src="https://img.shields.io/badge/Database-Supabase-3ECF8E">
<img src="https://img.shields.io/badge/UI-TailwindCSS-38B2AC">
<img src="https://img.shields.io/badge/AI-Gemini-orange">
<img src="https://img.shields.io/badge/ML-Python_FastAPI-yellow">
<img src="https://img.shields.io/badge/Build-Vite-purple">
<img src="https://img.shields.io/badge/Deploy-Vercel-black">
<img src="https://img.shields.io/badge/Session-Redis-DC382D">

</div>

---

## Overview

Velocity AI is a project management intelligence platform that connects to Jira via OAuth 2.0 and surfaces AI-driven analytics for engineering teams. It tracks project health, analyzes team capacity, matches employees to tasks based on skill profiles, automates leave approval decisions, and provides ROI reporting — all from a single dashboard.

The platform runs as a React SPA backed by an Express server. An external Python ML engine handles bottleneck detection, availability scoring, and capacity forecasting. Google Gemini AI powers contextual skill-to-task matching.

---

## Features

✔ Jira OAuth 2.0 integration with multi-tenant (multiple Atlassian Cloud sites) support  
✔ User authentication via email/password, Google OAuth, and Jira OAuth (Supabase Auth)  
✔ Project list with per-project health scores and issue metrics  
✔ Jira issues table with assignee and status filtering  
✔ Interactive Gantt chart per project and global cross-project Gantt dashboard  
✔ AI insights dashboard with project health analysis  
✔ Team capacity analysis (productive hours minus PTO and holidays)  
✔ ML-powered bottleneck detection and employee availability/skill matching  
✔ Reinforcement learning feedback loop for improving ML task recommendations  
✔ AI leave approval agent using weighted scoring (employee rating, leave balance, team capacity, absence type)  
✔ Smart progress tracker that parses EOD reports and updates weighted task completion  
✔ ROI calculator and ROI report pages  
✔ Audit page documenting validated formulas (health score, capacity, ROI)  
✔ Waitlist endpoint with Supabase and optional Google Sheets webhook integration  

---

## Architecture

```
Browser (React SPA)
    │
    │  /api/* proxied to Express (dev), Vercel serverless (prod)
    ▼
Express Server (server.ts / api/index.ts)
    ├── /api/jira/*           Jira OAuth 2.0 + issue/project data (Supabase cache)
    ├── /api/leave-approval/* Leave request approval (weighted scoring)
    ├── /api/deployed/*       Gemini AI skill-matching routes
    ├── /api/waitlist         Waitlist capture
    └── /api/ml/*             Proxy → Python ML Engine (Render)
                                  ├── POST /api/v1/analyze/availability
                                  ├── POST /api/v1/analyze/bottlenecks
                                  ├── POST /api/v1/analyze/capacity
                                  └── POST /api/v1/train
    │
    ├── Supabase (PostgreSQL)
    │     organizations, organization_members, jira_connections,
    │     jira_projects, jira_issues, waitlist
    │
    └── Redis (optional session store, falls back to in-memory)
```

**Frontend routes** (React Router):

| Path | Component |
|------|-----------|
| `/` | Landing page |
| `/login` · `/signup` · `/auth/callback` | Authentication |
| `/dashboard` | AI insights dashboard |
| `/velocity-ai` | Main tabbed dashboard (capacity, ROI, activity, leave, ML, Gantt) |
| `/projects` | Project list with health scores |
| `/projects/:id` | Project detail (issues, Gantt) |
| `/projects/jira-dashboard` | Jira issues & Gantt dashboard |
| `/projects/global-gantt` | Cross-project Gantt view |
| `/project-analytics/:id` | Project analytics detail |
| `/progress` | Smart progress tracker |
| `/roi-calculator` · `/roi-report` | ROI tools |
| `/audit` | Formula audit / validation reference |

---

## How It Works

1. A user signs in (email, Google, or Jira OAuth) — auth state is stored in Supabase and exposed via `AuthContext`.
2. On the Jira Dashboard, the frontend calls `/api/jira/auth/status`. If not connected, the user is redirected through the Jira OAuth 2.0 Authorization Code flow (`/api/jira/auth/connect` → Atlassian → `/api/jira/auth/callback`).
3. Once connected, projects and issues are fetched from Jira's REST API and cached in Supabase (`jira_projects`, `jira_issues` tables) via `jiraDbClient.ts`.
4. The project health score is calculated client-side in `lib/metrics.ts` using schedule performance (40%), resource utilization (30%), risk factors (20%), and quality metrics (10%).
5. For ML features, the frontend (via `src/services/mlService.ts`) sends employee and task data to `/api/ml/*` which proxies to the external Python FastAPI engine on Render.
6. For leave approval, the frontend posts leave requests to `/api/leave-approval/approve-single` or `/approve-batch`. The server runs a weighted scoring algorithm (0–100) and returns an approval decision with confidence score.
7. Gemini AI (`gemini-1.5-flash`) is called server-side in `/api/deployed/*` to determine whether an employee's skills match a task description, with results cached in memory.

---

## ML Pipeline

**External ML engine**: `https://python-ml-engine-xlwh.onrender.com`  
**Backend proxy** (avoids CORS in production): `api/ml.ts` (Vercel serverless) and `src/api/deployed/routes.ts`

| Endpoint | Input | Output |
|----------|-------|--------|
| `POST /api/v1/analyze/availability` | `{ task: MLTask, candidates: MLCandidate[] }` | `AvailabilityReport[]` — per-employee eligibility, match score, matched/missing skills |
| `POST /api/v1/analyze/bottlenecks` | `{ task: MLTask, candidates: MLCandidate[] }` | `BottleneckReport` — overloaded skills, system strain score, health status |
| `POST /api/v1/analyze/capacity` | `{ candidates: MLCandidate[] }` | `CapacityReport[]` — net available hours after PTO and holidays |
| `POST /api/v1/train` | `{ recommendation_id, selected_employee_id, actual_reward }` | `TrainResponse` — reinforcement learning update confirmation |

**Graceful degradation**: if the ML engine is offline, `mlService.ts` returns fallback results computed locally (simple skill matching and default capacity estimates). Health checks are cached for 60 seconds to avoid redundant calls.

**Gemini AI** (`src/api/deployed/routes.ts`): On task-to-employee matching requests, the server builds a structured prompt from the task description and employee skill list, calls `gemini-1.5-flash`, and parses the `{ match: boolean, confidence: number }` JSON response. Results are cached in-memory for 24 hours per unique task+skill combination.

---

## Installation

```bash
# Install all dependencies
npm install
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Jira OAuth 2.0
JIRA_OAUTH_CLIENT_ID=your_atlassian_oauth_client_id
JIRA_OAUTH_CLIENT_SECRET=your_atlassian_oauth_client_secret
JIRA_OAUTH_REDIRECT_URI_LOCAL=http://localhost:4000/api/jira/auth/callback
JIRA_OAUTH_REDIRECT_URI_PROD=https://www.joinvelocity.co/api/jira/auth/callback

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Session
SESSION_SECRET=a_random_string_at_least_32_chars

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Server
API_PORT=4000
NODE_ENV=development

# Redis (optional — falls back to in-memory if not set)
REDIS_URL=redis://localhost:6379
```

---

## Running Locally

```bash
# Start the Express API server (port 4000)
npm run api

# In a separate terminal, start the Vite dev server (port 5173)
npm run dev
```

Vite proxies all `/api/*` requests to `http://127.0.0.1:4000`, so the frontend and backend run independently without CORS issues.

**Production build:**

```bash
npm run build          # outputs to dist/
```

Deploy the `dist/` folder as a static site on Vercel. The `api/` directory is deployed as Vercel serverless functions according to `vercel.json`.

---

## Project Structure

```
/
├── src/
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Router and global providers
│   ├── pages/                      # Route-level components
│   │   ├── Index.tsx               # Landing page
│   │   ├── Dashboard.tsx           # AI insights dashboard
│   │   ├── VelocityAI.tsx          # Main tabbed dashboard
│   │   ├── Projects.tsx            # Project list
│   │   ├── JiraDashboard.tsx       # Jira issues + Gantt
│   │   ├── GlobalGanttDashboard.tsx
│   │   ├── ProjectDetailNew.tsx
│   │   ├── PlanMyProject.tsx       # Smart progress tracker
│   │   ├── ROICalculator.tsx
│   │   ├── Login.tsx / SignUp.tsx / AuthCallback.tsx
│   │   └── Audit.tsx
│   ├── components/
│   │   ├── jira/                   # IssuesTable, GanttChart, ManagerGantt, ManagerSummary
│   │   ├── dashboard/              # AIInsightsDashboard, ProjectDashboardWithInsights
│   │   ├── leave-management/       # JiraCapacityMap, ProjectLeaveManagement
│   │   ├── leave-approval/         # LeaveApprovalAgent UI
│   │   ├── ml-model/               # ProjectCheckDashboard, RecommendationEngine
│   │   ├── smart-progress/         # SmartProgressTracker, ProgressAgent
│   │   ├── demo2/                  # VeloHeader, VeloNavTabs, tabbed views
│   │   ├── landing/                # LandingHero, LandingFeatures, etc.
│   │   └── ui/                     # shadcn/ui components (Radix primitives)
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Supabase auth + org membership
│   │   └── ToastContext.tsx
│   ├── hooks/
│   │   └── useJiraData.ts
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client
│   │   ├── jiraDbClient.ts         # Hybrid Jira fetch (API + Supabase cache)
│   │   ├── leaveApprovalAgent.ts   # Weighted scoring leave approval logic
│   │   ├── metrics.ts              # Project health score calculation
│   │   ├── dataService.ts          # Project/metrics data loading
│   │   └── api.ts                  # API URL helper
│   ├── services/
│   │   └── mlService.ts            # ML engine client with fallback
│   └── api/
│       ├── jira/                   # routes.ts, auth.ts, db.ts
│       ├── leave-approval/         # routes.ts
│       └── deployed/               # routes.ts (Gemini AI)
├── api/
│   ├── index.ts                    # Vercel serverless entry (Express app)
│   └── ml.ts                       # Vercel ML proxy serverless function
├── server.ts                       # Standalone Express server (local dev + self-host)
├── public/
│   └── data/employees.csv          # Employee data for Gemini skill matching
├── supabase-migrations/            # SQL migration files
├── vite.config.ts
├── tailwind.config.ts
├── vercel.json                     # Vercel deployment + rewrite rules
└── package.json
```

---

## License

MIT — see [LICENSE](LICENSE) for details.
