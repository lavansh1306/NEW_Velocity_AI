import { Lightbulb, ArrowRight, Sparkles } from 'lucide-react';

interface PlanEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  "Build a customer analytics dashboard with real-time metrics",
  "Redesign the onboarding flow for mobile app users",
  "Set up CI/CD pipeline with automated testing",
];

export function PlanEmptyState({ onSelectPrompt }: PlanEmptyStateProps) {
  return (
    <div className="flex flex-col items-center mb-10">
      <div className="w-16 h-16 rounded-full bg-[#F0FDFA] flex items-center justify-center mb-4">
        <Lightbulb className="w-8 h-8 text-[#0F766E]" />
      </div>
      <h3 className="text-lg font-medium text-[#1C1917] mb-1">Start Planning Your First Project</h3>
      <p className="text-sm text-[#78716C] font-light mb-6 text-center max-w-md">
        Describe your project below and let AI break it down into tasks, estimate hours, and identify required skills.
      </p>

      <div className="w-full max-w-lg space-y-2 mb-6">
        <p className="text-xs text-[#A8A29E] text-center uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Try an example
        </p>
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelectPrompt(prompt)}
            className="group w-full text-left px-4 py-3 border border-[#E7E5E4] rounded-xl text-sm text-[#57534E] hover:border-[#0F766E]/40 hover:bg-[#F0FDFA]/30 hover:shadow-sm transition-all duration-300 flex items-center gap-3"
          >
            <span className="flex-1">"{prompt}"</span>
            <ArrowRight className="w-4 h-4 text-[#D6D3D1] group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
