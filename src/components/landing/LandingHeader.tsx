import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-md border-b border-stone-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Zap className="size-4 fill-current text-indigo-400" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Velocity AI</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#book-call" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Book a Call</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all shadow-sm ring-1 ring-slate-900/10"
              style={{ borderRadius: '10px' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
