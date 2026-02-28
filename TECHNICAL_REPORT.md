# VELOCITY AI - FULL STACK TECHNICAL REPORT

## PROJECT OVERVIEW
**Velocity AI** is a full-stack project management & workforce analytics platform with multi-tenant Jira OAuth integration, leave approval automation, ROI calculations, and workforce capacity planning. Built on React 18 + TypeScript frontend with Node.js Express backend, deployed on Vercel with Supabase PostgreSQL database.

---

## TECH STACK

### **Frontend**
- **Framework**: React 18.3.1 with TypeScript 5.8.3 + Vite 6.4.1 (SPA)
- **UI Components**: Radix UI + shadcn/ui + Tailwind CSS 3.4.17
- **Charts**: Recharts 2.15.4 + Chart.js 4.5.1 + Gantt visualizations
- **Forms**: React Hook Form 7.61.1 + Zod 3.25.76 validation
- **HTTP/State**: @tanstack/react-query 5.83.0 (React Query)
- **Routing**: React Router 6.30.1 with protected routes
- **Auth**: Supabase OAuth (Google, Jira, email/password)
- **Export**: exceljs + XLSX (Excel/CSV generation)

### **Backend**
- **Runtime**: Node.js with tsx/ts-node
- **Framework**: Express 5.2.1 (TypeScript)
- **Session Management**: express-session 1.17.3 + Redis/Memory store (connect-redis)
- **CORS**: cors 2.8.5 (cross-origin requests)
- **OAuth**: Jira OAuth 2.0 with PKCE flow (server-side implementation)
- **AI/ML**: Google Generative AI 0.24.1
- **Database Client**: @supabase/supabase-js 2.94.0

### **Database**
- **Provider**: Supabase (PostgreSQL 15) 
- **Tables**: oauth_users (email tracking), jira_oauth_pkce (token store), leave_requests, approval_rules
- **Auth**: Row-Level Security (RLS) policies, JWT token-based access

### **Deployment**
- **Frontend Hosting**: Vercel (SPA with @vercel/analytics)
- **Backend**: Vercel Functions or standalone Node.js (server.ts port 4000)
- **Domain**: joinvelocity.co (production) with localhost:5173 dev support

---

## FILE STRUCTURE & KEY FILES

### **Root Entry Points**
- **`server.ts`** (279 lines) - Express server with OAuth/session middleware, mounts all API routers
- **`src/main.tsx`** - React DOM root mount point
- **`src/App.tsx`** - Main router with all pages and provider setup
- **`vite.config.ts`** - Dev proxy (`/api` → http://127.0.0.1:4000), build config, path aliases
- **`package.json`** - 85+ dependencies, scripts: `npm run dev`, `npm run api`, `npm run build`

### **Frontend Structure**
```
src/
├── pages/                 # 20+ page components (Index, Dashboard, JiraDashboard, etc.)
├── components/            # UI & feature components
│   ├── ui/               # Radix UI + shadcn primitives (buttons, dialogs, etc.)
│   ├── dashboard/        # Dashboard views (charts, metrics)
│   ├── jira/             # Jira-specific components (issue browser, project picker)
│   ├── leave-management/ # Leave request handling
│   ├── projects/         # Project management components
│   └── ...
├── contexts/
│   ├── AuthContext.tsx   # User auth state (Supabase + Jira)
│   └── ToastContext.tsx  # Notification management
├── hooks/
│   ├── useJiraData.ts    # Fetch Jira issues/projects with credentials
│   ├── useNotification.ts
│   └── use-mobile.tsx
├── lib/
│   ├── supabase.ts       # Supabase client initialization
│   ├── dataService.ts    # CSV parsing + data fetching (949 lines)
│   ├── types.ts          # TypeScript interfaces
│   ├── leaveApprovalAgent.ts # Leave approval logic
│   ├── metrics.ts        # ROI/capacity calculations
│   └── normalizers/      # Data transformation (Jira to internal format)
└── api/
    ├── jira/
    ├── leave-approval/
    └── projects/
```

### **Backend Structure**
```
api/
├── index.ts              # Vercel serverless handler (mounts routers)
├── jira/
│   ├── auth.ts           # OAuth 2.0 PKCE flow (758 lines)
│   └── routes.ts         # Jira API endpoints (655 lines)
├── leave-approval/
│   └── routes.ts         # Approve-single, approve-batch endpoints
└── deployed/
    └── routes.ts         # Production deployed endpoints

server.ts                  # Standalone Express server for dev/self-hosted
src/api/jira/
├── auth.ts              # Same OAuth implementation (used in server.ts)
└── routes.ts            # Same routes (used in server.ts)
```

---

## CORS CONFIGURATION

### **1. Express Server CORS Setup** (`server.ts` lines 56-69)
```typescript
const corsOrigin = process.env.NODE_ENV === 'production' 
  ? (process.env.FRONTEND_URL_PROD || 'https://www.joinvelocity.co')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigin,
  credentials: true,  // Allow cookies/Authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
}))
```

**Where**: `server.ts` line 56 (production) | `api/index.ts` line 20 (serverless)
- **Production**: https://www.joinvelocity.co (Vercel domain)
- **Development**: http://localhost:5173, http://localhost:3000
- **Credentials**: `true` enables cookie/session transmission across origins (required for OAuth)
- **Methods**: Full REST support (GET, POST, PUT, DELETE, OPTIONS)
- **Headers Allowed**: Content-Type, Authorization (Bearer tokens), X-Requested-With
- **Headers Exposed**: Content-Type, Authorization (let client read response headers)

### **2. Session Cookie Security** (`server.ts` lines 76-85)
```typescript
cookie: { 
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
  httpOnly: true,                                  // No JS access (XSS protection)
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // OAuth needs 'none'
  maxAge: 24 * 60 * 60 * 1000,                    // 24-hour expiry
  domain: process.env.NODE_ENV === 'production' ? '.joinvelocity.co' : undefined
}
```

**Key Points**:
- **SameSite=none + Secure=true**: Required for OAuth redirects (external provider → app)
- **SameSite=lax**: Used in dev (localhost doesn't need 'none')
- **HttpOnly=true**: Session cookie not accessible to JavaScript (prevents XSS)

### **3. Vite Dev Proxy** (`vite.config.ts` lines 10-15)
```typescript
proxy: {
  '/api': {
    target: 'http://127.0.0.1:4000',  // Dev backend
    changeOrigin: true,                // Modify Host header for backend
  },
}
```
**Purpose**: During dev, all `/api/*` requests proxied to Express server on port 4000, avoiding local CORS issues.

---

## API ROUTES & INTEGRATIONS

### **1. JIRA OAUTH (Multi-Tenant)**

**Routes File**: `src/api/jira/routes.ts` (655 lines)
**Auth Implementation**: `src/api/jira/auth.ts` (758 lines)

#### **OAuth Flow (3-Legged)**
1. **POST** `/api/jira/auth/connect` - User clicks "Connect Jira", redirects to Atlassian auth
2. **GET** `/api/jira/auth/callback` - Callback from Atlassian, exchanges code for token, stores in session
3. **GET** `/api/jira/auth/status` - Check if user connected (returns: connected bool, site info, available sites)
4. **POST** `/api/jira/auth/disconnect` - Logout, clears session
5. **POST** `/api/jira/auth/switch-site/:siteId` - User has multiple Jira instances, switch between them

#### **PKCE Protection**
- **Code Verifier**: Random 128-char string stored in session
- **Code Challenge**: SHA256(verifier) sent in auth request
- **Token Exchange**: Only client_id + code_challenge + verifier can get access token (client_secret not sent)
- **Storage**: Tokens in Redis/Memory session (not cookies for security)

#### **Data Endpoints**
- **GET** `/api/jira/projects` - List all projects user has access to
- **GET** `/api/jira/issues?projectKey=PROJ` - Fetch issues for a project (100 max per request)
- **GET** `/api/jira/project-details/:projectKey` - Detailed project info with metrics

#### **Implementation Details**
- **Multi-Tenant**: Each user's tokens stored separately in `req.session.jiraStoreKey` (per user/browser)
- **Token Refresh**: Automatic refresh when expired (refresh_token used)
- **Scope**: read:jira-work, read:jira-user, read:issue:jira, read:project:jira, offline_access
- **Environment Redirect URIs**:
  - **Production**: `https://www.joinvelocity.co/api/jira/auth/callback`
  - **Local Dev**: `http://localhost:4000/api/jira/auth/callback`

### **2. Leave Approval Routes**
**Routes File**: `src/api/leave-approval/routes.ts` (215 lines)

- **POST** `/api/leave-approval/approve-single` - Approve one leave request with rules engine
- **POST** `/api/leave-approval/approve-batch` - Batch approve with weighted scoring & summary
- **POST** `/api/leave-approval/register-validation-rule` - Add custom validation rule
- **GET** `/api/leave-approval/summary` - Get approval statistics

**Backend Logic** (`src/lib/leaveApprovalAgent.ts`):
- Rule-based scoring: team_capacity, timing, employee_performance
- Prioritization: batch approval algorithm orders highest-priority leaves first
- Conflict detection: prevents duplicate approvals

### **3. Deployed Routes**
**Routes File**: `src/api/deployed/routes.ts`

Pre-configured endpoints for production data access (used after initial setup).

### **4. Projects API**
**Routes File**: `src/api/projects/index.ts`

Project CRUD operations (if using internal project management).

### **5. ML/AI Routes**
**Path**: `/api/ml` (proxied in vite config)

Google Generative AI integration for:
- Performance insights
- Capacity recommendations
- ROI predictions

---

## FRONTEND-BACKEND COMMUNICATION

### **Authentication Flow**
```
User → Frontend (React) → AuthContext (Supabase/Jira) → Backend Session
│
├─ Email/Password → Supabase Auth → JWT Session
├─ Google OAuth → Supabase OAuth → Accounts saved in oauth_users table
└─ Jira OAuth → Backend /api/jira/auth/connect → Atlassian → /callback → Session
```

### **Fetch with Credentials**
```typescript
// Frontend always sends credentials for session-based auth
const response = await fetch('/api/jira/projects', { 
  credentials: 'include'  // Sends session cookie
});
```

### **Request Flow Example**
1. **Frontend** (`useJiraData.ts`): Calls `fetch('/api/jira/issues?projectKey=PROJ', { credentials: 'include' })`
2. **Vite Dev**: Proxy routes to `http://127.0.0.1:4000`
3. **Backend** (`routes.ts`): Middleware logs request, reads `req.sessionID` & `req.session.jiraStoreKey`
4. **Auth Check** (`auth.ts`): Validates session has jiraAccessToken, responds 401 if not
5. **Jira API Call** (OAuth token): `fetch('https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/search')`
6. **Transform**: Normalize Jira response to internal format
7. **Return**: JSON to frontend, cached by React Query

---

## DATA STORAGE & PERSISTENCE

### **Supabase Tables**
1. **oauth_users** - Google OAuth users (email, provider, timestamp)
2. **jira_oauth_pkce** - Jira token store (not auto-managed, manual sync possible)
3. **leave_requests** - Leave request records
4. **approval_rules** - Custom approval validation rules
5. **projects** - Project metadata (if internal project management enabled)

### **Session Storage**
- **Backend Store**: Redis (production) or Memory (dev)
- **Keys Stored**: `jiraAccessToken`, `jiraRefreshToken`, `jiraCloudId`, `jiraUserId`, `jiraAccessibleResources`
- **Duration**: 24 hours max age with refresh token capability
- **Cookie Name**: `velocity-sid` (custom name for privacy)

### **Client-Side Storage**
- **React Query**: In-memory caching for API responses (5-minute default staleTime)
- **LocalStorage**: Not used for sensitive data (session in cookie only)
- **CSV Data**: Loaded from `/public/data/` (employees.csv, jira_events.csv, etc.) for demo mode

---

## BUILD & DEPLOYMENT

### **Development**
```bash
npm run dev       # Vite dev server on http://localhost:5173 with HMR
npm run api       # Express server on http://127.0.0.1:4000
# Both run in parallel in separate terminals
```

### **Production Build**
```bash
npm run build     # Vite compiles React → dist/ (TypeScript → JavaScript)
                  # Outputs single HTML + JS bundles
```

### **Vercel Deployment**
- **Frontend**: Automatic deployment of `dist/` folder
- **Backend**: 
  - Option 1: Standalone `server.ts` on Vercel Container (paid)
  - Option 2: `api/index.ts` as serverless function (free tier, 10s timeout)
- **Environment Variables**: `.env.local` loaded on both frontend & backend (Vite & Node.js)
- **Rewrites**: Vercel rewrites `/api/*` to cloud function, preserves original path via `_path` query param

### **Environment Variables** (.env.local)
```
# Frontend (visible in browser, Vite prefix: VITE_)
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

# Backend (private, only server-side)
JIRA_OAUTH_CLIENT_ID
JIRA_OAUTH_CLIENT_SECRET
JIRA_OAUTH_REDIRECT_URI_LOCAL
SUPABASE_URL
SUPABASE_ANON_KEY
SESSION_SECRET
REDIS_URL / (REDIS_HOST + REDIS_PASSWORD + REDIS_PORT)
FRONTEND_URL_PROD
NODE_ENV
```

---

## KEY INTEGRATION POINTS

| Integration | File | Purpose | Auth Type |
|---|---|---|---|
| **Jira Cloud** | `src/api/jira/*` | Project/issue data | OAuth 2.0 + PKCE |
| **Supabase** | `src/lib/supabase.ts` | User auth + DB | JWT + Row-Level Security |
| **Google Generative AI** | `src/services/mlService.ts` | AI insights | API Key |
| **Google Analytics** | `src/App.tsx` | Usage tracking | Auto (Vercel) |
| **Redis** | `server.ts` line 32 | Session store (prod) | Connection URL |

---

## CRITICAL FLOW DIAGRAMS

### **Jira OAuth Connect Flow**
```
1. User clicks "Connect Jira" button
   ↓
2. Frontend: fetch('/api/jira/auth/connect')
   ↓
3. Backend: Generate PKCE code_challenge → Redirect to Atlassian OAuth
   ↓
4. Atlassian: User grants permission
   ↓
5. Redirect: https://www.joinvelocity.co/api/jira/auth/callback?code=X&state=Y
   ↓
6. Backend: Verify state, exchange code for token using code_verifier
   ↓
7. Fetch accessible-resources API to get list of Jira instances
   ↓
8. Store in session: { jiraAccessToken, jiraRefreshToken, jiraCloudId, jiraAccessibleResources }
   ↓
9. Redirect to frontend: /projects (user now authenticated)
```

### **API Request with Session Auth**
```
Frontend (cookies: velocity-sid) → /api/jira/issues
                                  ↓
                          CORS middleware checks origin ✓
                                  ↓
                          Session middleware loads session ✓
                                  ↓
                          Jira routes middleware ✓
                                  ↓
                          Extract: req.session.jiraAccessToken
                                  ↓
                          Call Jira API: Bearer {token}
                                  ↓
                          Return JSON to frontend
                                  ↓
Frontend (React Query cache) ← { issues: [...] }
```

---

## SUMMARY

**Velocity AI** is a sophisticated multi-tenant SaaS web app combining modern DevOps tools (Jira), workforce analytics, and AI-driven insights. The architecture separates **frontend** (React/TypeScript/Vite) from **backend** (Express/OAuth), uses **session-based multi-tenant auth**, and deploys on **Vercel + Supabase**. CORS is carefully configured to allow OAuth redirects while maintaining XSS protection via HttpOnly cookies and SameSite policies. API routes are organized by integration (Jira, leave-approval, projects) with clear separation of concerns and robust error handling.

---
**Report Generated**: February 19, 2026 | **Version**: Velocity AI v0.0.0
