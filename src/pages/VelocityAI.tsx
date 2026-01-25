import { useState, useEffect } from 'react';
import VeloHeader from '../components/demo2/VeloHeader';
import VeloNavTabs from '../components/demo2/VeloNavTabs';

// Feature Components
import DashboardTab from '../components/demo2/DashboardTab';
import StandardTimeCatalogTab from '../components/demo2/StandardTimeCatalogTab';
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
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Global Styles for specific sub-components */}
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

      {/* 1. Header (Fixed Top) */}
      <VeloHeader 
        currentView="manager" 
        onViewChange={() => {}} // No-op: View switching disabled
        onSecurityAuditClick={handleSecurityAuditClick} 
      />

      {/* 2. Main Layout (Sidebar + Content) */}
      <VeloNavTabs activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="px-4 sm:px-6 py-8 max-w-[1600px] mx-auto animate-in fade-in duration-300 w-full">
          
          {/* Dashboard & Analytics */}
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'roi' && <ROIVerificationTab />}
          {activeTab === 'activity' && <ProjectActivityTab />}
          
          {/* Project Management */}
          {activeTab === 'projects' && <Projects jiraConnected={jiraConnected} withNav={false} />}
          {activeTab === 'stc' && <StandardTimeCatalogTab />}
          
          {/* Resource Management */}
          {activeTab === 'ledger' && <CapacityLedgerTab />}
          {activeTab === 'redeployment' && <RedeploymentTab />}
          {activeTab === 'leave' && <LeaveManagementTab />}
          {activeTab === 'projectcheck' && <ProjectCheckView />}

          {/* Integrations & Admin */}
          {activeTab === 'hubspot' && <HubSpotTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}
          {activeTab === 'security' && <SecurityAuditTab onJiraConnectionChange={handleJiraConnectionChange} />}
          
        </div>
      </VeloNavTabs>
    </div>
  );
}