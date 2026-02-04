import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-white pt-32 pb-20 md:pt-40 md:pb-32">
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-2 text-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
            <span className="text-blue-600">AI-Powered Workforce Intelligence</span>
          </div>
          
          <h1 className="mb-6 text-5xl font-bold leading-tight text-slate-900 md:text-6xl lg:text-7xl">
            Focus on What
            <span className="block bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Actually Matters
            </span>
          </h1>
          
          <p className="mb-10 text-lg text-slate-600 md:text-xl">
            Eliminate redundant operational work with AI-powered scheduling, workforce optimization, and intelligent redeployment. Let your managers drive outcomes, not logistics.
          </p>
          
          {/* Updated Action Area */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row max-w-lg mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
            <Button size="lg" className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shrink-0">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 text-sm text-slate-600 sm:flex-row">
            <span className="flex items-center gap-2">
              <span className="text-blue-600">●</span> No credit card required
            </span>
            <span className="hidden sm:block">•</span>
            <span className="flex items-center gap-2">
              <span className="text-blue-600">●</span> 14-day free trial
            </span>
            <span className="hidden sm:block">•</span>
            <span className="flex items-center gap-2">
              <span className="text-blue-600">●</span> Enterprise ready
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};