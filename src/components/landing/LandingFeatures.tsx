import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Calendar, Users, BarChart3, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    name: 'AI-Driven Scheduling',
    description: 'Automatically builds and optimizes schedules based on real demand, availability, and business priorities—reducing manual effort and costly inefficiencies.',
    icon: Calendar,
    color: 'bg-pink-50 text-pink-600',
    borderColor: 'hover:border-pink-200',
    shadowColor: 'hover:shadow-pink-500/10'
  },
  {
    name: 'Intelligent Redeployment',
    description: 'Identifies unused or freed capacity and recommends where employees can be redeployed for maximum impact across your organization.',
    icon: Users,
    color: 'bg-purple-50 text-purple-600',
    borderColor: 'hover:border-purple-200',
    shadowColor: 'hover:shadow-purple-500/10'
  },
  {
    name: 'Workforce Intelligence',
    description: 'Turns operational data into clear, actionable insights so leaders understand how work is performed and where productivity can be improved.',
    icon: BarChart3,
    color: 'bg-cyan-50 text-cyan-600',
    borderColor: 'hover:border-cyan-200',
    shadowColor: 'hover:shadow-cyan-500/10'
  },
  {
    name: 'Operational Automation',
    description: 'Replaces repetitive workforce planning tasks with AI, removing friction from day-to-day operations and freeing up valuable time.',
    icon: Zap,
    color: 'bg-orange-50 text-orange-600',
    borderColor: 'hover:border-orange-200',
    shadowColor: 'hover:shadow-orange-500/10'
  },
];

export function LandingFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(headerRef.current, 
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    if (cardsRef.current) {
      gsap.fromTo(cardsRef.current.children,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="py-24 sm:py-32 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
        <div ref={headerRef} className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-indigo-600 ring-1 ring-inset ring-indigo-200 mb-6 bg-white/50 backdrop-blur-sm">
            CAPABILITIES
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            What Velocity AI <span className="text-indigo-600 italic" style={{ fontFamily: "'Source Serif 4', serif" }}>Actually Does</span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Powerful AI capabilities that transform how you manage your workforce, eliminating guesswork and driving real ROI.
          </p>
        </div>
        
        <div ref={cardsRef} className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:max-w-none lg:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.name}
              className={`relative flex flex-col gap-6 rounded-2xl bg-white p-8 ring-1 ring-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 ${feature.borderColor} ${feature.shadowColor} hover:shadow-lg`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}>
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold leading-7 text-slate-900">
                  {feature.name}
                </h3>
                <p className="text-base leading-7 text-slate-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
