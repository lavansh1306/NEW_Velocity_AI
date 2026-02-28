import React from 'react';
import { Zap } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AuthLayoutProps {
  children: React.ReactNode;
  testimonial?: {
    quote: string;
    author: string;
    role: string;
    initials: string;
  };
}

const AuthLayout = ({ children, testimonial }: AuthLayoutProps) => {
  const defaultTestimonial = {
    quote: "Velocity AI completely changed how we deploy our engineering teams. What used to take 3 days of spreadsheet math now happens instantly.",
    author: "Jane Doe",
    role: "VP of Engineering, TechFlow",
    initials: "JD"
  };

  const t = testimonial || defaultTestimonial;

  return (
    <div className="min-h-screen w-full flex font-['Inter',sans-serif]">
      {/* Left Panel - Dark */}
      <div className="hidden lg:flex w-1/2 bg-[#0A0A0A] relative overflow-hidden flex-col justify-between p-16 text-white">
        {/* Background Effects */}
        <div 
          className="absolute inset-0 z-0 opacity-20" 
          style={{ 
            backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`, 
            backgroundSize: '40px 40px' 
          }} 
        />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-700/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-900/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg p-2 shadow-lg shadow-teal-900/20">
              <Zap className="h-6 w-6 text-white fill-white" />
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
            "{t.quote}"
          </p>
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 border border-white/10">
              <AvatarFallback className="bg-[#262626] text-white">{t.initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-white">{t.author}</div>
              <div className="text-sm text-white/50 font-light">{t.role}</div>
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

export default AuthLayout;
