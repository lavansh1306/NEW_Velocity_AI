import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote, Star } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    content: "Velocity AI completely transformed our scheduling process. What used to take our managers 15 hours a week is now done automatically in minutes, and the staff is happier with the fairness.",
    author: "Sarah Jenkins",
    role: "VP of Operations",
    company: "TechFlow Solutions",
    image: "https://images.unsplash.com/photo-1758599543120-4e462429a4d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHdvbWFuJTIwY29ycG9yYXRlfGVufDF8fHx8MTc3MTYwNTAyM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 5
  },
  {
    content: "The intelligent redeployment suggestions are a game changer. We uncovered 20% more capacity within our existing team just by moving people to where the demand actually was.",
    author: "Michael Chen",
    role: "Director of Engineering",
    company: "ScaleUp Inc.",
    image: "https://images.unsplash.com/photo-1769071166862-8cc3a6f2ac5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbiUyMHN0YXJ0dXAlMjBmb3VuZGVyfGVufDF8fHx8MTc3MTYwNzM4OHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 5
  },
  {
    content: "Finally, a tool that gives us real visibility. The insights dashboard isn't just data; it's actionable intelligence that has helped us improve our margins for three consecutive quarters.",
    author: "Elena Rodriguez",
    role: "Chief Operating Officer",
    company: "Global Logistics",
    image: "https://images.unsplash.com/photo-1758518729459-235dcaadc611?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHdvbWFuJTIwZXhlY3V0aXZlfGVufDF8fHx8MTc3MTU5NjE4OXww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 5
  }
];

export function LandingTestimonials() {
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
          stagger: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="py-24 sm:py-32 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div ref={headerRef} className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 ring-1 ring-inset ring-indigo-200 bg-indigo-50/50 backdrop-blur-sm mb-6">
            Customer Stories
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Trusted by the World's <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Most Innovative Teams</span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            See how leading organizations are using Velocity AI to streamline operations and empower their workforce.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div ref={cardsRef} className="mx-auto grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex flex-col justify-between rounded-2xl bg-white/60 backdrop-blur-md p-8 shadow-sm ring-1 ring-slate-200 hover:ring-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 h-8 w-8 text-indigo-100 -z-10 transform scale-150 rotate-180" />
                  <p 
                    className="text-lg leading-relaxed text-slate-700 font-medium italic relative z-10"
                    style={{ fontFamily: "'Source Serif 4', serif" }}
                  >
                    "{testimonial.content}"
                  </p>
                </div>
              </div>
              
              <div className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-6">
                <img
                  className="h-12 w-12 rounded-full bg-slate-100 object-cover ring-2 ring-white"
                  src={testimonial.image}
                  alt={testimonial.author}
                />
                <div>
                  <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {testimonial.author}
                  </div>
                  <div className="text-sm leading-6 text-slate-500">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
