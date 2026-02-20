import { Sparkles, CheckCircle2 } from "lucide-react";

export const Stats = () => {
  // Added unique gradients to make the progress bars pop
  const metrics = [
    { label: "Schedule Optimization", value: 94, gradient: "from-pink-500 to-rose-400" },
    { label: "Resource Utilization", value: 87, gradient: "from-purple-600 to-indigo-500" },
    { label: "Productivity Score", value: 91, gradient: "from-cyan-400 to-blue-500" }
  ];

  const benefits = [
    "Managers no longer need to micromanage schedules",
    "Eliminate staffing gaps and resource shifts",
    "Gain clarity, control, and confidence",
    "Focus on team performance and customer experience",
    "Drive growth with intelligent workforce decisions"
  ];

  return (
    <section className="relative overflow-hidden py-20 md:py-32 bg-white">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[100px] pointer-events-none opacity-80"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-purple-50 rounded-full blur-[100px] pointer-events-none opacity-80"></div>

      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Copy & Checklist */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 text-xs font-bold tracking-wide text-blue-600 uppercase">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              Why It Matters
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
              Remove the Noise of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Workforce Management
              </span>
            </h2>
            
            <p className="text-lg text-slate-600 font-medium leading-relaxed mb-10">
              Velocity AI removes the noise of day-to-day workforce management. Instead of managing logistics, your leaders get clarity, control, and confidence—allowing them to focus on what drives real business value.
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="mt-1 flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center transition-transform group-hover:scale-110">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-slate-700 font-medium text-base leading-relaxed">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Floating Dashboard Card */}
          <div className="relative">
            {/* Decorative element behind the card */}
            <div className="absolute -inset-1 bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-500 rounded-[2.5rem] blur-xl opacity-20"></div>
            
            <div className="relative bg-white/80 backdrop-blur-xl border border-slate-200/60 p-8 md:p-10 rounded-3xl shadow-2xl shadow-slate-200/50">
              <h3 className="text-xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">
                System Intelligence
              </h3>
              
              <div className="space-y-10">
                {metrics.map((metric, index) => (
                  <div key={index} className="group">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-slate-700 font-bold text-sm tracking-wide uppercase">
                        {metric.label}
                      </span>
                      <span className={`text-transparent bg-clip-text bg-gradient-to-r ${metric.gradient} font-black text-2xl drop-shadow-sm`}>
                        {metric.value}%
                      </span>
                    </div>
                    
                    {/* Progress Bar Track */}
                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden shadow-inner relative">
                      {/* Animated Gradient Fill */}
                      <div 
                        className={`absolute top-0 left-0 h-full bg-gradient-to-r ${metric.gradient} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${metric.value}%` }}
                      >
                        {/* Shimmer effect inside the bar */}
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini-insight box inside the card */}
              <div className="mt-10 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">AI Recommendation</h4>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">
                    Based on current velocity, reallocating 2 engineers to the frontend queue will optimize delivery by 14%.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};