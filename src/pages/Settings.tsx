import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import SettingsScreen from '@/components/Settings';

export default function Settings() {
  return (
    <VelocityAISidebar>
      <div className="min-h-screen bg-[#FAFAF9]">
        <SettingsScreen />
      </div>
    </VelocityAISidebar>
  );
}
