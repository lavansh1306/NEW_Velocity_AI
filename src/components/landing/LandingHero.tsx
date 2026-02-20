import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(useGSAP);

export function LandingHero() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const containerRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleGetEarlyAccess = async () => {
    setFormError('');
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from('email_interests')
      .upsert(
        [{ email: email.trim(), source: 'landing_hero', created_at: new Date().toISOString() }],
        { onConflict: 'email', ignoreDuplicates: true }
      );
    setSubmitting(false);
    if (error) {
      setFormError('Something went wrong. Please try again.');
    } else {
      setSubmitted(true);
      setEmail('');
    }
  };

  useGSAP(() => {
    if (!badgeRef.current || !titleRef.current || !descRef.current || !formRef.current || !trustRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from(badgeRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.8,
    })
      .from(titleRef.current, {
        y: 30,
        opacity: 0,
        duration: 1,
      }, '-=0.6')
      .from(descRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
      }, '-=0.8')
      .from(formRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
      }, '-=0.6')
      .from(trustRef.current, {
        y: 10,
        opacity: 0,
        duration: 1,
      }, '-=0.6');
      
    if (glowRef.current) {
      gsap.to(glowRef.current, {
        scale: 1.1,
        opacity: 0.6,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }
      
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative pt-40 pb-32 lg:pt-56 lg:pb-40">
      {/* Central Radial Glow Behind Headline */}
      <div 
        ref={glowRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-100/30 to-purple-100/30 blur-[80px] rounded-full pointer-events-none -z-10"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center z-10">
        
        {/* Badge */}
        <div 
          ref={badgeRef}
          className="mx-auto mb-10 flex max-w-fit items-center justify-center space-x-2 rounded-full border border-stone-200 bg-white/60 px-5 py-1.5 backdrop-blur-sm shadow-sm transition-all hover:border-stone-300 hover:bg-white/80"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Workforce Intelligence Platform
          </p>
        </div>

        {/* Headline */}
        <h1 
          ref={titleRef}
          className="mx-auto max-w-5xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-7xl mb-10"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Focus on What<br />
          <span 
            className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent italic"
            style={{ fontFamily: "'Source Serif 4', serif" }}
          >
            Actually Matters
          </span>
        </h1>

        {/* Description */}
        <p 
          ref={descRef}
          className="mx-auto max-w-2xl text-xl leading-relaxed text-slate-600 mb-14 font-light"
        >
          Eliminate redundant operational work with AI-powered scheduling and workforce optimization. <span className="font-medium text-slate-900">Let your managers drive outcomes, not logistics.</span>
        </p>

        {/* CTA Form */}
        <div 
          ref={formRef}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row max-w-lg mx-auto"
        >
          {submitted ? (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-6 py-4 text-emerald-700 font-medium text-sm">
              <Check className="size-4 text-emerald-500" />
              You're on the list! We'll be in touch soon.
            </div>
          ) : (
            <>
              <div className="relative w-full shadow-sm rounded-lg">
                <input
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGetEarlyAccess()}
                  className="w-full rounded-lg border border-slate-200 bg-white px-5 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm outline-none shadow-sm transition-all"
                />
              </div>
              <button
                onClick={handleGetEarlyAccess}
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-slate-900 px-7 py-3.5 text-sm font-medium text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Joining...' : 'Get Early Access'}
                {!submitting && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 opacity-70" />}
              </button>
            </>
          )}
        </div>
        {formError && (
          <p className="mt-3 text-sm text-red-500 text-center">{formError}</p>
        )}

        {/* Trust Indicators */}
        <div 
          ref={trustRef}
          className="mt-16 flex items-center justify-center gap-8 text-xs font-medium text-slate-500 uppercase tracking-wider"
        >
          <div className="flex items-center gap-2">
            <Check className="size-3.5 text-indigo-500" />
            <span>No credit card</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="size-3.5 text-indigo-500" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="size-3.5 text-indigo-500" />
            <span>Enterprise ready</span>
          </div>
        </div>
        
      </div>
    </section>
  );
}
