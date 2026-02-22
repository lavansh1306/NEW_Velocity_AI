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
    color: 'bg-[#FFF1F2] text-[#BE123C]',
  },
  {
    name: 'Intelligent Redeployment',
    description: 'Identifies unused or freed capacity and recommends where employees can be redeployed for maximum impact across your organization.',
    icon: Users,
    color: 'bg-[#F0FDFA] text-[#0F766E]',
  },
  {
    name: 'Workforce Intelligence',
    description: 'Turns operational data into clear, actionable insights so leaders understand how work is performed and where productivity can be improved.',
    icon: BarChart3,
    color: 'bg-[#FFF7ED] text-[#C2410C]',
  },
  {
    name: 'Operational Automation',
    description: 'Replaces repetitive workforce planning tasks with AI, removing friction from day-to-day operations and freeing up valuable time.',
    icon: Zap,
    color: 'bg-[#F5F5F4] text-[#57534E]',
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
    <div ref={containerRef} className="py-24 sm:py-32 relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
        <div ref={headerRef} className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center rounded-full px-4 py-2 text-xs font-medium text-[#78716C] ring-1 ring-[#E7E5E4] mb-6 bg-white/70 backdrop-blur-sm">
            CAPABILITIES
          </div>
          <h2 className="text-4xl font-light tracking-tight text-[#1C1917] sm:text-5xl">
            What Velocity AI Actually Does
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#78716C]">
            Powerful AI capabilities that transform how you manage your workforce, eliminating guesswork and driving real ROI.
          </p>
        </div>
        
        <div ref={cardsRef} className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:max-w-none lg:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.name}
              className={`relative flex flex-col gap-6 rounded-2xl bg-white p-8 border border-[#E7E5E4] shadow-sm hover:shadow-md transition-all duration-300`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold leading-7 text-[#1C1917]">
                  {feature.name}
                </h3>
                <p className="text-sm leading-6 text-[#78716C]">
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
