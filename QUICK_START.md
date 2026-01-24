# 🚀 Jira SaaS Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Create Atlassian OAuth App (2 minutes)

1. Visit: https://developer.atlassian.com/console/myapps/
2. Click **Create** → **OAuth 2.0 integration**
3. Name: `Velocity AI` (or your app name)
4. Click **Create**

### Step 2: Configure Permissions (1 minute)

Add these scopes:
- ✅ `read:jira-work`
- ✅ `read:jira-user`  
- ✅ `offline_access`

### Step 3: Add Callback URL (30 seconds)

**Development:**
```
http://localhost:4000/api/jira/auth/callback
```

**Production (when ready):**
```
https://yourdomain.com/api/jira/auth/callback
```

### Step 4: Copy Credentials (30 seconds)

- Copy **Client ID**
- Copy **Client Secret** (shown only once!)

### Step 5: Update .env File (1 minute)

Add these three lines to your `.env`:

```env
JIRA_OAUTH_CLIENT_ID=paste-your-client-id-here
JIRA_OAUTH_CLIENT_SECRET=paste-your-client-secret-here
JIRA_OAUTH_REDIRECT_URI=http://localhost:4000/api/jira/auth/callback
```

Make sure `SESSION_SECRET` is set:
```env
SESSION_SECRET=your-secure-random-string-min-32-chars
```

### Step 6: Restart Server (30 seconds)

```bash
npm run api
```

### Step 7: Test! (1 minute)

1. Open http://localhost:5173 in your browser
2. Go to **Integrations** or **Security Audit** tab
3. Find **Jira** integration
4. Click **Connect**
5. You'll be redirected to Atlassian
6. Sign in with your Jira account
7. Click **Accept** to grant permissions
8. You'll be redirected back → **Success!** 🎉

---

## ✅ Verification Checklist

After completing setup, verify:

- [ ] Server console shows: `[Jira OAuth] CLIENT_ID loaded: YES`
- [ ] Server console shows: `[Jira OAuth] CLIENT_SECRET loaded: YES`
- [ ] Clicking "Connect Jira" redirects to Atlassian
- [ ] After login, redirects back to your app
- [ ] Connection status shows "Connected"
- [ ] Can fetch Jira projects
- [ ] Can fetch Jira issues

---

## 🐛 Quick Troubleshooting

### "CLIENT_ID loaded: NO"
**Fix:** Check `.env` file exists and has `JIRA_OAUTH_CLIENT_ID`

### "Redirect URI mismatch"
**Fix:** Callback URL in Atlassian console must exactly match `.env`

### "No Jira sites accessible"
**Fix:** Sign in with a Jira account that has access to at least one site

### Cookies not working
**Fix:** Make sure `SESSION_SECRET` is set in `.env`

---

## 📖 Full Documentation

Need more details? Check:
- `JIRA_SAAS_COMPLETE.md` - Complete implementation guide
- `docs/JIRA_OAUTH_SETUP.md` - Detailed setup instructions
- `IMPLEMENTATION_SUMMARY.md` - Technical architecture

---

## 🎯 What You Just Built

You now have a **multi-tenant SaaS** Jira integration where:
- ✅ Each user connects their own Jira account
- ✅ Data is isolated per user
- ✅ OAuth 2.0 security (industry standard)
- ✅ Automatic token refresh
- ✅ Professional user experience

**Same pattern as Slack, GitHub, Google Drive!**

---

## 🚀 Production Deployment (Later)

When ready for production:

1. **Update Atlassian console:**
   - Add production callback: `https://yourdomain.com/api/jira/auth/callback`

2. **Update .env:**
   ```env
   NODE_ENV=production
   FRONTEND_URL=https://yourdomain.com
   JIRA_OAUTH_REDIRECT_URI=https://yourdomain.com/api/jira/auth/callback
   ```

3. **Implement database storage:**
   - Replace in-memory token storage with database
   - See `JIRA_SAAS_COMPLETE.md` for examples

---

**That's it! You're ready to go! 🎉**
