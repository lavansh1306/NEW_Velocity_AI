import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import LeaveManagementTab from '@/components/leave-management';

export default function Leave() {
  return (
    <VelocityAISidebar>
      <div className="min-h-screen bg-[#FAFAF9]">
        <LeaveManagementTab />
      </div>
    </VelocityAISidebar>
  );
}
