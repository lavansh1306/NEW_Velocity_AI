import { useNavigate } from 'react-router-dom';
import { User, Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';

interface EmptyDashboardStateProps {
  userName: string;
}

export function EmptyDashboardState({ userName }: EmptyDashboardStateProps) {
  const navigate = useNavigate();

  const steps = [
    {
      icon: User,
      title: 'Complete Your Profile',
      description: 'Add your skills, designation, and personal details so your team knows you better.',
      action: 'Go to Profile',
      path: '/app/employee/profile',
    },
    {
      icon: Calendar,
      title: 'Check Upcoming Holidays',
      description: 'View company holidays and plan your time off in advance.',
      action: 'View Holidays',
      path: '/app/employee/time',
    },
    {
      icon: Clock,
      title: 'Set Up Your Timesheet',
      description: 'Get familiar with the timesheet module so you\'re ready when tasks come in.',
      action: 'Open Timesheet',
      path: '/app/employee/time',
    },
  ];

  return (
    <div className="max-w-[900px] mx-auto pb-10">
      {/* Welcome Header */}
      <div className="text-center mb-12 pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] mb-6">
          <Sparkles className="w-7 h-7 text-[#0F766E]" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-light text-[#1C1917] tracking-tight mb-2">
          Welcome, {userName}!
        </h1>
        <p className="text-base text-[#78716C] font-light max-w-md mx-auto">
          You don't have any projects or tasks assigned yet. While you wait, here are a few things you can do to get started.
        </p>
      </div>

      {/* Next Steps */}
      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.title}
            className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300"
          >
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 rounded-lg bg-[#F5F5F4] flex items-center justify-center flex-shrink-0">
                <step.icon className="w-5 h-5 text-[#78716C]" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#1C1917] mb-0.5">{step.title}</div>
                <p className="text-xs text-[#78716C] font-light">{step.description}</p>
              </div>
              <button
                onClick={() => navigate(step.path)}
                className="text-xs text-[#0F766E] hover:text-[#0D9488] font-medium flex items-center gap-1 flex-shrink-0 transition-colors"
              >
                {step.action} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Subtle footer note */}
      <p className="text-center text-xs text-[#A8A29E] font-light mt-10">
        Once your manager assigns you to a project, your dashboard will populate automatically.
      </p>
    </div>
  );
}
