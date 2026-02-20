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
    <section className="relative overflow-hidden bg-slate-50 pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Colorful Aurora Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-fuchsia-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-blob animation-delay-4000"></div>
      
      {/* Dotted Mesh Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          
          {/* Vibrant Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md border border-pink-200 px-5 py-2 text-sm font-bold text-pink-600 shadow-[0_0_20px_rgba(236,72,153,0.15)] transition-transform hover:scale-105">
            <Sparkles className="h-4 w-4 text-pink-500" />
            <span>AI-Powered Workforce Intelligence</span>
          </div>
          
          {/* Headline */}
          <h1 className="mb-8 text-6xl font-black tracking-tight text-slate-900 md:text-8xl">
            Focus on What <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">
              Actually Matters
            </span>
          </h1>
          
          {/* Subtext */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-700 md:text-xl font-medium">
            Eliminate redundant operational work with AI-powered scheduling and workforce optimization. 
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600"> Let your managers drive outcomes, not logistics.</span>
          </p>
          
          {/* Colorful Action Area */}
          <div className="mx-auto max-w-lg p-[3px] rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 shadow-2xl shadow-purple-500/20 transition-all hover:shadow-purple-500/40">
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row p-1.5 rounded-[14px] bg-white backdrop-blur-xl">
              <Input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="h-14 border-none bg-transparent px-4 text-base font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400 placeholder:font-normal"
              />
              <Button
                aria-label="Join the waitlist"
                onClick={handleJoin}
                disabled={loading || !isValidEmail(email)}
                className="h-14 px-8 gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-xl flex-shrink-0 transition-all duration-300 border-0 shadow-lg shadow-pink-500/30"
              >
                {loading ? "Joining..." : "Get Early Access"}
                {!loading && <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {/* Status Message */}
          <div className="mt-6 h-6">
            {message && (
              <p className={`text-base font-bold animate-in fade-in slide-in-from-bottom-2 ${message.includes("Failed") || message.includes("Unexpected") || message.includes("Error") ? "text-red-500" : "text-emerald-500 drop-shadow-sm"}`}>
                {message}
              </p>
            )}
          </div>
          
          {/* Trust Section */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-bold text-slate-600">
            <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-full border border-slate-200/50">
              <CheckCircle2 className="h-4 w-4 text-cyan-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-full border border-slate-200/50">
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-full border border-slate-200/50">
              <CheckCircle2 className="h-4 w-4 text-pink-500" />
              Enterprise ready
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};