import { Link } from "react-router-dom";
import { Zap, Twitter, Linkedin, Github } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-6">
      <div className="w-full px-0 mx-0">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-start">
          
          {/* Brand Identity */}
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-md shadow-fuchsia-500/20">
                <Zap className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                Velocity<span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500">AI</span>
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 max-w-xs text-center md:text-left">
              Intelligent workforce optimization for modern, value-driven organizations.
            </p>
          </div>

          {/* Core Links */}
          <div className="flex-1 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-bold text-slate-500">
            <Link to="#" className="transition-all hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-fuchsia-500 hover:to-cyan-500">
              Privacy Policy
            </Link>
            <Link to="#" className="transition-all hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-fuchsia-500 hover:to-cyan-500">
              Terms of Service
            </Link>
            <Link to="#" className="transition-all hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-fuchsia-500 hover:to-cyan-500">
              Contact Sales
            </Link>
          </div>

          {/* Socials & Copyright */}
          <div className="flex flex-col items-center md:items-end gap-5">
            <div className="flex gap-5 text-slate-400">
              <Link to="#" className="transition-colors hover:text-cyan-500">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link to="#" className="transition-colors hover:text-fuchsia-500">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link to="#" className="transition-colors hover:text-slate-900">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
            <p className="text-xs font-bold tracking-wide text-slate-400">
              &copy; {new Date().getFullYear()} VELOCITY AI. ALL RIGHTS RESERVED.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};