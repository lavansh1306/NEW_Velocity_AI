import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 p-12 text-center shadow-2xl md:p-20">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="mb-6 flex justify-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <Zap className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h2 className="mb-4 text-4xl md:text-5xl font-bold text-white">
              Ready to Transform Your
              <span className="block">Workforce Operations?</span>
            </h2>
            
            <p className="mb-10 text-lg text-blue-100 md:text-xl max-w-2xl mx-auto">
              Join forward-thinking organizations that have already transformed their workforce management with Velocity AI. Start your free trial today and see the difference.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button 
                size="lg" 
                className="gap-2 bg-white text-blue-600 hover:bg-blue-50 shadow-lg font-semibold"
              >
                Book a Call
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold"
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
