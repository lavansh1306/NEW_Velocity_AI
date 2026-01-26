import { Card } from "@/components/ui/card";
import { Calendar, Users, BarChart3, Zap } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "AI-Driven Scheduling",
    description: "Automatically builds and optimizes schedules based on real demand, availability, and business priorities—reducing manual effort and costly inefficiencies.",
  },
  {
    icon: Users,
    title: "Intelligent Redeployment",
    description: "Identifies unused or freed capacity and recommends where employees can be redeployed for maximum impact across your organization.",
  },
  {
    icon: BarChart3,
    title: "Workforce Intelligence",
    description: "Turns operational data into clear, actionable insights so leaders understand how work is performed and where productivity can be improved.",
  },
  {
    icon: Zap,
    title: "Operational Automation",
    description: "Replaces repetitive workforce planning tasks with AI, removing friction from day-to-day operations and freeing up valuable time.",
  }
];

export const Features = () => {
  return (
    <section className="py-20 md:py-32 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-block px-4 py-1.5 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
            FEATURES
          </div>
          <h2 className="mb-6 text-4xl font-bold text-slate-900 md:text-5xl">
            What Velocity AI Does
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Powerful AI capabilities that transform how you manage your workforce
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-0 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
