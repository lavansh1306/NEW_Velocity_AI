import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  Zap, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Calendar,
  Sparkles,
  Users,
  LogOut
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';

// Icons
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#f35325" d="M1 1h10v10H1z"/>
    <path fill="#81bc06" d="M12 1h10v10H12z"/>
    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
    <path fill="#ffba08" d="M12 12h10v10H12z"/>
  </svg>
);

// SCREEN 1: SIGNUP
export const SignupScreen = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex font-['Inter',sans-serif]">
      {/* Left Panel - Dark, Grid, Mesh */}
      <div className="hidden lg:flex w-1/2 bg-[#0A0A0A] relative overflow-hidden flex-col justify-between p-16 text-white">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 opacity-20" 
          style={{ 
            backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`, 
            backgroundSize: '40px 40px' 
          }} 
        />
        <div 
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-700/20 rounded-full blur-[120px] pointer-events-none"
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-900/10 rounded-full blur-[100px] pointer-events-none"
        />
        
        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg p-2 shadow-lg shadow-teal-900/20">
              <Zap className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="font-semibold text-xl tracking-tight">Velocity AI</span>
          </div>
        </div>
        
        {/* Testimonial */}
        <div className="relative z-10 max-w-lg">
          <div className="mb-8 opacity-50">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.017 21L14.017 18C14.017 16.8954 14.8738 16 15.9304 16H19.9865V12H14.017C13.4647 12 13.017 11.5523 13.017 11V3H21.017V16C21.017 18.7614 18.7784 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.87345 16 6.93005 16H10.9861V12H5.0166C4.46432 12 4.0166 11.5523 4.0166 11V3H12.0166V16C12.0166 18.7614 9.77802 21 7.0166 21H5.0166Z" />
            </svg>
          </div>
          <h2 className="text-4xl font-medium leading-tight mb-6 tracking-tight">
            Turn workforce chaos into clarity.
          </h2>
          <p className="text-lg text-white/60 mb-8 leading-relaxed font-light">
            "Velocity AI completely changed how we deploy our engineering teams. What used to take 3 days of spreadsheet math now happens instantly."
          </p>
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 border border-white/10">
              <AvatarFallback className="bg-[#262626] text-white">JD</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-white">Jane Doe</div>
              <div className="text-sm text-white/50 font-light">VP of Engineering, TechFlow</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - White, Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 lg:p-24 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-8">
              <div className="flex items-center gap-2">
                <div className="bg-[#1C1917] rounded-xl p-2 shadow-md">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#292524] text-xl">Velocity AI</span>
              </div>
            </div>
            <h1 className="text-3xl font-semibold text-[#1C1917] mb-3 tracking-tight">
              Create Your Account
            </h1>
            <p className="text-[#78716C] font-normal">
              Start optimizing your engineering capacity today.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <Button variant="outline" className="h-11 border-[#E7E5E4] hover:bg-[#FAFAF9] flex items-center justify-center rounded-lg" aria-label="Continue with Google">
              <GoogleIcon />
            </Button>
            <Button variant="outline" className="h-11 border-[#E7E5E4] hover:bg-[#FAFAF9] flex items-center justify-center rounded-lg" aria-label="Continue with Microsoft">
              <MicrosoftIcon />
            </Button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E7E5E4]"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-medium">
              <span className="px-4 bg-white text-[#A8A29E]">Or sign up with email</span>
            </div>
          </div>

          <div className="space-y-5 mb-8">
            <div>
              <Label htmlFor="work-email" className="text-sm font-medium text-[#57534E] mb-1.5 block">Work Email</Label>
              <Input 
                id="work-email"
                className="h-11 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E]"
                placeholder="name@company.com"
              />
            </div>
            
            <div>
              <Label htmlFor="company-name" className="text-sm font-medium text-[#57534E] mb-1.5 block">Company Name</Label>
              <Input 
                id="company-name"
                className="h-11 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E]"
                placeholder="Acme Inc."
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-[#57534E] mb-1.5 block">Password</Label>
              <div className="relative">
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="h-11 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E] pr-10"
                  placeholder="••••••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#78716C]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-[#A8A29E] mt-2">Must be at least 12 characters</p>
            </div>
          </div>

          <Button 
            onClick={() => navigate('/onboarding/welcome')}
            className="w-full h-11 bg-[#1C1917] hover:bg-[#292524] mb-6 rounded-lg font-medium transition-all duration-300 text-white shadow-lg shadow-stone-900/10"
          >
            Create Account <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          <p className="text-xs text-center text-[#A8A29E] leading-relaxed mb-6">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>

          <div className="text-center">
            <span className="text-sm text-[#78716C]">Already have an account? </span>
            <Link to="/" className="text-sm text-[#1C1917] font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// SCREEN 2: WELCOME
export const OnboardingWelcomeScreen = () => {
  const navigate = useNavigate();

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
        <button onClick={() => navigate('/onboarding/complete')} className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
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
          onClick={() => navigate('/onboarding/team')}
          className="h-12 px-8 bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg font-normal text-base transition-all duration-200 shadow-md"
        >
          Let's Get Started <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// SCREEN 3: TEAM
export const OnboardingTeamScreen = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([
    { name: '', email: '', role: 'Engineer' },
    { name: '', email: '', role: 'Designer' },
    { name: '', email: '', role: 'Product Manager' }
  ]);
  const [openRoleDropdown, setOpenRoleDropdown] = useState<number | null>(null);

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
            <ChevronLeft size={16} /> Back
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
                      {PREDEFINED_ROLES.filter(role => role.toLowerCase().includes((member.role || '').toLowerCase())).length === 0 && (member.role || '').length > 0 && (
                        <div className="px-3 py-2 text-sm text-[#A8A29E] italic">
                          Use custom role "{member.role}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="w-8 flex justify-center">
                  <button onClick={() => removeMember(idx)} className="text-[#D6D3D1] hover:text-[#EF4444] transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center mb-10">
          <button onClick={addMember} className="text-sm text-[#0F766E] hover:text-[#0D9488] font-medium flex items-center gap-1 transition-colors">
            <Plus size={16} /> Add Another Person
          </button>
        </div>

        <div className="relative mb-8 max-w-lg mx-auto">
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

        <div className="bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg p-4 mb-20 text-center">
          <p className="text-sm text-[#134E4A] font-light">
            <span className="font-medium mr-1">💡 TIP:</span>
            Don't worry about getting everything perfect. You can edit roles and add skills later.
          </p>
        </div>

        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/onboarding/welcome')} className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            ← Back
          </button>
          <Button 
            onClick={() => navigate('/onboarding/settings')}
            className="h-10 px-8 bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg font-normal transition-all duration-200 shadow-md"
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
};

// SCREEN 4: SETTINGS
export const OnboardingSettingsScreen = () => {
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
            <ChevronLeft size={16} /> Back
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
                <Calendar size={16} />
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
                <Sparkles size={16} />
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
                    <ChevronRight size={14} className="rotate-90" />
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
};

// SCREEN 5: HOLIDAYS
export const OnboardingHolidaysScreen = () => {
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
            <ChevronLeft size={16} /> Back
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
                  <Check size={16} className="text-[#0F766E]" />
                  <span className="text-sm text-[#57534E] font-light">{holiday}</span>
                </div>
                <button onClick={() => removeHoliday(idx)} className="text-[#D6D3D1] hover:text-[#EF4444] transition-colors">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mb-10">
            <button className="text-sm text-[#0F766E] hover:text-[#0D9488] font-medium flex items-center gap-1 mx-auto transition-colors">
              <Plus size={16} /> Add Custom Holiday
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
};

// SCREEN 6: COMPLETE
export const OnboardingCompleteScreen = () => {
  const navigate = useNavigate();

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
            Your workspace is ready. Start by planning your first project with AI or head to the dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button 
              onClick={() => navigate('/app/plan-project')}
              className="h-12 px-8 bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg font-normal text-base transition-all duration-200 shadow-md"
            >
              ✨ Plan First Project
            </Button>
            
            <Button 
              onClick={() => navigate('/app/dashboard')}
              variant="outline"
              className="h-12 px-8 border-[#E7E5E4] hover:bg-[#FAFAF9] text-[#57534E] rounded-lg font-normal text-base transition-all duration-200"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>

        {/* Right Column: Quick Actions Grid */}
        <div className="flex-1 w-full max-w-md">
            <p className="text-sm text-[#A8A29E] font-medium uppercase tracking-wider mb-4 text-center lg:text-left">
              Explore Velocity AI
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: "✨", title: "AI Project Plan", desc: "Generate a plan instantly", action: "/app/plan-project" },
              { icon: "📋", title: "Manual Project", desc: "Build from scratch", action: "/app/projects" },
              { icon: "👥", title: "Team Capacity", desc: "View bandwidth", action: "/app/people" },
              { icon: "📚", title: "Tutorial", desc: "Learn the basics", action: null }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-[#E7E5E4] rounded-xl p-5 hover:border-[#0F766E]/50 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => item.action && navigate(item.action)}
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="text-base font-medium text-[#1C1917] mb-1 group-hover:text-[#0F766E] transition-colors">{item.title}</h3>
                <p className="text-xs text-[#78716C] font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
