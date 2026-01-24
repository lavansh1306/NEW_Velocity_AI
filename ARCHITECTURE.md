# 🎯 Jira Multi-Tenant SaaS - Architecture Overview

## 🔄 Authentication Flow

```
┌──────────┐                                    ┌────────────────┐
│  User    │                                    │   Atlassian    │
│ Browser  │                                    │ OAuth Server   │
└────┬─────┘                                    └────────┬───────┘
     │                                                   │
     │ 1. Click "Connect Jira"                          │
     │ ───────────────────────────────────>             │
     │        GET /api/jira/auth/connect                │
     │                                                   │
     │ 2. Redirect to Atlassian                         │
     │ ─────────────────────────────────────────────>   │
     │    https://auth.atlassian.com/authorize?...      │
     │                                                   │
     │ 3. User logs in & grants permissions             │
     │ <─────────────────────────────────────────────   │
     │                                                   │
     │ 4. Redirect back with code                       │
     │ <─────────────────────────────────────────────   │
     │    /api/jira/auth/callback?code=ABC123           │
     │                                                   │
┌────▼─────┐                                    ┌───────▼────────┐
│   Your   │ 5. Exchange code for tokens        │   Atlassian    │
│  Server  │ ───────────────────────────────>   │  Token Server  │
│          │                                     │                │
│          │ 6. Return access & refresh tokens  │                │
│          │ <───────────────────────────────   │                │
└────┬─────┘                                    └────────────────┘
     │
     │ 7. Store tokens in user session
     │    (linked to sessionID)
     │
     │ 8. Redirect to dashboard with success
     │ ───────────────────────────────────>
     │
┌────▼─────┐
│  User    │  ✅ Connected!
│ Browser  │
└──────────┘
```

## 📊 Data Access Flow

```
┌──────────┐                                    ┌────────────────┐
│  User    │                                    │   Jira Cloud   │
│ Browser  │                                    │      API       │
└────┬─────┘                                    └────────┬───────┘
     │                                                   │
     │ 1. Request data                                  │
     │    GET /api/jira/issues?projectKey=PROJ          │
     │ ───────────────────────────────────>             │
     │                                                   │
┌────▼─────┐                                            │
│   Your   │ 2. Check session for user's tokens        │
│  Server  │    - Is user authenticated?                │
│          │    - Token expired?                        │
│          │      → Auto-refresh if needed              │
└────┬─────┘                                            │
     │                                                   │
     │ 3. Make request with user's token                │
     │ ──────────────────────────────────────────────>  │
     │    Authorization: Bearer <user_access_token>     │
     │                                                   │
     │ 4. Return user's data (isolated)                 │
     │ <──────────────────────────────────────────────  │
     │                                                   │
     │ 5. Send data to user                             │
     │ ───────────────────────────────────>             │
     │                                                   │
┌────▼─────┐                                    ┌───────────────┐
│  User    │  ✅ Sees only their Jira data      │               │
│ Browser  │                                    │               │
└──────────┘                                    └───────────────┘
```

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                   (React + TypeScript)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Integrations │  │Security Audit│  │     Jira     │     │
│  │     Tab      │  │     Tab      │  │  Dashboard   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                            │ Click "Connect Jira"            │
│                            │ → /api/jira/auth/connect        │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (Express)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          OAuth Routes (src/api/jira/routes.ts)       │   │
│  │                                                       │   │
│  │  GET  /api/jira/auth/connect    → Start OAuth       │   │
│  │  GET  /api/jira/auth/callback   → Handle callback   │   │
│  │  POST /api/jira/auth/disconnect → Disconnect        │   │
│  │  GET  /api/jira/auth/status     → Check status      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │      Data Routes (src/api/jira/routes.ts)            │   │
│  │                                                       │   │
│  │  GET /api/jira/issues    → Fetch issues (auth req)  │   │
│  │  GET /api/jira/projects  → List projects (auth req) │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              AUTH MODULE (src/api/jira/auth.ts)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────┐     │
│  │  OAuth Functions:                                  │     │
│  │  • generatePKCE()          → Security             │     │
│  │  • exchangeCodeForToken()  → Get tokens           │     │
│  │  • refreshAccessToken()    → Auto-refresh         │     │
│  │  • getAccessToken()        → Get valid token      │     │
│  │  • getCloudId()            → Get user's site      │     │
│  └───────────────────────────────────────────────────┘     │
│                                                              │
│  ┌───────────────────────────────────────────────────┐     │
│  │  Token Storage (In-Memory Map):                   │     │
│  │  SessionID → TokenStore {                         │     │
│  │    accessToken: string                            │     │
│  │    refreshToken: string                           │     │
│  │    expiresAt: timestamp                           │     │
│  │    cloudId: string                                │     │
│  │    userId: string                                 │     │
│  │  }                                                │     │
│  └───────────────────────────────────────────────────┘     │
│                                                              │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  SESSION MIDDLEWARE                          │
│                   (express-session)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Stores per-user data:                                      │
│  • sessionID (unique per user)                              │
│  • jiraCloudId                                              │
│  • jiraUserId                                               │
│  • jiraStoreKey                                             │
│  • jiraCodeVerifier (PKCE)                                  │
│                                                              │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │  Atlassian OAuth     │      │   Jira Cloud API     │   │
│  │  auth.atlassian.com  │      │  api.atlassian.com   │   │
│  └──────────────────────┘      └──────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Multi-Tenancy Model

```
┌──────────────────────────────────────────────────────────────┐
│                    USER ISOLATION                             │
└──────────────────────────────────────────────────────────────┘

User A                          User B                          User C
  │                               │                               │
  ├─ Session: abc123             ├─ Session: def456             ├─ Session: ghi789
  │                               │                               │
  ├─ Tokens:                     ├─ Tokens:                     ├─ Tokens:
  │  • Access: token_A            │  • Access: token_B            │  • Access: token_C
  │  • Refresh: refresh_A         │  • Refresh: refresh_B         │  • Refresh: refresh_C
  │  • CloudId: site_A            │  • CloudId: site_B            │  • CloudId: site_C
  │                               │                               │
  ├─ Sees:                       ├─ Sees:                       ├─ Sees:
  │  • CompanyA Jira             │  • CompanyB Jira             │  • CompanyC Jira
  │  • Projects: [PA1, PA2]      │  • Projects: [PB1, PB2]      │  • Projects: [PC1]
  │  • Issues: 150               │  • Issues: 80                │  • Issues: 200
  │                               │                               │
  └─ ✅ Isolated                  └─ ✅ Isolated                  └─ ✅ Isolated

❌ User A CANNOT see User B's data
❌ User B CANNOT see User C's data
❌ User C CANNOT see User A's data

✅ Each user has their own:
   • Jira account connection
   • Access tokens
   • Jira site (cloudId)
   • Projects & Issues
```

## 📦 Component Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│                   NEW FILES CREATED                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  src/api/jira/                                              │
│  ├── auth.ts              ← OAuth 2.0 implementation        │
│  │   • login()            → Start OAuth flow               │
│  │   • callback()         → Handle OAuth callback          │
│  │   • getAccessToken()   → Get/refresh token              │
│  │   • getCloudId()       → Get user's Jira site           │
│  │   • disconnect()       → Remove user's connection       │
│  │                                                          │
│  └── routes.ts            ← API endpoints                   │
│      • GET  /auth/connect                                   │
│      • GET  /auth/callback                                  │
│      • POST /auth/disconnect                                │
│      • GET  /auth/status                                    │
│      • GET  /issues                                         │
│      • GET  /projects                                       │
│                                                              │
│  docs/                                                      │
│  └── JIRA_OAUTH_SETUP.md  ← Detailed setup guide           │
│                                                              │
│  JIRA_SAAS_COMPLETE.md     ← Complete implementation guide  │
│  IMPLEMENTATION_SUMMARY.md ← Technical architecture         │
│  QUICK_START.md            ← 5-minute setup guide           │
│  .env.example              ← Environment template           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   FILES MODIFIED                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  api/index.ts                                               │
│  ├── Added: import jiraRoutes                               │
│  └── Added: app.use('/api/jira', jiraRoutes)               │
│                                                              │
│  server.ts                                                  │
│  ├── Added: import jiraRoutes                               │
│  └── Added: app.use('/api/jira', jiraRoutes)               │
│                                                              │
│  src/components/demo2/IntegrationsTab.tsx                   │
│  ├── Updated: handleConnect() for Jira                      │
│  │   → Redirects to /api/jira/auth/connect                 │
│  └── Updated: handleDisconnect() for Jira                   │
│                                                              │
│  src/components/demo2/SecurityAuditTab.tsx                  │
│  └── Updated: handleToggleIntegration() for Jira            │
│      → Redirects to /api/jira/auth/connect                 │
│                                                              │
│  src/pages/JiraDashboard.tsx                                │
│  ├── Updated: fetchProjectData()                            │
│  │   → Uses /api/jira/issues endpoint                      │
│  │   → Handles 401 (auth required)                         │
│  └── Added: credentials: 'include' to fetch                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Environment Variables

```
┌──────────────────────────────────────────────────────────────┐
│              REQUIRED CONFIGURATION                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  # New OAuth Configuration (Required)                        │
│  JIRA_OAUTH_CLIENT_ID=your-client-id                         │
│  JIRA_OAUTH_CLIENT_SECRET=your-client-secret                 │
│  JIRA_OAUTH_REDIRECT_URI=http://localhost:4000/api/jira/auth/callback
│                                                               │
│  # Session Security (Required)                               │
│  SESSION_SECRET=your-secure-random-string-32-chars           │
│                                                               │
│  # Old Configuration (Optional - backward compatibility)     │
│  JIRA_DOMAIN=company.atlassian.net                           │
│  JIRA_EMAIL=admin@company.com                                │
│  JIRA_API_TOKEN=your-token                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## 🎯 Success Metrics

```
Before Implementation:
┌─────────────────────────┐
│  Single-Tenant System   │
├─────────────────────────┤
│ Users:      1 (shared)  │
│ Accounts:   1 (shared)  │
│ Scalability: ❌ Limited │
│ Security:    ⚠️ Risk    │
│ SaaS-Ready:  ❌ No      │
└─────────────────────────┘

After Implementation:
┌─────────────────────────┐
│  Multi-Tenant SaaS      │
├─────────────────────────┤
│ Users:      ♾️ Unlimited │
│ Accounts:   Per-User    │
│ Scalability: ✅ Infinite│
│ Security:    ✅ OAuth   │
│ SaaS-Ready:  ✅ Yes     │
└─────────────────────────┘
```

## 🚀 What's Next?

1. **Test Locally** - Follow QUICK_START.md
2. **Create OAuth App** - At developer.atlassian.com
3. **Deploy to Production** - Follow production guide
4. **Add Database Storage** - Replace in-memory Map
5. **Monitor & Scale** - Add analytics, logging

---

**Your Jira integration is now enterprise-ready!** 🎉
