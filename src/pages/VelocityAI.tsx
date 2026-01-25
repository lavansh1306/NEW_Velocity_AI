import { useState, useEffect } from 'react';
import VeloHeader from '../components/demo2/VeloHeader';
import VeloNavTabs from '../components/demo2/VeloNavTabs';

// Feature Components
import DashboardTab from '../components/demo2/DashboardTab';
import CapacityLedgerTab from '../components/demo2/CapacityLedgerTab';
import RedeploymentTab from '../components/demo2/RedeploymentTab';
import ROIVerificationTab from '../components/demo2/ROIVerificationTab';
import ProjectActivityTab from '../components/demo2/ProjectActivityTab';
import SecurityAuditTab from '../components/demo2/SecurityAuditTab';
import HubSpotTab from '../components/demo2/HubSpotTab';
import IntegrationsTab from '../components/demo2/IntegrationsTab';
import Projects from './Projects';
import LeaveManagementTab from '../components/leave-management'; 
import ProjectCheckView from '@/components/ml-model';
import { DeploymentView } from '@/components/demo/DeploymentView';

import { getJiraConnected, setJiraConnected } from '../lib/storage';

export default function VelocityAI() {
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

      <VeloHeader onSecurityAuditClick={handleSecurityAuditClick} />

      {/* --- MAIN CONTENT LAYOUT --- */}
      
      {/* MANAGER VIEW: Wrapped in NavTabs Sidebar */}
      <VeloNavTabs activeTab={activeTab} onTabChange={setActiveTab}>
          <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto animate-in fade-in duration-300">
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'projects' && <Projects jiraConnected={jiraConnected} withNav={false} />}
            {/* Standard Time Catalog removed */}
            {activeTab === 'ledger' && <CapacityLedgerTab />}
            {activeTab === 'hubspot' && <HubSpotTab />}
            {activeTab === 'integrations' && <IntegrationsTab />}
            {activeTab === 'redeployment' && <RedeploymentTab />}
            {activeTab === 'activity' && <ProjectActivityTab />}
            {activeTab === 'roi' && <ROIVerificationTab />}
            {activeTab === 'security' && <SecurityAuditTab onJiraConnectionChange={handleJiraConnectionChange} />}
            {activeTab === 'leave' && <LeaveManagementTab />}
            {activeTab === 'deployment' && <DeploymentView />}
          </div>
        </VeloNavTabs>
    </div>
  );
}