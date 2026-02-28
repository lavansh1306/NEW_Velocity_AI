import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Copy, Check, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingComplete() {
  const navigate = useNavigate();
  const { inviteCode, orgName, orgId } = useOnboarding();
  const { refreshOrg } = useAuth();
  const [copied, setCopied] = useState(false);
  
  // Build invite link from actual code
  const inviteLink = inviteCode 
    ? `${window.location.origin}/onboarding/join?code=${inviteCode}`
    : '';

  // Refresh AuthContext org state so dashboard works
  useEffect(() => {
    if (orgId) {
      refreshOrg();
    }
  }, [orgId, refreshOrg]);

  const handleCopy = () => {
    const textToCopy = inviteCode || inviteLink;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          fallbackCopyTextToClipboard(textToCopy);
        });
    } else {
      fallbackCopyTextToClipboard(textToCopy);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('Fallback: Unable to copy', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] font-['Inter',sans-serif] relative overflow-hidden flex items-center justify-center">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        
        {/* Left Column: Welcome & Actions */}
        <div className="flex-1 text-center lg:text-left">
          <div className="text-6xl mb-6">🎉</div>
          
          <h1 className="text-4xl font-light text-[#1C1917] mb-4 tracking-tight">
            You're All Set Up!
          </h1>
          
          <p className="text-lg text-[#78716C] mb-8 font-light leading-relaxed">
            {orgName ? `Your "${orgName}" workspace is ready.` : 'Your workspace is ready.'} Start by planning your first project with AI or head to the dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button 
              onClick={() => navigate('/progress')}
              className="h-12 px-8 bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg font-normal text-base transition-all duration-200 shadow-md"
            >
              ✨ Plan First Project
            </Button>
            
            <Button 
              onClick={() => navigate('/velocity-ai')}
              variant="outline"
              className="h-12 px-8 border-[#E7E5E4] hover:bg-[#FAFAF9] text-[#57534E] rounded-lg font-normal text-base transition-all duration-200"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>

        {/* Right Column: Invite & Quick Actions */}
        <div className="flex-1 w-full max-w-md space-y-8">
          {/* Invite Card */}
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-[#0F766E]/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Users className="h-20 w-20" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#FAFAF9] flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-[#1C1917]" />
              </div>
              <h3 className="text-base font-medium text-[#1C1917]">Invite your team</h3>
            </div>
            <p className="text-sm text-[#78716C] mb-4 font-light leading-relaxed">
              Share this invite code with your team members so they can join your workspace.
            </p>
            
            {inviteCode ? (
              <>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest text-[#1C1917] select-all">
                    {inviteCode}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleCopy}
                    className="bg-white hover:bg-[#FAFAF9] border-[#E7E5E4] text-[#57534E]"
                    title="Copy Code"
                  >
                    {copied ? <Check className="h-4 w-4 text-[#0F766E]" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-[#A8A29E] font-light mb-3 truncate">
                  Or share link: {inviteLink}
                </p>
              </>
            ) : (
              <p className="text-sm text-[#A8A29E] font-light mb-3">Invite code will be generated once your workspace is created.</p>
            )}
            
            <Button 
              variant="ghost" 
              className="w-full text-xs text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAFAF9] h-8 justify-start px-2 font-normal"
              onClick={() => window.location.href = `mailto:?subject=Join me on Velocity AI&body=Hey team, join our workspace using invite code: ${inviteCode || ''} — or use this link: ${inviteLink}`}
            >
              <Mail className="h-3 w-3 mr-2" />
              Or send invites via email
            </Button>
          </div>

          {/* Explore Section */}
          <div>
            <p className="text-sm text-[#A8A29E] font-medium uppercase tracking-wider mb-4 text-center lg:text-left">
              Explore Velocity AI
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: "✨", title: "AI Project Plan", desc: "Generate a plan instantly", action: "/progress" },
                { icon: "📋", title: "Manual Project", desc: "Build from scratch", action: "/projects" },
                { icon: "👥", title: "Team Capacity", desc: "View bandwidth", action: "/velocity-ai" },
                { icon: "📚", title: "Tutorial", desc: "Learn the basics", action: null }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-[#E7E5E4] rounded-xl p-4 hover:border-[#0F766E]/50 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => item.action && navigate(item.action)}
                >
                  <div className="text-xl mb-2">{item.icon}</div>
                  <h3 className="text-sm font-medium text-[#1C1917] mb-0.5 group-hover:text-[#0F766E] transition-colors">{item.title}</h3>
                  <p className="text-[10px] text-[#78716C] font-light leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
