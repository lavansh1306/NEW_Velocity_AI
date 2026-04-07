import { DashboardScreen } from '@/components/DashboardScreen';
import { SampleDataBanner } from '@/components/SampleDataBanner';
import { StandupCard } from '@/components/StandupCard';
import { AgentSyncCard } from '@/components/AgentSyncCard';
import { BurnoutWarning } from '@/components/BurnoutWarning';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';

const DashboardPage = () => {
  return (
    <VelocityAISidebar>
      <div className="min-h-screen bg-[#FAFAF9]">
        <SampleDataBanner />
        <StandupCard />
        <AgentSyncCard />
        <BurnoutWarning />
        <DashboardScreen />
      </div>
    </VelocityAISidebar>
  );
};

export default DashboardPage;
