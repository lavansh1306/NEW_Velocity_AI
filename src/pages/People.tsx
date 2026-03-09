import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { PeopleCapacityScreen } from '@/components/PeopleCapacityScreen';

export default function People() {
  return (
    <VelocityAISidebar>
      <div className="min-h-screen bg-[#FAFAF9]">
        <PeopleCapacityScreen />
      </div>
    </VelocityAISidebar>
  );
}
