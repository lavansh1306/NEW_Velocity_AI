import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Hero = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  const handleJoin = async () => {
    if (!isValidEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      // Try inserting into Supabase `waitlist` table. Ensure you have set VITE_SUPABASE_* env vars.
      const { data, error } = await supabase.from("waitlist").insert({ email }).select();
      if (error) {
        console.error("Supabase insert error:", error);
        alert("Failed to join waitlist. Check server logs or Supabase credentials.");
      } else {
        alert("Thanks — you joined the waitlist!");
        setEmail("");
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error while joining waitlist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Subtle Background Decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-200/30 blur-[120px] rounded-full" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Refined Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white border border-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 shadow-sm transition-all hover:border-blue-200">
            <Sparkles className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
            <span>AI-Powered Workforce Intelligence</span>
          </div>
          
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
            Focus on What
            <span className="block bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent italic pb-2">
              Actually Matters
            </span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
            Eliminate redundant operational work with AI-powered scheduling and workforce optimization. 
            <span className="font-medium text-slate-800"> Let your managers drive outcomes, not logistics.</span>
          </p>
          
          {/* Action Area with Shadow Depth */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row max-w-lg mx-auto p-2 rounded-2xl bg-white/50 backdrop-blur-md border border-slate-100 shadow-xl shadow-blue-500/5">
            <Input
              type="email"
              placeholder="Enter your work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-none bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              aria-label="Join the waitlist"
              size="lg"
              onClick={handleJoin}
              disabled={loading}
              className="w-full sm:w-auto h-12 px-8 gap-2 bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all text-white shadow-md shadow-blue-200"
            >
              {loading ? "Joining..." : "JOIN THE WAITLIST"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Enhanced Trust Section */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Enterprise ready
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};