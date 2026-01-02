import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" aria-label="Home" className="flex items-center gap-2 no-underline">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <span className="text-lg font-bold text-white">V</span>
            </div>
            <span className="text-xl font-bold text-inherit">Velocity AI</span>
          </Link>
        
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#architecture" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Architecture
          </a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
          <a href="#docs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Documentation
          </a>
          <a href="/use-cases" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Use Cases
          </a>
          <a href="/projects" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Projects
          </a>
        </nav>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden md:inline-flex">
            Sign In
          </Button>
          <Button className="hidden md:inline-flex">
            Get Started
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile nav overlay */}
      {open && (
        <div className="fixed inset-0 z-60 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-70 w-full max-w-xs bg-background p-6 shadow-lg md:hidden">
            <div className="mb-6 flex items-center justify-between">
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
                  <span className="text-lg font-bold text-white">V</span>
                </div>
                <span className="font-bold">Velocity AI</span>
              </Link>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-4">
              <a href="#features" onClick={() => setOpen(false)} className="text-base font-medium text-muted-foreground">Features</a>
              <a href="#architecture" onClick={() => setOpen(false)} className="text-base font-medium text-muted-foreground">Architecture</a>
              <a href="#pricing" onClick={() => setOpen(false)} className="text-base font-medium text-muted-foreground">Pricing</a>
              <a href="#docs" onClick={() => setOpen(false)} className="text-base font-medium text-muted-foreground">Documentation</a>
              <a href="/use-cases" onClick={() => setOpen(false)} className="text-base font-medium text-muted-foreground">Use Cases</a>
              <a href="/projects" onClick={() => setOpen(false)} className="text-base font-medium text-muted-foreground">Projects</a>
            </nav>

            <div className="mt-6 flex flex-col gap-3">
              <Button variant="ghost" onClick={() => setOpen(false)}>Sign In</Button>
              <Button onClick={() => setOpen(false)}>Get Started</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
