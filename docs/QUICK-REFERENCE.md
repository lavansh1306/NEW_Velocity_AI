# VelocityAI — Quick Reference

## Data Flow (CSV → Metrics → Charts)

```
┌─────────────────────────────────────────────────────────────────────┐
│  RAW DATA SOURCES (public/data/)                                    │
├─────────────────────────────────────────────────────────────────────┤
│  • hubspot_events.csv      → workflows, emails, contacts            │
│  • asana_events.csv         → tasks created/updated by bot/human    │
│  • jira_events.csv          → issues, transitions, comments         │
│  • projects-analytics.csv   → project stats, AI hours saved         │
│  • integrations-analytics.csv → integration health                  │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NORMALIZE (ETL)                                                    │
├─────────────────────────────────────────────────────────────────────┤
│  Parse CSV → Unescape JSON fields → Normalize timestamps           │
│  Classify: automation vs manual → Map to projectId                 │
│  Output: NormalizedEvent { eventId, timestamp, app, actionType,    │
│           units, avgManualMinutes, projectId, payload }             │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NORMALIZED STORAGE                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  normalized/events/projectId/YYYY-MM.json  OR  DB (SQLite/Postgres)│
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  METRICS COMPUTATION (src/lib/dataService.ts)                       │
├─────────────────────────────────────────────────────────────────────┤
│  Filter by projectId + timeframe                                    │
│  Aggregate:                                                          │
│    • Automation Coverage % = autoUnits / totalUnits * 100           │
│    • Hours Saved = Σ(units × avgManualMinutes / 60)                │
│    • Cost Saved = hoursSaved × hourlyRate                           │
│    • Weekly Automations = group by week, count units               │
│    • By Integration = group by app, calc auto% / manual%            │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  API / loadMetrics(projectId)                                       │
├─────────────────────────────────────────────────────────────────────┤
│  Returns: { estimatedTimeSavedHours, estimatedCostSavedUSD,        │
│             automationCoveragePct, weeklyCommits, burndownData }    │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  UI (src/pages/ProjectDetail.tsx)                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Renders:                                                            │
│    📊 Weekly Commits Bar Chart                                      │
│    📈 Automation Growth Line Chart                                  │
│    📊 Manual vs Auto Stacked Bars (by Integration)                  │
│    📋 Team Members, PRs, Recent Commits                             │
│    💰 AI Impact Metrics Sidebar (hours/cost saved)                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Metrics (Formulas)

| Metric | Formula | Why It Matters |
|--------|---------|----------------|
| **Automation Coverage %** | `(autoUnits / totalUnits) × 100` | Shows % work done by bots |
| **Hours Saved** | `Σ(units × avgManualMins / 60)` | Time reclaimed for value work |
| **Cost Saved** | `hoursSaved × hourlyRate` | $ impact for finance/ROI |
| **Weekly Automations** | `group by week, Σ units` | Tracks execution volume trends |
| **Manual vs Auto by App** | `per app: auto% = auto/(auto+manual)` | Which integrations need automation |

---

## NormalizedEvent Model

```ts
{
  eventId: string,          // unique id
  timestamp: string,        // ISO 8601 UTC
  app: string,              // "asana"|"jira"|"hubspot"|"zapier"|"m365"
  actionType: string,       // "automation"|"manual"
  units: number,            // count (default 1)
  avgManualMinutes: number, // est. manual time per unit
  projectId: string,        // join key
  payload: object           // original data
}
```

---

## Tech Stack

- **Data**: CSV files in `public/data/`
- **Normalizer**: Node.js + `papaparse` (ETL script)
- **Storage**: JSON files or SQLite
- **Backend**: `src/lib/dataService.ts` (metrics aggregation)
- **Frontend**: React + TypeScript (`ProjectDetail.tsx`)
- **Charts**: SVG + divs (Weekly Commits, Burndown)

---

## Files Reference

| File | Purpose |
|------|---------|
| `public/data/*.csv` | Raw event data |
| `src/lib/dataService.ts` | `loadProjects()`, `loadMetrics()` |
| `src/pages/ProjectDetail.tsx` | PM dashboard UI |
| `docs/data-pipeline.md` | Full pipeline docs |
| `docs/metrics-and-architecture.md` | Detailed metrics |

---

## Next Steps

1. Run ETL to normalize CSVs → `public/normalized/`
2. Wire `loadMetrics()` to read normalized JSON
3. Test UI with real data
4. Add API endpoint for live queries

---

**One-sentence summary:**  
Raw CSV events → Normalize (classify auto/manual) → Aggregate by project/week/app → Compute hours/cost saved → Render charts in PM dashboard.
