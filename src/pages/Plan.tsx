import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { PlanMyProjectScreen } from '@/components/PlanMyProjectScreen';

export default function Plan() {
  return (
    <VelocityAISidebar>
      <div className="min-h-screen bg-[#FAFAF9]">
        <PlanMyProjectScreen />
      </div>
    </VelocityAISidebar>
  );
}
