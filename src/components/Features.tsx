import { Card } from "@/components/ui/card";
import { Calendar, Users, BarChart3, Zap, Sparkles } from "lucide-react";

// I added 'gradient' and 'shadowColor' properties to give each card a unique, vibrant personality!
const features = [
  {
    icon: Calendar,
    title: "AI-Driven Scheduling",
    description: "Automatically builds and optimizes schedules based on real demand, availability, and business priorities—reducing manual effort and costly inefficiencies.",
    gradient: "from-pink-500 to-rose-500",
    shadowColor: "shadow-pink-500/20",
    hoverBorder: "hover:border-pink-300",
  },
  {
    icon: Users,
    title: "Intelligent Redeployment",
    description: "Identifies unused or freed capacity and recommends where employees can be redeployed for maximum impact across your organization.",
    gradient: "from-purple-500 to-indigo-500",
    shadowColor: "shadow-purple-500/20",
    hoverBorder: "hover:border-purple-300",
  },
  {
    icon: BarChart3,
    title: "Workforce Intelligence",
    description: "Turns operational data into clear, actionable insights so leaders understand how work is performed and where productivity can be improved.",
    gradient: "from-cyan-500 to-blue-500",
    shadowColor: "shadow-cyan-500/20",
    hoverBorder: "hover:border-cyan-300",
  },
  {
    icon: Zap,
    title: "Operational Automation",
    description: "Replaces repetitive workforce planning tasks with AI, removing friction from day-to-day operations and freeing up valuable time.",
    gradient: "from-amber-400 to-orange-500",
    shadowColor: "shadow-amber-500/20",
    hoverBorder: "hover:border-amber-300",
  }
];

export const Features = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32 bg-slate-50">
      
      {/* Subtle Background Elements to tie into the Hero */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="mb-20 text-center mx-auto max-w-3xl">
          
          {/* Vibrant Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md border border-purple-200 px-4 py-1.5 text-xs font-bold tracking-wide text-purple-600 uppercase shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Sparkles className="h-3.5 w-3.5" />
            Capabilities
          </div>
          
          {/* Bold Headline */}
          <h2 className="mb-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            What Velocity AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-500">Actually Does</span>
          </h2>
          
          {/* Upgraded Subtitle */}
          <p className="mx-auto max-w-2xl text-lg text-slate-600 font-medium leading-relaxed">
            Powerful AI capabilities that transform how you manage your workforce, eliminating guesswork and driving real ROI.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${feature.shadowColor} ${feature.hoverBorder} rounded-3xl`}
            >
              {/* Card Hover Glow Effect */}
              <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br ${feature.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-10 pointer-events-none`}></div>

              {/* Colorful Icon Container */}
              <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg ${feature.shadowColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <feature.icon className="h-7 w-7" />
              </div>
              
              {/* Card Typography */}
              <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed font-medium text-base">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};