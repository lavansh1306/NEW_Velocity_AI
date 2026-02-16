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
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-[1800px] mx-auto px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-block px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-light">
            FEATURES
          </div>
          <h2 className="mb-6 text-4xl font-light text-gray-900 md:text-5xl">
            What Velocity AI Does
          </h2>
          <p className="mx-auto max-w-2xl text-base text-gray-600 font-light">
            Powerful AI capabilities that transform how you manage your workforce
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-all rounded-xl"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-light text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed font-light text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
