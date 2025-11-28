const stats = [
  { value: "40%", label: "Average Time Saved" },
  { value: "3.2x", label: "ROI on Strategic Initiatives" },
  { value: "98%", label: "Data Accuracy Rate" },
  { value: "24/7", label: "Real-Time Monitoring" }
];

export const Stats = () => {
  return (
    <section className="border-y bg-card py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">{stat.value}</div>
              <div className="text-sm text-muted-foreground md:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
