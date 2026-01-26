import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Zap, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  Clock 
} from 'lucide-react';

// Layout Components
import VeloHeader from '../components/demo2/VeloHeader';
import VeloNavTabs from '../components/demo2/VeloNavTabs';
import VPDashboard from '../components/demo2/VPDashboard';

// Feature Components
import StandardTimeCatalogTab from '../components/demo2/StandardTimeCatalogTab';
import CapacityLedgerTab from '../components/demo2/CapacityLedgerTab';
import ROIVerificationTab from '../components/demo2/ROIVerificationTab';
import ProjectActivityTab from '../components/demo2/ProjectActivityTab';
import SecurityAuditTab from '../components/demo2/SecurityAuditTab';
import HubSpotTab from '../components/demo2/HubSpotTab';
import IntegrationsTab from '../components/demo2/IntegrationsTab';
import Projects from './Projects';
import LeaveManagementTab from '../components/leave-management'; 
import ProjectCheckView from '@/components/ml-model';

import { getJiraConnected, setJiraConnected } from '../lib/storage';
import { apiUrl } from '../lib/api';

// Fetch Jira connection status using API
async function fetchJiraStatus() {
  try {
    const response = await fetch(apiUrl('/api/jira/auth/status'), {
      credentials: 'include'
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.connected ? data : null;
  } catch (error) {
    console.error('Error fetching Jira status:', error);
    return null;
  }
}

// Fetch Jira resources using OAuth token
async function fetchJiraData() {
  const status = await fetchJiraStatus();
  
  if (!status || !status.connected) {
    console.warn('No Jira connection found');
    return null;
  }

  try {
    const cloudId = status.site?.cloudId;
    
    if (!cloudId) {
      console.warn('No Jira cloudId found');
      return null;
    }
    
    // Fetch projects from Jira API through our backend
    const projectsRes = await fetch(apiUrl('/api/jira/projects'), {
      credentials: 'include'
    });

    if (!projectsRes.ok) {
      throw new Error(`Failed to fetch projects: ${projectsRes.statusText}`);
    }

    const projectsData = await projectsRes.json();
    const projects = projectsData.projects || [];
    
    console.log('Jira data fetched successfully:', { 
      site: status.site,
      availableSites: status.availableSites,
      projects: projects.length 
    });
    
    return { 
      resources: status.availableSites,
      projects, 
      cloudId,
      site: status.site
    };
  } catch (error) {
    console.error('Error fetching Jira data:', error);
    return null;
  }
}

// --- NEW MODERN DASHBOARD COMPONENT (Placeholder) ---
const ModernDashboard = ({ jiraData }: { jiraData: any }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Jira Connection Status Banner */}
      {jiraData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Jira Connected</h3>
              <p className="text-sm text-green-700">
                {jiraData.resources?.length || 0} workspace(s) • {jiraData.projects?.length || 0} project(s) loaded
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, Manager</h1>
          <p className="text-gray-500">Here's what's happening with your teams today.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
            Download Report
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md transition-all hover:shadow-lg">
            + New Project
          </button>
        </div>
      </div>

      {/* Jira Projects List */}
      {jiraData?.projects && jiraData.projects.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Jira Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jiraData.projects.slice(0, 9).map((project: any) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  {project.avatarUrls?.['48x48'] && (
                    <img src={project.avatarUrls['48x48']} alt={project.name} className="w-10 h-10 rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{project.name}</h4>
                    <p className="text-sm text-gray-500">{project.key}</p>
                    <p className="text-xs text-gray-400 mt-1">{project.projectTypeKey}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Team Velocity', value: '124 pts', change: '+12%', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Active Projects', value: '8', change: 'On Track', icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Resource Health', value: '94%', change: '+2.4%', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Team Members', value: '24', change: 'Full Capacity', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                {stat.change} <ArrowUpRight className="w-3 h-3 ml-1" />
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Charts Area (Visual Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Chart Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              Sprint Performance
            </h3>
            <select className="text-sm border-gray-200 rounded-md text-gray-500 bg-gray-50 px-2 py-1">
              <option>Last 30 Days</option>
            </select>
          </div>
          {/* Decorative Chart Bars */}
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
              <div key={i} className="w-full bg-indigo-50 rounded-t-sm relative group">
                <div 
                  className="absolute bottom-0 w-full bg-indigo-500 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-600"
                  style={{ height: `${h}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium">
            <span>Sprint 1</span>
            <span>Sprint 2</span>
            <span>Sprint 3</span>
            <span>Sprint 4</span>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Recent Updates
          </h3>
          <div className="space-y-6">
            {[
              { title: 'Deployment Success', time: '2 hours ago', desc: 'Velocity AI v2.0 deployed to prod', color: 'bg-emerald-500' },
              { title: 'New Alert', time: '4 hours ago', desc: 'High capacity usage in Design Team', color: 'bg-amber-500' },
              { title: 'Jira Sync', time: '5 hours ago', desc: 'Automatic synchronization complete', color: 'bg-blue-500' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};


export default function VelocityAI() {
  const [currentView, setCurrentView] = useState<'manager' | 'vp'>('manager');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jiraConnected, setJiraConnectionState] = useState<boolean>(() => {
    return getJiraConnected();
  });
  const [jiraData, setJiraData] = useState<any>(null);

  // Fetch Jira data on mount if token exists
  useEffect(() => {
    fetchJiraData().then(data => {
      if (data) {
        setJiraData(data);
        setJiraConnectionState(true);
        console.log('Jira connected with data:', data);
      }
    });
  }, []);

  // Save to localStorage whenever jiraConnected changes
  useEffect(() => {
    setJiraConnected(jiraConnected);
  }, [jiraConnected]);

  const handleJiraConnectionChange = (connected: boolean) => {
    setJiraConnectionState(connected);
  };

  const handleSecurityAuditClick = () => {
    setActiveTab('security');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <style>{`
        .capacity-bar {
          height: 24px;
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .hotspot-card {
          transition: all 0.2s ease;
        }
        .hotspot-card:hover {
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
      `}</style>

      {/* --- HEADERS --- */}
      {currentView === 'manager' && (
        <VeloHeader 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          onSecurityAuditClick={handleSecurityAuditClick} 
        />
      )}

      {currentView === 'vp' && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center">
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setCurrentView('manager')}
                className={`h-8 sm:h-10 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentView === 'manager'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="hidden sm:inline">Manager View</span>
                </span>
              </button>
              <button
                onClick={() => setCurrentView('vp')}
                className={`h-8 sm:h-10 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentView === 'vp'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">VP Executive View</span>
                </span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* --- MAIN CONTENT LAYOUT --- */}
      
      {currentView === 'vp' ? (
        // VP VIEW: Full width, no sidebar
        <main className="w-full">
          <VPDashboard />
        </main>
      ) : (
        // MANAGER VIEW: Wrapped in NavTabs Sidebar
        <VeloNavTabs activeTab={activeTab} onTabChange={setActiveTab}>
          <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto animate-in fade-in duration-300">
            
            {/* 1. UPDATED DASHBOARD: Uses the new pleasant component */}
            {activeTab === 'dashboard' && <ModernDashboard jiraData={jiraData} />}
            
            {activeTab === 'projects' && <Projects jiraConnected={jiraConnected} withNav={false} />}
            {activeTab === 'stc' && <StandardTimeCatalogTab />}
            {activeTab === 'ledger' && <CapacityLedgerTab />}
            {activeTab === 'hubspot' && <HubSpotTab />}
            {activeTab === 'integrations' && <IntegrationsTab />}
            
            {/* 2. FIXED ROUTING: 'redeployment' AND 'projectcheck' both open the ML Model */}
            {activeTab === 'deployment' && <ProjectCheckView />}
            
            {activeTab === 'activity' && <ProjectActivityTab />}
            {activeTab === 'roi' && <ROIVerificationTab />}
            {activeTab === 'security' && <SecurityAuditTab onJiraConnectionChange={handleJiraConnectionChange} />}
            {activeTab === 'leave' && <LeaveManagementTab />}
            
          </div>
        </VeloNavTabs>
      )}
    </div>
  );
}