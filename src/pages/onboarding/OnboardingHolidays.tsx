import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingHolidays() {
  const navigate = useNavigate();
  const [holidays, setHolidays] = useState([
    "New Year's Day - Jan 1, 2026",
    "Memorial Day - May 25, 2026",
    "Independence Day - Jul 4, 2026",
    "Thanksgiving - Nov 26, 2026",
    "Christmas - Dec 25, 2026"
  ]);

  const removeHoliday = (index: number) => {
    const newHolidays = [...holidays];
    newHolidays.splice(index, 1);
    setHolidays(newHolidays);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] font-['Inter',sans-serif] relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[900px] mx-auto px-8 py-8">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/onboarding/settings')} className="text-sm text-[#78716C] hover:text-[#1C1917] flex items-center gap-1 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-xl font-light text-[#1C1917]">Step 4 of 4: Add Company Holidays</span>
          <button onClick={() => navigate('/onboarding/complete')} className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            Skip Step
          </button>
        </div>

        <p className="text-base text-[#78716C] text-center mb-8 font-light">
          Add holidays when your team won't be working. This helps us calculate accurate capacity.
        </p>

        <div className="max-w-[600px] mx-auto">
          <div className="mb-8">
            <select className="w-[240px] h-10 rounded-md border border-[#E7E5E4] px-3 text-sm bg-white focus:border-[#0F766E] outline-none text-[#57534E] font-light">
              <option>Import from Template (US)</option>
              <option>Import from Template (UK)</option>
              <option>Import from Template (CA)</option>
              <option>Custom</option>
            </select>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden mb-6 shadow-sm">
            {holidays.map((holiday, idx) => (
              <div key={idx} className="flex items-center justify-between px-6 py-3 border-b border-[#F5F5F4] last:border-0 hover:bg-[#FAFAF9] transition-colors">
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-[#0F766E]" />
                  <span className="text-sm text-[#57534E] font-light">{holiday}</span>
                </div>
                <button onClick={() => removeHoliday(idx)} className="text-[#D6D3D1] hover:text-[#EF4444] transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mb-10">
            <button className="text-sm text-[#0F766E] hover:text-[#0D9488] font-medium flex items-center gap-1 mx-auto transition-colors">
              <Plus className="h-4 w-4" /> Add Custom Holiday
            </button>
          </div>

          <div className="bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg p-4 mb-20 text-center">
            <p className="text-sm text-[#134E4A] font-light">
              <span className="font-medium mr-1">💡 TIP:</span>
              You can add more holidays later in Settings.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/onboarding/settings')} className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            ← Back
          </button>
          <Button 
            onClick={() => navigate('/onboarding/complete')}
            className="h-10 px-8 bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg font-normal transition-all duration-200 shadow-md"
          >
            Finish Setup →
          </Button>
        </div>
      </div>
    </div>
  );
}
