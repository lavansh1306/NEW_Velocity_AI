import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#E7E5E4]/60 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1C1917] flex items-center justify-center text-white shadow-md">
              <Zap className="w-4 h-4 fill-current text-[#2DD4BF]" />
            </div>
            <span className="text-lg font-semibold text-[#1C1917] tracking-tight">Velocity AI</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-10">
            <a href="#how-it-works" className="text-sm font-medium text-[#78716C] hover:text-[#1C1917] transition-colors">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-[#78716C] hover:text-[#1C1917] transition-colors">Pricing</a>
            <a href="#book-call" className="text-sm font-medium text-[#78716C] hover:text-[#1C1917] transition-colors">Book a Call</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-[#78716C] hover:text-[#1C1917] transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-xl bg-[#1C1917] text-white text-sm font-medium hover:bg-[#292524] transition-all shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
