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
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-[1800px] mx-auto px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-block px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-light">
            THE RESULTS
          </div>
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
            Measurable Impact
          </h2>
          <p className="text-base text-gray-600 font-light">
            Real outcomes that transform how your organization operates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map((result, index) => (
            <div key={index} className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10">
                  <result.icon className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <div className="mb-2 text-4xl font-light text-primary">
                {result.value}
              </div>
              <h3 className="mb-2 text-base font-light text-gray-900">
                {result.label}
              </h3>
              <p className="text-gray-600 font-light text-sm">
                {result.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
