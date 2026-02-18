export const Stats = () => {
  const metrics = [
    { label: "Schedule Optimization", value: 94 },
    { label: "Resource Utilization", value: 87 },
    { label: "Productivity Score", value: 91 }
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1800px] mx-auto px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12">
            <div className="inline-block px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-light mb-6">
              WHY IT MATTERS
            </div>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
              Remove the Noise of
              <span className="block text-primary">
                Workforce Management
              </span>
            </h2>
            <p className="text-base text-gray-600 font-light mb-8">
              Velocity AI removes the noise of day-to-day workforce management. Instead of managing logistics, your leaders get clarity, control, and confidence—allowing them to focus on what drives real business value.
            </p>
            
            <div className="space-y-6 mb-10">
              {metrics.map((metric, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-light text-sm">{metric.label}</span>
                    <span className="text-primary font-light text-lg">{metric.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${metric.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-primary text-lg mt-0.5 font-light">✓</span>
                <span className="text-gray-700 font-light text-sm">Managers no longer need to micromanage schedules</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary text-lg mt-0.5 font-light">✓</span>
                <span className="text-gray-700 font-light text-sm">Eliminate staffing gaps and resource shifts</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary text-lg mt-0.5 font-light">✓</span>
                <span className="text-gray-700 font-light text-sm">Gain clarity, control, and confidence</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary text-lg mt-0.5 font-light">✓</span>
                <span className="text-gray-700 font-light text-sm">Focus on team performance and customer experience</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary text-lg mt-0.5 font-light">✓</span>
                <span className="text-gray-700 font-light text-sm">Drive growth with intelligent workforce decisions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
