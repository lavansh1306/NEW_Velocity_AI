import { useNavigate } from 'react-router-dom';
import { Zap, Building2, UserPlus, ArrowRight } from 'lucide-react';

export default function OnboardingModeSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFDFB] font-['Inter',sans-serif] relative overflow-hidden flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-[#1C1917] mb-4 tracking-tight">How do you want to get started?</h1>
          <p className="text-lg text-[#78716C] font-light">Choose how you want to set up your workspace.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Option 1: Create Team */}
          <button 
            onClick={() => navigate('/onboarding/welcome')}
            className="bg-white border border-[#E7E5E4] rounded-2xl p-8 text-left hover:border-[#1C1917] hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
              <ArrowRight className="h-5 w-5 text-[#1C1917]" />
            </div>
            <div className="w-14 h-14 rounded-full bg-[#FAFAF9] flex items-center justify-center mb-6 group-hover:bg-[#1C1917] transition-colors border border-[#E7E5E4] group-hover:border-[#1C1917]">
              <Building2 className="h-6 w-6 text-[#1C1917] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-medium text-[#1C1917] mb-3">Create a new Team</h3>
            <p className="text-[#78716C] text-sm leading-relaxed font-light">
              I want to set up a new workspace for my organization, invite members, and start projects from scratch.
            </p>
          </button>

          {/* Option 2: Join Team */}
          <button 
            onClick={() => navigate('/onboarding/join')}
            className="bg-white border border-[#E7E5E4] rounded-2xl p-8 text-left hover:border-[#1C1917] hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
              <ArrowRight className="h-5 w-5 text-[#1C1917]" />
            </div>
            <div className="w-14 h-14 rounded-full bg-[#FAFAF9] flex items-center justify-center mb-6 group-hover:bg-[#1C1917] transition-colors border border-[#E7E5E4] group-hover:border-[#1C1917]">
              <UserPlus className="h-6 w-6 text-[#1C1917] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-medium text-[#1C1917] mb-3">Join an existing Team</h3>
            <p className="text-[#78716C] text-sm leading-relaxed font-light">
              I have an invite code or link to join a team that's already set up on Velocity AI.
            </p>
          </button>
        </div>
        
        <div className="text-center mt-12">
          <button onClick={() => navigate('/login')} className="text-sm text-[#A8A29E] hover:text-[#78716C] transition-colors">
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
