import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSetupProgress } from '@/hooks/useSetupProgress';
import { setupProgressService, SETUP_STEPS } from '@/services/setupProgressService';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Users, FolderPlus, Clock, CalendarDays, X, Rocket } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  FolderPlus,
  Clock,
  CalendarDays,
};

export const IncompleteSetupBanner = () => {
  const navigate = useNavigate();
  const { orgId, orgName } = useAuth();
  const { completedSteps, isLoading, fetchProgress } = useSetupProgress();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (orgId) {
      fetchProgress(orgId);
    }
  }, [orgId, fetchProgress]);

  // Don't render if loading, dismissed, no org, or all setup steps already done
  if (
    isLoading ||
    dismissed ||
    !orgId ||
    setupProgressService.isComplete(completedSteps)
  ) {
    return null;
  }

  const percentage = setupProgressService.getPercentage(completedSteps);
  const incompleteItems = setupProgressService.getIncompleteItems(completedSteps);

  return (
    <div className="mb-6 bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm relative">
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-[#A8A29E] hover:text-[#57534E] transition-colors p-1 rounded-md hover:bg-[#F5F5F4]"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
          <Rocket className="w-5 h-5 text-[#F59E0B]" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#1C1917]">
            Complete Your Setup
          </h3>
          <p className="text-xs text-[#78716C] font-light mt-0.5">
            You're {percentage}% done! Finish setting up{' '}
            {orgName ? `"${orgName}"` : 'your workspace'} to unlock the full
            power of Velocity AI.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-5">
        <Progress value={percentage} className="h-2 flex-1 bg-[#F5F5F4]" />
        <span className="text-xs font-medium text-[#78716C] min-w-[32px] text-right">
          {percentage}%
        </span>
      </div>

      {/* Step items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SETUP_STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.key);
          const IconComponent = ICON_MAP[step.icon] || Circle;

          return (
            <button
              key={step.key}
              onClick={() => !isCompleted && navigate(step.route)}
              disabled={isCompleted}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                isCompleted
                  ? 'bg-[#F5F5F4] opacity-60 cursor-default'
                  : 'bg-[#FAFAF9] border border-[#E7E5E4] hover:border-[#D6D3D1] hover:bg-white cursor-pointer'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <IconComponent className="w-4 h-4 text-[#A8A29E] shrink-0" />
              )}
              <span
                className={`text-sm ${
                  isCompleted
                    ? 'text-[#A8A29E] line-through'
                    : 'text-[#57534E] font-medium'
                }`}
              >
                {step.label}
              </span>
              {!isCompleted && (
                <span className="ml-auto text-[#D6D3D1] text-sm">→</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
