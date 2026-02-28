import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingWelcome() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { createOrganization, loading, error, clearError, orgId } = useOnboarding();
  const [orgName, setOrgName] = useState('');

  const handleStart = async () => {
    if (!orgName.trim() || !user) return;
    clearError();
    try {
      await createOrganization(orgName.trim());
      navigate('/onboarding/team');
    } catch {
      // error is already set in context
    }
  };

  const handleSkip = async () => {
    if (!orgId && orgName.trim()) {
      try {
        await createOrganization(orgName.trim());
      } catch {
        // proceed anyway
      }
    } else if (!orgId) {
      try {
        await createOrganization('My Team');
      } catch {
        // proceed anyway
      }
    }
    navigate('/onboarding/complete');
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] font-['Inter',sans-serif] relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 h-14 bg-[#FAFAF9]/80 backdrop-blur-sm border-b border-[#E7E5E4] px-8 flex items-center justify-between">
        <span className="text-xs text-[#A8A29E]">Step 1 of 4</span>
        <button onClick={handleSkip} className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
          Skip Setup
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center pt-20 max-w-[600px] mx-auto px-4">
        <div className="text-7xl mb-8">👋</div>
        
        <h1 className="text-[32px] font-light text-[#1C1917] text-center mb-4 tracking-tight">
          Welcome to Velocity AI!
        </h1>
        
        <p className="text-base text-[#78716C] text-center mb-12 font-light">
          Let's get your workspace set up in 4 quick steps
        </p>

        {/* Organization Name Input */}
        <div className="w-[400px] mb-8">
          <label className="text-sm text-[#57534E] font-medium mb-2 block">What's your team or company name?</label>
          <Input
            placeholder="e.g., Acme Inc, Engineering Team"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="h-12 text-base border-[#E7E5E4] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] rounded-lg"
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
        </div>

        {error && (
          <div className="w-[400px] mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="w-[400px] space-y-4 mb-8">
          {[
            "Add your team members",
            "Configure work settings",
            "Add company holidays",
            "Create your first project"
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 text-[#57534E] font-light text-base">
              <div className="w-5 h-5 rounded-full border border-[#D6D3D1] flex items-center justify-center text-[#A8A29E] text-[10px]">
                {idx + 1}
              </div>
              {item}
            </div>
          ))}
        </div>

        <p className="text-sm text-[#A8A29E] mb-16 font-light">This will take about 5 minutes.</p>

        <Button 
          onClick={handleStart}
          disabled={loading || authLoading || !user || !orgName.trim()}
          className="h-12 px-8 bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg font-normal text-base transition-all duration-200 shadow-md disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating workspace...</>
          ) : (
            <>Let's Get Started <ChevronRight className="h-4 w-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
