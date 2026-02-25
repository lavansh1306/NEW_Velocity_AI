import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle2, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function LandingBenefits() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(leftRef.current, 
      { x: -50, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: leftRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    gsap.fromTo(rightRef.current,
      { x: 50, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: rightRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    const bars = gsap.utils.toArray<HTMLElement>('.progress-bar', containerRef.current);
    bars.forEach((bar) => {
      const width = bar.getAttribute('data-width');
      gsap.fromTo(
        bar,
        { width: 0 },
        {
          width: width || '0%',
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: bar,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="py-24 sm:py-32 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24 items-center">
          
          {/* Left Content */}
          <div ref={leftRef}>
            <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600 ring-1 ring-inset ring-blue-200 bg-blue-50 mb-6">
              Why it matters
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-6">
              Remove the Noise of <span className="text-blue-600 italic" style={{ fontFamily: "'Source Serif 4', serif" }}>Workforce Management</span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600 mb-8">
              Velocity AI removes the noise of day-to-day workforce management. Instead of managing logistics, your leaders get clarity, control, and confidence—allowing them to focus on what drives real business value.
            </p>
            
            <ul className="space-y-4 text-slate-600">
              {[
                "Managers no longer need to micromanage schedules",
                "Eliminate staffing gaps and resource shifts",
                "Gain clarity, control, and confidence",
                "Focus on team performance and customer experience",
                "Drive growth with intelligent workforce decisions"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Content - Stats Card */}
          <div ref={rightRef} className="relative">
            <div className="rounded-3xl bg-white p-8 ring-1 ring-slate-100 shadow-2xl shadow-blue-900/10 relative z-10 backdrop-blur-sm bg-white/90">
              <h3 className="text-lg font-semibold text-slate-900 mb-8">System Intelligence</h3>
              
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Schedule Optimization</span>
                    <span className="text-xl font-bold text-pink-500">94%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      data-width="94%"
                      className="progress-bar h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full w-0" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resource Utilization</span>
                    <span className="text-xl font-bold text-purple-500">87%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      data-width="87%"
                      className="progress-bar h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full w-0" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Productivity Score</span>
                    <span className="text-xl font-bold text-cyan-500">91%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      data-width="91%"
                      className="progress-bar h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full w-0" 
                    />
                  </div>
                </div>
              </div>

              {/* Recommendation Box */}
              <div className="mt-8 rounded-xl bg-slate-50 p-4 border border-slate-100 flex gap-4">
                <div className="mt-1 h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">AI Recommendation</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Based on current velocity, reallocating 2 engineers to the frontend queue will optimize delivery by 14%.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="absolute -inset-4 -z-10 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-[2.5rem] blur-xl opacity-60"></div>
          </div>

        </div>
      </div>
    </div>
  );
}
