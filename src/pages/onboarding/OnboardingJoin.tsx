import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, ChevronRight, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { supabase } from '@/lib/supabase';
import { normalizeInviteCode, isValidInviteCodeFormat } from '@/lib/inviteCodeGenerator';

interface TeamPreview {
  teamName: string;
  orgName: string;
}

export default function OnboardingJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { joinWithInviteCode, loading, error, clearError } = useOnboarding();
  const [code, setCode] = useState('');
  const [teamPreview, setTeamPreview] = useState<TeamPreview | null>(null);

  // Pre-fill code from URL query parameter
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      validateCode(urlCode);
    }
  }, [searchParams]);

  // Validate and preview team info when code looks complete
  const validateCode = async (rawCode: string) => {
    const normalized = normalizeInviteCode(rawCode);
    if (!isValidInviteCodeFormat(normalized)) {
      setTeamPreview(null);
      return;
    }

    try {
      const { data: team } = await supabase
        .from('teams')
        .select(`
          name,
          invite_is_active,
          organizations:organization_id ( name )
        `)
        .eq('invite_code', normalized)
        .eq('invite_is_active', true)
        .maybeSingle();

      if (team) {
        setTeamPreview({
          teamName: team.name,
          orgName: (team as any).organizations?.name || '',
        });
      } else {
        setTeamPreview(null);
      }
    } catch {
      setTeamPreview(null);
    }
  };

  const handleCodeChange = (value: string) => {
    const upper = value.toUpperCase();
    setCode(upper);
    clearError();
    validateCode(upper);
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    clearError();
    try {
      await joinWithInviteCode(code.trim());
      navigate('/app/employee/dashboard');
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

        {/* Team preview — shown when a valid code is entered */}
        {teamPreview && (
          <div className="mb-4 p-3 bg-[#F0FDFA] border border-[#0F766E]/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#0F766E]/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-[#0F766E]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0F766E] truncate">{teamPreview.teamName}</p>
              {teamPreview.orgName && (
                <p className="text-xs text-[#0F766E]/70 font-light truncate">at {teamPreview.orgName}</p>
              )}
            </div>
          </div>
        )}

        <div className="mb-4">
          <Input
            placeholder="Enter invite code (e.g., ACME-X8J9)"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
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
            <>Join {teamPreview ? teamPreview.teamName : 'Team'} <ChevronRight className="h-4 w-4 ml-1" /></>
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
