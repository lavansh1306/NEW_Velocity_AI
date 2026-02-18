import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1800px] mx-auto px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-12 text-center md:p-16">
          <div className="relative z-10">
            <h2 className="mb-4 text-4xl md:text-5xl font-light text-white">
              Ready to Transform Your
              <span className="block">Workforce Operations?</span>
            </h2>
            
            <p className="mb-10 text-base text-white/80 font-light max-w-2xl mx-auto">
              Join forward-thinking organizations that have already transformed their workforce management with Velocity AI.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button 
                className="gap-2 bg-white text-primary hover:bg-white/90 font-light h-11 px-6 rounded-lg"
              >
                Book a Call
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 font-light h-11 px-6 rounded-lg"
              >
                Talk to Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
