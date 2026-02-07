# Production API Fix for Leave Approval Agent

## Problem
The Leave Approval Agent was not working in production (deployed version) because:
1. **CORS Error**: Frontend at `https://www.joinvelocity.co` was trying to call `http://localhost:4000`
2. **Wrong API URL**: Component was hardcoded to use localhost instead of same-domain API
3. **Missing CORS Headers**: CORS wasn't configured with all necessary headers

## Error Logs
```
Access to fetch at 'http://localhost:4000/api/leave-approval/approve-batch' 
from origin 'https://www.joinvelocity.co' has been blocked by CORS policy
```

## Solution Implemented

### 1. **Fixed API URL in Component** 
File: `src/components/leave-approval/LeaveApprovalAgent.tsx`

```typescript
const apiUrl = (path: string) => {
  // In production, API is at same domain (via reverse proxy)
  // In development, use VITE_API_URL env var or localhost:4000
  const isDev = import.meta.env.DEV;
  const baseUrl = isDev 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:4000')
    : (import.meta.env.VITE_API_URL || '');
  return `${baseUrl}${path}`;
};
```

**What it does:**
- In **development**: Uses `VITE_API_URL` or `http://localhost:4000` (Vite proxy handles routing)
- In **production**: Uses same domain (empty baseUrl = relative paths like `/api/leave-approval/approve-batch`)

### 2. **Enhanced CORS Configuration**
File: `server.ts`

```typescript
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
}))
```

**What it does:**
- Properly sets CORS headers for all HTTP methods
- Includes required headers for API requests
- Exposes headers needed by frontend

### 3. **Production Setup Requirements**

**On Vercel/Production Server:**
1. Frontend and backend must run on same domain
2. Use a reverse proxy to route `/api/*` requests to backend server
3. Set `NODE_ENV=production` environment variable
4. Ensure `FRONTEND_URL_PROD` is set (defaults to `https://www.joinvelocity.co`)

**Vercel Configuration Example:**
```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/api/:match*",
      "destination": "http://localhost:4000/api/:match*"
    }
  ]
}
```

Or using environment variables:
```
VITE_API_URL=https://api.yoursite.com
```

## How It Works Now

### Development (localhost)
```
Frontend: http://localhost:5173
Backend: http://localhost:4000
Vite Proxy: /api → http://localhost:4000/api
```

### Production (Vercel)
```
Frontend: https://www.joinvelocity.co
Backend: https://www.joinvelocity.co (via reverse proxy)
API Calls: /api/leave-approval/approve-batch
```

## Testing the Fix

### Local Testing:
```bash
npm run dev  # Frontend runs on localhost:5173
# Backend should be running on localhost:4000
```

### Production Testing:
1. Deploy frontend to Vercel/production
2. Deploy backend to production server
3. Configure reverse proxy to route `/api/*` to backend
4. Visit `https://www.joinvelocity.co`
5. Leave Approval Agent should auto-approve leaves without CORS errors

## Environment Variables to Set

### On Vercel Dashboard (Settings → Environment Variables):
```
NODE_ENV=production
FRONTEND_URL_PROD=https://www.joinvelocity.co
VITE_API_URL=https://www.joinvelocity.co  (or your API domain)
```

### Or in `.env.production`:
```
FRONTEND_URL_PROD=https://www.joinvelocity.co
```

## Verification Checklist

- [x] Remove hardcoded `localhost:4000` from frontend
- [x] Use relative paths in production (`/api/*`)
- [x] Enhanced CORS headers on backend
- [x] Development fallback for localhost development
- [x] Production-ready API URL resolution

## Related Files Modified

1. `src/components/leave-approval/LeaveApprovalAgent.tsx` - Fixed API URL logic
2. `server.ts` - Enhanced CORS configuration
