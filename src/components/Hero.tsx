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
    <section className="relative overflow-hidden bg-white pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Background Decorative Mesh & Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
      <div className="absolute right-0 top-0 -z-10 h-[400px] w-[400px] rounded-full bg-purple-500 opacity-10 blur-[120px]"></div>

      <div className="relative mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/50 px-5 py-2 text-sm font-medium text-indigo-700 shadow-sm transition-all hover:bg-indigo-100/80">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span>AI-Powered Workforce Intelligence</span>
          </div>
          
          {/* Headline */}
          <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-slate-900 md:text-7xl">
            Focus on What <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Actually Matters
            </span>
          </h1>
          
          {/* Subtext */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
            Eliminate redundant operational work with AI-powered scheduling and workforce optimization. 
            <span className="font-semibold text-slate-800"> Let your managers drive outcomes, not logistics.</span>
          </p>
          
          {/* Action Area */}
          <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 sm:flex-row p-2 rounded-2xl bg-white/60 backdrop-blur-md border border-slate-200 shadow-xl shadow-indigo-900/5">
            <Input
              type="email"
              placeholder="Enter your work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="h-12 border-none bg-transparent px-4 text-base font-medium text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400"
            />
            <Button
              aria-label="Join the waitlist"
              onClick={handleJoin}
              disabled={loading || !isValidEmail(email)}
              className="h-12 px-8 gap-2 bg-slate-900 hover:bg-indigo-600 text-white font-semibold rounded-xl flex-shrink-0 transition-all duration-300 shadow-md"
            >
              {loading ? "Joining..." : "Get Early Access"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Status Message */}
          <div className="mt-4 h-6">
            {message && (
              <p className={`text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${message.includes("Failed") || message.includes("Unexpected") || message.includes("Error") ? "text-red-500" : "text-emerald-600"}`}>
                {message}
              </p>
            )}
          </div>
          
          {/* Trust Section */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Enterprise ready
            </div>
          </div>

        </div>

        {/* Dashboard Preview Mockup (Optional but highly recommended for SaaS) */}
        <div className="mt-20 mx-auto max-w-5xl rounded-2xl border border-slate-200/50 bg-white/40 p-2 shadow-2xl shadow-indigo-900/10 backdrop-blur-sm">
          <div className="rounded-xl overflow-hidden border border-slate-100 bg-white">
            
          </div>
        </div>

      </div>
    </section>
  );
};