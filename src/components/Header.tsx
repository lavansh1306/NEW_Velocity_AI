import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            Velocity AI
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="#how it works" className="text-slate-600 hover:text-slate-900 transition">
              How it works
            </Link>
            <Link to="#pricing" className="text-slate-600 hover:text-slate-900 transition">
              Pricing
            </Link>
            <Link to="#book a call" className="text-slate-600 hover:text-slate-900 transition">
              Book a Call
            </Link>
          </nav>

          {/* Right Section */}
          {/* <div className="flex items-center gap-3">
            <Link to="/login" className="hidden md:inline">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="hidden md:block bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </Link>
          </div> */}
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-slate-900" />
            ) : (
              <Menu className="h-6 w-6 text-slate-900" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link
              to="#features"
              className="block px-4 py-2 text-slate-600 hover:text-slate-900"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link
              to="#benefits"
              className="block px-4 py-2 text-slate-600 hover:text-slate-900"
              onClick={() => setIsOpen(false)}
            >
              Benefits
            </Link>
            <Link
              to="#results"
              className="block px-4 py-2 text-slate-600 hover:text-slate-900"
              onClick={() => setIsOpen(false)}
            >
              Results
            </Link>
            <div className="px-4 pt-2 space-y-2">
              <Link to="/login" className="block">
                <Button variant="ghost" className="w-full text-slate-900">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
