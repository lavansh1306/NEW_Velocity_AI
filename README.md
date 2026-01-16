# 🚀 Velocity AI - Workforce Intelligence Platform

<div align="center">

![Velocity AI](https://img.shields.io/badge/Velocity-AI-3b82f6?style=for-the-badge&logo=react&logoColor=white)

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.5-FF6384?style=flat&logo=chart.js&logoColor=white)](https://www.chartjs.org/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.83-FF4154?style=flat&logo=react-query&logoColor=white)](https://tanstack.com/query)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat)](https://opensource.org/licenses/MIT)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https://github.com/lavansh1306/NEW_Velocity_AI)

**Transform raw project events into CFO-ready insights**

[Features](#-core-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**Velocity AI** is a comprehensive workforce intelligence platform that transforms raw project events from multiple sources (Jira, Asana, HubSpot, Microsoft 365, Zapier) into actionable CFO-ready insights. The platform provides:

- **Automation Coverage Analysis**: Track what percentage of work is automated vs. manual
- **Human-Hours Saved**: Calculate time savings from AI and automation tools
- **Cost Impact Attribution**: Link automation savings to measurable business outcomes
- **Redeployment Recommendations**: Strategic allocation of freed capacity to high-impact initiatives

### 💼 Business Value

Designed for **CFOs, CHROs, and Engineering Leaders** who need to:
- Prove ROI from AI and automation investments
- Make data-driven decisions about resource allocation
- Track productivity gains across teams and projects
- Forecast capacity and plan strategic initiatives

---

## ✨ Core Features

### 🔌 **Multi-Platform Integration**
- **Jira**: Issues, sprints, timelines, and quality metrics
- **Asana**: Tasks, projects, and team workflows
- **HubSpot**: CRM deals, contacts, campaigns, and tickets
- **Microsoft 365**: Meetings, emails, calendar events, and Teams data
- **Zapier**: Workflow automation runs and metrics
- **CSV Import**: Support for custom data sources

### 📊 **Real-Time Dashboards**
- Interactive project dashboards with live metrics
- Cross-platform analytics and comparisons
- Gantt charts for timeline visualization
- Burndown charts for sprint tracking
- Custom visualizations with Chart.js and Recharts

### 💰 **ROI & Analytics**
- **Automation Coverage**: Percentage of work handled by automation
- **Time Savings**: Estimated human-hours saved from automation
- **Cost Analysis**: Financial impact of productivity gains
- **Capacity Forecasting**: Predict future team capacity
- **Causal Attribution**: Link specific tools to business outcomes

### 🎯 **Redeployment Engine**
- Skill graph mapping for team capabilities
- Strategic capacity allocation recommendations
- High-impact initiative prioritization
- Team rebalancing suggestions

### 🎨 **Modern UI/UX**
- Built with shadcn/ui and Radix UI primitives
- Fully responsive design with Tailwind CSS
- Dark/light theme support
- Accessible components (WCAG compliant)
- Toast notifications and user feedback

---

## 🏗️ Architecture

Velocity AI follows a layered architecture design for scalability and maintainability:

![Architecture Diagram](./architecture-new.svg)

### **Architecture Layers**

1. **External Data Sources**: Connect to Jira, Asana, HubSpot, Microsoft 365, Zapier, and CSV files
2. **Data Ingestion Layer**: Express API server with OAuth/token authentication
3. **Processing Layer**: Data normalization, transformation, and storage
4. **Intelligence Layer**: Metrics calculation, ROI attribution, and redeployment engine
5. **Frontend Layer**: React SPA with modern UI components and visualizations

For detailed architecture documentation, see [docs/metrics-and-architecture.md](./docs/metrics-and-architecture.md).

---

## 🛠️ Tech Stack

<details>
<summary><b>Frontend Technologies</b></summary>

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.8.3 | Type safety |
| **Vite** | 6.4.1 | Build tool & dev server |
| **React Router** | 6.30.1 | Client-side routing |
| **TanStack Query** | 5.83.0 | Data fetching & caching |
| **Tailwind CSS** | 3.4.17 | Utility-first styling |
| **shadcn/ui** | Latest | Component library (Radix UI) |
| **Chart.js** | 4.5.1 | Data visualization |
| **Recharts** | 2.15.4 | React charts |
| **Lucide React** | 0.462.0 | Icon library |
| **React Hook Form** | 7.61.1 | Form management |
| **Zod** | 3.25.76 | Schema validation |
| **date-fns** | 3.6.0 | Date utilities |

</details>

<details>
<summary><b>Backend Technologies</b></summary>

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 5.2.1 | Web framework |
| **TypeScript** | 5.8.3 | Type safety |
| **CORS** | 2.8.5 | Cross-origin requests |
| **dotenv** | 17.2.3 | Environment variables |
| **csv-parse** | 6.1.0 | CSV parsing |
| **node-fetch** | 3.3.2 | HTTP client |
| **express-session** | 1.17.3 | Session management |

</details>

<details>
<summary><b>Development & Build Tools</b></summary>

| Technology | Version | Purpose |
|-----------|---------|---------|
| **ESLint** | 9.32.0 | Code linting |
| **TypeScript ESLint** | 8.38.0 | TypeScript linting |
| **PostCSS** | 8.5.6 | CSS processing |
| **Autoprefixer** | 10.4.21 | CSS vendor prefixes |
| **tsx** | 4.21.0 | TypeScript execution |
| **ts-node** | 1.7.1 | TypeScript Node.js |

</details>

<details>
<summary><b>Deployment & Monitoring</b></summary>

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Vercel** | Latest | Hosting platform |
| **@vercel/analytics** | 1.5.0 | Usage analytics |
| **@vercel/speed-insights** | 1.2.0 | Performance monitoring |

</details>

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 18.x or higher ([download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lavansh1306/NEW_Velocity_AI.git
   cd NEW_Velocity_AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (Optional but recommended)
   
   Create a `.env` file in the root directory:
   ```bash
   # Jira Configuration
   JIRA_DOMAIN=yourcompany.atlassian.net
   JIRA_EMAIL=your-email@company.com
   JIRA_API_TOKEN=your_jira_api_token
   JIRA_PROJECT_KEY=YOUR_PROJECT_KEY
   JIRA_TEAM_FIELD_ID=customfield_xxxxx
   
   # Asana Configuration
   ASANA_TOKEN=your_asana_personal_access_token
   ASANA_PROJECT_ID=your_asana_project_id
   
   # HubSpot Configuration
   HUBSPOT_API_KEY=your_hubspot_api_key
   
   # Microsoft 365 Configuration
   MS365_CLIENT_ID=your_azure_app_client_id
   MS365_CLIENT_SECRET=your_azure_app_client_secret
   MS365_TENANT_ID=your_azure_tenant_id
   
   # Server Configuration
   API_PORT=4000
   ```

   > **Note**: The app works without API credentials using demo CSV data from `public/data/`

4. **Start the development server**
   
   **Frontend (React app):**
   ```bash
   npm run dev
   ```
   
   Access the app at `http://localhost:5173`

   **Backend API (optional, in a new terminal):**
   ```bash
   npm run api
   ```
   
   API server runs at `http://localhost:4000`

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

---

## 📁 Project Structure

```
NEW_Velocity_AI/
├── 📁 public/                      # Static assets
│   ├── data/                       # Demo CSV data files
│   │   ├── jira_events.csv
│   │   ├── asana_events.csv
│   │   ├── hubspot_events.csv
│   │   ├── microsoft365_events.csv
│   │   ├── zapier_events.csv
│   │   └── projects-*.csv
│   ├── placeholder.svg
│   └── robots.txt
│
├── 📁 src/                         # Main application source
│   ├── 📁 api/                     # API route handlers
│   │   ├── hubspot/                # HubSpot integration
│   │   ├── microsoft365/           # Microsoft 365 integration
│   │   └── projects/               # Project endpoints
│   │
│   ├── 📁 components/              # React components
│   │   ├── ui/                     # shadcn/ui components (40+)
│   │   ├── analytics/              # Chart components
│   │   │   ├── AnalyticsPanel.tsx
│   │   │   ├── AIUsageChart.tsx
│   │   │   ├── BurndownChart.tsx
│   │   │   ├── GanttChart.tsx
│   │   │   └── custom/             # Custom visualizations
│   │   ├── jira/                   # Jira-specific components
│   │   ├── asana/                  # Asana-specific components
│   │   ├── hubspot/                # HubSpot-specific components
│   │   ├── microsoft365/           # Microsoft 365 components
│   │   ├── demo/                   # Demo components
│   │   │   ├── LiveFeed.tsx
│   │   │   ├── ROIMetrics.tsx
│   │   │   ├── RedeploymentView.tsx
│   │   │   └── TimeTracking.tsx
│   │   ├── demo2/                  # Advanced demo components
│   │   │   ├── VPDashboard.tsx
│   │   │   ├── DashboardTab.tsx
│   │   │   ├── RedeploymentTab.tsx
│   │   │   └── [other tabs]
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   └── [other components]
│   │
│   ├── 📁 pages/                   # Route components
│   │   ├── Index.tsx               # Landing page
│   │   ├── Demo.tsx                # Main demo
│   │   ├── JiraDashboard.tsx       # Jira dashboard
│   │   ├── AsanaDashboard.tsx      # Asana dashboard
│   │   ├── HubSpotDashboard.tsx    # HubSpot dashboard
│   │   ├── Microsoft365Dashboard.tsx
│   │   ├── Projects.tsx            # Projects list
│   │   ├── ProjectDetailNew.tsx    # Project details
│   │   ├── ROICalculator.tsx       # ROI calculator
│   │   ├── ROIReport.tsx           # ROI reports
│   │   ├── VelocityAI.tsx          # VP dashboard
│   │   ├── UseCases.tsx            # Use cases page
│   │   ├── GlobalCapacity.tsx      # Capacity view
│   │   └── NotFound.tsx            # 404 page
│   │
│   ├── 📁 lib/                     # Core utilities
│   │   ├── normalizers/            # Data normalizers
│   │   │   ├── jira.ts             # Jira normalization
│   │   │   ├── asana.ts            # Asana normalization
│   │   │   ├── hubspot.ts          # HubSpot normalization
│   │   │   ├── microsoft365.ts     # Microsoft 365 normalization
│   │   │   └── zapier.ts           # Zapier normalization
│   │   ├── api.ts                  # API client
│   │   ├── dataService.ts          # Data fetching service
│   │   ├── metrics.ts              # Metrics calculations
│   │   ├── storage.ts              # Local storage
│   │   ├── csvLoader.ts            # CSV parsing
│   │   ├── types.ts                # TypeScript types
│   │   └── utils.ts                # Utility functions
│   │
│   ├── 📁 hooks/                   # Custom React hooks
│   │   ├── use-toast.ts
│   │   ├── use-mobile.tsx
│   │   └── useNotification.ts
│   │
│   ├── 📁 contexts/                # React contexts
│   │   └── ToastContext.tsx
│   │
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
│
├── 📁 docs/                        # Documentation
│   ├── data-pipeline.md
│   ├── metrics-and-architecture.md
│   └── QUICK-REFERENCE.md
│
├── 📁 api/                         # Serverless API
│   └── index.ts
│
├── server.ts                       # Express server
├── architecture-new.svg            # Architecture diagram
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite config
├── tailwind.config.ts              # Tailwind config
├── vercel.json                     # Vercel config
└── README.md                       # This file
```

---

## 🔌 API Endpoints

The Express API server provides RESTful endpoints for data access:

### Jira Endpoints

```http
GET /api/issues?projectKey=YOUR_KEY
GET /api/projects
```

### Asana Endpoints

```http
GET /api/asana/issues?projectKey=PROJECT_ID
```

### HubSpot Endpoints

```http
GET /api/hubspot/deals
GET /api/hubspot/contacts
GET /api/hubspot/campaigns
```

### Microsoft 365 Endpoints

```http
GET /api/microsoft365/meetings
GET /api/microsoft365/emails
GET /api/microsoft365/roi
```

### Health Check

```http
GET /health
```

**Response Format:**
```json
{
  "issues": [
    {
      "key": "PROJ-123",
      "issueType": "Task",
      "summary": "Task summary",
      "priority": "High",
      "status": "In Progress",
      "assignee": "John Doe",
      "created": "2024-01-01T00:00:00Z",
      "duration": 14
    }
  ]
}
```

---

## 📊 Key Metrics & Calculations

### Automation Coverage
```
Automation Coverage (%) = (Automated Tasks / Total Tasks) × 100
```

### Human Hours Saved
```
Hours Saved = Σ(Task Duration × Automation Efficiency)
```

### Cost Savings
```
Cost Savings ($) = Hours Saved × Hourly Rate
```

### Capacity Forecast
```
Future Capacity = Current Capacity + (Hours Saved / Work Week Hours)
```

For detailed metric formulas, see [docs/metrics-and-architecture.md](./docs/metrics-and-architecture.md).

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure Environment Variables**
   - Add all variables from `.env` in Vercel dashboard
   - Go to Settings → Environment Variables

4. **Deploy**
   - Vercel automatically builds and deploys
   - Automatic deployments on every push to `main`

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lavansh1306/NEW_Velocity_AI)

### Alternative Deployment Options

<details>
<summary><b>Deploy to Netlify</b></summary>

```bash
npm run build
# Deploy the dist/ folder to Netlify
```

1. Sign up at [netlify.com](https://netlify.com)
2. Drag and drop the `dist/` folder
3. Or use Netlify CLI: `netlify deploy --prod`

</details>

<details>
<summary><b>Self-Hosting with Docker</b></summary>

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

```bash
docker build -t velocity-ai .
docker run -p 5173:5173 velocity-ai
```

</details>

<details>
<summary><b>Static Hosting (Nginx)</b></summary>

Build the project and serve the `dist/` folder:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/velocity-ai/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

</details>

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev          # Start Vite dev server (port 5173)
npm run api          # Start Express API server (port 4000)

# Building
npm run build        # Production build
npm run build:dev    # Development build

# Quality Checks
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Adding a New Integration

1. **Create normalizer**: `src/lib/normalizers/yourplatform.ts`
   ```typescript
   export function normalizeYourPlatformEvents(data: any[]): Event[] {
     return data.map(item => ({
       // Transform to canonical event format
     }));
   }
   ```

2. **Add API routes**: `src/api/yourplatform/routes.ts`
   ```typescript
   app.get('/api/yourplatform/data', async (req, res) => {
     // Fetch and return data
   });
   ```

3. **Create components**: `src/components/yourplatform/`

4. **Add dashboard page**: `src/pages/YourPlatformDashboard.tsx`

5. **Register route**: Update `src/App.tsx`

### Code Style Guidelines

- Use TypeScript for all new code
- Follow ESLint configuration
- Use functional components with hooks
- Implement proper error handling
- Add JSDoc comments for complex functions
- Keep components small and focused

---

## 📚 Documentation

- **[Quick Reference](./docs/QUICK-REFERENCE.md)** - Common tasks and commands
- **[Data Pipeline](./docs/data-pipeline.md)** - Data ingestion and processing
- **[Metrics & Architecture](./docs/metrics-and-architecture.md)** - System design and calculations
- **[Toast System](./TOAST_SYSTEM.md)** - Notification system documentation
- **[Integration Guide](./INTEGRATION_GUIDE.md)** - Adding new integrations

---

## 🔐 Security

- **Environment Variables**: Never commit `.env` files
- **API Tokens**: Rotate regularly and store securely
- **CORS**: Configured for production domains
- **Authentication**: OAuth 2.0 and token-based auth
- **HTTPS**: Always use HTTPS in production
- **Input Validation**: Zod schemas for all user inputs

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Bugs

1. Check if the issue already exists
2. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its benefits
3. Provide mockups or examples if possible

### Submitting Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/NEW_Velocity_AI.git
   cd NEW_Velocity_AI
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow the existing code style
   - Add tests if applicable

4. **Test your changes**
   ```bash
   npm run lint
   npm run build
   npm run dev
   ```

5. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new feature description"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Development Setup

See [Quick Start](#-quick-start) for development environment setup.

---

## 🎯 Use Cases

### For CFOs
- **ROI Measurement**: Quantify returns from AI/automation investments
- **Cost Analysis**: Track operational cost reductions
- **Budget Planning**: Forecast future capacity and resource needs

### For CHROs
- **Workforce Planning**: Optimize team allocation and utilization
- **Skill Mapping**: Identify team capabilities and gaps
- **Redeployment**: Strategic reallocation of freed capacity

### For Engineering Leaders
- **Productivity Tracking**: Monitor team velocity and efficiency
- **Tool Adoption**: Measure impact of new tools and processes
- **Process Optimization**: Identify bottlenecks and improvements

### For Project Managers
- **Project Analytics**: Real-time project health and metrics
- **Timeline Tracking**: Gantt charts and burndown analysis
- **Resource Management**: Team capacity and allocation

---

## 🏆 Key Achievements

- **End-to-end analytics pipeline** from multiple data sources
- **Causal attribution engine** linking tools to business outcomes
- **Redeployment intelligence** for strategic capacity allocation
- **CFO-ready insights** with ROI and cost impact analysis
- **Modular architecture** for easy integration additions
- **Production-ready** with Vercel deployment and monitoring

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Icons**: [Lucide](https://lucide.dev/)
- **Charts**: [Chart.js](https://www.chartjs.org/) and [Recharts](https://recharts.org/)
- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 Support

For questions, issues, or feature requests:

- **GitHub Issues**: [Open an issue](https://github.com/lavansh1306/NEW_Velocity_AI/issues)
- **Documentation**: Check the [docs/](./docs/) folder
- **Examples**: See [TOAST_EXAMPLES.md](./TOAST_EXAMPLES.md)

---

## 🔄 Changelog

See the [commit history](https://github.com/lavansh1306/NEW_Velocity_AI/commits/main) for detailed version information.

---

<div align="center">

**Built with ❤️ by the Velocity AI Team**

[⬆ Back to Top](#-velocity-ai---workforce-intelligence-platform)

</div>
