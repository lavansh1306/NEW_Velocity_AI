import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './components/ui/dialog';
import { 
  Users, 
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Calendar,
  Settings,
  Search,
  Bell,
  Plus,
  X,
  Zap,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PeopleCapacityScreen, PersonDetailScreen, LeaveManagementScreen } from './components/PeopleScreens';
import { ProjectsListScreen, ProjectDetailScreen, PlanMyProjectScreen, CreateProjectScreen } from './components/ProjectScreens';
import { TeamCapacityReportScreen, ProjectHealthReportScreen } from './components/ReportsScreens';
import { NotificationsScreen, ActivityFeedScreen } from './components/ActivityScreens';
import { 
  SignupScreen, 
  OnboardingWelcomeScreen, 
  OnboardingTeamScreen, 
  OnboardingSettingsScreen, 
  OnboardingHolidaysScreen, 
  OnboardingCompleteScreen 
} from './components/OnboardingScreens';

// ==================== SHARED COMPONENTS ====================

const SystemStatus = () => {
  const [isPulsing, setIsPulsing] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 800);
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex items-center gap-2 text-xs text-[#78716C] font-medium mr-4 bg-[#F5F5F4] px-3 py-1.5 rounded-full border border-[#E7E5E4]">
      <div className={`w-1.5 h-1.5 bg-[#0F766E] rounded-full transition-opacity duration-800 ${isPulsing ? 'opacity-40' : 'opacity-100'}`} />
      System Operational
    </div>
  );
};

const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className="bg-[#1C1917] rounded-lg p-2 shadow-lg shadow-stone-900/10">
        <Zap className="w-5 h-5 text-[#2DD4BF]" fill="currentColor" />
      </div>
      <span className={`font-medium text-[#1C1917] tracking-tight ${sizes[size]}`}>Velocity AI</span>
    </div>
  );
};

const AnimatedNumber = ({ value }: { value: string | number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);
  
  return (
    <span className="transition-opacity duration-300">
      {displayValue}
    </span>
  );
};

const KPICard = ({ label, value, sublabel, trend }: any) => (
  <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className="text-sm text-[#78716C] font-medium tracking-wide uppercase text-[11px]">{label}</div>
      {trend && (
        <div className={`text-xs px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {trend === 'up' ? '↑' : '↓'}
        </div>
      )}
    </div>
    <div className="text-4xl font-light text-[#1C1917] mb-2 tracking-tighter group-hover:text-[#0F766E] transition-colors">
      <AnimatedNumber value={value} />
    </div>
    {sublabel && <div className="text-xs text-[#A8A29E] font-normal pl-0.5">{sublabel}</div>}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'Active': 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
    'At Risk': 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]',
    'Delayed': 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]',
    'Completed': 'bg-[#F5F5F4] text-[#57534E] border border-[#E7E5E4]',
    'Healthy': 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
    'Overloaded': 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]',
    'Not Started': 'bg-[#FAFAF9] text-[#78716C] border border-[#E7E5E4]',
    'In Progress': 'bg-white text-[#1C1917] border border-[#E7E5E4]',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide ${variants[status] || 'bg-gray-50 text-gray-700'}`}>
      {status}
    </span>
  );
};

const GoogleIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const OutlookIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#0072C6" d="M1 5h22v14H1z"/>
    <path fill="#F2F2F2" d="M12 13.5L2 6h20L12 13.5z"/>
    <path fill="#D2D2D2" d="M1 5l11 8.25L23 5H1z"/>
  </svg>
);

const JiraIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.53 2C6.46 2.05 2.05 6.46 2 11.53V22h10.47V2h-.94z" fill="#2684FF"/>
    <path d="M12.94 13.12v8.88h8.88c-.05-4.88-4-8.83-8.88-8.88z" fill="#0052CC"/>
  </svg>
);

const AsanaIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" fill="#F06A6A"/>
    <circle cx="20" cy="12" r="3" fill="#F06A6A"/>
    <circle cx="4" cy="12" r="3" fill="#F06A6A"/>
  </svg>
);

const AuthLayout = ({ children, testimonial }: { children: React.ReactNode, testimonial?: any }) => {
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
          {children}
        </div>
      </div>
    </div>
  );
};

// ==================== AUTH SCREENS ====================

const LoginScreen = () => {
  const navigate = useNavigate();
  
  return (
    <AuthLayout>
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
          Welcome back
        </h1>
        <p className="text-[#78716C] font-normal">
          Enter your credentials to access your workspace.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button variant="outline" className="h-12 rounded-lg border-[#E7E5E4] hover:bg-[#FAFAF9] hover:border-[#D6D3D1] transition-all flex items-center justify-center gap-2 text-[#57534E] font-medium" title="Continue with Google">
          <GoogleIcon /> <span className="text-sm">Google</span>
        </Button>
        <Button variant="outline" className="h-12 rounded-lg border-[#E7E5E4] hover:bg-[#FAFAF9] hover:border-[#D6D3D1] transition-all flex items-center justify-center gap-2 text-[#57534E] font-medium" title="Continue with Jira">
          <JiraIcon /> <span className="text-sm">Jira</span>
        </Button>
      </div>
      
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E7E5E4]"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-medium">
          <span className="px-4 bg-white text-[#A8A29E]">Or continue with email</span>
        </div>
      </div>
      
      <div className="space-y-5 mb-8">
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-[#57534E] mb-1.5 block">Email address</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="name@company.com" 
            className="h-11 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E]"
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-[#57534E]">Password</Label>
            <Link to="#" className="text-xs font-medium text-[#78716C] hover:text-[#1C1917]">Forgot password?</Link>
          </div>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            className="h-11 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E]"
          />
        </div>
      </div>
      
      <Button 
        className="w-full h-11 bg-[#1C1917] hover:bg-[#292524] mb-8 rounded-lg font-medium transition-all duration-300 text-white shadow-lg shadow-stone-900/10"
        onClick={() => navigate('/app/dashboard')}
      >
        Sign In
      </Button>
      
      <div className="text-center">
        <span className="text-sm text-[#78716C]">Don't have an account? </span>
        <Link to="/signup" className="text-sm text-[#1C1917] font-semibold hover:underline">
          Sign up
        </Link>
      </div>
    </AuthLayout>
  );
};

const CreateAccountScreen = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('individual');
  
  return (
    <AuthLayout>
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
          Create an account
        </h1>
        <p className="text-[#78716C] font-normal">
          Start optimizing your engineering capacity today.
        </p>
      </div>
      
      <div className="space-y-5 mb-8">
        <div>
          <Label htmlFor="fullname" className="text-sm font-medium text-[#57534E] mb-1.5 block">Full Name</Label>
          <Input 
            id="fullname" 
            placeholder="John Smith" 
            className="h-11 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E]"
          />
        </div>
        
        <div>
          <Label htmlFor="workemail" className="text-sm font-medium text-[#57534E] mb-1.5 block">Work Email</Label>
          <Input 
            id="workemail" 
            type="email" 
            placeholder="name@company.com" 
            className="h-11 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E]"
          />
        </div>
        
        <div>
          <Label htmlFor="newpassword" className="text-sm font-medium text-[#57534E] mb-1.5 block">Password</Label>
          <Input 
            id="newpassword" 
            type="password" 
            placeholder="Create a password" 
            className="h-11 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E]"
          />
        </div>
        
        <div className="pt-2">
          <Label className="text-sm font-medium text-[#57534E] mb-3 block">I am setting this up for</Label>
          <RadioGroup value={userType} onValueChange={setUserType} className="grid grid-cols-2 gap-4">
            <div className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${userType === 'individual' ? 'border-[#1C1917] bg-[#FAFAF9]' : 'border-[#E7E5E4] hover:border-[#D6D3D1]'}`} onClick={() => setUserType('individual')}>
              <RadioGroupItem value="individual" id="individual" className="sr-only" />
              <div className="text-center">
                <Users className="w-5 h-5 mx-auto mb-2 text-[#78716C]" />
                <span className="text-sm font-medium text-[#1C1917]">Myself</span>
              </div>
            </div>
            <div className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${userType === 'manager' ? 'border-[#1C1917] bg-[#FAFAF9]' : 'border-[#E7E5E4] hover:border-[#D6D3D1]'}`} onClick={() => setUserType('manager')}>
              <RadioGroupItem value="manager" id="manager" className="sr-only" />
               <div className="text-center">
                <FolderKanban className="w-5 h-5 mx-auto mb-2 text-[#78716C]" />
                <span className="text-sm font-medium text-[#1C1917]">My Team</span>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      <Button 
        className="w-full h-11 bg-[#1C1917] hover:bg-[#292524] mb-6 rounded-lg font-medium transition-all duration-300 text-white shadow-lg shadow-stone-900/10"
        onClick={() => {
          if (userType === 'manager') {
            navigate('/team-setup');
          } else {
            navigate('/app/dashboard');
          }
        }}
      >
        Get Started
      </Button>
      
      <div className="text-center">
        <span className="text-sm text-[#78716C]">Already have an account? </span>
        <Link to="/" className="text-sm text-[#1C1917] font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};

const TeamSetupScreen = () => {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([
    { name: 'Sarah Chen', email: 'sarah@company.com', role: 'Frontend Lead', skills: ['React', 'TypeScript'] },
    { name: 'Marcus Johnson', email: 'marcus@company.com', role: 'Backend Developer', skills: ['Node.js', 'Python'] },
  ]);
  
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center font-['Inter',sans-serif] p-8">
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-12 w-full max-w-5xl shadow-sm">
        <div className="mb-10 text-center">
           <div className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-[#1C1917] rounded-xl p-2 shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-[#292524] text-xl">Velocity AI</span>
          </div>
          <h1 className="text-3xl font-semibold text-[#1C1917] mb-3 tracking-tight">Set up your team</h1>
          <p className="text-[#78716C]">Configure your organization and invite team members.</p>
        </div>
        
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div>
            <Label htmlFor="orgname" className="text-sm font-medium text-[#57534E] mb-2 block">Organization Name</Label>
            <Input 
              id="orgname" 
              placeholder="Acme Inc." 
              className="h-11 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E]"
            />
          </div>
          
          <div>
            <Label htmlFor="workhours" className="text-sm font-medium text-[#57534E] mb-2 block">Work Hours Per Week</Label>
            <Input 
              id="workhours" 
              type="number" 
              placeholder="40" 
              className="h-11 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E]"
            />
          </div>
          
          <div>
            <Label htmlFor="workdays" className="text-sm font-medium text-[#57534E] mb-2 block">Work Days Per Week</Label>
            <Input 
              id="workdays" 
              type="number" 
              placeholder="5" 
              className="h-11 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E]"
            />
          </div>
        </div>
        
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-[#1C1917]">Team Members</h2>
            <Button size="sm" variant="outline" className="rounded-lg border-[#E7E5E4] hover:bg-[#FAFAF9] text-[#57534E]">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
          
          <div className="rounded-xl overflow-hidden border border-[#E7E5E4]">
            <table className="w-full">
              <thead className="bg-[#FAFAF9] border-b border-[#E7E5E4]">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-[#78716C] uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-[#78716C] uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-[#78716C] uppercase tracking-wider">Role</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-[#78716C] uppercase tracking-wider">Skills</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#F5F5F4]">
                {teamMembers.map((member, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFAF9]/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-[#1C1917] font-medium">{member.name}</td>
                    <td className="py-4 px-6 text-sm text-[#78716C]">{member.email}</td>
                    <td className="py-4 px-6 text-sm text-[#1C1917]">{member.role}</td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 flex-wrap">
                        {member.skills.map((skill, i) => (
                          <span key={i} className="px-2.5 py-0.5 bg-[#F5F5F4] text-[#57534E] text-xs rounded-full font-medium border border-[#E7E5E4]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-[#A8A29E] hover:text-[#EF4444] transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-end gap-4">
          <Button 
             variant="outline"
             className="h-11 px-6 rounded-lg font-medium border-[#E7E5E4] text-[#57534E] hover:bg-[#FAFAF9]"
             onClick={() => navigate('/signup')}
          >
            Back
          </Button>
          <Button 
            className="bg-[#1C1917] hover:bg-[#292524] h-11 px-8 rounded-lg font-medium transition-all duration-300 text-white shadow-lg shadow-stone-900/10"
            onClick={() => navigate('/app/dashboard')}
          >
            Complete Setup
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==================== APP LAYOUT ====================

const NotificationDropdown = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();

  const notifications = [
    {
      id: 1,
      title: "New Leave Request",
      message: "Sarah Chen requested 3 days off (Mar 12-15)",
      time: "10 min ago",
      type: "leave",
      path: "/app/leave",
      read: false
    },
    {
      id: 2,
      title: "Project At Risk",
      message: "Mobile App MVP timeline is slipping",
      time: "2 hours ago",
      type: "alert",
      path: "/app/projects",
      read: false
    },
    {
      id: 3,
      title: "New Team Member",
      message: "David Kim joined the Engineering team",
      time: "5 hours ago",
      type: "info",
      path: "/app/people",
      read: true
    }
  ];

  const handleClick = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#E7E5E4] rounded-xl shadow-lg shadow-black/5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="px-4 py-3 border-b border-[#E7E5E4] flex justify-between items-center bg-[#FAFAF9]">
        <span className="text-sm font-medium text-[#1C1917]">Notifications</span>
        <span className="text-xs text-[#78716C] cursor-pointer hover:text-[#1C1917]">Mark all read</span>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {notifications.map((notif) => (
          <div 
            key={notif.id}
            onClick={() => handleClick(notif.path)}
            className={`px-4 py-3 border-b border-[#E7E5E4]/50 hover:bg-[#F5F5F4] cursor-pointer transition-colors ${!notif.read ? 'bg-[#FDFDFB]' : ''}`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-sm font-medium ${!notif.read ? 'text-[#1C1917]' : 'text-[#78716C]'}`}>
                {notif.title}
              </span>
              <span className="text-[10px] text-[#A8A29E] whitespace-nowrap ml-2">{notif.time}</span>
            </div>
            <p className="text-xs text-[#78716C] leading-relaxed line-clamp-2">
              {notif.message}
            </p>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-[#E7E5E4] bg-[#FAFAF9] text-center">
        <span className="text-xs text-[#78716C] cursor-pointer hover:text-[#1C1917]">View all notifications</span>
      </div>
    </div>
  );
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Sidebar state
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', path: '/app/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'projects', path: '/app/projects', label: 'Projects', icon: <FolderKanban className="w-5 h-5" /> },
    { id: 'plan', path: '/app/plan-project', label: 'Plan', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'people', path: '/app/people', label: 'People', icon: <Users className="w-5 h-5" /> },
    { id: 'leave', path: '/app/leave', label: 'Leave', icon: <Calendar className="w-5 h-5" /> },
  ];

  // Sync active section with URL
  useEffect(() => {
    if (location.pathname.startsWith('/app/settings')) {
      setActiveSection('settings');
      return;
    }
    const found = navItems.find(item => location.pathname.startsWith(item.path));
    if (found) setActiveSection(found.id);
  }, [location.pathname]);

  const handleNavClick = (item: any) => {
    if (activeSection === item.id) {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    } else {
      setActiveSection(item.id);
      setIsSidebarCollapsed(false);
      navigate(item.path);
    }
  };
  
  return (
    <div className="flex h-screen bg-[#F5F5F4] font-['Inter',sans-serif] overflow-hidden">
      {/* Activity Bar - Premium SaaS Style */}
      <div 
        className={`${isSidebarCollapsed ? 'w-[70px]' : 'w-[260px]'} bg-[#1C1917] flex flex-col py-6 z-40 flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] border-r border-[#292524] shadow-2xl shadow-black/20`}
      >
        <div className={`mb-8 px-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
           {/* Logo */}
           <div className="bg-[#2DD4BF] rounded-lg p-1.5 flex-shrink-0 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
            <Zap className="w-5 h-5 text-[#1C1917]" fill="currentColor" />
           </div>
           {!isSidebarCollapsed && <span className="text-white font-medium text-lg whitespace-nowrap overflow-hidden animate-in fade-in duration-300 tracking-tight">Velocity AI</span>}
        </div>
        
        <div className="flex-1 w-full flex flex-col gap-1 px-4">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`w-full relative px-3 py-3 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} rounded-lg group transition-all duration-200 outline-none ${
                  isActive ? 'bg-[#292524] text-white' : 'text-[#A8A29E] hover:text-[#E7E5E4] hover:bg-[#292524]/50'
                }`}
                title={item.label}
              >
                <div className={`${isActive ? 'text-[#2DD4BF]' : 'text-[#78716C] group-hover:text-[#D6D3D1]'} transition-colors flex-shrink-0`}>
                  {item.icon}
                </div>
                {!isSidebarCollapsed && <span className={`text-sm whitespace-nowrap overflow-hidden animate-in fade-in duration-300 ${isActive ? 'font-medium' : 'font-normal'}`}>{item.label}</span>}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#2DD4BF] rounded-r-sm shadow-[0_0_10px_rgba(45,212,191,0.4)]" />
                )}
              </button>
            );
          })}
        </div>
        
        <div className="w-full flex flex-col gap-1 px-4 mt-auto mb-4">
          <button 
            className={`w-full relative px-3 py-3 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} rounded-lg group transition-all duration-200 outline-none ${
              activeSection === 'settings' ? 'bg-[#292524] text-white' : 'text-[#A8A29E] hover:text-[#E7E5E4] hover:bg-[#292524]/50'
            }`}
            onClick={() => {
              setActiveSection('settings');
              navigate('/app/settings');
            }}
            title="Settings"
          >
            <Settings className={`w-5 h-5 flex-shrink-0 transition-colors ${activeSection === 'settings' ? 'text-[#2DD4BF]' : 'text-[#78716C] group-hover:text-[#D6D3D1]'}`} />
            {!isSidebarCollapsed && <span className={`text-sm whitespace-nowrap overflow-hidden animate-in fade-in duration-300 ${activeSection === 'settings' ? 'font-medium' : 'font-normal'}`}>Settings</span>}
            {activeSection === 'settings' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#2DD4BF] rounded-r-sm shadow-[0_0_10px_rgba(45,212,191,0.4)]" />
            )}
          </button>
          
          <button  
            className={`w-full relative px-3 py-3 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} rounded-lg text-[#F43F5E] hover:bg-[#F43F5E]/10 transition-colors`}
            onClick={() => navigate('/')}
            title="Log Out"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="text-sm font-normal whitespace-nowrap overflow-hidden animate-in fade-in duration-300">Log Out</span>}
          </button>
          
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-2 py-4 mt-2 border-t border-[#292524]`}>
            <Avatar className="w-9 h-9 border border-[#292524] flex-shrink-0 bg-[#292524]">
              <AvatarFallback className="bg-[#292524] text-[#D6D3D1] text-xs font-medium">JD</AvatarFallback>
            </Avatar>
            {!isSidebarCollapsed && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden animate-in fade-in duration-300">
                <span className="text-xs font-medium text-[#E7E5E4]">John Doe</span>
                <span className="text-[10px] text-[#A8A29E]">Product Lead</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F5F5F4] relative">
         {/* Texture Overlay */}
         <div 
          className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none z-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(#A8A29E 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Top Header */}
        <div className="h-16 border-b border-[#E7E5E4] flex items-center justify-between px-8 bg-[#F5F5F4]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Breadcrumb or Title */}
            <div className="flex items-center text-sm text-[#78716C]">
              <span className="font-normal">Velocity AI</span>
              <ChevronRight className="w-4 h-4 mx-2 text-[#D6D3D1]" />
              <span className="text-[#1C1917] font-medium">{navItems.find(n => n.id === activeSection)?.label}</span>
            </div>
          </div>
          
          <div className="flex-1 max-w-xl mx-8">
             <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#A8A29E] group-focus-within:text-[#1C1917] transition-colors" />
              <Input 
                placeholder={`Search ${navItems.find(n => n.id === activeSection)?.label.toLowerCase()}...`}
                className="pl-10 h-10 bg-white border border-[#E7E5E4] rounded-lg text-sm focus:bg-white focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF]/20 focus:shadow-sm transition-all placeholder:text-[#D6D3D1]"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-5 relative">
             <SystemStatus />
             <button 
               className={`relative p-2 rounded-lg transition-colors ${isNotificationsOpen ? 'bg-[#F5F5F4] text-[#1C1917]' : 'hover:bg-[#F5F5F4] text-[#78716C]'}`}
               onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
             >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#F43F5E] rounded-full border border-white"></span>
            </button>
            
            {isNotificationsOpen && (
              <NotificationDropdown onClose={() => setIsNotificationsOpen(false)} />
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-0 z-10">
          {children}
        </div>
      </div>
    </div>
  );
};

// ==================== DASHBOARD SCREEN ====================

const DashboardScreen = () => {
  const navigate = useNavigate();
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);

  const capacityData = [
    { week: 'Week 1', utilization: 85, available: 120 },
    { week: 'Week 2', utilization: 92, available: 96 },
    { week: 'Week 3', utilization: 78, available: 168 },
    { week: 'Week 4', utilization: 110, available: 48 },
    { week: 'Week 5', utilization: 95, available: 72 },
    { week: 'Week 6', utilization: 88, available: 120 },
    { week: 'Week 7', utilization: 82, available: 144 },
    { week: 'Week 8', utilization: 75, available: 180 },
  ];
  
  const upcomingDeadlines = [
    { project: 'Velocity AI Platform Redesign', deadline: 'Mar 30, 2026', daysLeft: 44, status: 'At Risk' },
    { project: 'Mobile App MVP', deadline: 'Mar 15, 2026', daysLeft: 29, status: 'Active' },
    { project: 'API Documentation', deadline: 'Feb 28, 2026', daysLeft: 14, status: 'Active' },
  ];
  
  const aiRecommendations = [
    { 
      type: 'risk',
      severity: 'high', 
      title: 'Frontend capacity overload risk', 
      description: 'Sarah Chen is projected to reach 120% utilization by Week 4 based on current velocity.', 
      impact: 'High risk of burnout and sprint spillover.',
      action: 'Reassign 2 tasks',
      confidence: 98
    },
    { 
      type: 'optimization',
      severity: 'medium', 
      title: 'Timeline optimization opportunity', 
      description: 'Platform Redesign is trending 13 days behind, but API Docs are ahead.', 
      impact: 'Potential to swap resources to balance velocity.',
      action: 'Adjust roadmap',
      confidence: 92
    },
    { 
      type: 'allocation',
      severity: 'low', 
      title: 'Strategic resource allocation', 
      description: '168 unused hours identified in Week 3 across the Design team.', 
      impact: 'Perfect window for "Design System Update" backlog item.',
      action: 'Schedule backlog',
      confidence: 87
    },
  ];

  const handleReview = (rec: any) => {
    setSelectedInsight(rec);
    setShowDialog(true);
  };

  const handleCommit = () => {
    setShowDialog(false);
    setSelectedInsight(null);
  };

  const handleIgnore = () => {
    setShowDialog(false);
    setSelectedInsight(null);
  };
  
  return (
    <div className="p-10 relative max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">Dashboard</h1>
          <p className="text-[#78716C] mt-2 font-light">Overview of your team's capacity and project health.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:bg-white hover:border-[#D6D3D1] transition-all">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button 
            className="bg-[#1C1917] text-white hover:bg-[#292524] shadow-md hover:shadow-lg transition-all"
            onClick={() => navigate('/app/projects/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-8">
        {/* Main Content - 8 columns */}
        <div className="col-span-12 xl:col-span-8 space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-6">
            <KPICard label="Active Projects" value="12" trend="up" />
            <KPICard label="Team Utilization" value="87%" sublabel="Target: 85%" trend="up" />
            <KPICard label="Available Capacity" value="312h" sublabel="Next 2 weeks" trend="down" />
            <KPICard label="Projects at Risk" value="3" trend="down" />
          </div>
          
          {/* Capacity Overview Chart */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 shadow-sm">
            <div className="flex flex-col gap-6 mb-8">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-[#1C1917]">Team Capacity & Allocation</h2>
                <div className="flex items-center gap-3">
                   <Button variant="outline" className="h-8 text-xs border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] hover:bg-white transition-colors">
                      Filter
                      <ChevronRight className="w-3 h-3 ml-2 rotate-90" />
                   </Button>
                   <Button variant="outline" className="h-8 text-xs border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] hover:bg-white transition-colors">
                      Sort
                      <ChevronRight className="w-3 h-3 ml-2 rotate-90" />
                   </Button>
                   <div className="h-4 w-px bg-[#E7E5E4] mx-1"></div>
                   <div className="flex items-center gap-1 bg-[#FAFAF9] rounded-md p-0.5 border border-[#E7E5E4]">
                      <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-white text-[#78716C]">
                          <ChevronRight className="w-3 h-3 rotate-180" />
                      </Button>
                      <span className="text-xs font-medium text-[#1C1917] px-2">Feb 2026</span>
                      <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-white text-[#78716C]">
                          <ChevronRight className="w-3 h-3" />
                      </Button>
                   </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-[#0F766E] rounded-full"></div>
                  <span className="text-xs text-[#78716C]">On Track</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-[#F59E0B] rounded-full"></div>
                  <span className="text-xs text-[#78716C]">At Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-[#F5F5F4] border border-[#E7E5E4] rounded-full"></div>
                  <span className="text-xs text-[#78716C]">Available</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[800px] pb-4">
                {/* Timeline Header */}
                <div className="grid grid-cols-12 gap-0 border-b border-[#E7E5E4] pb-2 mb-2">
                  <div className="col-span-3 text-xs font-medium text-[#78716C] uppercase tracking-wide pl-2 flex justify-between items-end pb-1">
                    <span>Team Member</span>
                    <span className="text-[10px] font-normal normal-case text-[#A8A29E] pr-2">Week ending</span>
                  </div>
                  {['Feb 22', 'Mar 01', 'Mar 08', 'Mar 15', 'Mar 22', 'Mar 29', 'Apr 05', 'Apr 12', 'Apr 19'].map((date, i) => (
                    <div key={i} className="col-span-1 text-center text-xs text-[#A8A29E] font-medium">{date}</div>
                  ))}
                </div>

                {/* Team Rows */}
                <div className="space-y-4">
                  {[
                    { 
                      name: 'Sarah Chen', 
                      role: 'Frontend Lead', 
                      avatar: 'SC',
                      tasks: [
                        { name: 'Design System', start: 0, duration: 3, status: 'track', project: 'Platform Redesign' },
                        { name: 'Review', start: 4, duration: 1, status: 'risk', project: 'Mobile MVP' },
                        { name: 'Refactor', start: 6, duration: 2, status: 'track', project: 'Optimization' }
                      ]
                    },
                    { 
                      name: 'Marcus Johnson', 
                      role: 'Backend Dev', 
                      avatar: 'MJ',
                      tasks: [
                        { name: 'API Setup', start: 0, duration: 2, status: 'track', project: 'Mobile MVP' },
                        { name: 'Database', start: 2, duration: 3, status: 'track', project: 'Platform Redesign' },
                        { name: 'Security', start: 7, duration: 2, status: 'track', project: 'Audit' }
                      ]
                    },
                     { 
                      name: 'Emily Rodriguez', 
                      role: 'Product Designer', 
                      avatar: 'ER',
                      tasks: [
                        { name: 'User Research', start: 1, duration: 2, status: 'track', project: 'New Feature' },
                        { name: 'Wireframes', start: 3, duration: 3, status: 'risk', project: 'Platform Redesign' }
                      ]
                    },
                     { 
                      name: 'David Kim', 
                      role: 'Full Stack', 
                      avatar: 'DK',
                      tasks: [
                        { name: 'Onboarding', start: 0, duration: 1, status: 'track', project: 'Internal' },
                        { name: 'Frontend', start: 2, duration: 4, status: 'track', project: 'Mobile MVP' },
                         { name: 'QA', start: 7, duration: 1, status: 'track', project: 'Platform Redesign' }
                      ]
                    }
                  ].map((member, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-0 items-center group hover:bg-[#FAFAF9] rounded-lg transition-colors p-2 -mx-2">
                      {/* Member Info */}
                      <div className="col-span-3 flex items-center gap-3 pr-4 border-r border-[#E7E5E4]/50">
                         <Avatar className="w-8 h-8 border border-[#E7E5E4] transition-transform group-hover:scale-105">
                            <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-[10px]">{member.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[#1C1917] truncate">{member.name}</div>
                            <div className="text-[10px] text-[#78716C] truncate">{member.role}</div>
                          </div>
                      </div>

                      {/* Gantt Bars */}
                      <div className="col-span-9 relative h-8 ml-2">
                         {/* Grid Lines */}
                         <div className="absolute inset-0 grid grid-cols-9 w-full h-full pointer-events-none">
                            {[...Array(9)].map((_, i) => (
                              <div key={i} className={`border-l ${i === 0 ? 'border-transparent' : 'border-[#E7E5E4]/30'} h-full`}></div>
                            ))}
                         </div>

                         {/* Tasks */}
                         {member.tasks.map((task, tIdx) => (
                           <div 
                            key={tIdx}
                            onClick={() => navigate('/app/projects/1')}
                            className={`absolute top-1 bottom-1 rounded-md text-[10px] font-medium flex items-center px-2 truncate shadow-sm border cursor-pointer z-10 group/task transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:z-20
                              ${task.status === 'track' 
                                ? 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1] hover:bg-[#E0F2FE] hover:border-[#BAE6FD] hover:ring-2 hover:ring-[#CCFBF1] hover:ring-offset-1' 
                                : 'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5] hover:bg-[#FFF1F2] hover:border-[#FECDD3] hover:ring-2 hover:ring-[#FFEDD5] hover:ring-offset-1'}
                            `}
                            style={{
                              left: `${(task.start / 9) * 100}%`,
                              width: `${(task.duration / 9) * 100}%`,
                              maxWidth: '98%' 
                            }}
                           >
                             {task.name}
                             
                             {/* Detailed Tooltip */}
                             <div className="absolute top-full left-0 mt-2 w-56 bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#E7E5E4] opacity-0 invisible group-hover/task:opacity-100 group-hover/task:visible transition-all duration-200 z-50 pointer-events-none origin-top-left">
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${task.status === 'track' ? 'bg-[#F0FDFA] text-[#0F766E]' : 'bg-[#FFF7ED] text-[#C2410C]'}`}>
                                    {task.status === 'track' ? 'On Track' : 'At Risk'}
                                  </span>
                                  <span className="text-[10px] text-[#A8A29E]">{task.duration} weeks</span>
                                </div>
                                <div className="font-medium text-[#1C1917] text-sm mb-0.5">{task.name}</div>
                                <div className="text-xs text-[#78716C] mb-3">{task.project}</div>
                                
                                <div className="flex items-center gap-2 pt-3 border-t border-[#F5F5F4]">
                                   <Avatar className="w-5 h-5 border border-[#E7E5E4]">
                                      <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-[8px]">{member.avatar}</AvatarFallback>
                                   </Avatar>
                                   <span className="text-xs text-[#78716C]">Assigned to {member.name.split(' ')[0]}</span>
                                </div>
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Upcoming Deadlines */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-[#1C1917]">Upcoming Deadlines</h2>
              <Button variant="ghost" className="text-xs text-[#78716C] hover:text-[#1C1917]">View All</Button>
            </div>
            
            <div className="space-y-3">
              {upcomingDeadlines.map((item, idx) => (
                <Link to="/app/projects/1" key={idx} className="flex items-center justify-between py-4 px-5 bg-[#FAFAF9] border border-[#E7E5E4]/50 rounded-lg hover:border-[#D6D3D1] hover:bg-white transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E7E5E4] flex items-center justify-center text-[#78716C] group-hover:text-[#0F766E] group-hover:border-[#CCFBF1] transition-colors">
                      <FolderKanban size={18} />
                    </div>
                    <div>
                      <div className="text-[#1C1917] text-sm font-medium mb-0.5">{item.project}</div>
                      <div className="text-xs text-[#78716C]">{item.deadline}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-sm text-[#1C1917] font-medium">{item.daysLeft} days</div>
                      <div className="text-[10px] text-[#A8A29E] uppercase tracking-wide">Remaining</div>
                    </div>
                    <StatusBadge status={item.status} />
                    <ChevronRight className="w-4 h-4 text-[#D6D3D1] group-hover:text-[#78716C] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* AI Recommendations Panel - 4 columns */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-[#2DD4BF]" />
              <h2 className="text-lg font-medium text-[#1C1917]">AI Insights</h2>
            </div>
            
            <div className="space-y-4">
              {aiRecommendations.map((rec, idx) => {
                const styles: Record<string, any> = {
                  risk: { border: 'bg-rose-500', icon: 'text-rose-600', bg: 'bg-rose-50/50' },
                  optimization: { border: 'bg-amber-500', icon: 'text-amber-600', bg: 'bg-amber-50/50' },
                  allocation: { border: 'bg-emerald-500', icon: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                };
                const style = styles[rec.type] || styles.optimization;
                
                return (
                  <div 
                    key={idx} 
                    className="group relative rounded-lg border border-[#E7E5E4] bg-white p-5 transition-all hover:shadow-md hover:border-[#D6D3D1]"
                  >
                    <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${style.border}`}></div>
                    
                    <div className="pl-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F5F4] text-[#57534E]">
                          <Zap className="w-3 h-3" />
                          {rec.confidence}% confidence
                        </span>
                      </div>
                      
                      <h3 className="text-[#1C1917] font-medium text-sm leading-snug mb-2 group-hover:text-[#0F766E] transition-colors">
                        {rec.title}
                      </h3>
                      
                      <p className="text-sm text-[#57534E] leading-relaxed mb-4">
                        {rec.description}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          className="w-full h-8 text-xs bg-[#1C1917] hover:bg-[#292524] text-white font-normal rounded-md shadow-sm"
                          onClick={() => handleReview(rec)}
                        >
                          {rec.action}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-6 border-t border-[#F5F5F4] text-center">
              <button className="text-xs text-[#78716C] hover:text-[#1C1917] font-medium transition-colors flex items-center justify-center gap-1 mx-auto">
                View all insights <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent aria-describedby={undefined} className="font-['Inter',sans-serif] rounded-2xl bg-white border border-[#E7E5E4] shadow-2xl max-w-lg p-0 overflow-hidden">
          <div className="p-6 border-b border-[#F5F5F4]">
            <DialogHeader>
              <DialogTitle className="text-xl font-medium text-[#1C1917]">
                Insight Details
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-[#FAFAF9]">
            {selectedInsight && (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selectedInsight.severity === 'high' ? 'bg-rose-100 text-rose-600' : 
                    selectedInsight.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-[#1C1917] mb-1">{selectedInsight.title}</h3>
                    <p className="text-sm text-[#57534E]">{selectedInsight.description}</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-[#E7E5E4] p-4 space-y-3">
                  <div>
                    <span className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">Impact</span>
                    <p className="text-sm text-[#1C1917] mt-1">{selectedInsight.impact}</p>
                  </div>
                  <div className="pt-3 border-t border-[#F5F5F4]">
                    <span className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">Recommended Action</span>
                    <p className="text-sm text-[#1C1917] mt-1">{selectedInsight.action}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-[#F5F5F4] bg-white flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={handleIgnore} 
              className="h-10 border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F5F4] rounded-lg font-normal transition-all"
            >
              Dismiss
            </Button>
            <Button 
              onClick={handleCommit} 
              className="bg-[#1C1917] hover:bg-[#292524] h-10 rounded-lg font-normal transition-all text-white shadow-md"
            >
              Apply Action
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ==================== SETTINGS SCREEN ====================

const SettingsScreen = () => {
  return (
    <div className="p-12 relative min-h-screen">      
      <div className="max-w-[1200px] mx-auto relative z-10">
        <h1 className="text-4xl font-light text-[#1C1917] mb-12 tracking-tight">Settings</h1>
        
        <Tabs defaultValue="organization" className="w-full">
          <TabsList className="mb-10 bg-white/70 backdrop-blur-xl border border-white/20 p-1.5 rounded-xl shadow-sm">
            <TabsTrigger value="organization" className="rounded-lg font-light data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Organization</TabsTrigger>
            <TabsTrigger value="team" className="rounded-lg font-light data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Team</TabsTrigger>
            <TabsTrigger value="holidays" className="rounded-lg font-light data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Holidays</TabsTrigger>
            <TabsTrigger value="ai-thresholds" className="rounded-lg font-light data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">AI Thresholds</TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-lg font-light data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Integrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="organization">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">Organization Settings</h2>
              <div className="space-y-6 max-w-xl">
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Organization Name</Label>
                  <Input placeholder="Acme Inc." className="h-11 rounded-xl border-white/20 bg-white/50 font-light" />
                </div>
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Work Hours Per Week</Label>
                  <Input type="number" placeholder="40" className="h-11 rounded-xl border-white/20 bg-white/50 font-light" />
                </div>
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Work Days Per Week</Label>
                  <Input type="number" placeholder="5" className="h-11 rounded-xl border-white/20 bg-white/50 font-light" />
                </div>
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Fiscal Year Start</Label>
                  <select className="w-full border border-white/20 bg-white/50 rounded-xl px-4 py-2.5 text-sm font-light h-11 text-[#292524]">
                    <option>January</option>
                    <option>April</option>
                    <option>July</option>
                    <option>October</option>
                  </select>
                </div>
                <Button className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md">Save Changes</Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="team">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">Team Settings</h2>
              <div className="space-y-6 max-w-xl">
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Utilization Target</Label>
                  <Input type="number" placeholder="85" className="h-11 rounded-xl border-white/20 bg-white/50 font-light" />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">Target utilization percentage for team members</div>
                </div>
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Overload Threshold</Label>
                  <Input type="number" placeholder="110" className="h-11 rounded-xl border-white/20 bg-white/50 font-light" />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">Alert when utilization exceeds this percentage</div>
                </div>
                <Button className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md">Save Changes</Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="holidays">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-light text-[#1C1917]">Company Holidays</h2>
                <Button size="sm" className="bg-[#1C1917] hover:bg-[#292524] h-10 px-5 rounded-xl font-light transition-all duration-300 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Holiday
                </Button>
              </div>
              <div className="space-y-3">
                {['New Year\'s Day - Jan 1, 2026', 'Memorial Day - May 25, 2026', 'Independence Day - Jul 4, 2026', 'Thanksgiving - Nov 26, 2026'].map((holiday, idx) => (
                  <div key={idx} className="flex items-center justify-between py-4 px-5 bg-white/40 border-[0.5px] border-white/20 rounded-2xl">
                    <span className="text-sm text-[#1C1917] font-light">{holiday}</span>
                    <button className="text-[#A8A29E] hover:text-[#78716C] transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ai-thresholds">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">AI Threshold Settings</h2>
              <div className="space-y-6 max-w-xl">
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Low Confidence Threshold</Label>
                  <Input type="number" placeholder="70" className="h-11 rounded-xl border-white/20 bg-white/50 font-light" />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">Alert for tasks with confidence below this %</div>
                </div>
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Health Score Warning</Label>
                  <Input type="number" placeholder="60" className="h-11 rounded-xl border-white/20 bg-white/50 font-light" />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">Projects below this score show warnings</div>
                </div>
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Timeline Risk Days</Label>
                  <Input type="number" placeholder="7" className="h-11 rounded-xl border-white/20 bg-white/50 font-light" />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">Alert when predicted delay exceeds this many days</div>
                </div>
                <Button className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md">Save Changes</Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="integrations">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">Integrations</h2>
              <div className="space-y-4">
                {[
                  { name: 'Jira', description: 'Import projects and track tasks', connected: true },
                  { name: 'Asana', description: 'Sync project management data', connected: false },
                  { name: 'Slack', description: 'Get notifications and updates', connected: true },
                  { name: 'Google Calendar', description: 'Sync team schedules', connected: false },
                ].map((integration, idx) => (
                  <div key={idx} className="flex items-center justify-between py-5 px-6 bg-white/40 border border-white/20 rounded-2xl">
                    <div>
                      <div className="text-[#292524] text-sm mb-1.5 font-light">{integration.name}</div>
                      <div className="text-xs text-[#78716C] font-light">{integration.description}</div>
                    </div>
                    {integration.connected ? (
                      <div className="flex items-center gap-4">
                        <StatusBadge status="Active" />
                        <Button size="sm" variant="outline" className="text-xs h-9 px-4 rounded-xl font-light border-white/20 hover:bg-white transition-all duration-300">
                          Configure
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" className="bg-[#1C1917] hover:bg-[#292524] h-9 px-5 rounded-xl font-light transition-all duration-300 text-white shadow-md">
                        Connect
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================

const router = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    children: [
      { index: true, element: <LoginScreen /> },
      { path: "signup", element: <SignupScreen /> },
      { path: "onboarding/welcome", element: <OnboardingWelcomeScreen /> },
      { path: "onboarding/team", element: <OnboardingTeamScreen /> },
      { path: "onboarding/settings", element: <OnboardingSettingsScreen /> },
      { path: "onboarding/holidays", element: <OnboardingHolidaysScreen /> },
      { path: "onboarding/complete", element: <OnboardingCompleteScreen /> },
      { path: "*", element: <Navigate to="/" replace /> },
      {
        path: "app",
        element: <AppLayout><Outlet /></AppLayout>,
        children: [
          { index: true, element: <DashboardScreen /> },
          { path: "dashboard", element: <DashboardScreen /> },
          { path: "projects", element: <ProjectsListScreen /> },
          { path: "projects/new", element: <CreateProjectScreen /> },
          { path: "projects/:id", element: <ProjectDetailScreen /> },
          { path: "plan-project", element: <PlanMyProjectScreen /> },
          { path: "people", element: <PeopleCapacityScreen /> },
          { path: "person/:id", element: <PersonDetailScreen /> },
          { path: "leave", element: <LeaveManagementScreen /> },
          { path: "settings", element: <SettingsScreen /> },
          { path: "notifications", element: <NotificationsScreen /> },
          { path: "activity", element: <ActivityFeedScreen /> },
          { path: "reports/capacity", element: <TeamCapacityReportScreen /> },
          { path: "reports/health", element: <ProjectHealthReportScreen /> },
        ]
      }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}