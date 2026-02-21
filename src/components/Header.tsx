import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md transition-all">
      <div className="w-full px-0 mx-0">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo (Matches Footer) */}
          <Link to="/" className="flex items-center gap-0 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-md shadow-fuchsia-500/20 transition-transform group-hover:scale-105">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Velocity<span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/Features" className="text-sm font-bold text-slate-600 transition-all hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-fuchsia-500 hover:to-cyan-500">
              How it works
            </Link>
            <Link to="#" className="text-sm font-bold text-slate-600 transition-all hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-fuchsia-500 hover:to-cyan-500">
              Pricing
            </Link>
            <Link to="#" className="text-sm font-bold text-slate-600 transition-all hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-fuchsia-500 hover:to-cyan-500">
              Book a Call
            </Link>
          </nav>

          {/* Right Section (Buttons) */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold rounded-xl">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-xl h-11 px-4 shadow-lg shadow-pink-500/20 transition-all duration-300 hover:scale-105 hover:shadow-pink-500/40 border-0" style={{ borderRadius: '10px' }}>
                Get Started
              </Button>
            </Link>
          </div>
          
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-slate-900" />
            ) : (
              <Menu className="h-6 w-6 text-slate-900" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
          {isOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-xl px-0 py-4 animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-4 mb-6">
              <Link
                to="#features"
                className="text-base font-bold text-slate-600 hover:text-fuchsia-500 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                to="#benefits"
                className="text-base font-bold text-slate-600 hover:text-fuchsia-500 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Benefits
              </Link>
              <Link
                to="#results"
                className="text-base font-bold text-slate-600 hover:text-fuchsia-500 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Results
              </Link>
            </nav>
            <div className="flex flex-col space-y-3 pt-6 border-t border-slate-100">
              <Link to="/login" className="w-full">
                <Button variant="outline" className="w-full text-slate-900 font-bold border-slate-200 h-12 rounded-xl">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup" className="w-full">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-xl h-12 border-0 shadow-lg shadow-pink-500/20" style={{ borderRadius: '10px' }}>
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};