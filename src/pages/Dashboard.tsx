import { DashboardScreen } from '@/components/DashboardScreen';
import { SampleDataBanner } from '@/components/SampleDataBanner';
import { StandupCard } from '@/components/StandupCard';
import { AgentSyncCard } from '@/components/AgentSyncCard';
import { BurnoutWarning } from '@/components/BurnoutWarning';
import { BriefMeCard } from '@/components/BriefMeCard';
import { DeadlineRiskPredictor } from '@/components/DeadlineRiskPredictor';
import { MoodPulseWidget } from '@/components/MoodPulse';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';

const DashboardPage = () => {
  return (
    <VelocityAISidebar>
      <div className="min-h-screen bg-[#FAFAF9]">
        <BriefMeCard />
        <SampleDataBanner />
        <StandupCard />
        <AgentSyncCard />
        <BurnoutWarning />
        <DeadlineRiskPredictor />
        <MoodPulseWidget />
        <DashboardScreen />
      </div>
    </VelocityAISidebar>
  );
};

export default DashboardPage;
