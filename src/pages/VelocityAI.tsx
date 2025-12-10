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

export default function VelocityAI() {
  const [currentView, setCurrentView] = useState<'manager' | 'vp'>('manager');
  const [activeTab, setActiveTab] = useState('dashboard');

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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {currentView === 'manager' && (
            <VeloNavTabs activeTab={activeTab} onTabChange={setActiveTab} />
          )}

          <main className="flex-1">
            {currentView === 'vp' ? (
              <VPDashboard />
            ) : (
              <>
                {activeTab === 'dashboard' && <DashboardTab />}
                {activeTab === 'integrations' && <IntegrationsTab />}
                {activeTab === 'stc' && <StandardTimeCatalogTab />}
                {activeTab === 'ledger' && <CapacityLedgerTab />}
                {activeTab === 'hotspots' && <HotspotScoringTab />}
                {activeTab === 'redeployment' && <RedeploymentTab />}
                {activeTab === 'roi' && <ROIVerificationTab />}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
