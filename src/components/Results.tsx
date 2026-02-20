import { TrendingDown, Brain, TrendingUp, Target, Sparkles } from "lucide-react";

export const Results = () => {
  // Added unique neon gradients for the dark theme!
  const results = [
    {
      icon: TrendingDown,
      value: "60%",
      label: "Less time on operations",
      description: "Reduce redundant operational work dramatically",
      gradient: "from-orange-400 to-rose-500",
      glow: "group-hover:shadow-orange-500/20"
    },
    {
      icon: Brain,
      value: "AI",
      label: "Powered decisions",
      description: "Smarter labor decisions backed by intelligence",
      gradient: "from-fuchsia-400 to-purple-600",
      glow: "group-hover:shadow-fuchsia-500/20"
    },
    {
      icon: TrendingUp,
      value: "40%",
      label: "Productivity increase",
      description: "Higher output without increasing headcount",
      gradient: "from-emerald-400 to-cyan-500",
      glow: "group-hover:shadow-emerald-500/20"
    },
    {
      icon: Target,
      value: "100%",
      label: "Value-focused teams",
      description: "Deploy teams where they create the most value",
      gradient: "from-blue-400 to-indigo-600",
      glow: "group-hover:shadow-blue-500/20"
    }
  ];

  return (
    <section className="relative overflow-hidden py-24 md:py-32 bg-slate-950">
      
      {/* Dark Theme Background Mesh & Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-[120px] pointer-events-none"></div>

      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="mb-20 text-center mx-auto max-w-3xl">
          
          {/* Glowing Dark Theme Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-bold tracking-wide text-indigo-300 uppercase backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            The Results
          </div>
          
          {/* High-Contrast Headline */}
          <h2 className="mb-6 text-4xl font-black tracking-tight text-white md:text-5xl">
            Measurable <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Impact</span>
          </h2>
          
          <p className="mx-auto max-w-2xl text-lg text-slate-400 font-medium">
            Real outcomes that transform how your organization operates, moving your baseline from surviving to scaling.
          </p>
        </div>

        {/* Glassmorphic Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map((result, index) => (
            <div 
              key={index} 
              className={`group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8 text-center backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.06] hover:-translate-y-1 ${result.glow}`}
            >
              {/* Subtle hover gradient background bleed */}
              <div className={`absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br ${result.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20 pointer-events-none`}></div>

              <div className="mb-8 flex justify-center relative z-10">
                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${result.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <result.icon className="h-8 w-8" />
                </div>
              </div>
              
              {/* Neon Text Gradient for the Big Numbers */}
              <div className={`mb-3 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br ${result.gradient} drop-shadow-sm`}>
                {result.value}
              </div>
              
              <h3 className="mb-2 text-lg font-bold text-white tracking-wide">
                {result.label}
              </h3>
              
              <p className="text-slate-400 font-medium text-sm leading-relaxed">
                {result.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};