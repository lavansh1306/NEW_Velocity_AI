import { FolderOpen, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectsEmptyStateProps {
  onCreateProject: () => void;
  onPlanWithAI: () => void;
}

export function ProjectsEmptyState({ onCreateProject, onPlanWithAI }: ProjectsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 rounded-full bg-[#F5F5F4] flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-[#D6D3D1]" />
      </div>
      <h3 className="text-lg font-medium text-[#1C1917] mb-1">No projects yet</h3>
      <p className="text-sm text-[#78716C] font-light mb-6 text-center max-w-md">
        Create your first project to start planning and tracking work with your team.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onCreateProject}
          className="bg-[#1C1917] text-white hover:bg-[#292524] gap-2 rounded-xl h-11 px-6 shadow-sm transition-all duration-300"
        >
          <Plus className="w-4 h-4" /> Create Project
        </Button>
        <Button
          variant="outline"
          onClick={onPlanWithAI}
          className="border-[#E7E5E4] text-[#57534E] hover:bg-[#FAFAF9] gap-2 rounded-xl h-11 px-6 transition-all duration-300"
        >
          Plan with AI
        </Button>
      </div>

      {/* Hint card */}
      <div className="mt-8 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-5 py-4 max-w-md">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#0F766E] mt-0.5 shrink-0" />
          <p className="text-xs text-[#78716C] font-light leading-relaxed">
            Not sure where to start? Use <button onClick={onPlanWithAI} className="text-[#0F766E] font-medium hover:underline transition-colors">AI planning</button> to describe what you want to build and get a full task breakdown automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
