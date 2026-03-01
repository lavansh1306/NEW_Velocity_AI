import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import ProjectCheckView from '@/components/ml-model';

export default function Plan() {
  return (
    <VelocityAISidebar>
      <div className="min-h-screen bg-[#FAFAF9]">
        <ProjectCheckView />
      </div>
    </VelocityAISidebar>
  );
}
