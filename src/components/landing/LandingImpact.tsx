import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingDown, BrainCircuit, TrendingUp, Target } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  {
    value: 60,
    suffix: '%',
    label: 'Less time on operations',
    description: 'Reduce redundant operational work dramatically',
    icon: TrendingDown,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200'
  },
  {
    value: 'AI',
    suffix: '',
    label: 'Powered decisions',
    description: 'Smarter labor decisions backed by intelligence',
    icon: BrainCircuit,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  },
  {
    value: 40,
    suffix: '%',
    label: 'Productivity increase',
    description: 'Higher output without increasing headcount',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200'
  },
  {
    value: 100,
    suffix: '%',
    label: 'Value-focused teams',
    description: 'Deploy teams where they create the most value',
    icon: Target,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
];

export function LandingImpact() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
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

    const numbers = gsap.utils.toArray<HTMLElement>('.stat-number', containerRef.current);
    numbers.forEach((num) => {
      const targetValue = num.getAttribute('data-value');
      if (targetValue === 'AI') return;

      gsap.from(num, {
        textContent: 0,
        duration: 2,
        ease: 'power1.out',
        snap: { textContent: 1 },
        scrollTrigger: {
          trigger: num,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
      });
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="py-24 sm:py-32 relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#78716C] ring-1 ring-[#E7E5E4] bg-white/70 mb-6">
            The Results
          </div>
          <h2 className="text-4xl font-light tracking-tight text-[#1C1917] sm:text-5xl">
            Measurable Impact
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#78716C]">
            Real outcomes that transform how your organization operates, moving your baseline from surviving to scaling.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-[#E7E5E4] shadow-sm hover:shadow-md transition-all group`}
            >
              <div className={`mb-6 p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-8 w-8" />
              </div>
              <div className={`text-4xl font-light mb-2 ${stat.color} flex items-center`}>
                <span className="stat-number" data-value={stat.value}>
                  {stat.value}
                </span>
                {stat.suffix}
              </div>
              <div className="text-lg font-semibold text-[#1C1917] mb-2">{stat.label}</div>
              <p className="text-sm text-[#78716C] leading-relaxed">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
