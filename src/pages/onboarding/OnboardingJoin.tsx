import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function OnboardingJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { joinWithInviteCode, loading, error, clearError } = useOnboarding();
  const [code, setCode] = useState('');

  // Pre-fill code from URL query parameter (e.g., /onboarding/join?code=ACME-X8J9)
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode);
    }
  }, [searchParams]);

  const handleJoin = async () => {
    if (!code.trim()) return;
    clearError();
    try {
      await joinWithInviteCode(code.trim());
      navigate('/velocity-ai');
    } catch {
      // error shown via context
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] font-['Inter',sans-serif] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[#FAFAF9] border border-[#E7E5E4] flex items-center justify-center mx-auto mb-6">
            <UserPlus className="h-6 w-6 text-[#1C1917]" />
          </div>
          <h1 className="text-2xl font-medium text-[#1C1917] mb-2 tracking-tight">Join your team</h1>
          <p className="text-[#78716C] text-sm font-light">Enter the invite code shared by your admin.</p>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Enter invite code (e.g., ACME-X8J9)"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); clearError(); }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            className="h-12 text-center text-lg tracking-widest border-[#E7E5E4] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] rounded-lg font-light"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        <Button 
          onClick={handleJoin}
          disabled={!code.trim() || loading}
          className="w-full h-12 bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg font-normal text-base transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Joining...</>
          ) : (
            <>Join Team <ChevronRight className="h-4 w-4 ml-1" /></>
          )}
        </Button>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#A8A29E] font-light mb-4">Don't have an invite code?</p>
          <button onClick={() => navigate('/onboarding/mode')} className="text-sm text-[#0F766E] hover:text-[#0D9488] font-medium transition-colors">
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
}
