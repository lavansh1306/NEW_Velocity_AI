import { useNavigate } from 'react-router-dom';
import { Users, FolderPlus, Clock, CalendarDays, ArrowRight, Rocket } from 'lucide-react';
import { SETUP_STEPS } from '@/services/setupProgressService';

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  FolderPlus,
  Clock,
  CalendarDays,
};

interface ManagerEmptyDashboardProps {
  orgName: string | null;
  completedSteps: string[];
}

export function ManagerEmptyDashboard({ orgName, completedSteps }: ManagerEmptyDashboardProps) {
  const navigate = useNavigate();

  const incompleteSteps = SETUP_STEPS.filter(
    (step) => !completedSteps.includes(step.key)
  );

  return (
    <div className="max-w-[900px] mx-auto pb-10">
      {/* Welcome Header */}
      <div className="text-center mb-12 pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FEF3C7] border border-[#FDE68A] mb-6">
          <Rocket className="w-7 h-7 text-[#F59E0B]" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-light text-[#1C1917] tracking-tight mb-2">
          Welcome{orgName ? ` to ${orgName}` : ''}!
        </h1>
        <p className="text-base text-[#78716C] font-light max-w-md mx-auto">
          Let's get your workspace set up. Complete these steps to unlock the full power of Velocity AI.
        </p>
      </div>

      {/* Setup Steps */}
      <div className="space-y-4">
        {incompleteSteps.map((step) => {
          const IconComponent = ICON_MAP[step.icon] || Clock;
          return (
            <div
              key={step.key}
              className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300"
            >
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-lg bg-[#F5F5F4] flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-5 h-5 text-[#78716C]" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1C1917] mb-0.5">{step.label}</div>
                  <p className="text-xs text-[#78716C] font-light">{getStepDescription(step.key)}</p>
                </div>
                <button
                  onClick={() => navigate(step.route)}
                  className="text-xs text-[#0F766E] hover:text-[#0D9488] font-medium flex items-center gap-1 flex-shrink-0 transition-colors"
                >
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle footer note */}
      <p className="text-center text-xs text-[#A8A29E] font-light mt-10">
        Once setup is complete, your dashboard will show team capacity, project health, and AI insights.
      </p>
    </div>
  );
}

function getStepDescription(key: string): string {
  switch (key) {
    case 'team_members_added':
      return 'Invite your team so you can plan capacity and assign work across your organization.';
    case 'first_project_created':
      return 'Create a project to start tracking tasks, timelines, and team allocation.';
    case 'working_hours_configured':
      return 'Set your team\'s working hours so capacity planning is accurate.';
    case 'holidays_configured':
      return 'Add company holidays to account for time off in project timelines.';
    default:
      return '';
  }
}
