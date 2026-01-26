export const Stats = () => {
  const metrics = [
    { label: "Schedule Optimization", value: 94 },
    { label: "Resource Utilization", value: 87 },
    { label: "Productivity Score", value: 91 }
  ];

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16">
            <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-6">
              WHY IT MATTERS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Remove the Noise of
              <span className="block bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Workforce Management
              </span>
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Velocity AI removes the noise of day-to-day workforce management. Instead of managing logistics, your leaders get clarity, control, and confidence—allowing them to focus on what drives real business value.
            </p>
            
            <div className="space-y-6 mb-10">
              {metrics.map((metric, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700 font-medium">{metric.label}</span>
                    <span className="text-blue-600 font-bold text-lg">{metric.value}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                      style={{ width: `${metric.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl mt-0.5">✓</span>
                <span className="text-slate-700">Managers no longer need to micromanage schedules</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl mt-0.5">✓</span>
                <span className="text-slate-700">Eliminate staffing gaps and resource shifts</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl mt-0.5">✓</span>
                <span className="text-slate-700">Gain clarity, control, and confidence</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl mt-0.5">✓</span>
                <span className="text-slate-700">Focus on team performance and customer experience</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl mt-0.5">✓</span>
                <span className="text-slate-700">Drive growth with intelligent workforce decisions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
