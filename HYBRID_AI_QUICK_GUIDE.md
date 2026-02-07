# Hybrid AI Leave Approval System - Quick Integration Guide

## What's Been Implemented

✅ **Weighted Scoring System**
- 5-dimensional scoring (Employee Rating, Leave Balance, Team Capacity, Absence Type, Blackout Dates)
- 0-100 score range
- Configurable weights via API

✅ **Gemini AI Integration**
- Used for borderline cases (score 25-75)
- Complex reasoning for edge cases
- Graceful fallback if unavailable

✅ **Decision Routing**
- Score > 75: Auto-approve (fast path)
- Score < 25: Auto-reject (fast path)
- Score 25-75: Use Gemini reasoning (complex path)

✅ **Enhanced UI**
- Shows decision method (weighted-scoring, gemini-reasoning, or hybrid)
- Displays weighted score
- Updated status endpoint with detailed feature list

## How to Use

### 1. Send Leave Request with Context Data

```typescript
// Include optional fields for better scoring
const leave = {
  id: 1,
  name: "John Doe",
  startDate: "2024-02-15",
  endDate: "2024-02-17",
  reason: "Vacation",
  status: "Pending",
  // New optional fields
  employeeRating: 4.5,      // 1-5 scale
  leaveBalance: 12,         // days available
  teamCapacity: 3,          // team members available
  absenceType: "vacation"   // vacation|medical|family|other
}
```

### 2. Decision Method Tracking

The response now shows how the decision was made:

```json
{
  "decisionMethod": "weighted-scoring",  // or "gemini-reasoning"
  "weightedScore": 78,
  "approved": true,
  "reason": "Strong approval: weighted score 78/100",
  "confidence": 93
}
```

### 3. Customize Scoring Weights

```bash
curl -X POST http://localhost:4000/api/leave-approval/set-weights \
  -H "Content-Type: application/json" \
  -d '{
    "employeeRating": 0.30,    # Increase weight for performance
    "leaveBalance": 0.20,
    "teamCapacity": 0.25,
    "absenceType": 0.15,
    "blackoutDate": 0.10
  }'
```

### 4. Get Current Configuration

```bash
# Get status and decision flow
curl http://localhost:4000/api/leave-approval/status

# Get current weights
curl http://localhost:4000/api/leave-approval/weights
```

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/leave-approval/approve-single` | POST | Approve single leave |
| `/api/leave-approval/approve-batch` | POST | Approve multiple leaves |
| `/api/leave-approval/status` | GET | Agent status & features |
| `/api/leave-approval/weights` | GET | Current scoring weights |
| `/api/leave-approval/set-weights` | POST | Update scoring weights |
| `/api/leave-approval/register-rule` | POST | Add validation rule |

## Environment Configuration

Make sure `GEMINI_API_KEY` is set in `.env.production`:

```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

If not set, system falls back to weighted scoring only (no Gemini reasoning).

## Scoring Dimensions Explained

### Employee Rating (25% weight)
Performance-based factor. Higher-rated employees get more favorable scores.
- 5/5: +20 points
- 1/5: -20 points

### Leave Balance (25% weight)
Ensures employee has sufficient balance.
- >5 days: +15 points
- 2-5 days: +5 points
- <2 days: -15 points

### Team Capacity (25% weight)
Coverage check - can team function without this person?
- ≥3 available: +20 points
- 2 available: +10 points
- <2 available: -20 points

### Absence Type (15% weight)
Different leave types have different urgency levels.
- Medical: +15 points (highest priority)
- Family: +10 points
- Vacation: 0 points (neutral)
- Other: -5 points

### Blackout Date (10% weight)
Critical business dates when leaves are restricted.
- Overlaps: -30 points penalty

## Decision Flow Visualization

```
Leave Request
     │
     ├─ Critical Validations
     │   └─ Fail? → REJECT (confidence: 10%)
     │
     ├─ Calculate Weighted Score (0-100)
     │
     └─ Decision Routing
         ├─ Score > 75? → APPROVE (fast, 70-95% confidence)
         ├─ Score < 25? → REJECT (fast, 20-95% confidence)
         └─ Score 25-75? → Gemini AI (complex, 75% confidence)
```

## Example Scenarios

### Scenario 1: Clear Approval
```
Employee: Top performer, good balance, team well-staffed
Score: 85/100 → APPROVE
Method: weighted-scoring
Confidence: 92%
Time: <100ms
```

### Scenario 2: Clear Rejection
```
Employee: New hire, no balance, team stretched thin
Score: 12/100 → REJECT
Method: weighted-scoring
Confidence: 88%
Time: <100ms
```

### Scenario 3: Gemini Analysis Required
```
Employee: Average performer, emergency family leave, reasonable balance
Score: 55/100 → Gemini AI Analysis
Method: gemini-reasoning
Gemini: "Emergency family leave justifies score discrepancy. Recommend approval."
Final: APPROVE
Confidence: 75%
Time: ~2-5s (depends on Gemini latency)
```

## Monitoring

Check the approval summary for insights:

```json
{
  "total": 10,
  "approved": 8,
  "rejected": 2,
  "averageConfidence": 82,
  "decisionBreakdown": {
    "weighted-scoring": 7,   // Fast decisions (70%)
    "gemini-reasoning": 3    // Complex cases (30%)
  },
  "commonFailures": {}
}
```

**What to watch:**
- If `gemini-reasoning` > 50%: May indicate policy gaps
- High failure rate: May need weight adjustment
- Low confidence: May need validation rule review

## Troubleshooting

### Gemini Not Working
- Check `GEMINI_API_KEY` in environment
- System falls back to weighted scoring
- Check server logs for Gemini initialization errors

### Unexpected Decisions
- Review weighted score vs. decision method
- Check if critical validation rules are blocking
- Adjust weights if pattern is systematic

### Performance
- Weighted scoring: <100ms
- Gemini reasoning: 2-5s (first request may be slower)
- Batch processing: Linear (n × time_per_request)

## Next Steps

1. **Test the system** with various leave requests
2. **Monitor decision breakdown** to understand patterns
3. **Adjust weights** based on business rules feedback
4. **Add custom validation rules** for specific policies
5. **Integrate with payroll/HR** for complete context

---

**Version**: 2.0.0 (Hybrid AI)  
**Status**: Production Ready  
**Last Updated**: 2024
