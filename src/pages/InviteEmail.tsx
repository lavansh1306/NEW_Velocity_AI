import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InviteEmail() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center p-4 font-['Inter',sans-serif]">
      <div className="w-[600px] bg-white shadow-xl rounded-none overflow-hidden">
        {/* Header */}
        <div className="bg-[#1C1917] p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-[#2DD4BF] p-2 rounded-lg">
              <Zap className="h-8 w-8 text-[#1C1917]" />
            </div>
          </div>
          <h1 className="text-2xl font-light text-white tracking-tight">Velocity AI</h1>
        </div>

        {/* Body */}
        <div className="p-12">
          <h2 className="text-lg font-light text-[#1C1917] mb-6">Hi Sarah,</h2>
          
          <p className="text-base text-[#57534E] leading-relaxed mb-8">
            You've been added to Acme Inc's Velocity AI workspace by your manager, John Smith.
          </p>
          
          <p className="text-base text-[#78716C] leading-relaxed mb-12">
            Velocity AI helps you track your work, manage capacity, and submit timesheets—all in one place.
          </p>

          <div className="text-center mb-8">
            <Button 
              onClick={() => navigate('/invite/accept')}
              className="h-[52px] bg-[#1C1917] hover:bg-[#292524] text-white px-8 rounded-lg text-base font-light shadow-md transition-all duration-300"
            >
              Accept Invitation & Set Password →
            </Button>
          </div>

          <div className="space-y-2 text-center">
            <p className="text-xs text-[#A8A29E]">This invitation expires in 7 days.</p>
            <p className="text-xs text-[#A8A29E]">Questions? Contact your manager or support@velocityai.com</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAFAF9] p-8 text-center border-t border-[#E7E5E4]">
          <p className="text-xs text-[#A8A29E]">© 2026 Velocity AI</p>
        </div>
      </div>
    </div>
  );
}
