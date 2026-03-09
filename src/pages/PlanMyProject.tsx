import { PlanMyProjectScreen } from '@/components/PlanMyProjectScreen';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';

export default function PlanMyProject() {
  return (
    <VelocityAISidebar>
      <div className="min-h-screen bg-[#FAFAF9]">
        <PlanMyProjectScreen />
      </div>
    </VelocityAISidebar>
  );
}
