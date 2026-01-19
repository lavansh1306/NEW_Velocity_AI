# Velocity AI - Complete Project Structure

## 📋 Overview

**Velocity AI** is a full-stack workforce intelligence platform that transforms raw project events (from Jira, Asana, HubSpot, Microsoft365, Zapier) into actionable CFO-ready insights: automation coverage, human-hours saved, cost impact, and redeployment recommendations.

**Tech Stack:**
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts
- **Backend:**Node.js, Expre, TypeScript
- **Deployment:** Vercel
- **Package Manager:** Bun

---

## 📁 Root Directory Structure

```
NEW_Velocity_AI/
├── 📄 Configuration Files
│   ├── package.json                 # Project dependencies and scripts
│   ├── tsconfig.json               # TypeScript compiler config (base)
│   ├── tsconfig.app.json           # App-specific TypeScript config
│   ├── tsconfig.node.json          # Node-specific TypeScript config
│   ├── vite.config.ts              # Vite bundler configuration
│   ├── tailwind.config.ts          # Tailwind CSS configuration
│   ├── postcss.config.js           # PostCSS plugins config
│   ├── eslint.config.js            # ESLint rules configuration
│   ├── components.json             # shadcn/ui components config
│   ├── vercel.json                 # Vercel deployment config
│   └── bun.lockb                   # Bun lock file (dependency lock)
│
├── 📄 Documentation
│   ├── README.md                   # Project overview & quick start
│   ├── PROJECT_STRUCTURE.md        # This file
│   ├── TOAST_SYSTEM.md             # Toast notification system docs
│   ├── TOAST_EXAMPLES.md           # Toast usage examples
│   ├── LICENSE                     # MIT License
│   └── docs/
│       ├── data-pipeline.md        # Data ingestion & processing pipeline
│       ├── metrics-and-architecture.md  # Core metrics & system architecture
│       └── QUICK-REFERENCE.md      # Quick reference guide
│
├── 📄 App Files
│   ├── index.html                  # Entry HTML file
│   ├── velo.html                   # Alternative/legacy HTML file
│   ├── server.ts                   # Express backend server
│   ├── googleba79ddad728eb1f3.html # Google verification file
│   └── vercel.json                 # Vercel deployment config
│
├── 📁 public/                      # Static assets
│   ├── robots.txt
│   ├── googleba79ddad728eb1f3.html
│   └── data/                       # CSV data files for demo/testing
│       ├── asana_events.csv
│       ├── github_events.csv
│       ├── hubspot_events.csv
│       ├── integrations-analytics.csv
│       ├── jira_events.csv
│       ├── microsoft365_events.csv
│       ├── projects-analytics.csv
│       ├── projects-asana.csv
│       ├── projects-hubspot.csv
│       ├── projects-microsoft365.csv
│       ├── projects-zapier.csv
│       └── zapier_events.csv
│
├── 📁 src/                         # Main application source code
│   ├── main.tsx                    # React app entry point
│   ├── App.tsx                     # Root React component
│   ├── App.css                     # App styles
│   ├── index.css                   # Global styles
│   ├── vite-env.d.ts              # Vite environment types
│   │
│   ├── 📁 components/              # Reusable React components
│   │   ├── Header.tsx              # Header/navbar
│   │   ├── Footer.tsx              # Footer component
│   │   ├── Hero.tsx                # Hero section
│   │   ├── CTA.tsx                 # Call-to-action component
│   │   ├── Features.tsx            # Features showcase
│   │   ├── Stats.tsx               # Statistics display
│   │   ├── Architecture.tsx        # Architecture diagram
│   │   ├── NavLink.tsx             # Navigation link component
│   │   ├── ToastContainer.tsx      # Toast notification container
│   │   │
│   │   ├── 📁 ui/                  # shadcn/ui components (auto-generated)
│   │   │   └── [individual UI components]
│   │   │
│   │   ├── 📁 analytics/           # Analytics charts & dashboards
│   │   │   ├── AnalyticsPanel.tsx  # Main analytics panel
│   │   │   ├── AIUsageChart.tsx    # AI usage visualization
│   │   │   ├── AsanaTasksChart.tsx # Asana task analytics
│   │   │   ├── BurndownChart.tsx   # Sprint burndown chart
│   │   │   ├── GanttChart.tsx      # Gantt chart visualization
│   │   │   ├── HubSpotDealsChart.tsx # HubSpot deals analytics
│   │   │   ├── JiraQualityChart.tsx  # Jira quality metrics
│   │   │   ├── Microsoft365MeetingsChart.tsx # M365 meeting analytics
│   │   │   ├── PlannedVsActualChart.tsx # Plan vs actual comparison
│   │   │   ├── ZapierRunsChart.tsx    # Zapier automation runs
│   │   │   ├── chartSetup.ts       # Chart configuration utilities
│   │   │   ├── types.ts            # Analytics type definitions
│   │   │   └── 📁 custom/          # Custom chart components
│   │   │
│   │   ├── 📁 asana/               # Asana-specific components
│   │   │   ├── GanttChart.tsx      # Asana Gantt view
│   │   │   ├── ManagerGantt.tsx    # Manager-level Gantt
│   │   │   ├── ManagerSummary.tsx  # Manager summary view
│   │   │   ├── IssuesTable.tsx     # Issues/tasks table
│   │   │   ├── index.ts            # Asana components export
│   │   │   └── types.ts            # Asana-specific types
│   │   │
│   │   ├── 📁 jira/                # Jira-specific components
│   │   │   └── [Jira-specific components]
│   │   │
│   │   └── 📁 demo/                # Demo/example components
│   │       ├── LiveFeed.tsx        # Live event feed demo
│   │       ├── RedeploymentView.tsx # Redeployment recommendations
│   │       ├── ROIMetrics.tsx      # ROI metrics display
│   │       └── TimeTracking.tsx    # Time tracking demo
│   │
│   ├── 📁 pages/                   # Page-level components (routes)
│   │   ├── Index.tsx               # Landing/index page
│   │   ├── Demo.tsx                # Main demo page
│   │   ├── AsanaDashboard.tsx      # Asana dashboard view
│   │   ├── JiraDashboard.tsx       # Jira dashboard view
│   │   ├── ProjectDetail.tsx       # Project detail page (legacy)
│   │   ├── ProjectDetailNew.tsx    # Project detail page (new)
│   │   ├── Projects.tsx            # Projects list view
│   │   ├── GlobalCapacity.tsx      # Global capacity view
│   │   ├── ROICalculator.tsx       # ROI calculator page
│   │   ├── ROIReport.tsx           # ROI report page
│   │   ├── VelocityAI.tsx          # Main Velocity AI page
│   │   ├── UseCases.tsx            # Use cases page
│   │   ├── DebugNormalization.tsx  # Debug normalization view
│   │   └── NotFound.tsx            # 404 page
│   │
│   ├── 📁 lib/                     # Utilities & helpers
│   │   ├── api.ts                  # API client utilities
│   │   ├── dataService.ts          # Data fetching & processing
│   │   ├── metrics.ts              # Metrics calculation logic
│   │   ├── storage.ts              # Local storage utilities
│   │   ├── csvLoader.ts            # CSV file loading utilities
│   │   ├── types.ts                # Global type definitions
│   │   ├── utils.ts                # General utilities
│   │   └── 📁 normalizers/         # Data normalization logic
│   │       └── [normalizer modules]
│   │
│   ├── 📁 hooks/                   # Custom React hooks
│   │   ├── use-mobile.tsx          # Mobile detection hook
│   │   ├── use-toast.ts            # Toast notification hook
│   │   └── useNotification.ts      # Notification hook
│   │
│   ├── 📁 contexts/                # React context providers
│   │   └── ToastContext.tsx        # Toast notification context
│   │
│   └── 📁 api/                     # API route handlers
│       ├── projects/
│       │   ├── index.ts            # Projects API endpoints
│       │   └── [projectId]/        # Project-specific endpoints
│
├── 📁 api/                         # Backend API
│   └── index.ts                    # API configuration & routing
│
├── 📁 asana/                       # Asana integration
│   └── [Asana-specific integration files]
│
└── 📁 demo/                        # Demo/example data
    ├── LiveFeed.tsx
    ├── RedeploymentView.tsx
    ├── ROIMetrics.tsx
    └── TimeTracking.tsx
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA INGESTION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  Connectors: Jira, Asana, HubSpot, Microsoft365, Zapier         │
│  Authentication: Token-based (OAuth/Personal tokens)            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NORMALIZATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  lib/normalizers/: Transform platform-specific → Canonical      │
│  events (tasks, deployments, meetings, etc.)                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    METRICS CALCULATION                          │
├─────────────────────────────────────────────────────────────────┤
│  lib/metrics.ts:                                                │
│  • Automation Coverage                                          │
│  • Human-hours Saved                                            │
│  • Cost Impact                                                  │
│  • Capacity Forecasts                                           │
│  • Redeployment Recommendations                                │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND VISUALIZATION                      │
├─────────────────────────────────────────────────────────────────┤
│  Components/analytics/:  Charts & dashboards                    │
│  Components/asana/:      Asana-specific views                   │
│  Pages/:                 Page-level components                  │
│  Visualizations: Recharts, Chart.js                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Modules

### **src/lib/types.ts**
Global TypeScript interface definitions for:
- Events (Task, Deployment, Meeting, Automation Run)
- Projects
- Metrics
- User data

### **src/lib/dataService.ts**
Handles:
- CSV data loading from `/public/data/`
- API calls to backend
- Data transformation & caching
- Async data fetching

### **src/lib/metrics.ts**
Calculates:
- Automation coverage percentages
- Hours saved per project
- Cost savings attribution
- Team capacity forecasts

### **src/lib/normalizers/**
Platform-specific data transformation:
- Jira events → Canonical events
- Asana tasks → Canonical events
- HubSpot deals → Canonical events
- Microsoft365 meetings → Canonical events
- Zapier runs → Canonical events

### **src/components/analytics/**
Visualization components using Recharts & Chart.js:
- Time-series charts for metrics
- Burndown & capacity charts
- Deal pipelines
- Meeting analytics
- Automation run tracking

### **src/pages/**
Route-level components:
- `/` → Index/landing page
- `/demo` → Main demo dashboard
- `/asana` → Asana dashboard
- `/jira` → Jira dashboard
- `/projects` → Projects list
- `/project/:id` → Project detail view
- `/roi` → ROI calculator
- `/capacity` → Global capacity view

---

## 🔌 Backend (server.ts)

Express server running on `http://localhost:4000`:
- Provides RESTful API endpoints
- Handles data ingestion from platforms
- Processes normalization
- Vite dev server proxy: `/api` → `localhost:4000/api`

---

## 🚀 Build & Deployment

### **Scripts** (package.json)
```bash
npm run dev           # Start Vite dev server (port 8080)
npm run api           # Start Express backend (port 4000)
npm run build         # Production build
npm run build:dev     # Dev mode build
npm run lint          # Run ESLint
npm run preview       # Preview production build
```

### **Deployment**
- **Platform:** Vercel
- **Config:** `vercel.json`
- **Environment variables:** Configured in Vercel dashboard

---

## 📊 Key Concepts

### **Event Normalization**
Raw platform events (Jira, Asana, etc.) are transformed into a canonical event model with:
- Timestamp
- Event type (task_created, deployment, meeting_scheduled, etc.)
- Project ID
- User/team data
- Impact metrics (estimated hours saved, cost impact)

### **Automation Coverage**
Percentage of project work handled by automation vs. manual effort.

### **Human-Hours Saved**
Calculated from automated task durations and labor costs.

### **Redeployment Recommendations**
AI-driven suggestions on where teams can redeploy freed-up capacity.

### **Cost Impact Attribution**
Links automation savings to measurable business outcomes (revenue impact, team efficiency).

---

## 🎨 Styling

- **Tailwind CSS:** Utility-first styling
- **shadcn/ui:** Accessible, unstyled component library
- **Recharts & Chart.js:** Data visualization

---

## 📦 Dependencies Highlights

- `react`: UI framework
- `typescript`: Type safety
- `vite`: Fast build tool
- `tailwind-css`: Styling
- `shadcn-ui`: Component library
- `recharts`: Data visualization
- `chart.js`: Advanced charting
- `@tanstack/react-query`: Data fetching & caching
- `react-hook-form`: Form management
- `zod`: Schema validation
- `express`: Backend framework
- `cors`: Cross-origin requests

---

## 🔑 Environment Variables

Create a `.env.local` file (or configure in Vercel):

```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_JIRA_TOKEN=xxx
VITE_ASANA_TOKEN=xxx
VITE_HUBSPOT_TOKEN=xxx
VITE_MS365_TOKEN=xxx
```

---

## 🚦 Development Workflow

1. **Start backend:** `npm run api`
2. **Start frontend:** `npm run dev`
3. **Open browser:** `http://localhost:8080`
4. **Vite proxy** handles `/api/*` requests → `localhost:4000/api/*`
5. **Hot reload:** Changes auto-refresh in dev mode

---

## 📖 Additional Resources

- [Data Pipeline](./docs/data-pipeline.md)
- [Metrics & Architecture](./docs/metrics-and-architecture.md)
- [Quick Reference](./docs/QUICK-REFERENCE.md)
- [Toast System](./TOAST_SYSTEM.md)
- [Toast Examples](./TOAST_EXAMPLES.md)

---

## 📝 Notes

- **Demo Data:** CSV files in `/public/data/` for local development
- **Type Safety:** Full TypeScript throughout (strict mode)
- **Components:** shadcn/ui for base components, custom analytics components for domain-specific visualizations
- **Scalability:** Modular connector architecture allows adding new integrations with minimal friction

---

*Last Updated: January 16, 2026*
