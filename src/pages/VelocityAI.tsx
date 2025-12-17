import { useState } from 'react';
import VeloHeader from '../components/demo2/VeloHeader';
import VeloNavTabs from '../components/demo2/VeloNavTabs';
import VPDashboard from '../components/demo2/VPDashboard';
import DashboardTab from '../components/demo2/DashboardTab';
import IntegrationsTab from '../components/demo2/IntegrationsTab';
import StandardTimeCatalogTab from '../components/demo2/StandardTimeCatalogTab';
import CapacityLedgerTab from '../components/demo2/CapacityLedgerTab';
import HotspotScoringTab from '../components/demo2/HotspotScoringTab';
import RedeploymentTab from '../components/demo2/RedeploymentTab';
import ROIVerificationTab from '../components/demo2/ROIVerificationTab';
import CausalAttributionAnalysis from '../components/demo2/CausalAttributionAnalysis';
import ProjectActivityTab from '../components/demo2/ProjectActivityTab';
import Projects from './Projects';

interface IntegrationState {
  jira: boolean;
  hubspot: boolean;
  asana: boolean;
  microsoft365: boolean;
  zapier: boolean;
}

export default function VelocityAI() {
  const [currentView, setCurrentView] = useState<'manager' | 'vp'>('manager');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [integrationStates, setIntegrationStates] = useState<IntegrationState>({
    jira: true,
    hubspot: true,
    asana: true,
    microsoft365: true,
    zapier: false,
  });

  const handleIntegrationToggle = (integrationId: string) => {
    setIntegrationStates(prev => ({
      ...prev,
      [integrationId]: !prev[integrationId]
    }));
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

      <VeloHeader currentView={currentView} onViewChange={setCurrentView} />
      <VeloNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex">
        <aside className="hidden md:flex md:w-56 h-screen sticky top-20 bg-white border-r border-gray-200">
          <div className="flex flex-col py-6 w-full">
            <div className="px-4 space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'projects', label: 'Projects' },
                { id: 'integrations', label: 'Data Integrations' },
                { id: 'stc', label: 'Standard Time Catalog' },
                { id: 'activity', label: 'Project Activity' },
                { id: 'ledger', label: 'Capacity Ledger' },
                { id: 'hotspots', label: 'Hotspot Scoring' },
                { id: 'redeployment', label: 'Redeployment' },
                { id: 'roi', label: 'ROI Verification' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 font-semibold text-sm transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-l-4 border-blue-600 bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
        <main className="flex-1 w-full">
          {currentView === 'vp' ? (
            <VPDashboard />
          ) : (
            <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'integrations' && <IntegrationsTab integrationStates={integrationStates} onToggleIntegration={handleIntegrationToggle} />}
              {activeTab === 'projects' && <Projects jiraConnected={integrationStates.jira} />}
              {activeTab === 'stc' && <StandardTimeCatalogTab />}
              {activeTab === 'ledger' && <CapacityLedgerTab />}
              {activeTab === 'hotspots' && <HotspotScoringTab />}
              {activeTab === 'redeployment' && <RedeploymentTab />}
              {activeTab === 'activity' && <ProjectActivityTab />}
              {activeTab === 'roi' && <ROIVerificationTab />}

              {/* Add causal attribution analysis for manager view */}
              <div className="mt-8">
                <CausalAttributionAnalysis />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
