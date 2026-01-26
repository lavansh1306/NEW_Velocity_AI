import { TrendingDown, Brain, TrendingUp, Target } from "lucide-react";

export const Results = () => {
  const results = [
    {
      icon: TrendingDown,
      value: "60%",
      label: "Less time on operations",
      description: "Reduce redundant operational work dramatically"
    },
    {
      icon: Brain,
      value: "AI",
      label: "Powered decisions",
      description: "Smarter labor decisions backed by intelligence"
    },
    {
      icon: TrendingUp,
      value: "40%",
      label: "Productivity increase",
      description: "Higher output without increasing headcount"
    },
    {
      icon: Target,
      value: "100%",
      label: "Value-focused teams",
      description: "Deploy teams where they create the most value"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-block px-4 py-1.5 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
            THE RESULTS
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Measurable Impact
          </h2>
          <p className="text-lg text-slate-600">
            Real outcomes that transform how your organization operates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {results.map((result, index) => (
            <div key={index} className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100">
                  <result.icon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="mb-2 text-4xl md:text-5xl font-bold text-blue-600">
                {result.value}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">
                {result.label}
              </h3>
              <p className="text-slate-600">
                {result.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
