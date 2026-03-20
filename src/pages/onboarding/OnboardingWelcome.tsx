import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { OrganizationPicker } from '@/components/onboarding/OrganizationPicker';

export default function OnboardingWelcome() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { createOrganization, loading, error, clearError, orgId } = useOnboarding();
  const [orgName, setOrgName] = useState('');
  const [teamName, setTeamName] = useState('');

  const handleStart = async () => {
    if (!orgName.trim() || !teamName.trim() || !user) return;
    clearError();
    try {
      await createOrganization(orgName.trim(), teamName.trim());
      navigate('/onboarding/team');
    } catch {
      // error is already set in context
    }
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
        <div className="w-[450px] mb-4">
          <OrganizationPicker
            value={orgName}
            onSelect={(org) => {
              if (org) setOrgName(org.name);
              else setOrgName('');
            }}
            onCreate={(name) => setOrgName(name)}
            onClear={() => setOrgName('')}
          />
        </div>

        {/* Team Name Input */}
        <div className="w-[450px] mb-8">
          <label className="block text-sm text-[#78716C] mb-2 font-light">Team Name</label>
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Engineering, Design, Product"
            className="h-11 bg-white border-[#E7E5E4] text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#1C1917] focus:ring-0"
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
          disabled={loading || authLoading || !user || !orgName.trim() || !teamName.trim()}
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
