import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

export const CTA = () => {
  return (
    <section className="relative py-24 bg-white overflow-hidden">
      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-8">
        
        {/* The Massive Glowing Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-8 py-20 shadow-2xl shadow-purple-900/20 sm:px-16 sm:py-28 text-center border border-slate-800">
          
          {/* Internal Aurora Glows */}
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-500 blur-[128px] opacity-40 pointer-events-none animate-pulse"></div>
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-cyan-500 blur-[128px] opacity-40 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

          <div className="relative z-10 mx-auto max-w-3xl">
            
            {/* Floating Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 text-sm font-bold tracking-wide text-white uppercase shadow-lg">
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
              Get Started Today
            </div>
            
            {/* High-Impact Headline */}
            <h2 className="mb-8 text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
              Ready to Transform Your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 drop-shadow-sm">
                Workforce Operations?
              </span>
            </h2>
            
            <p className="mb-12 text-lg text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
              Join forward-thinking organizations that have already transformed their scheduling, redeployment, and capacity planning with Velocity AI.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button 
                className="h-14 px-8 gap-2 bg-white text-slate-900 hover:bg-slate-100 hover:scale-105 font-bold rounded-xl text-base transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              >
                Book a Demo
                <ArrowRight className="h-5 w-5 text-slate-900" />
              </Button>
              <Button 
                variant="outline" 
                className="h-14 px-8 bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:border-white/40 font-bold rounded-xl text-base transition-all duration-300"
              >
                Talk to Sales
              </Button>
            </div>

            {/* Micro-copy for extra conversion push */}
            <p className="mt-8 text-sm font-medium text-slate-500 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-400" />
              Setup takes less than 15 minutes.
            </p>

          </div>
        </div>
      </div>
    </section>
  );
};