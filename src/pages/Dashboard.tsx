import { DashboardScreen } from '@/components/DashboardScreen';
import { SampleDataBanner } from '@/components/SampleDataBanner';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';

const DashboardPage = () => {
  return (
    <VelocityAISidebar>
      <div className="min-h-screen bg-[#FAFAF9]">
        <SampleDataBanner />
        <DashboardScreen />
      </div>
    </VelocityAISidebar>
  );
};

export default DashboardPage;
