import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface HolidayItem {
  name: string;
  date: string; // YYYY-MM-DD
}

const US_HOLIDAYS: HolidayItem[] = [
  { name: "New Year's Day", date: '2026-01-01' },
  { name: 'Memorial Day', date: '2026-05-25' },
  { name: 'Independence Day', date: '2026-07-04' },
  { name: 'Thanksgiving', date: '2026-11-26' },
  { name: 'Christmas', date: '2026-12-25' },
];

const UK_HOLIDAYS: HolidayItem[] = [
  { name: "New Year's Day", date: '2026-01-01' },
  { name: 'Good Friday', date: '2026-04-03' },
  { name: 'Easter Monday', date: '2026-04-06' },
  { name: 'May Day', date: '2026-05-04' },
  { name: 'Christmas', date: '2026-12-25' },
  { name: 'Boxing Day', date: '2026-12-26' },
];

const CA_HOLIDAYS: HolidayItem[] = [
  { name: "New Year's Day", date: '2026-01-01' },
  { name: 'Canada Day', date: '2026-07-01' },
  { name: 'Labour Day', date: '2026-09-07' },
  { name: 'Thanksgiving', date: '2026-10-12' },
  { name: 'Christmas', date: '2026-12-25' },
];

const TEMPLATES: Record<string, HolidayItem[]> = {
  US: US_HOLIDAYS,
  UK: UK_HOLIDAYS,
  CA: CA_HOLIDAYS,
  Custom: [],
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function OnboardingHolidays() {
  const navigate = useNavigate();
  const { saveHolidays, loading, error, clearError } = useOnboarding();
  const [holidays, setHolidays] = useState<HolidayItem[]>([...US_HOLIDAYS]);
  const [template, setTemplate] = useState('US');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');

  const removeHoliday = (index: number) => {
    const newHolidays = [...holidays];
    newHolidays.splice(index, 1);
    setHolidays(newHolidays);
  };

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    setHolidays([...(TEMPLATES[value] || [])]);
  };

  const addHoliday = () => {
    if (!newName.trim() || !newDate) return;
    setHolidays([...holidays, { name: newName.trim(), date: newDate }]);
    setNewName('');
    setNewDate('');
    setShowAddForm(false);
  };

  const handleFinish = async () => {
    clearError();
    try {
      await saveHolidays(holidays);
      navigate('/onboarding/complete');
    } catch {
      // error shown via context
    }
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
            <select 
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-[240px] h-10 rounded-md border border-[#E7E5E4] px-3 text-sm bg-white focus:border-[#0F766E] outline-none text-[#57534E] font-light"
            >
              <option value="US">Import from Template (US)</option>
              <option value="UK">Import from Template (UK)</option>
              <option value="CA">Import from Template (CA)</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden mb-6 shadow-sm">
            {holidays.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-[#A8A29E] font-light">
                No holidays added. Click "Add Custom Holiday" below.
              </div>
            )}
            {holidays.map((holiday, idx) => (
              <div key={idx} className="flex items-center justify-between px-6 py-3 border-b border-[#F5F5F4] last:border-0 hover:bg-[#FAFAF9] transition-colors">
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-[#0F766E]" />
                  <span className="text-sm text-[#57534E] font-light">{holiday.name} — {formatDate(holiday.date)}</span>
                </div>
                <button onClick={() => removeHoliday(idx)} className="text-[#D6D3D1] hover:text-[#EF4444] transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Custom Holiday */}
          {showAddForm ? (
            <div className="bg-white border border-[#E7E5E4] rounded-lg p-4 mb-6 shadow-sm">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs text-[#78716C] mb-1 block">Holiday Name</label>
                  <Input
                    placeholder="e.g., Company Anniversary"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-9 border-[#E7E5E4] focus:border-[#0F766E]"
                  />
                </div>
                <div className="w-[160px]">
                  <label className="text-xs text-[#78716C] mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-9 border-[#E7E5E4] focus:border-[#0F766E]"
                  />
                </div>
                <Button
                  onClick={addHoliday}
                  disabled={!newName.trim() || !newDate}
                  className="h-9 px-4 bg-[#1C1917] hover:bg-[#292524] text-white text-sm"
                >
                  Add
                </Button>
                <button
                  onClick={() => { setShowAddForm(false); setNewName(''); setNewDate(''); }}
                  className="h-9 px-2 text-[#78716C] hover:text-[#1C1917]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center mb-10">
              <button 
                onClick={() => setShowAddForm(true)}
                className="text-sm text-[#0F766E] hover:text-[#0D9488] font-medium flex items-center gap-1 mx-auto transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Custom Holiday
              </button>
            </div>
          )}

          <div className="bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg p-4 mb-12 text-center">
            <p className="text-sm text-[#134E4A] font-light">
              <span className="font-medium mr-1">💡 TIP:</span>
              You can add more holidays later in Settings.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/onboarding/settings')} className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            ← Back
          </button>
          <Button 
            onClick={handleFinish}
            disabled={loading}
            className="h-10 px-8 bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg font-normal transition-all duration-200 shadow-md disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Finish Setup →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
