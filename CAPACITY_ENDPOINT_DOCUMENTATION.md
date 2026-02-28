# Team Capacity Endpoint Implementation

## Overview
Successfully removed "👥 Team Workload Overview" and implemented a new POST endpoint `/api/v1/analyze/capacity` that calculates true available hours for the team based on base capacity, PTO, and holidays.

## Changes Made

### 1. **Removed Team Workload Overview**
- **File**: `src/components/leave-management/index.tsx`
- **Change**: Removed the "👥 Team Workload Overview" section from the manager's view
- **Lines**: Previously displayed in the manager view

### 2. **Created `/api/v1/analyze/capacity` Endpoint**
- **File**: `src/api/leave-approval/routes.ts`
- **Method**: POST
- **Route**: `/api/v1/analyze/capacity` (mounted via `/api/v1/analyze` prefix)
- **Handler**: `router.post("/capacity", ...)`

#### Request Body
```json
{
  "candidates": [
    {
      "id": "string",
      "name": "string",
      "current_load": 0,
      "skills": ["string"],
      "role_level": "string",
      "avg_completion_time": 0,
      "efficiency_score": 1,
      "base_productive_hours": 40,
      "pto_hours_this_week": 0,
      "holiday_hours_this_week": 0
    }
  ]
}
```

#### Response (200 Success)
```json
{
  "success": true,
  "timestamp": "2025-02-20T...",
  "summary": {
    "total_candidates": 5,
    "total_base_hours": 200,
    "total_pto_hours": 16,
    "total_holiday_hours": 0,
    "total_available_hours": 184,
    "available_members": 4,
    "utilization_rate": 92
  },
  "data": [
    {
      "employee_id": "string",
      "name": "string",
      "base_productive_hours": 40,
      "pto_hours_this_week": 0,
      "holiday_hours_this_week": 0,
      "net_available_hours": 40,
      "status": "available"
    }
  ]
}
```

#### Endpoint Features
- ✅ Calculates net available hours: `base_hours - PTO - holidays`
- ✅ Returns capacity status for each employee: `available`, `limited`, `unavailable`, `full`
- ✅ **Integrates with JIRA data**: Uses employee data from connected JIRA instances
- ✅ **Considers approved leaves**: Automatically factored into PTO calculations
- ✅ Provides team-wide utilization metrics
- ✅ Does NOT affect the ML model (independent calculation)
- ✅ Works on both `localhost` and `joinvelocity.co`

### 3. **Created CapacityAnalysis Component**
- **File**: `src/components/leave-management/CapacityAnalysis.tsx`
- **Purpose**: Display team capacity information in the manager's view
- **Features**:
  - Real-time capacity calculation
  - Automatic integration with approved leaves
  - Summary metrics cards
  - Employee capacity table with status indicators
  - Refresh functionality
  - Error handling with retry capability

#### Component Props
```typescript
interface CapacityAnalysisProps {
  employees: EmployeeProfile[];
  approvedLeaves: LeaveRequest[];
  onRefresh?: () => void;
}
```

#### Status Indicators
- **Full**: 35+ hours available (Green)
- **Available**: 10-34 hours available (Green)
- **Limited**: 1-9 hours available (Yellow)
- **Unavailable**: 0 hours available (Red)

### 4. **Updated API Router Configuration**
- **File**: `api/index.ts`
- **Change**: Added new route mount for `/api/v1/analyze` prefix
- **Routes Mounted**:
  - `/api/jira` - JIRA integration
  - `/api/leave-approval` - Leave approval endpoints
  - `/api/v1/analyze` - New capacity analysis endpoints

### 5. **Integrated CapacityAnalysis into Manager View**
- **File**: `src/components/leave-management/index.tsx`
- **Location**: Added to manager view after the "Active Leave Requests" section
- **Data Integration**: 
  - Passes all employees to component
  - Filters for approved leaves only
  - Updates when leaves are approved/rejected

## How It Works

### Data Flow
1. **Manager approves a leave** → Leave status changes to "Approved"
2. **Component mounts** → Fetches employee list and approved leaves
3. **API call to `/api/v1/analyze/capacity`** → Sends candidates with leave data
4. **Endpoint calculates** → Subtracts PTO/holidays from base capacity
5. **Returns response** → Component displays capacity information

### Leave Calculation
- Detects leave dates that overlap with current week
- Calculates overlapping days (minimum 1 day per 24-hour period)
- Multiplies by 8 hours per day (configurable)
- Subtracts total from base capacity

### Multi-Environment Support
- ✅ **Localhost (5173/3000)**: Full functionality
- ✅ **Production (joinvelocity.co)**: Full functionality with CORS support
- CORS origins configured in `api/index.ts`:
  - Development: `['http://localhost:5173', 'http://localhost:3000']`
  - Production: `'https://www.joinvelocity.co'`

## Integration Points

### JIRA Integration
- Component receives employee data from JIRA connections
- Can be used with any supported project
- Leave data from the application is used for PTO calculations

### Leave Approval System
- Uses existing `LeaveRequest` interface
- Automatically considers `Approved` status
- Updates in real-time when leaves are approved/rejected

## Testing the Endpoint

### Using cURL
```bash
curl -X POST http://localhost:3000/api/v1/analyze/capacity \
  -H "Content-Type: application/json" \
  -d '{
    "candidates": [
      {
        "id": "emp1",
        "name": "John Doe",
        "base_productive_hours": 40,
        "pto_hours_this_week": 8,
        "holiday_hours_this_week": 0,
        "current_load": 0,
        "skills": ["engineering"],
        "role_level": "senior",
        "avg_completion_time": 0,
        "efficiency_score": 1.0
      }
    ]
  }'
```

### Using JavaScript
```javascript
const response = await fetch('/api/v1/analyze/capacity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    candidates: [
      {
        id: 'emp1',
        name: 'John Doe',
        base_productive_hours: 40,
        pto_hours_this_week: 8,
        holiday_hours_this_week: 0,
        // ... other fields
      }
    ]
  })
});

const data = await response.json();
console.log(data);
```

## Notes

1. **No ML Model Impact**: This endpoint performs pure capacity calculations independently
2. **Real-time Updates**: Component automatically recalculates when new leaves are approved
3. **Configurable Hours**: Base productive hours default to 40 (8-hour workday) but can be customized
4. **Team Summary**: Provides aggregate metrics for better visibility
5. **Error Handling**: Graceful fallback with retry mechanism

## Future Enhancements

- [ ] Custom holiday calendar integration
- [ ] Role-based capacity adjustments
- [ ] Predictive capacity forecasting
- [ ] Export capacity reports to CSV
- [ ] Capacity alerts when below threshold
- [ ] Historical capacity trends
