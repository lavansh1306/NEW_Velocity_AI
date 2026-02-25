import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Background } from "@/components/landing/Background";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingImpact } from "@/components/landing/LandingImpact";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

gsap.registerPlugin(useGSAP);

const Index = () => {
  return (
    <div
      className="min-h-screen text-slate-900 selection:bg-indigo-100 selection:text-indigo-900"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Background />
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingBenefits />
        <LandingImpact />
        <LandingTestimonials />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Index;
