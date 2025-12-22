# Data Pipeline: Normalization → Metrics → Charts

This document describes how the repository ingests and normalizes raw data (CSV event files in `public/data/`), how metrics are derived from normalized data, and how the UI charts in `src/pages/ProjectDetail.tsx` are built from those metrics.

**Intended audience:** engineers and managers who need to understand where numbers come from and how charts are produced.

---

## 1. Overview

High-level flow:

- Ingest: CSV files under `public/data/` (HubSpot, Asana, Jira, integrations, projects analytics, etc.)
- Normalize: parse CSV + JSON fields, normalize timestamps to ISO + timezone, and map events to `project_id`.
- Enrich & aggregate: compute derived fields (commits/week, remaining tasks per day, AI time saved, cost saved, etc.).
- Serve: `loadProjects()` / `loadMetrics()` in `src/lib/dataService.ts` return structured objects.
- UI: `src/pages/ProjectDetail.tsx` consumes those outputs and renders charts (`weeklyCommits`, `burndownData`, `velocityData`).

---

## 2. Data sources (examples)

Files referenced in this workspace and their purpose (examples from attachments):

- `public/data/projects-analytics.csv`  — per-project analytics; contains a `data` column with a JSON blob (planned_hours, actual_hours, ai_time_saved_hours, ai_time_saved_percent, time_logs, tasks, etc.).
- `public/data/hubspot_events.csv` — marketing CRM events (workflow executed, email sent); `properties` column contains JSON.
- `public/data/asana_events.csv` — task and story events; `details` column contains JSON-like metadata.
- `public/data/jira_events.csv` — issue lifecycle events, used to infer remaining tasks / burndown.
- `public/data/integrations-analytics.csv` — integration health metrics (used for AI/integration savings mapping).

Notes:
- Several CSV fields themselves contain JSON strings (escaped). Normalization must parse those strings into native objects.
- Each event row usually has a `project_id` which is the join key to projects.

---

## 3. Normalization steps (general)

1. Read CSV row-by-row (use a streaming parser for large files, e.g. `papaparse`, `csv-parse`, or `d3-dsv`).
2. Trim and normalize header names to snake_case (optional, but helpful).
3. For columns that hold JSON (e.g. `data`, `properties`, `details`, `fields`):
   - Unescape the CSV JSON string and parse with `JSON.parse()`.
   - If parsing fails, log and fallback to storing raw string.
4. Normalize timestamps to ISO 8601 UTC using a robust library (e.g. `date-fns` or `luxon`):
   - `occurred_at`, `created_at`, `date` → ensure `YYYY-MM-DDTHH:mm:ssZ` format.
5. Map event types to canonical event model:
   - canonical fields: `{ event_id, project_id, ts, source, type, action, payload }`
6. Validate `project_id` exists in projects list (if not, mark as orphaned event).
7. Persist normalized rows to in-memory collections or a local JSON store for aggregation.

Example normalization snippet (TypeScript pseudocode):

```ts
import { parse } from 'papaparse';

function normalizeRow(row) {
  const payload = tryParseJson(row.data || row.properties || row.details || '{}');
  const ts = normalizeTimestamp(row.occurred_at || row.created_at || payload.date);
  return {
    event_id: row.event_id || row.gid || row.issue_id,
    project_id: String(row.project_id || payload.project_id || ''),
    ts,
    source: row.source || row.resource_type || 'unknown',
    type: row.object_type || row.resource_type || row.event_type,
    action: row.event_action || row.action || row.action_type,
    payload,
  };
}
```

---

## 4. Metric derivations (formulas & rationale)

Below are the core metrics we show in the UI and how to compute them from normalized data.

### 4.1 AI Impact Metrics (from `projects-analytics.csv` `data` blob)

- ai_time_saved_hours: provided in the `data` JSON (e.g. `ai_time_saved_hours`).
- estimatedCostSavedUSD = ai_time_saved_hours * hourlyRateUsedUSD
  - Example: if `ai_time_saved_hours` = 55 and `hourlyRateUsedUSD` = 100 → cost saved = 5,500
- ai_time_saved_percent = (ai_time_saved_hours / planned_hours) * 100 (if `planned_hours` present)

Store these in a `metrics` object returned by `loadMetrics(projectId)`:

```ts
metrics.estimatedTimeSavedHours = data.ai_time_saved_hours || 0;
metrics.estimatedCostSavedUSD = metrics.estimatedTimeSavedHours * (config.hourlyRate || 100);
metrics.hourlyRateUsedUSD = config.hourlyRate || 100;
```

### 4.2 Commits & Activity

- Source: repository commit logs (in this project they are mocked in `recentCommits` state); in real setup, commits would come from GitHub events CSV or API.
- weekly_commits: group commits by week start (ISO week or week-of-month). Example calculation:
  - For each commit: determine `weekLabel = startOfWeek(commit.ts)`
  - Aggregate: commitsByWeek[weekLabel] = count
- avg_commits_per_week = total_commits / number_of_weeks

### 4.3 Burndown (remaining work by day)

- Input: `jira_events.csv` + project tasks from `projects-analytics.csv` `tasks` + Asana task events.
- Compute initial scope: `initial_total = initial open story/issue count at sprint start`.
- For each day: remaining = previous_remaining - issues_closed_that_day
- Data shape used by UI: `burndownData = [{ day: 'Day 1', remaining: 30 }, ...]`

### 4.4 Velocity (per sprint)

- Input: task completions by sprint from Asana events or project `tasks` in `projects-analytics.csv`.
- For each sprint: `planned = sum(estimated_points or planned_points)`; `completed = sum(completed_points)`
- Velocity percent = completed / planned

### 4.5 Team-level aggregations (for quick stats)

- total_tasks_assigned = sum(team.tasksAssigned)
- total_tasks_completed = sum(team.tasksCompleted)
- avg_task_completion_percent = (total_completed / total_assigned) * 100
- prs_pending = count PR objects with `status === 'pending-review'`

---

## 5. Chart construction (how the UI builds them)

All charts are generated in `src/pages/ProjectDetail.tsx`. State variables and their origins:

- `weeklyCommits: WeeklyCommit[]` — array of `{ week: string, commits: number }` derived from commits dataset.
  - Rendering: bars with height proportional to commits relative to max; labels show absolute commit counts and % of total.
  - Implementation notes: bars are rendered with divs/SVG and height is computed as `(commits / maxCommits) * chartHeight`.

- `burndownData: { day: string, remaining: number }[]` — derived from Jira/Asana events and tasks snapshot.
  - Rendering: an SVG `polyline` built from points calculated as `x = left + (i * width) / (n-1)` and `y = baseline - (remaining / maxRemaining) * baseline`.
  - Data points show the `remaining` value and an "ideal" diagonal is drawn for reference.

- `velocityData: VelocityData[]` — array of `{ sprint: string, planned: number, completed: number }`.
  - Rendering: horizontal progress bars (completed / planned).
  - Note: in current manager-oriented layout you removed the visual `Velocity Trend`; the burndown and weekly commits remain.

Example TS pseudo for weekly commits aggregation:

```ts
function buildWeeklyCommits(commits: CommitLog[]) {
  const byWeek = new Map<string, number>();
  commits.forEach(c => {
    const week = startOfWeekISO(c.date); // e.g. "Dec 9-15"
    byWeek.set(week, (byWeek.get(week) || 0) + 1);
  });
  return Array.from(byWeek.entries()).map(([week, commits]) => ({ week, commits }));
}
```

Example TS pseudo for burndown data:

```ts
function buildBurndown(issuesEvents, sprintStart, sprintEnd) {
  const days = dateRange(sprintStart, sprintEnd);
  let remaining = initialScope;
  return days.map((d, i) => {
    const closedToday = countEvents(issuesEvents, d, 'transition', { to_status: 'Done' });
    remaining -= closedToday;
    return { day: `Day ${i+1}`, remaining };
  });
}
```

---

## 6. Editable flow & real-time UI updates

- The page allows inline edits for team member `currentTask` and PR `reviewers`.
- Those edits update local React state (`teamMembers`, `pullRequests`) immediately.
- If you want persistence, send the updated payload to an API or write back to a local JSON store; e.g. `POST /api/projects/:id/team`.

---

## 7. Validation & testing

- Unit tests for parser logic:
  - parse JSON-in-csv fields, timestamp normalization, project_id mapping.
- Integration tests for metrics derivation:
  - feed sample CSVs (the attachments) and assert derived numbers (weekly commits, ai_time_saved, cost saved).
- Visual sanity checks:
  - Ensure chart maxima are not zero (guard divide-by-zero logic) and labels show readable values.

---

## 8. Files & code references

- Data sources: `public/data/projects-analytics.csv`, `public/data/hubspot_events.csv`, `public/data/asana_events.csv`, `public/data/jira_events.csv`, `public/data/integrations-analytics.csv`
- Loader + metrics: `src/lib/dataService.ts` — `loadProjects()`, `loadMetrics()` (aggregates the per-project `data` JSON into a metrics object).
- UI & charts: `src/pages/ProjectDetail.tsx` — `weeklyCommits`, `burndownData`, `velocityData` (used to render bars and SVGs).

---

## 9. Quick next steps (recommended)

- If you want these graphs backed by real data, implement a small ETL script that:
  1. Reads CSVs from `public/data/`.
  2. Normalizes and writes per-project JSON files under `data/normalized/projects/:id.json`.
  3. Adds an HTTP endpoint (or static `normalized/` files) that `loadMetrics()` can fetch.

- Add tests to validate the normalization; create a small `fixtures/` folder with the sample CSVs (attachments) and expected outputs.

---

If you'd like, I can:

- Generate the ETL script (Node.js) using `papaparse` to normalize the attached CSVs and output JSON.
- Wire `loadMetrics()` to read those JSON files so the UI reflects normalized data.

Which would you prefer next? (I can scaffold the ETL and a small local `normalized/` dataset.)
