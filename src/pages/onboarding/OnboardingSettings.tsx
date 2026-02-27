import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OnboardingSettings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFDFB] font-['Inter',sans-serif] relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[800px] mx-auto px-8 py-8">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/onboarding/team')} className="text-sm text-[#78716C] hover:text-[#1C1917] flex items-center gap-1 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-xl font-light text-[#1C1917]">Step 3 of 4: Configure Work Settings</span>
          <button onClick={() => navigate('/onboarding/holidays')} className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            Skip Step
          </button>
        </div>

        <p className="text-base text-[#78716C] text-center mb-10 font-light">
          Tell us about your team's work schedule to help us calculate capacity accurately.
        </p>

        <div className="max-w-[700px] mx-auto space-y-8 mb-16">
          
          {/* Card 1: Work Schedule */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-medium text-[#1C1917]">Work Schedule</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-8">
              {/* Hours */}
              <div>
                <Label className="text-sm text-[#57534E] font-medium mb-2 block">Standard Work Hours</Label>
                <div className="flex items-center gap-3">
                  <Input className="w-full h-10 border-[#E7E5E4] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]" defaultValue="40" />
                  <span className="text-sm text-[#78716C] font-light whitespace-nowrap">hrs / week</span>
                </div>
                <p className="text-xs text-[#A8A29E] mt-2 font-light">Most teams work 40 hours/week</p>
              </div>

              {/* Days */}
              <div>
                <Label className="text-sm text-[#57534E] font-medium mb-2 block">Work Days</Label>
                <div className="flex items-center gap-3">
                  <Input className="w-full h-10 border-[#E7E5E4] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]" defaultValue="5" />
                  <span className="text-sm text-[#78716C] font-light whitespace-nowrap">days / week</span>
                </div>
                <p className="text-xs text-[#A8A29E] mt-2 font-light">Usually Monday - Friday</p>
              </div>

              {/* Week Start */}
              <div className="col-span-2 pt-2 border-t border-[#F5F5F4]">
                <Label className="text-sm text-[#57534E] font-medium mb-3 block">Work Week Starts On</Label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="radio" name="weekstart" className="peer appearance-none w-5 h-5 border border-[#D6D3D1] rounded-full checked:border-[#0F766E] checked:bg-[#0F766E] transition-all" />
                      <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                    </div>
                    <span className="text-sm text-[#57534E] font-light group-hover:text-[#1C1917] transition-colors">Sunday</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="radio" name="weekstart" className="peer appearance-none w-5 h-5 border border-[#D6D3D1] rounded-full checked:border-[#0F766E] checked:bg-[#0F766E] transition-all" defaultChecked />
                      <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                    </div>
                    <span className="text-sm text-[#57534E] font-light group-hover:text-[#1C1917] transition-colors">Monday</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Planning & Capacity */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-medium text-[#1C1917]">Planning & Capacity</h3>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-8">
              {/* Fiscal Year */}
              <div>
                <Label className="text-sm text-[#57534E] font-medium mb-2 block">Fiscal Year Starts</Label>
                <div className="relative">
                  <select className="w-full h-10 rounded-md border border-[#E7E5E4] px-3 text-sm bg-white focus:border-[#0F766E] outline-none text-[#57534E] font-light appearance-none cursor-pointer">
                    <option>January</option>
                    <option>April</option>
                    <option>July</option>
                    <option>October</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#A8A29E]">
                    <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                  </div>
                </div>
                <p className="text-xs text-[#A8A29E] mt-2 font-light">Used for quarterly planning</p>
              </div>

              {/* Utilization */}
              <div>
                <Label className="text-sm text-[#57534E] font-medium mb-2 block">Target Utilization</Label>
                <div className="flex items-center gap-3">
                  <Input className="w-full h-10 border-[#E7E5E4] text-center focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]" defaultValue="85" />
                  <span className="text-sm text-[#78716C] font-light whitespace-nowrap">% capacity</span>
                </div>
                <p className="text-xs text-[#A8A29E] mt-2 font-light">Recommended: 85%</p>
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/onboarding/team')} className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            ← Back
          </button>
          <Button 
            onClick={() => navigate('/onboarding/holidays')}
            className="h-10 px-8 bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg font-normal transition-all duration-200 shadow-md"
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
}
