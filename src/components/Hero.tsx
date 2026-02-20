import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Hero = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isValidEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  const handleJoin = async () => {
    if (!isValidEmail(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      const emailTrimmed = email.toLowerCase().trim();
      console.log('[Waitlist] Attempting to save email:', emailTrimmed);
      
      // Try API route first (more reliable across regions)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const apiResponse = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailTrimmed }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (apiResponse.ok) {
          console.log('[Waitlist] Email saved via API');
          setMessage("Thanks for joining! Check your email for updates.");
          setEmail("");
          setTimeout(() => setMessage(""), 5000);
          return;
        }
      } catch (apiErr: any) {
        console.error('[Waitlist] API route error:', apiErr.message);
        // Fall through to Supabase if API fails
      }
      
      // Fallback: Try Supabase directly
      console.log('[Waitlist] Trying Supabase fallback...');
      const { data, error } = await supabase
        .from("waitlist")
        .insert([{ 
          email: emailTrimmed,
          created_at: new Date().toISOString(),
          source: "homepage_hero"
        }])
        .select();
      
      if (error) {
        console.error('[Waitlist] Supabase error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Check if it's a duplicate email error
        if (error.code === '23505' || error.message?.includes('unique')) {
          setMessage("You've already joined the waitlist!");
        } else {
          setMessage(`Failed to join waitlist: ${error.message || 'Please try again later.'}`);
        }
      } else {
        console.log('[Waitlist] Email saved successfully:', data);
        setMessage("Thanks for joining! Check your email for updates.");
        setEmail("");
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (err: any) {
      console.error('[Waitlist] Unexpected error:', err);
      const errorMsg = err?.message || 'Unexpected error. Please try again.';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && isValidEmail(email)) {
      handleJoin();
    }
  };

  return (
    <section className="relative bg-white pt-24 pb-20 md:pt-32 md:pb-32">
      <div className="relative mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-2 text-sm font-light text-blue-700">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Workforce Management</span>
          </div>
          
          {/* Headline */}
          <h1 className="mb-6 text-5xl md:text-6xl font-light tracking-tight text-gray-900">
            Focus on What Matters
          </h1>
          
          {/* Subtext */}
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-gray-600 font-light">
            Eliminate operational overhead with AI-powered scheduling and workforce optimization. 
            Let your managers drive outcomes, not logistics.
          </p>
          
          {/* Action Area */}
          <div className="mx-auto max-w-lg rounded-2xl bg-gray-50 border-2 border-gray-200 shadow-sm p-1.5">
            <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row p-3.5 rounded-xl bg-white">
              <Input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="h-11 border border-gray-200 bg-white px-4 text-base font-light text-gray-900 focus-visible:ring-blue-500 focus-visible:border-blue-500 placeholder:text-gray-400 placeholder:font-light rounded-lg"
              />
              <Button
                aria-label="Join the waitlist"
                onClick={handleJoin}
                disabled={loading || !isValidEmail(email)}
                className="h-11 px-6 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-light rounded-lg flex-shrink-0 transition-colors border-0"
              >
                {loading ? "Joining..." : "Get Started"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Status Message */}
          <div className="mt-6 h-6">
            {message && (
              <p className={`text-sm font-light animate-in fade-in slide-in-from-bottom-2 ${message.includes("Failed") || message.includes("Unexpected") || message.includes("Error") ? "text-red-600" : "text-green-600"}`}>
                {message}
              </p>
            )}
          </div>
          
          {/* Trust Section */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 text-sm font-light text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              Enterprise ready
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};