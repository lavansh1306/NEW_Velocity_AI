import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOnboarding } from '@/contexts/OnboardingContext';

const PREDEFINED_ROLES = [
  "Engineer",
  "Designer",
  "Product Manager",
  "Engineering Manager",
  "QA Engineer",
  "Data Scientist",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer"
];

export default function OnboardingTeam() {
  const navigate = useNavigate();
  const { saveTeamMembers, loading, error, clearError } = useOnboarding();
  const [members, setMembers] = useState([
    { name: '', email: '', role: 'Engineer' },
    { name: '', email: '', role: 'Designer' },
    { name: '', email: '', role: 'Product Manager' }
  ]);
  const [openRoleDropdown, setOpenRoleDropdown] = useState<number | null>(null);

  const addMember = () => {
    setMembers([...members, { name: '', email: '', role: '' }]);
  };

  const removeMember = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const updateMember = (index: number, field: string, value: string) => {
    const newMembers = members.map((member, i) => {
      if (i === index) {
        return { ...member, [field]: value };
      }
      return member;
    });
    setMembers(newMembers);
  };

  const handleContinue = async () => {
    clearError();
    try {
      // Only save members that have an email
      const validMembers = members.filter(m => m.email.trim());
      if (validMembers.length > 0) {
        await saveTeamMembers(validMembers);
      }
      navigate('/onboarding/settings');
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
          <button onClick={() => navigate('/onboarding/welcome')} className="text-sm text-[#78716C] hover:text-[#1C1917] flex items-center gap-1 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-xl font-light text-[#1C1917]">Step 2 of 4: Add Your Team</span>
          <button onClick={() => navigate('/onboarding/settings')} className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            Skip Step
          </button>
        </div>

        <p className="text-base text-[#78716C] text-center mb-10 font-light max-w-xl mx-auto">
          Add the people you'll be planning projects with. You can always add more later.
        </p>

        {/* Table */}
        <div className="mb-6">
          <div className="bg-[#FAFAF9] px-4 py-3 border-b border-[#E7E5E4] flex gap-4">
            <div className="flex-1 text-xs font-normal text-[#78716C] uppercase">Name</div>
            <div className="flex-1 text-xs font-normal text-[#78716C] uppercase">Email</div>
            <div className="w-[200px] text-xs font-normal text-[#78716C] uppercase">Role</div>
            <div className="w-8"></div>
          </div>
          
          <div className="space-y-0 pb-32">
            {members.map((member, idx) => (
              <div key={idx} className="flex gap-4 px-4 py-4 border-b border-[#E7E5E4] items-center group relative z-0" style={{ zIndex: openRoleDropdown === idx ? 50 : 1 }}>
                <div className="flex-1">
                  <Input 
                    placeholder="Jane Doe" 
                    value={member.name || ''}
                    onChange={(e) => updateMember(idx, 'name', e.target.value)}
                    className="h-10 border-transparent hover:border-[#E7E5E4] focus:border-[#0F766E] bg-transparent px-2"
                  />
                </div>
                <div className="flex-1">
                  <Input 
                    placeholder="jane@company.com" 
                    value={member.email || ''}
                    onChange={(e) => updateMember(idx, 'email', e.target.value)}
                    className="h-10 border-transparent hover:border-[#E7E5E4] focus:border-[#0F766E] bg-transparent px-2"
                  />
                </div>
                <div className="w-[200px] relative">
                  <Input 
                    placeholder="Select or type role"
                    value={member.role || ''}
                    onChange={(e) => updateMember(idx, 'role', e.target.value)}
                    onFocus={() => setOpenRoleDropdown(idx)}
                    onBlur={() => setTimeout(() => setOpenRoleDropdown(null), 200)}
                    className="h-10 border-transparent hover:border-[#E7E5E4] focus:border-[#0F766E] bg-transparent px-2 w-full"
                  />
                  {openRoleDropdown === idx && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#E7E5E4] rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                      {PREDEFINED_ROLES.filter(role => role.toLowerCase().includes((member.role || '').toLowerCase())).map((role) => (
                        <div 
                          key={role}
                          className="px-3 py-2 text-sm text-[#1C1917] hover:bg-[#F5F5F4] cursor-pointer"
                          onMouseDown={() => {
                            updateMember(idx, 'role', role);
                            setOpenRoleDropdown(null);
                          }}
                        >
                          {role}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => removeMember(idx)}
                  className="w-8 h-8 flex items-center justify-center text-[#D6D3D1] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <Button 
            variant="outline" 
            onClick={addMember}
            className="h-10 px-6 border-[#E7E5E4] text-[#57534E] font-normal hover:bg-[#FAFAF9]"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Team Member
          </Button>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E7E5E4]"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-4 bg-[#FDFDFB] text-[#A8A29E]">OR</span>
          </div>
        </div>

        <div className="flex justify-center mb-12">
          <Button variant="outline" className="h-10 px-6 border-[#E7E5E4] text-[#57534E] font-normal hover:bg-[#FAFAF9]">
            📄 Import from CSV
          </Button>
        </div>

        <div className="bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg p-4 mb-8 text-center">
          <p className="text-sm text-[#134E4A] font-light">
            <span className="font-medium mr-1">💡 TIP:</span>
            Don't worry about getting everything perfect. You can edit roles and add skills later.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/onboarding/welcome')} className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            ← Back
          </button>
          <Button 
            onClick={handleContinue}
            disabled={loading}
            className="h-10 px-8 bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg font-normal transition-all duration-200 shadow-md disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Continue →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
