# Serverless Functions Analysis - Merger Opportunities

## Current Serverless Functions (11 total)

### 1. **Health Check Functions** (2 functions - REDUNDANT ⚠️)
- `api/index.ts` - Returns: `{ status: 'ok', message: 'Velocity AI API is running' }`
- `api/health.ts` - Returns: `{ status: 'ok', message: 'API is running' }`

**ANALYSIS:** These are duplicates. Both return health check responses.
**MERGE OPTION:** Delete `health.ts`, keep `index.ts`
**SAVINGS:** 1 function (-1)

---

### 2. **Jira Auth Sub-functions** (5 functions)
- `api/jira/auth.ts` - Main logic (126 lines)
- `api/jira/auth/connect.ts` - Wrapper calling `handleJiraConnect()` from auth.ts
- `api/jira/auth/callback.ts` - Wrapper calling `handleJiraCallback()` from auth.ts
- `api/jira/auth/disconnect.ts` - Wrapper calling logout logic
- `api/jira/auth/status.ts` - Wrapper calling status check logic

**ANALYSIS:** The `/auth/` subfolder functions are just thin wrappers that call functions from `auth.ts`. They're needed because Vercel creates separate functions for each file, but they're not doing any independent logic.

**MERGE OPTION:** Consolidate all Jira auth into a single `api/jira/auth-handler.ts` that routes based on `req.path` or query params
```typescript
export default async function handler(req: Request, res: Response) {
  if (req.path.includes('connect')) await handleJiraConnect(...);
  if (req.path.includes('callback')) await handleJiraCallback(...);
  if (req.path.includes('disconnect')) await handleJiraDisconnect(...);
  if (req.path.includes('status')) await handleJiraStatus(...);
}
```
**SAVINGS:** 4 functions (-4) → 1 combined function

**IMPACT:** Low - just reorganizes routing, no logic changes

---

### 3. **Jira Data Functions** (2 functions)
- `api/jira/projects.ts` - Fetches Jira projects (128 lines)
- `api/jira/issues.ts` - Fetches Jira issues (128 lines)

**ANALYSIS:** These are distinct operations with different purposes. 
**CAN THEY MERGE?** Yes, but not recommended
- Could combine into one `api/jira/data.ts` and route on query param `?type=projects|issues`
- **NOT IDEAL** because they have different response times and use cases
**SAVINGS:** Potential -1, but hurts readability

---

### 4. **Other Functions** (2 functions)
- `api/diagnose.ts` - Debug/diagnostic tool (172 lines) - STANDALONE
- `api/hubspot-callback.ts` - OAuth callback (21 lines) - STANDALONE

**ANALYSIS:** Both are specialized, separate concerns.

---

### 5. **Leave Approval** (1 function - NEW)
- `api/leave-approval/approve-batch.ts` - Your new function

---

## Current Count: 11 Functions

```
✅ Index / Health               2 functions → Can merge to 1
✅ Jira Auth Routing            5 functions → Can merge to 1  
✅ Jira Data Fetching           2 functions → Could merge to 1 (not recommended)
✅ Diagnostics                  1 function  → Keep standalone
✅ HubSpot Callback             1 function  → Keep standalone
✅ Leave Approval               1 function  → Keep standalone (new)
---
                              = 13 total
```

---

## RECOMMENDED MERGERS (To get under 12)

### **Option A: Conservative** (-2 functions → 9 total remaining)
1. **Delete `api/health.ts`** (duplicate of `api/index.ts`)
2. **Consolidate Jira Auth** (`api/jira/auth/connect.ts`, `callback.ts`, `disconnect.ts`, `status.ts`) into single route handler

**Result: 13 - 2 = 11 functions ✅ (under limit)**

### **Option B: Aggressive** (-5 functions → 8 total remaining)
Do Option A + also merge:
3. **Merge Jira projects + issues** into `api/jira/data.ts` with query routing

**Result: 13 - 5 = 8 functions ✅ (more breathing room)**

---

## My Recommendation

**Go with Option A (Conservative):**
- ✅ Removes duplicates (health.ts)
- ✅ Consolidates auth wrappers (they're just routing)
- ✅ Keeps logic organized and readable
- ✅ Gets you to 11 functions (under 12 limit)
- ✅ Low risk - no complex refactoring

**Don't merge Jira projects+issues** because they're independent queries with different latencies.

---

## Implementation Impact

**Option A would require:**
1. Delete `api/health.ts`
2. Create `api/jira/auth-handler.ts` with routing logic
3. Update `vercel.json` rewrites to point to `/api/jira/auth-handler`
4. Delete individual `api/jira/auth/*.ts` files

**Time:** ~20 minutes
**Risk:** Low
**Benefit:** 2 functions freed up (room to add more features later)

Want me to implement Option A? Or prefer Option B?
