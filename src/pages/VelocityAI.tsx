import { useState, useEffect } from 'react';
import VeloHeader from '../components/demo2/VeloHeader';
import VeloNavTabs from '../components/demo2/VeloNavTabs';
import VPDashboard from '../components/demo2/VPDashboard';
import DashboardTab from '../components/demo2/DashboardTab';
import StandardTimeCatalogTab from '../components/demo2/StandardTimeCatalogTab';
import CapacityLedgerTab from '../components/demo2/CapacityLedgerTab';
import HotspotScoringTab from '../components/demo2/HotspotScoringTab';
import RedeploymentTab from '../components/demo2/RedeploymentTab';
import ROIVerificationTab from '../components/demo2/ROIVerificationTab';
import CausalAttributionAnalysis from '../components/demo2/CausalAttributionAnalysis';
import ProjectActivityTab from '../components/demo2/ProjectActivityTab';
import SecurityAuditTab from '../components/demo2/SecurityAuditTab';
import Projects from './Projects';
import { getJiraConnected, setJiraConnected } from '../lib/storage';

export default function VelocityAI() {
  const [currentView, setCurrentView] = useState<'manager' | 'vp'>('manager');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jiraConnected, setJiraConnectionState] = useState<boolean>(() => {
    return getJiraConnected();
  });

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

      {currentView === 'manager' && <VeloHeader currentView={currentView} onViewChange={setCurrentView} onSecurityAuditClick={handleSecurityAuditClick} />}
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
      <div className="flex">
        {currentView === 'manager' && <VeloNavTabs activeTab={activeTab} onTabChange={setActiveTab} />}
        <main className="flex-1 w-full">
          {currentView === 'vp' ? (
            <VPDashboard />
          ) : (
            <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
              {activeTab === 'dashboard' && (
                <>
                  <DashboardTab />
                  <div className="mt-8">
                    <CausalAttributionAnalysis />
                  </div>
                </>
              )}
              {activeTab === 'projects' && <Projects jiraConnected={jiraConnected} />}
              {activeTab === 'stc' && <StandardTimeCatalogTab />}
              {activeTab === 'ledger' && <CapacityLedgerTab />}
              {activeTab === 'hotspots' && <HotspotScoringTab />}
              {activeTab === 'redeployment' && <RedeploymentTab />}
              {activeTab === 'activity' && <ProjectActivityTab />}
              {activeTab === 'roi' && <ROIVerificationTab />}
              {activeTab === 'security' && <SecurityAuditTab onJiraConnectionChange={handleJiraConnectionChange} />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
