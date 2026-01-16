# Velocity AI — Workforce Intelligence

![MIT](https://img.shields.io/badge/license-MIT-yellow) ![React](https://img.shields.io/badge/React-17.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-4.0-3178C6) ![Vite](https://img.shields.io/badge/Vite-3.0-646CFF) ![Tailwind](https://img.shields.io/badge/Tailwind-3.0-06B6D4)

Short pitch
-----------

Velocity AI turns raw project events into CFO-ready insights: automation coverage, human-hours saved, cost impact, and redeployment recommendations that convert efficiency into measurable business outcomes.

Why this repo matters (for recruiters)
------------------------------------

- Full-stack product: data ingestion, normalization, analytics, and dashboard UI.
- Designed for stakeholders (CFO/CHRO) with KPIs and ROI attribution—bridges product, analytics, and engineering.
- Modular connectors: add integrations (Jira, Asana, HubSpot, Microsoft365) with low friction.

Core features
-------------

- Connectors: Jira & Asana ingestion and canonical event mapping
- Normalization: unified event model for cross-platform analytics
- Metrics: Automation Coverage, Hours Saved, Cost Savings, Capacity Forecasts
- Intelligence: Redeployment recommendations and causal attribution
- Visuals: Live dashboards, project detail views, and Gantt charts

High-level architecture
-----------------------

- Ingestion layer: platform-specific connectors and token-based auth
- Processing layer: normalization, enrichment, and metrics calculations
- Intelligence layer: attribution and redeployment engine
- Frontend: React SPA (TypeScript) with charts and responsive UI

Tech summary
------------

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Visuals: Chart.js, Recharts, date-fns
- Backend: Node.js + Express (TypeScript)
- Deployment: Vercel; env-driven configuration

Quick start
-----------

Clone and run (dev):

```bash
git clone https://github.com/lavansh1306/NEW_Velocity_AI.git
cd NEW_Velocity_AI
npm install
npm run dev
```

Optional: start backend API server in another terminal:

```bash
npm run api
```

Configuration (short)
---------------------

- Create a `.env` at repo root with your Jira/Asana credentials. The app runs in demo mode using `public/data` CSVs when tokens are missing.
- Minimal vars: `JIRA_DOMAIN`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `ASANA_TOKEN`, `ASANA_PROJECT_ID`, `API_PORT`.

Files to inspect
----------------

- `public/data/` — sample CSVs for local demos
- `src/api/` — server endpoints and normalization logic
- `src/components/analytics/` — charting and metrics components

Deployment
----------

- Recommended: Vercel. Configure environment variables in the Vercel dashboard and connect to this repository for automatic deploys.

Interview callouts (say this)
-----------------------------

- "I built an end-to-end analytics pipeline that converts Jira/Asana events into CFO-level KPIs and recommendations." 
- Focus: causal attribution & redeployment engine — business-facing features, not only charts.

Contributing
------------

- Create a `feature/<name>` branch, run `npm run lint`, `npm run build`, and open a PR with a clear description.

License
-------

MIT — see the LICENSE file.

Contact
-------

Open an issue or PR on the repository for questions or improvements.

---

This README is intentionally concise — ask me to add a short "Key achievements" block with sample metrics for recruiter impact.
# Velocity AI - Workforce Intelligence Platform

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lavansh1306/NEW_Velocity_AI)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Velocity AI** is an AI-powered workforce intelligence platform that tracks productivity gains from AI tools, reallocates freed capacity to high-impact initiatives, and proves ROI with causal attribution. It provides CFOs and CHROs with the clarity they need to make data-driven decisions about AI adoption and resource allocation.

![Velocity AI Architecture](./architecture.svg)

## 🚀 Features

### Core Capabilities
- **📊 Multi-Platform Integration**: Seamlessly connects with Jira and Asana to aggregate project data
- **⚡ Real-time Dashboards**: Interactive dashboards for Jira and Asana projects with live metrics
- **💰 ROI Calculator**: Calculate and visualize return on investment from AI and automation tools
- **📈 Analytics & Metrics**: 
  - Automation coverage percentage
  - Total automations executed (weekly trends)
  - Estimated human hours saved
  - Cost savings analysis
  - Capacity forecasting
- **🎯 Project Management**: 
  - Project detail views with comprehensive metrics
  - Gantt charts for timeline visualization
  - Team capacity planning
  - Sprint analytics
- **🔄 Redeployment Engine**: Strategic allocation of freed capacity to high-impact initiatives
- **🎨 Modern UI/UX**: Built with shadcn/ui and Tailwind CSS for a polished, responsive design

### Advanced Features
- **Skill Graph Engine**: Maps team skills and automation capabilities
- **Causal Attribution Analysis**: Tracks impact of AI tools on productivity
- **Security Audit**: Enterprise-grade security monitoring
- **Data Normalization**: Canonical event mapping across multiple data sources

## 🏗️ Architecture

The application follows a layered architecture:

1. **Data Ingestion Layer**: Connectors for Jira, Asana, and other platforms with OAuth/Token authentication
2. **Processing Layer**: Data normalization, metrics calculation, and event processing
3. **Intelligence Layer**: Redeployment engine, ROI attribution, and capacity forecasting
4. **Frontend Layer**: React-based SPA with modern UI components and state management
5. **Infrastructure Layer**: Vite build system, Vercel deployment, and monitoring

For a detailed architecture diagram, see [architecture.svg](./architecture.svg).

## 🛠️ Tech Stack

### Frontend
- **Framework**: React  with TypeScript
- **Build Tool**: Vite 
- **Routing**: React Router DOM
- **State Management**: TanStack Query (React Query)
- **UI Framework**: 
  - shadcn/ui (Radix UI components)
  - Tailwind CSS
  - Lucide React icons
- **Charts & Visualization**:
  - Chart.js 4.5.1 with React wrapper
  - Recharts 2.15.4
  - Date-fns for date handling
- **Forms**: React Hook Form  with Zod validation

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express 5.2.1
- **API Integration**: Node-fetch 3.3.2
- **Security**: CORS 2.8.5, dotenv for env management

### Development Tools
- **Linting**: ESLint 9.32.0 with TypeScript ESLint
- **Testing**: Built-in Vite test support
- **Package Manager**: npm (bun.lockb also available)

### Deployment & Monitoring
- **Platform**: Vercel
- **Analytics**: @vercel/analytics, @vercel/speed-insights
- **CI/CD**: GitHub Actions (optional)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For version control

### API Credentials (Optional but Recommended)

To use the full functionality, you'll need:

1. **Jira API Access**:
   - Jira domain (e.g., `yourcompany.atlassian.net`)
   - Email address associated with your Jira account
   - API token (generate from [Atlassian API tokens](https://id.atlassian.com/manage-profile/security/api-tokens))
   - Project key

2. **Asana API Access**:
   - Personal Access Token (generate from [Asana Developer Console](https://app.asana.com/0/my-apps))
   - Project ID

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/lavansh1306/NEW_Velocity_AI.git
cd NEW_Velocity_AI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following configuration:

```bash
# Jira API credentials
JIRA_DOMAIN=yourcompany.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your_jira_api_token
JIRA_PROJECT_KEY=YOUR_PROJECT_KEY

# Optional: custom field for team names (e.g., customfield_12345)
JIRA_TEAM_FIELD_ID=

# Asana API credentials
ASANA_TOKEN=your_asana_personal_access_token
ASANA_PROJECT_ID=your_asana_project_id

# Server port (defaults to 4000)
API_PORT=4000
```

**Note**: The application will work without API credentials, but integration features will be limited. See warnings in the console for missing configurations.

### 4. Start the Development Server

#### Frontend (React App)
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

#### Backend API Server (Optional)
In a separate terminal:

```bash
npm run api
```

The API server will run on `http://localhost:4000`.

### 5. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### 6. Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
NEW_Velocity_AI/
├── public/                  # Static assets
│   ├── data/               # CSV data files
│   └── placeholder.svg     # Image assets
├── src/
│   ├── api/                # API integration modules
│   │   └── projects/       # Project-specific API endpoints
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── jira/          # Jira-specific components
│   │   ├── demo2/         # Demo components
│   │   └── [feature].tsx  # Feature components
│   ├── contexts/          # React contexts (Toast, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and services
│   ├── pages/             # Route pages
│   │   ├── Index.tsx      # Landing page
│   │   ├── JiraDashboard.tsx
│   │   ├── AsanaDashboard.tsx
│   │   ├── Projects.tsx
│   │   ├── ProjectDetailNew.tsx
│   │   ├── ROICalculator.tsx
│   │   └── [other pages]
│   ├── App.tsx            # Main app component with routing
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── server.ts              # Express API server
├── docs/                  # Documentation
│   ├── QUICK-REFERENCE.md
│   ├── data-pipeline.md
│   └── metrics-and-architecture.md
├── architecture.svg       # System architecture diagram
├── .env                   # Environment variables (not in repo)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── vercel.json            # Vercel deployment config
└── README.md              # This file
```

## 🔧 Configuration

### Vite Configuration

The project uses Vite for fast development and optimized production builds. Key configuration in `vite.config.ts`:

- React SWC plugin for fast refresh
- Path aliases (`@/` → `src/`)
- Server configuration for development

### Tailwind CSS

Custom theme configuration in `tailwind.config.ts` with:
- Custom color palette
- Shadow utilities
- Typography plugin
- Animation utilities

### TypeScript

Strict TypeScript configuration with:
- ES2020 target
- React JSX transformation
- Path mapping for imports
- Strict type checking enabled

## 🌐 API Endpoints

The Express server provides the following REST endpoints:

### Jira Endpoints

#### Get Jira Issues
```
GET /api/issues?projectKey=YOUR_KEY
```
Returns normalized Jira issues for a project.

#### Get Jira Projects
```
GET /api/projects
```
Returns list of all Jira projects.

### Asana Endpoints

#### Get Asana Tasks
```
GET /api/asana/issues?projectKey=YOUR_PROJECT_ID
```
Returns normalized Asana tasks for a project.

### Health Check
```
GET /health
```
Returns API server health status.

### Response Format

All endpoints return JSON with the following structure:

```json
{
  "issues": [
    {
      "key": "PROJ-123",
      "issueType": "Task",
      "summary": "Task summary",
      "description": "Task description",
      "priority": "High",
      "status": "In Progress",
      "assignee": "John Doe",
      "team": "Team 1",
      "created": "2024-01-01T00:00:00Z",
      "due": "2024-01-15T00:00:00Z",
      "duration": 14
    }
  ]
}
```

## 💻 Development Workflow

### Code Style

- Follow the ESLint configuration (run `npm run lint`)
- Use TypeScript for type safety
- Follow React best practices and hooks rules

### Adding New Features

1. Create feature branch: `git checkout -b feature/your-feature-name`
2. Implement your feature in the appropriate directory
3. Test locally with `npm run dev`
4. Run linter: `npm run lint`
5. Build to verify: `npm run build`
6. Commit changes with clear messages
7. Create a pull request

### Testing

While the project doesn't include a formal test suite yet, manual testing is recommended:

1. Test all routes and navigation
2. Verify API integrations with real credentials
3. Check responsive design on multiple screen sizes
4. Test form validations and error handling

## 🚀 Deployment

### Deploying to Vercel (Recommended)

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository

2. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables in Vercel dashboard

3. **Environment Variables**: Add all variables from `.env` to Vercel's environment settings

4. **Deploy**: Vercel will automatically build and deploy your application

5. **Automatic Deployments**: Push to `main` branch triggers automatic deployments

### Alternative: Deploying to Netlify

```bash
# Build the project
npm run build

# Deploy the dist folder to Netlify
# Use Netlify CLI or drag-and-drop the dist folder
```

### Alternative: Deploying to GitHub Pages

1. Update `vite.config.ts` with base URL:
```typescript
export default defineConfig({
  base: '/NEW_Velocity_AI/',
  // ... other config
})
```

2. Build and deploy:
```bash
npm run build
# Deploy dist folder to gh-pages branch
```

### Self-Hosting

Deploy to any static hosting provider:

1. Build: `npm run build`
2. Serve the `dist/` directory
3. Configure your web server to route all requests to `index.html` (SPA mode)

Example Nginx configuration:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 🔐 Security Considerations

- **Environment Variables**: Never commit `.env` file to version control
- **API Tokens**: Rotate API tokens regularly
- **CORS**: Configure CORS appropriately for production
- **Rate Limiting**: Consider implementing rate limiting for API endpoints
- **Authentication**: Implement proper authentication for production use
- **HTTPS**: Always use HTTPS in production

## 📊 Data Pipeline

The application uses a sophisticated data pipeline:

1. **Ingestion**: Data pulled from Jira/Asana APIs
2. **Normalization**: Events mapped to canonical format
3. **Processing**: Metrics calculated from normalized events
4. **Storage**: Data cached for performance
5. **Visualization**: Rendered in dashboards and charts

See [docs/data-pipeline.md](./docs/data-pipeline.md) for detailed information.

## 📝 Key Metrics Explained

- **Automation Coverage**: Percentage of work executed automatically vs. manually
- **Human Hours Saved**: Calculated from automation events × average manual time
- **Cost Savings**: Hours saved × hourly rate (configurable)
- **Automation Growth**: Trend analysis of automation adoption over time
- **Capacity Forecasting**: Predicted future capacity based on current trends

See [docs/metrics-and-architecture.md](./docs/metrics-and-architecture.md) for formulas and implementation details.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs**: Open an issue with detailed reproduction steps
2. **Suggest Features**: Open an issue with your feature proposal
3. **Submit Pull Requests**: 
   - Fork the repository
   - Create a feature branch
   - Make your changes
   - Submit a PR with a clear description

### Development Guidelines

- Write clean, readable code with proper TypeScript types
- Follow the existing code style and conventions
- Update documentation for significant changes
- Test your changes thoroughly before submitting
- Keep PRs focused on a single feature or fix

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts by [Chart.js](https://www.chartjs.org/) and [Recharts](https://recharts.org/)

## 📞 Support

For questions, issues, or feature requests:

- Open an issue on [GitHub](https://github.com/lavansh1306/NEW_Velocity_AI/issues)
- Check existing documentation in the `docs/` folder
- Review the [TOAST_SYSTEM.md](./TOAST_SYSTEM.md) for notification system details

## 🔄 Version History

See the [commit history](https://github.com/lavansh1306/NEW_Velocity_AI/commits/main) for detailed version information.

---

**Built with ❤️ by the Velocity AI team**
