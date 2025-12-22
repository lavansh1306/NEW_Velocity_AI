**Metrics & Architecture — Normalized Events → PM Dashboard**

This document explains how the project-level dashboard metrics and charts are produced from normalized event data. It is concise, technical and manager-facing. Implementation references in this repo: `src/lib/dataService.ts`, `src/lib/metrics.ts` (if present), and `src/pages/ProjectDetail.tsx` (chart rendering).

---

**NormalizedEvent model (canonical fields)**
- `eventId: string` — unique event id
- `timestamp: string` — ISO 8601 UTC
- `app: string` — source integration ("asana", "jira", "hubspot", "zapier", "m365", etc.)
- `actionType: 'automation' | 'manual'` — whether the event was automated or manual
- `units: number` — numeric count the event represents (default 1)
- `avgManualMinutes: number | null` — estimated average manual minutes saved per unit when automated
- `projectId: string` — join key to project
- `payload: object` — original parsed payload for detail

Normalized events are produced by an ETL/normalizer (CSV rows or API events → parse JSON fields → map/clean → produce NormalizedEvent). Normalizer responsibilities:
- Parse JSON-in-CSV fields (`properties`, `data`, `details`).
- Normalize timestamps to UTC ISO.
- Classify `actionType` using `source`/`event_action`/known automation markers (e.g., `workflow:executed`, `zap:run`, `automation_bot` → `automation`).
- Populate `avgManualMinutes` via event payload or a central lookup table (e.g., "email.send" → 5 mins, "workflow.run" → 12 mins).
- Validate `projectId`; drop/orphan-mark events that lack mapping.

---

**1) Automation Coverage (%)**
- What data is used (after normalization):
  - All `NormalizedEvent` rows for a selected `projectId` and timeframe (e.g., last 7 days or current sprint).
  - Use `units` field for aggregation.
- Filtering logic:
  - Include events where `event.projectId === selectedProjectId && timestamp within timeWindow`.
  - Exclude duplicates (de-dup on `eventId`).
- Calculation (formula):
  - totalAutomation = SUM(units WHERE actionType === 'automation')
  - totalActions = SUM(units WHERE actionType === 'automation' OR actionType === 'manual')
  - automationCoveragePct = (totalAutomation / totalActions) * 100
- Grouping: computed per project (and optionally per integration or team).
- Implementation note (pseudocode):
  ```js
  const events = normalized.filter(e => e.projectId === projectId && inWindow(e.timestamp));
  const totalAutomation = events.filter(e => e.actionType==='automation').reduce((s,e)=>s+e.units,0);
  const totalActions = events.reduce((s,e)=>s+e.units,0);
  const coverage = totalActions ? (totalAutomation/totalActions)*100 : 0;
  ```
- Why it matters:
  - Shows percent of work executed automatically vs manually. PMs use it to measure operational leverage, automation adoption, and areas for automation investment.

---

**2) Total Automations Executed (weekly bar chart)**
- What data is used:
  - `NormalizedEvent` rows where `actionType === 'automation'` (project-scoped).
  - Use `units` (default 1) per event.
- Filtering logic:
  - `event.projectId === selectedProjectId` and `timestamp` falls in the displayed range (e.g., last 6 weeks).
- Calculation / grouping logic:
  - Group by ISO week (or week label used in UI): `weekKey = startOfWeek(timestamp)`
  - weeklyCount[weekKey] = SUM(units for automation events in that week)
- Pseudocode:
  ```js
  const automations = events.filter(e => e.actionType==='automation');
  const byWeek = groupBy(automations, e => startOfWeekLabel(e.timestamp));
  const weekly = Object.entries(byWeek).map(([week, arr]) => ({week, count: arr.reduce((s,e)=>s+e.units,0)}));
  ```
- Rendering:
  - X-axis: week labels; Y-axis: automation counts.
  - Bars show absolute number of automations executed that week.
- Why it matters:
  - Tracks execution volume of automations over time. Useful for capacity planning, spotting declines, and measuring impact of automation campaigns.

---

**3) Estimated Human Hours Saved & Estimated Cost Saved**
- What data is used:
  - `NormalizedEvent` rows where `actionType === 'automation'` and `avgManualMinutes` is present (either attached per event or resolved via lookup table keyed by event type).
  - Optionally, authoritative `ai_time_saved_hours` from `projects-analytics.csv` can override/calibrate computed values.
- Filtering logic:
  - Filter by `projectId` and timeframe.
- Calculation (formulas):
  - For each automation event: hoursSavedEvent = (units * avgManualMinutes) / 60
  - totalHoursSaved = SUM(hoursSavedEvent)
  - estimatedCostSavedUSD = totalHoursSaved * hourlyRateUSD
  - Where `hourlyRateUSD` comes from config (project-level or global default — `loadMetrics()` currently uses `metrics.hourlyRateUsedUSD` fallback).
- Pseudocode:
  ```js
  const autos = events.filter(e=>e.actionType==='automation' && e.avgManualMinutes);
  const totalHours = autos.reduce((s,e)=> s + (e.units * (e.avgManualMinutes/60)), 0);
  const cost = totalHours * hourlyRateUSD;
  ```
- Implementation notes:
  - If `avgManualMinutes` missing: attempt to resolve by `app`+`payload.action` lookup; if still missing, mark as unknown and exclude or apply conservative default.
  - `projects-analytics.csv` may contain an authoritative `ai_time_saved_hours` field; prefer that when available and fall back to event-based estimate.
- Why it matters:
  - Translates automation activity into business value (time and $). Helps PMs and finance prioritize automation investments and report ROI.

---

**4) Automation Growth Trend (line/area chart)**
- What data is used:
  - Periodic aggregation of automation counts or hours-saved (e.g., weekly totals of `totalAutomation` or `totalHoursSaved`).
- Filtering logic:
  - Project-level filter + time-range; use consistent period bucketing (week/month).
- Calculation / grouping:
  - For period P (week/month): metric[P] = SUM(units of automation events in P) OR SUM(hoursSaved in P)
  - Optionally compute cumulative growth: cumulative[P] = SUM(metric up to P)
- Pseudocode:
  ```js
  const periodTotals = periods.map(p => ({period:p, value: eventsInPeriod(p).reduce((s,e)=>s+(e.units),0)}));
  ```
- Rendering:
  - Line or area chart connecting `value` across periods.
  - Optionally overlay % growth: (value[P] - value[P-1]) / value[P-1].
- Why it matters:
  - Shows adoption velocity and whether automations are scaling. PMs use it to measure momentum and as a leading indicator of efficiency gains.

---

**5) Manual vs Automated by Integration (100% stacked bar)**
- What data is used:
  - `NormalizedEvent` rows grouped by `app` (integration name).
  - For each `app` compute `automatedUnits` and `manualUnits` (sum of `units` by `actionType`).
- Filtering logic:
  - Filter to `projectId` and timeframe.
- Calculation (group + normalize):
  - For each `app`:
    - automated = SUM(units WHERE app === A AND actionType === 'automation')
    - manual = SUM(units WHERE app === A AND actionType === 'manual')
    - total = automated + manual
    - automatedPct = total ? (automated / total) * 100 : 0
    - manualPct = 100 - automatedPct
  - Chart gets one 100% stacked bar per `app` with `automatedPct` and `manualPct` segments.
- Pseudocode:
  ```js
  const byApp = groupBy(events, e=>e.app);
  const rows = Object.entries(byApp).map(([app, arr])=>{
    const auto = arr.filter(e=>e.actionType==='automation').reduce((s,e)=>s+e.units,0);
    const manual = arr.filter(e=>e.actionType==='manual').reduce((s,e)=>s+e.units,0);
    const total = auto+manual;
    return {app, automatedPct: total? (auto/total)*100:0, manualPct: total? (manual/total)*100:0};
  })
  ```
- Why it matters:
  - Reveals which integrations have high automation adoption vs those still manual. Guides integration-focused automation investments and highlights integration-specific blockers.

---

**Filtering, deduplication & quality controls (practical notes)**
- De-dup: dedupe by `eventId` or a hash of (`app`, `timestamp`, `payload.id`) to avoid double-counting repeated CSV imports.
- Orphan events: keep an "orphan" bucket for rows without `projectId` and surface them for manual review.
- Missing `avgManualMinutes`: maintain a central lookup (CSV/JSON) mapping `app`+`action` → `avgManualMinutes` for consistent hour estimates.
- Time windows: choose consistent bucketing (ISO week) and timezone normalization to UTC to avoid label shifts.

---

**Simple architecture (text diagram & components)**

- Sources:
  - `public/data/*.csv` (Asana, Jira, HubSpot, Zapier, Microsoft365) or API webhooks
- ETL / Normalizer (Node script / serverless function)
  - Parses CSV rows, unescapes JSON fields, normalizes timestamps, classifies `actionType`, fills `avgManualMinutes`, writes `NormalizedEvent` objects
  - Output: `normalized/events/:projectId/YYYY-MM.json` or into a small DB (SQLite / Postgres / DynamoDB)
- Normalized storage / cache
  - Option A: static JSON files under `public/normalized/` for dev/test
  - Option B: a lightweight DB for production queries
- Metrics service (`src/lib/dataService.ts` / `src/lib/metrics.ts`)
  - Reads normalized events for a `projectId` and timeframe
  - Produces `metrics` object: `{ estimatedTimeSavedHours, estimatedCostSavedUSD, automationCoveragePct, weeklyCommits, automationByWeek, automationByIntegration, burndownData }`
  - Optional caching layer to avoid repeated computation
- API layer (optional)
  - `GET /api/projects/:id/metrics?start=...&end=...` returns computed metrics
- UI (`src/pages/ProjectDetail.tsx`) — consumes `loadMetrics(projectId)` and local mock data
  - Renders charts: weekly bars, growth line, stacked bars, quick stats
  - Inline edits update local state and can POST back to API for persistence

Visualized flow (linear):
`CSV/API` → `ETL Normalizer` → `Normalized Events` → `Metrics Service` → `API / loadMetrics()` → `UI (ProjectDetail.tsx)` → `Charts`

---

**Quick implementation pointers referencing repo files**
- Normalizers should produce the `NormalizedEvent` used by `loadMetrics()` (edit `src/lib/dataService.ts` to point at normalized files or the DB).
- Chart code in `src/pages/ProjectDetail.tsx` expects arrays like `weeklyCommits`, `burndownData` and the sidebar `metrics` object; compute these in `loadMetrics()` and return a single structured object.
- Keep config values (e.g., `hourlyRateUSD`, default `avgManualMinutes` per action) in a single config file so `metrics` calculations are consistent.

---

If you want, I can now:
- Generate the ETL script (Node.js + `papaparse`) that reads the attached CSVs and outputs normalized JSON per project.
- Or wire `src/lib/dataService.ts` to read a `public/normalized/` directory and return the metrics exactly as `ProjectDetail.tsx` expects.

Which would you like me to implement next? (I can scaffold the ETL and normalization outputs and wire `loadMetrics()` to them.)
