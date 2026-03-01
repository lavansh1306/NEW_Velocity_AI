import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import PeopleCapacityTab from '@/components/demo2/PeopleCapacityTab';

export default function People() {
  return (
    <VelocityAISidebar>
      <div className="min-h-screen bg-[#FAFAF9]">
        <PeopleCapacityTab />
      </div>
    </VelocityAISidebar>
  );
}
