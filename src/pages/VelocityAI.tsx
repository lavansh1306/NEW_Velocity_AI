import { useState } from 'react';
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

export default function VelocityAI() {
  const [currentView, setCurrentView] = useState<'manager' | 'vp'>('manager');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jiraConnected, setJiraConnected] = useState(true);

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

      <VeloHeader currentView={currentView} onViewChange={setCurrentView} onSecurityAuditClick={handleSecurityAuditClick} />
      <div className="flex">
        <VeloNavTabs activeTab={activeTab} onTabChange={setActiveTab} />
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
              {activeTab === 'security' && <SecurityAuditTab onJiraConnectionChange={setJiraConnected} />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
