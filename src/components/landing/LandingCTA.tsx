import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Phone } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function LandingCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(cardRef.current,
      { scale: 0.95, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="py-24 sm:py-32 relative overflow-hidden bg-white">
      <div className="px-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div
            ref={cardRef}
            className="relative isolate overflow-hidden rounded-3xl bg-[#1C1917] px-6 py-24 text-center shadow-2xl sm:px-16"
          >
            {/* Background Gradients */}
            <div className="absolute -top-24 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#2DD4BF]/20 to-[#0F766E]/20 blur-[100px]"></div>
            
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center rounded-full px-4 py-2 text-xs font-medium text-[#2DD4BF] ring-1 ring-[#2DD4BF]/30 bg-[#2DD4BF]/10 mb-8">
                GET STARTED TODAY
              </div>
              
              <h2 className="text-3xl font-light tracking-tight text-white sm:text-4xl">
                Ready to Transform Your Workforce Operations?
              </h2>
              
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-stone-300">
                Join forward-thinking organizations that have already transformed their scheduling, redeployment, and capacity planning with Velocity AI.
              </p>
              
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <a
                  href="#"
                  className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all flex items-center group"
                >
                  Book a Demo
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="#"
                  className="rounded-full bg-white/10 px-8 py-3.5 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 hover:bg-white/20 transition-all flex items-center"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Talk to Sales
                </a>
              </div>
              
              <p className="mt-8 text-xs text-slate-500 flex items-center justify-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Setup takes less than 15 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
