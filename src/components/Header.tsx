import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-white border-b border-gray-100 z-50">
      <div className="max-w-[1800px] mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-light text-lg text-gray-900">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-light text-sm">V</span>
            </div>
            Velocity AI
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-12">
            <Link to="#" className="text-gray-600 hover:text-gray-900 transition font-light text-sm">
              How it works
            </Link>
            <Link to="#" className="text-gray-600 hover:text-gray-900 transition font-light text-sm">
              Pricing
            </Link>
            <Link to="#" className="text-gray-600 hover:text-gray-900 transition font-light text-sm">
              Book a Call
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden md:inline">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-light">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="hidden md:block bg-primary hover:bg-primary/90 text-white font-light h-10 px-6 rounded-xl">
                Get Started
              </Button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-gray-900" />
            ) : (
              <Menu className="h-6 w-6 text-gray-900" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link
              to="#features"
              className="block px-4 py-2 text-gray-600 hover:text-gray-900 font-light text-sm"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link
              to="#benefits"
              className="block px-4 py-2 text-gray-600 hover:text-gray-900 font-light text-sm"
              onClick={() => setIsOpen(false)}
            >
              Benefits
            </Link>
            <Link
              to="#results"
              className="block px-4 py-2 text-gray-600 hover:text-gray-900 font-light text-sm"
              onClick={() => setIsOpen(false)}
            >
              Results
            </Link>
            <div className="px-4 pt-2 space-y-2">
              <Link to="/login" className="block">
                <Button variant="ghost" className="w-full text-gray-900 font-light">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup" className="block">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-light rounded-xl">
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
