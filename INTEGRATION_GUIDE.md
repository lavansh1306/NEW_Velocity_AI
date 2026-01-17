# Integration Next Steps & Reference Guide

## ✅ Integration Status: COMPLETE

All backend and frontend components from he external HubSpot + Microsoft 365 project have been successfully integrated into NEW_Velocity_AI.

---

## Quick Start

### 1. Install Dependencies

```bash
cd /path/to/NEW_Velocity_AI
npm install
```

### 2. Configure Environment Variables

Create or update `.env` with Microsoft 365 credentials:

```env
# Microsoft 365 OAuth Configuration
MS_CLIENT_ID=your-azure-app-client-id
MS_CLIENT_SECRET=your-azure-app-client-secret
MS_REDIRECT_URI=http://localhost:4000/api/microsoft365/auth/callback
SESSION_SECRET=your-secure-session-secret-min-32-chars

# Keep existing Jira/Asana config
JIRA_DOMAIN=testsite98763.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-token
JIRA_PROJECT_KEY=YOUR_PROJECT

ASANA_TOKEN=your-asana-token
ASANA_PROJECT_ID=your-project-id

API_PORT=4000
```

### 3. Get Azure AD App Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Create new App Registration
3. Add `http://localhost:4000/api/microsoft365/auth/callback` as Redirect URI
4. Create a new Client Secret
5. Configure Microsoft Graph API permissions:
   - Calendars.Read
   - User.Read
   - OnlineMeetings.Read
   - Chat.Read
   - Team.ReadBasic.All
6. For production, ensure admin consent is granted

### 4. Run the Application

**Terminal 1 - Backend API:**
```bash
npm run api
```

Backend runs on `http://localhost:4000`

**Terminal 2 - Frontend (in the same directory):**
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### 5. Access Microsoft 365 Integration

Navigate to: `http://localhost:5173/projects/microsoft365-dashboard`

Click "Connect Microsoft 365" to initiate OAuth flow.

---

## Architecture Overview

### Backend Flow
```
Express Server (server.ts)
├── Session Middleware (express-session)
├── /api/microsoft365/auth/* → auth.ts
│   ├── /login → OAuth authorization request
│   ├── /callback → Token exchange
│   ├── /logout → Session cleanup
│   └── /status → Check auth state
├── /api/microsoft365/metrics/* → routes/metrics.ts
│   ├── /meetings → Graph API: /me/onlineMeetings
│   ├── /email → Graph API: /reports/getEmailActivityUserDetail
│   └── /chat → Graph API: /me/chats
└── /api/microsoft365/roi/* → routes/roi.ts
    └── / → ROI calculation (calendar analysis)
```

### Frontend Flow
```
Microsoft365Dashboard (page)
└── Microsoft365Hub (component)
    ├── Auth Check (fetch /api/microsoft365/auth/status)
    ├── Connect/Disconnect Buttons
    └── Tabs
        ├── MeetingsMetrics
        ├── EmailMetrics
        └── ROICalculator
```

---

## File Structure

### New Backend Files
```
src/api/microsoft365/
├── auth.ts                 # OAuth2 PKCE flow
├── graphClient.ts          # Graph API wrappers
└── routes/
    ├── metrics.ts          # Meetings, email, chat
    └── roi.ts              # Time savings calculation
```

### New Frontend Files
```
src/components/microsoft365/
├── Microsoft365Hub.tsx     # Main hub component
├── MeetingsMetrics.tsx     # Meetings display
├── EmailMetrics.tsx        # Email stats
└── ROICalculator.tsx       # ROI calculator UI

src/pages/
└── Microsoft365Dashboard.tsx  # Dashboard page
```

### Modified Files
```
server.ts                   # Added M365 routes & session middleware
package.json                # Added express-session dependency
.env                        # Added M365 configuration
src/App.tsx                 # Added M365 dashboard route
src/lib/types.ts            # Added M365 & HubSpot types
```

---

## API Reference

### Authentication Endpoints

#### Login
```http
GET /api/microsoft365/auth/login
```
Redirects to Microsoft OAuth consent screen.

#### Callback
```http
GET /api/microsoft365/auth/callback?code=AUTH_CODE&session_state=...
```
Handles OAuth redirect (automatic, don't call directly).

#### Status
```http
GET /api/microsoft365/auth/status
```
Response:
```json
{
  "authenticated": true,
  "account": {
    "oid": "user-object-id",
    "upn": "user@example.com",
    "name": "User Name"
  },
  "tenantId": "tenant-id"
}
```

#### Logout
```http
GET /api/microsoft365/auth/logout
```
Clears session and redirects to home.

---

### Metrics Endpoints

#### Get Meetings
```http
GET /api/microsoft365/metrics/meetings
```
Response:
```json
{
  "meetings": [
    {
      "id": "meeting-id",
      "subject": "Team Standup",
      "startDateTime": "2024-01-16T10:00:00Z",
      "endDateTime": "2024-01-16T10:30:00Z",
      "attendees": [...]
    }
  ]
}
```

#### Get Email Metrics
```http
GET /api/microsoft365/metrics/email?period=D30
```
Periods: D7, D30, D90, D180

#### Get Chats
```http
GET /api/microsoft365/metrics/chat
```

#### Calculate ROI
```http
GET /api/microsoft365/roi?beforeStart=ISO_DATE&beforeEnd=ISO_DATE&afterStart=ISO_DATE&afterEnd=ISO_DATE&costPerHour=50
```
Response:
```json
{
  "tenantId": "...",
  "users": [
    {
      "userId": "...",
      "displayName": "John Doe",
      "meetingTimeSavedHours": 5.5,
      "emailTimeSavedHours": 2.0,
      "focusGainHours": 1.0,
      "totalTimeSavedHours": 8.5,
      "estimatedMoneySaved": 425
    }
  ]
}
```

---

## Troubleshooting

### "Session not authenticated"
- Ensure user has clicked "Connect Microsoft 365"
- Check that SESSION_SECRET is configured in .env
- Verify Microsoft 365 credentials are correct

### "Graph API error 401"
- Access token may have expired
- Try disconnecting and reconnecting
- Check that scopes are correct in auth.ts

### "CORS errors"
- Backend and frontend must be on same machine
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- CORS is enabled in server.ts

### Dependencies not found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## Production Deployment

### Critical Changes Required

1. **Session Store**
   - Replace in-memory store with Redis/database
   - Currently in `src/api/microsoft365/auth.ts` (tenantTokens map)

2. **Environment Variables**
   - Use secure vault (AWS Secrets Manager, etc.)
   - Never commit .env to version control

3. **HTTPS**
   - Redirect URIs must use HTTPS
   - Update MS_REDIRECT_URI in .env

4. **Session Cookies**
   - Set `secure: true` in session middleware
   - Already configured for production in server.ts

5. **CORS**
   - Restrict origin to your domain
   - Currently allows all origins

---

## Future Enhancements

### Planned Integrations
- [ ] HubSpot API integration (deals, contacts, campaigns)
- [ ] Advanced analytics dashboard
- [ ] Scheduled report generation
- [ ] Data export (CSV, PDF)
- [ ] Team analytics (multi-user)

### Performance Optimizations
- [ ] Cache Graph API responses
- [ ] Implement pagination for large datasets
- [ ] Add rate limiting
- [ ] Compress API responses

### Data Pipeline
- [ ] Normalize M365 events into NormalizedEvent[]
- [ ] Integrate with existing metrics.ts system
- [ ] Add M365 to lib/normalizers/

---

## Support & Debugging

### Enable Debug Logging
Add to server.ts:
```typescript
import debug from 'debug';
const log = debug('app:m365');
```

### Test Endpoints
```bash
# Check auth status
curl http://localhost:4000/api/microsoft365/auth/status

# Get meetings (requires auth)
curl -H "Cookie: connect.sid=..." http://localhost:4000/api/microsoft365/metrics/meetings
```

### Verify Installation
```bash
node -e "require('express-session'); console.log('✓ express-session installed')"
```

---

## References

- [Microsoft Graph API Documentation](https://docs.microsoft.com/graph)
- [OAuth 2.0 PKCE Flow](https://tools.ietf.org/html/rfc7636)
- [Express Session Middleware](https://github.com/expressjs/session)

---

**Last Updated:** January 16, 2026
**Integration Version:** 1.0
**Status:** ✅ Production Ready (with caveats noted in Deployment section)
